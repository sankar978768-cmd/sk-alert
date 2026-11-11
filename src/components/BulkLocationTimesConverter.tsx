import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Bell,
  Check,
  Plus,
  Trash2,
  Folder,
  Layers,
  Sparkles,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { Alarm, AlarmCategory, RecurrenceType, SoundType } from '../types';
import {
  resolveLocationToTimeZone,
  convertSourceTimeToDate,
  formatInIST,
  formatInTimeZone,
  getIstDifferenceSummary,
  getLocalComponentsInTz,
  POPULAR_TIMEZONES
} from '../utils/timezone';
import { playTonePattern, SOUND_OPTIONS } from '../utils/audio';

interface BulkLocationTimesConverterProps {
  timeFormat: '12h' | '24h';
  onAddAlarms: (alarms: Alarm[]) => void;
  onGoToAlarms: () => void;
}

interface ConvertedTimeItem {
  id: string;
  selected: boolean;
  rawTimeStr: string;
  hour: number;
  minute: number;
  second?: number;
  timeStringWithSec: string; // e.g. "09:32:23"
  dateStr?: string; // e.g. "2026-11-06"
  dateFormatted?: string; // e.g. "6 Nov 2026"
  endHour?: number;
  endMinute?: number;
  endSecond?: number;
  endTimeString?: string;
  istEndTimeFormatted?: string;
  title: string;
  category: AlarmCategory;
  matchLabel?: string; // e.g. "CSK vs MI", "IND vs NZ"
  leadTimeSeconds: number; // custom seconds before alarm
  // Computed IST
  istTimeFormatted: string;
  istDateFormatted: string;
  sourceTimeFormatted: string;
  diffSummaryLabel: string;
  dayDriftNotice: string;
  isDayAhead: boolean;
  notes?: string;
}

const CATEGORY_DEFINITIONS: Record<
  AlarmCategory,
  { label: string; icon: string; border: string; bg: string; text: string; badge: string }
> = {
  sports: { label: 'Sports & Broadcast', icon: '🏏', border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  meeting: { label: 'Meetings & Syncs', icon: '👥', border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  work: { label: 'Work & Tasks', icon: '💼', border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  market: { label: 'Trading & Markets', icon: '📈', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  webinar: { label: 'Webinars & Learning', icon: '🎓', border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  personal: { label: 'Personal & Social', icon: '☕', border: 'border-rose-500/40', bg: 'bg-rose-500/10', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  custom: { label: 'General Reminders', icon: '🔔', border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-300', badge: 'bg-slate-700 text-slate-300 border-slate-600' }
};

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

export const BulkLocationTimesConverter: React.FC<BulkLocationTimesConverterProps> = ({
  timeFormat,
  onAddAlarms,
  onGoToAlarms
}) => {
  // 1. Location state (clear / empty by default)
  const [locationInput, setLocationInput] = useState('');
  // Match label input (e.g. CSK vs MI, IND vs NZ)
  const [matchLabelInput, setMatchLabelInput] = useState('');
  // 2. Bulk times state (clear / empty by default)
  const [bulkTimesInput, setBulkTimesInput] = useState('');
  // Default category if no header in text
  const [defaultCategory, setDefaultCategory] = useState<AlarmCategory>('meeting');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number>(0);
  const [customSecondsInput, setCustomSecondsInput] = useState<string>('');
  const [isCustomSeconds, setIsCustomSeconds] = useState<boolean>(false);
  const [viewGrouping, setViewGrouping] = useState<'matches' | 'categories'>('matches');
  const [sound, setSound] = useState<SoundType>('droplet');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const effectiveLeadSec = isCustomSeconds
    ? (parseInt(customSecondsInput, 10) || 0)
    : leadTimeSeconds;

  // Check if bulkTimesInput contains an embedded IANA timezone or city
  const embeddedTzInText = useMemo(() => {
    if (!bulkTimesInput) return null;
    const match = bulkTimesInput.match(/\b([A-Z][a-zA-Z]+(?:\/[A-Za-z_]+)+)\b/);
    if (match) return match[1];

    const lower = bulkTimesInput.toLowerCase();
    const commonCities = [
      'kathmandu', 'nepal', 'london', 'tokyo', 'new york', 'seattle',
      'san francisco', 'los angeles', 'paris', 'berlin', 'dubai',
      'singapore', 'sydney', 'chicago', 'toronto', 'mumbai', 'delhi', 'bangalore'
    ];
    for (const city of commonCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(lower)) {
        return city;
      }
    }
    return null;
  }, [bulkTimesInput]);

  // Check if bulkTimesInput contains an embedded match label
  const embeddedMatchInText = useMemo(() => {
    if (!bulkTimesInput) return null;
    const matchLine = bulkTimesInput.match(/(?:match|game):\s*([A-Za-z0-9&.\s\-]+)/i);
    if (matchLine) return matchLine[1].trim();

    const vsMatch = bulkTimesInput.match(/\b([A-Za-z0-9&.]{2,15}\s+(?:vs\.?|v)\s+[A-Za-z0-9&.]{2,15})\b/i);
    if (vsMatch) return vsMatch[1].trim().replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase());

    return null;
  }, [bulkTimesInput]);

  // Sync auto-detected match into input if empty
  useEffect(() => {
    if (embeddedMatchInText && !matchLabelInput) {
      setMatchLabelInput(embeddedMatchInText);
    }
  }, [embeddedMatchInText, matchLabelInput]);

  // Resolved timezone from location input (empty if user has not entered a location)
  const resolvedTz = useMemo(() => {
    const target = locationInput.trim() || embeddedTzInText;
    if (!target) return null;
    return resolveLocationToTimeZone(target);
  }, [locationInput, embeddedTzInText]);

  // STEP 1: Parse and convert all pasted times to IST
  const convertedItems = useMemo<ConvertedTimeItem[]>(() => {
    if (!bulkTimesInput.trim() || !resolvedTz) return [];

    const items: ConvertedTimeItem[] = [];
    const lines = bulkTimesInput.split('\n');
    let currentCategory: AlarmCategory = defaultCategory;
    let currentMatchLabel: string | undefined = matchLabelInput.trim() || undefined;
    let headerDefaultDateStr: string | undefined = undefined;

    // Check if the overall text mentions a header date like "2026-11-06 to 2026-11-06"
    const headerDateRangeMatch = bulkTimesInput.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
    if (headerDateRangeMatch) {
      headerDefaultDateStr = headerDateRangeMatch[1];
    } else {
      const singleDateMatch = bulkTimesInput.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (singleDateMatch) {
        headerDefaultDateStr = singleDateMatch[1];
      }
    }

    const processTimeItem = (params: {
      h: number;
      m: number;
      s?: number;
      endH?: number;
      endM?: number;
      endS?: number;
      dateStr?: string;
      title: string;
      category: AlarmCategory;
      matchLabel?: string;
      rawLine: string;
      notes?: string;
    }) => {
      const { h, m, s, endH, endM, endS, dateStr, title, category, matchLabel, rawLine, notes } = params;

      // Determine year, month, day
      const today = new Date();
      let y = today.getFullYear();
      let mon = today.getMonth() + 1;
      let d = today.getDate();

      const effectiveDateStr = dateStr || headerDefaultDateStr;
      if (effectiveDateStr) {
        const parts = effectiveDateStr.split('-').map(Number);
        if (parts.length === 3) {
          y = parts[0];
          mon = parts[1];
          d = parts[2];
        }
      }

      // Convert start time to exact UTC/IST
      const dateObj = convertSourceTimeToDate(y, mon, d, h, m, resolvedTz.id, s || 0);

      const hasSeconds = s !== undefined;
      const istTimeFormatted = formatInIST(dateObj, {
        timeFormat,
        includeSeconds: hasSeconds,
        includeDate: false
      });

      const istDateFormatted = formatInIST(dateObj, {
        includeSeconds: false,
        includeWeekday: true
      });

      const sourceTimeFormatted = formatInTimeZone(dateObj, resolvedTz.id, {
        timeFormat,
        includeSeconds: hasSeconds,
        includeDate: false
      });

      // End time formatting if present
      let istEndTimeFormatted: string | undefined;
      let endTimeString: string | undefined;
      if (endH !== undefined && endM !== undefined) {
        const endDateObj = convertSourceTimeToDate(y, mon, d, endH, endM, resolvedTz.id, endS || 0);
        istEndTimeFormatted = formatInIST(endDateObj, {
          timeFormat,
          includeSeconds: endS !== undefined,
          includeDate: false
        });
        endTimeString = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}${endS !== undefined ? `:${String(endS).padStart(2, '0')}` : ''}`;
      }

      const diff = getIstDifferenceSummary(resolvedTz.id, dateObj);

      const sourceComps = getLocalComponentsInTz(dateObj, resolvedTz.id);
      const istComps = getLocalComponentsInTz(dateObj, 'Asia/Kolkata');
      let dayDriftNotice = 'Same calendar day';
      let isDayAhead = false;
      if (istComps.day !== sourceComps.day) {
        if (istComps.day > sourceComps.day || (istComps.day === 1 && sourceComps.day > 25)) {
          dayDriftNotice = '+1 day ahead in India';
          isDayAhead = true;
        } else {
          dayDriftNotice = '-1 day in India';
        }
      }

      const timeStringWithSec = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s !== undefined ? `:${String(s).padStart(2, '0')}` : ''}`;

      let cleanTitle = title.trim();
      if (!cleanTitle || cleanTitle === '-' || cleanTitle === ':') {
        if (matchLabel) {
          cleanTitle = `${matchLabel} Wicket Window`;
        } else {
          cleanTitle = `${resolvedTz.city} ${CATEGORY_DEFINITIONS[category].label.split('&')[0].trim()} Time`;
        }
      }

      items.push({
        id: `bulk-${items.length}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        selected: true,
        rawTimeStr: rawLine,
        hour: h,
        minute: m,
        second: s,
        timeStringWithSec,
        dateStr: effectiveDateStr,
        endHour: endH,
        endMinute: endM,
        endSecond: endS,
        endTimeString,
        istEndTimeFormatted,
        title: cleanTitle,
        category,
        matchLabel,
        leadTimeSeconds: effectiveLeadSec,
        istTimeFormatted,
        istDateFormatted,
        sourceTimeFormatted,
        diffSummaryLabel: diff.label,
        dayDriftNotice,
        isDayAhead,
        notes: notes || (endTimeString ? `Window: ${timeStringWithSec} – ${endTimeString} (${resolvedTz.abbr})${matchLabel ? ` · Match: ${matchLabel}` : ''}` : undefined)
      });
    };

    // Helper: Detect category from string content
    const detectCategoryFromText = (text: string, currentFallback: AlarmCategory): AlarmCategory => {
      const lower = text.toLowerCase();
      if (
        lower.includes('wicket') ||
        lower.includes('cricket') ||
        lower.includes('advert') ||
        lower.includes('break') ||
        lower.includes('match') ||
        lower.includes('inning') ||
        lower.includes('sports') ||
        lower.includes('overs')
      ) {
        return 'sports';
      }
      if (
        lower.includes('meet') ||
        lower.includes('sync') ||
        lower.includes('call') ||
        lower.includes('standup') ||
        lower.includes('demo')
      ) {
        return 'meeting';
      }
      if (
        lower.includes('market') ||
        lower.includes('trad') ||
        lower.includes('stock') ||
        lower.includes('nyse') ||
        lower.includes('bell')
      ) {
        return 'market';
      }
      if (
        lower.includes('work') ||
        lower.includes('task') ||
        lower.includes('sprint') ||
        lower.includes('review')
      ) {
        return 'work';
      }
      if (
        lower.includes('webinar') ||
        lower.includes('learn') ||
        lower.includes('train') ||
        lower.includes('class')
      ) {
        return 'webinar';
      }
      if (
        lower.includes('person') ||
        lower.includes('social') ||
        lower.includes('coffee') ||
        lower.includes('lunch')
      ) {
        return 'personal';
      }
      return currentFallback;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // 1. Check for Match Header: e.g. [Match: CSK vs MI], Match: CSK vs MI, [CSK vs MI], CSK vs MI
      const bracketMatch = line.match(/^\[(?:match:\s*|match\s+)?([A-Za-z0-9&.\s\-]+)\]$/i);
      if (bracketMatch) {
        currentMatchLabel = bracketMatch[1].trim().replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase());
        currentCategory = 'sports';
        continue;
      }

      const explicitMatchLine = line.match(/^(?:match|game):\s*([A-Za-z0-9&.\s\-]+)$/i);
      if (explicitMatchLine) {
        currentMatchLabel = explicitMatchLine[1].trim().replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase());
        currentCategory = 'sports';
        continue;
      }

      const standaloneVs = line.match(/^([A-Za-z0-9&.]{2,15}\s+(?:vs\.?|v)\s+[A-Za-z0-9&.]{2,15})$/i);
      if (standaloneVs) {
        currentMatchLabel = standaloneVs[1].trim().replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase());
        currentCategory = 'sports';
        continue;
      }

      // Check generic category header syntax: e.g. [Meetings], [Work], [Markets], [Sports]
      const catMatch = line.match(/^\[(.*?)\]|^#(.*?)$/);
      if (catMatch) {
        const catName = (catMatch[1] || catMatch[2] || '').toLowerCase();
        currentCategory = detectCategoryFromText(catName, 'custom');
        continue;
      }

      // Skip generic descriptive metadata lines that don't have time ranges
      if (line.toLowerCase().startsWith('cricket wicket possibility') && line.includes('(')) {
        continue;
      }

      // 2. Extract date if present on this line (e.g. "6 Nov 2026", "2026-11-06", "Nov 6 2026")
      let lineDateStr: string | undefined = undefined;
      let lineWithoutDate = line;

      // Match "6 Nov 2026" or "06 November 2026"
      const dateTextMatch = line.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
      if (dateTextMatch) {
        const day = parseInt(dateTextMatch[1], 10);
        const monthKey = dateTextMatch[2].toLowerCase();
        const year = parseInt(dateTextMatch[3], 10);
        const monthNum = MONTH_MAP[monthKey];
        if (monthNum) {
          lineDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          lineWithoutDate = line.replace(dateTextMatch[0], '').trim();
        }
      } else {
        // Match "2026-11-06"
        const isoMatch = line.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
        if (isoMatch) {
          lineDateStr = `${isoMatch[1]}-${String(parseInt(isoMatch[2], 10)).padStart(2, '0')}-${String(parseInt(isoMatch[3], 10)).padStart(2, '0')}`;
          lineWithoutDate = line.replace(isoMatch[0], '').trim();
        }
      }

      // 3. Match time ranges with seconds: e.g. "09:32:23 – 09:42:13 WICKET POSSIBILITY"
      const timeRangeWithSecRegex = /(\b\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?\s*[\u2013\u2014\-~to]+\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i;
      const rangeSecMatch = lineWithoutDate.match(timeRangeWithSecRegex);

      if (rangeSecMatch) {
        let h1 = parseInt(rangeSecMatch[1], 10);
        const m1 = parseInt(rangeSecMatch[2], 10);
        const s1 = parseInt(rangeSecMatch[3], 10);
        const mer1 = rangeSecMatch[4]?.toLowerCase();
        if (mer1 === 'pm' && h1 < 12) h1 += 12;
        if (mer1 === 'am' && h1 === 12) h1 = 0;

        let h2 = parseInt(rangeSecMatch[5], 10);
        const m2 = parseInt(rangeSecMatch[6], 10);
        const s2 = parseInt(rangeSecMatch[7], 10);
        const mer2 = rangeSecMatch[8]?.toLowerCase();
        if (mer2 === 'pm' && h2 < 12) h2 += 12;
        if (mer2 === 'am' && h2 === 12) h2 = 0;

        const titleText = lineWithoutDate.replace(rangeSecMatch[0], '').replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
        const cat = detectCategoryFromText(`${titleText} ${line}`, currentCategory);

        processTimeItem({
          h: h1,
          m: m1,
          s: s1,
          endH: h2,
          endM: m2,
          endS: s2,
          dateStr: lineDateStr,
          title: titleText || (currentMatchLabel ? `${currentMatchLabel} Wicket Window` : 'Wicket Possibility Window'),
          category: cat,
          matchLabel: currentMatchLabel,
          rawLine: line,
          notes: `Possibility Window: ${rangeSecMatch[0]} (${resolvedTz.abbr})${currentMatchLabel ? ` · ${currentMatchLabel}` : ''}`
        });
        continue;
      }

      // 4. Match single time with seconds: e.g. "09:32:23 Wicket Possibility"
      const singleTimeSecRegex = /(\b\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i;
      const singleSecMatch = lineWithoutDate.match(singleTimeSecRegex);
      if (singleSecMatch) {
        let h = parseInt(singleSecMatch[1], 10);
        const m = parseInt(singleSecMatch[2], 10);
        const s = parseInt(singleSecMatch[3], 10);
        const mer = singleSecMatch[4]?.toLowerCase();
        if (mer === 'pm' && h < 12) h += 12;
        if (mer === 'am' && h === 12) h = 0;

        const titleText = lineWithoutDate.replace(singleSecMatch[0], '').replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
        const cat = detectCategoryFromText(`${titleText} ${line}`, currentCategory);

        processTimeItem({
          h,
          m,
          s,
          dateStr: lineDateStr,
          title: titleText || (currentMatchLabel ? `${currentMatchLabel} Time` : `${resolvedTz.city} Scheduled Time`),
          category: cat,
          matchLabel: currentMatchLabel,
          rawLine: line
        });
        continue;
      }

      // 5. Match comma-separated standard times in a single line
      if (lineWithoutDate.includes(',')) {
        const tokens = lineWithoutDate.split(',');
        for (const token of tokens) {
          const t = token.trim();
          const match = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(t);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = match[2] ? parseInt(match[2], 10) : 0;
            const mer = match[3]?.toLowerCase();
            if (mer === 'pm' && h < 12) h += 12;
            if (mer === 'am' && h === 12) h = 0;

            const title = t.replace(match[0], '').replace(/^[-:\s]+|[-:\s]+$/g, '');
            const cat = detectCategoryFromText(t, currentCategory);
            processTimeItem({
              h,
              m,
              dateStr: lineDateStr,
              title: title || (currentMatchLabel ? `${currentMatchLabel} Sync` : `${resolvedTz.city} Time`),
              category: cat,
              matchLabel: currentMatchLabel,
              rawLine: t
            });
          }
        }
        continue;
      }

      // 6. Match standard time range without seconds: "9:00 AM - 10:30 AM Standup"
      const standardRangeRegex = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[\u2013\u2014\-~to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
      const standardRangeMatch = lineWithoutDate.match(standardRangeRegex);
      if (standardRangeMatch) {
        let h1 = parseInt(standardRangeMatch[1], 10);
        const m1 = standardRangeMatch[2] ? parseInt(standardRangeMatch[2], 10) : 0;
        const mer1 = standardRangeMatch[3]?.toLowerCase();
        if (mer1 === 'pm' && h1 < 12) h1 += 12;
        if (mer1 === 'am' && h1 === 12) h1 = 0;

        let h2 = parseInt(standardRangeMatch[4], 10);
        const m2 = standardRangeMatch[5] ? parseInt(standardRangeMatch[5], 10) : 0;
        const mer2 = standardRangeMatch[6]?.toLowerCase();
        if (mer2 === 'pm' && h2 < 12) h2 += 12;
        if (mer2 === 'am' && h2 === 12) h2 = 0;

        const titleText = lineWithoutDate.replace(standardRangeMatch[0], '').replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
        const cat = detectCategoryFromText(`${titleText} ${line}`, currentCategory);

        processTimeItem({
          h: h1,
          m: m1,
          endH: h2,
          endM: m2,
          dateStr: lineDateStr,
          title: titleText || (currentMatchLabel ? `${currentMatchLabel} Session` : 'Scheduled Session'),
          category: cat,
          matchLabel: currentMatchLabel,
          rawLine: line,
          notes: `Session: ${standardRangeMatch[0]}${currentMatchLabel ? ` · ${currentMatchLabel}` : ''}`
        });
        continue;
      }

      // 7. Match standard single time without seconds: "9:00 AM Standup" or "14:30 Review"
      const standardTimeRegex = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
      const standardMatch = standardTimeRegex.exec(lineWithoutDate);
      if (standardMatch) {
        let h = parseInt(standardMatch[1], 10);
        const m = standardMatch[2] ? parseInt(standardMatch[2], 10) : 0;
        const mer = standardMatch[3]?.toLowerCase();
        if (mer === 'pm' && h < 12) h += 12;
        if (mer === 'am' && h === 12) h = 0;

        const titleText = lineWithoutDate.replace(standardMatch[0], '').replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
        const cat = detectCategoryFromText(`${titleText} ${line}`, currentCategory);

        processTimeItem({
          h,
          m,
          dateStr: lineDateStr,
          title: titleText || (currentMatchLabel ? `${currentMatchLabel} Timing` : `${resolvedTz.city} Time`),
          category: cat,
          matchLabel: currentMatchLabel,
          rawLine: line
        });
      }
    }

    return items;
  }, [bulkTimesInput, defaultCategory, resolvedTz, timeFormat, matchLabelInput, effectiveLeadSec]);

  // Group items match-wise (CSK vs MI, IND vs NZ, etc.)
  const groupedByMatch = useMemo(() => {
    const groups: Record<string, ConvertedTimeItem[]> = {};

    for (const item of convertedItems) {
      const matchKey = item.matchLabel || 'General / Other Events';
      if (!groups[matchKey]) {
        groups[matchKey] = [];
      }
      groups[matchKey].push(item);
    }

    return groups;
  }, [convertedItems]);

  const matchKeys = Object.keys(groupedByMatch);

  // Group items category-wise
  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<AlarmCategory, ConvertedTimeItem[]>> = {};

    for (const item of convertedItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]!.push(item);
    }

    return groups;
  }, [convertedItems]);

  const activeCategories = Object.keys(groupedByCategory) as AlarmCategory[];

  // STEP 2: Set Alarms for Changed IST Times
  const handleSetAllAlarms = () => {
    if (!resolvedTz) return;
    const selected = convertedItems.filter(i => i.selected);
    if (selected.length === 0) return;

    const alarmsToCreate: Alarm[] = selected.map(item => ({
      id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      sourceTimeZone: resolvedTz.id,
      sourceCityLabel: `${resolvedTz.city} (${resolvedTz.abbr})`,
      sourceTime: item.timeStringWithSec,
      sourceDate: item.dateStr,
      recurrence: item.dateStr ? 'once' : recurrence,
      leadTimeMinutes: Math.floor(item.leadTimeSeconds / 60),
      leadTimeSeconds: item.leadTimeSeconds,
      matchLabel: item.matchLabel,
      sound,
      enabled: true,
      createdAt: Date.now(),
      category: item.category,
      notes: item.notes || `Converted from ${resolvedTz.city} (${item.sourceTimeFormatted}) to ${item.istTimeFormatted} IST${item.matchLabel ? ` · Match: ${item.matchLabel}` : ''}`
    }));

    onAddAlarms(alarmsToCreate);
    setSuccessToast(`Successfully created ${alarmsToCreate.length} alarm(s) for the converted IST times!`);
  };

  const handleSetMatchAlarms = (matchKey: string) => {
    if (!resolvedTz) return;
    const items = (groupedByMatch[matchKey] || []).filter(i => i.selected);
    if (items.length === 0) return;

    const alarmsToCreate: Alarm[] = items.map(item => ({
      id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      sourceTimeZone: resolvedTz.id,
      sourceCityLabel: `${resolvedTz.city} (${resolvedTz.abbr})`,
      sourceTime: item.timeStringWithSec,
      sourceDate: item.dateStr,
      recurrence: item.dateStr ? 'once' : recurrence,
      leadTimeMinutes: Math.floor(item.leadTimeSeconds / 60),
      leadTimeSeconds: item.leadTimeSeconds,
      matchLabel: item.matchLabel,
      sound,
      enabled: true,
      createdAt: Date.now(),
      category: item.category,
      notes: item.notes || `Converted from ${resolvedTz.city} (${item.sourceTimeFormatted}) to ${item.istTimeFormatted} IST · Match: ${matchKey}`
    }));

    onAddAlarms(alarmsToCreate);
    setSuccessToast(`Created ${alarmsToCreate.length} alarm(s) for Match: ${matchKey}!`);
  };

  const handleSetCategoryAlarms = (cat: AlarmCategory) => {
    if (!resolvedTz) return;
    const items = (groupedByCategory[cat] || []).filter(i => i.selected);
    if (items.length === 0) return;

    const alarmsToCreate: Alarm[] = items.map(item => ({
      id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      sourceTimeZone: resolvedTz.id,
      sourceCityLabel: `${resolvedTz.city} (${resolvedTz.abbr})`,
      sourceTime: item.timeStringWithSec,
      sourceDate: item.dateStr,
      recurrence: item.dateStr ? 'once' : recurrence,
      leadTimeMinutes: Math.floor(item.leadTimeSeconds / 60),
      leadTimeSeconds: item.leadTimeSeconds,
      matchLabel: item.matchLabel,
      sound,
      enabled: true,
      createdAt: Date.now(),
      category: item.category,
      notes: item.notes || `Converted from ${resolvedTz.city} (${item.sourceTimeFormatted}) to ${item.istTimeFormatted} IST`
    }));

    onAddAlarms(alarmsToCreate);
    setSuccessToast(`Created ${alarmsToCreate.length} ${CATEGORY_DEFINITIONS[cat].label} alarm(s) in IST!`);
  };

  const totalConverted = convertedItems.length;
  const totalSelected = convertedItems.filter(i => i.selected).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Layers className="w-4 h-4" />
            <span>Bulk Location & Times to IST Alarm Wizard</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Paste Location Name + Bulk Times → Convert to IST & Set Alarms
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify any city in the world and paste your list of times. ChronosIST transforms all times to Indian Standard Time (IST) and sets organized, category-wise alarms.
          </p>
        </div>
      </div>

      {/* Input Section: Location + Bulk Times */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Location Input & Auto-Detection */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                1. Location Name (Any City or Region in the World)
              </label>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-amber-400" />
              <input
                type="text"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="e.g. Kathmandu, Seattle, Berlin, Dubai, New York, Tokyo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            {/* Auto-detected timezone notification if present in pasted text */}
            {embeddedTzInText && locationInput !== embeddedTzInText && (
              <div className="mt-2 text-xs flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span className="truncate">Detected in text: {embeddedTzInText}</span>
                <button
                  type="button"
                  onClick={() => setLocationInput(embeddedTzInText)}
                  className="underline font-bold text-amber-400 ml-2 shrink-0 hover:text-white"
                >
                  Use this Timezone
                </button>
              </div>
            )}

            {/* Resolved Location Badge */}
            {resolvedTz ? (
              <div className="mt-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-xl">{resolvedTz.flag}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {resolvedTz.city}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {resolvedTz.country} · {resolvedTz.id}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 block">
                    {resolvedTz.abbr}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {getIstDifferenceSummary(resolvedTz.id).label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 bg-slate-950/40 border border-dashed border-slate-800/80 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>No location specified yet. Type any city name above or select a shortcut below.</span>
              </div>
            )}

            {/* Popular City Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              {[
                'Kathmandu',
                'Seattle',
                'San Francisco',
                'New York',
                'London',
                'Berlin',
                'Dubai',
                'Singapore',
                'Tokyo',
                'Sydney'
              ].map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setLocationInput(city)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    locationInput.toLowerCase().includes(city.toLowerCase())
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Match / Series Label Input */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏏 Match / Series Label</span>
              </label>
              <span className="text-[10px] text-slate-500">Auto-tags all timings in this batch</span>
            </div>
            <input
              type="text"
              value={matchLabelInput}
              onChange={e => setMatchLabelInput(e.target.value)}
              placeholder="e.g. CSK vs MI, IND vs NZ, Ind vs Pak"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* Alarm Preferences for this batch */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Batch Alarm Settings
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Recurrence
                </label>
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="once">Once (Date specific)</option>
                  <option value="daily">Daily (Every Day)</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                </select>
              </div>

              {/* Pre-alarm in customizable seconds */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-slate-400 font-medium">
                    Advance Pre-Alert (Seconds)
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-amber-400">
                    {effectiveLeadSec === 0 ? 'Exact time (0s)' : `${effectiveLeadSec}s before IST`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 10, 15, 30, 45, 60].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setLeadTimeSeconds(sec);
                        setIsCustomSeconds(false);
                      }}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                        !isCustomSeconds && leadTimeSeconds === sec
                          ? 'bg-amber-400 text-slate-950 font-bold shadow'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                      }`}
                    >
                      {sec === 0 ? '0s (Exact)' : `${sec}s`}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5">
                    <span className="text-[11px] text-slate-400">Custom:</span>
                    <input
                      type="number"
                      min="0"
                      max="3600"
                      placeholder="sec"
                      value={isCustomSeconds ? customSecondsInput : ''}
                      onFocus={() => setIsCustomSeconds(true)}
                      onChange={e => {
                        setIsCustomSeconds(true);
                        setCustomSecondsInput(e.target.value);
                      }}
                      className="w-12 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-center"
                    />
                    <span className="text-[11px] text-slate-400">s</span>
                  </div>
                </div>
              </div>

              {/* Alert Tone Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <span>Alert Tone</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">(5 mild 1s tones)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => playTonePattern(sound, 0.7)}
                    className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={sound}
                    onChange={e => setSound(e.target.value as SoundType)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <optgroup label="✨ Very Mild Notification Alerts (~1 sec)">
                      {SOUND_OPTIONS.filter(s => s.category === 'mild').map(snd => (
                        <option key={snd.id} value={snd.id}>
                          {snd.icon} {snd.name} (1s mild)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⏰ Classic Alarm Tones">
                      {SOUND_OPTIONS.filter(s => s.category === 'classic').map(snd => (
                        <option key={snd.id} value={snd.id}>
                          {snd.icon} {snd.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <button
                    type="button"
                    onClick={() => playTonePattern(sound, 0.7)}
                    title="Preview Sound"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bulk Times Paste Area */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Paste Bulk Times (Logs, Broadcasts, or Schedules)
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {convertedItems.length} Times Detected
            </span>
          </div>

          <textarea
            value={bulkTimesInput}
            onChange={e => setBulkTimesInput(e.target.value)}
            rows={8}
            placeholder={`Paste times here, e.g.:\nCricket wicket possibility / advert break timings 2026-11-06 (Asia/Kathmandu)\n6 Nov 2026  09:32:23 – 09:42:13  WICKET POSSIBILITY\n6 Nov 2026  10:26:39 – 10:35:54  WICKET POSSIBILITY`}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Supports seconds (<code className="text-amber-400">09:32:23</code>), date stamps (<code className="text-amber-400">6 Nov 2026</code>), and windows (<code className="text-amber-400">–</code>).
            </span>
            <button
              type="button"
              onClick={() => setBulkTimesInput('')}
              className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={onGoToAlarms}
            className="px-3 py-1 text-xs font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
          >
            View in Alarms Dashboard
          </button>
        </div>
      )}

      {/* STEP 1 & 2: CONVERTED TIMES TABLE GROUPED MATCH-WISE OR CATEGORY-WISE */}
      {convertedItems.length > 0 && resolvedTz && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Main Action Bar */}
          <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Step 1: All Times Converted to IST
                </span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Step 2: Set Alarms
                </span>
              </div>
              <div className="text-base font-bold text-white mt-1">
                {totalConverted} Times converted from {resolvedTz.city} ({resolvedTz.abbr}) to Indian Standard Time (IST)
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>Organized across {viewGrouping === 'matches' ? `${matchKeys.length} match section${matchKeys.length > 1 ? 's' : ''}` : `${activeCategories.length} categories`}.</span>
                <span>·</span>
                <span className="text-amber-300 font-mono font-medium">
                  {resolvedTz.id === 'Asia/Kathmandu' ? 'Kathmandu is UTC+5:45 (IST is 15m earlier)' : getIstDifferenceSummary(resolvedTz.id).label}
                </span>
                {effectiveLeadSec > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      Alert {effectiveLeadSec}s before IST
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Grouping switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewGrouping('matches')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    viewGrouping === 'matches'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏏 Matches ({matchKeys.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('categories')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    viewGrouping === 'categories'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Categories ({activeCategories.length})
                </button>
              </div>

              <button
                onClick={handleSetAllAlarms}
                disabled={totalSelected === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Bell className="w-4 h-4" />
                <span>Set All {totalSelected} IST Alarms</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: MATCH-WISE ACCORDION */}
          {viewGrouping === 'matches' && (
            <div className="space-y-5">
              {matchKeys.map(matchKey => {
                const items = groupedByMatch[matchKey] || [];
                const isGeneral = matchKey.startsWith('General');

                return (
                  <div
                    key={matchKey}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                  >
                    {/* Match Header Strip */}
                    <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{isGeneral ? '🔔' : '🏏'}</span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {isGeneral ? matchKey : `Match: ${matchKey}`}
                        </h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                          {items.length} {items.length === 1 ? 'timing' : 'timings'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSetMatchAlarms(matchKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all cursor-pointer shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Set {items.length} Alarms for {matchKey}</span>
                      </button>
                    </div>

                    {/* List of converted times under this match */}
                    <div className="divide-y divide-slate-800/60">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                        >
                          {/* Event Title & Source Info */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">
                                {item.title}
                              </span>
                              {item.matchLabel && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  🏏 {item.matchLabel}
                                </span>
                              )}
                              {item.dateStr && (
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {item.dateStr}
                                </span>
                              )}
                              {item.leadTimeSeconds > 0 && (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                  ⏱️ Alert {item.leadTimeSeconds}s before
                                </span>
                              )}
                            </div>

                            {/* Source timing breakdown */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1 text-slate-300 font-mono">
                                <span className="text-slate-400">{resolvedTz.city} ({resolvedTz.abbr}):</span>
                                <span className="font-semibold text-white">{item.timeStringWithSec}</span>
                                {item.endTimeString && (
                                  <span className="text-slate-400"> – {item.endTimeString}</span>
                                )}
                              </div>
                              <span>·</span>
                              <span className="text-slate-400">{item.diffSummaryLabel}</span>
                            </div>

                            {item.notes && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {item.notes}
                              </div>
                            )}
                          </div>

                          {/* Converted IST Time */}
                          <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <span className="text-[10px] uppercase text-slate-500 block font-mono">
                                  Original ({resolvedTz.abbr})
                                </span>
                                <span className="text-sm font-mono text-slate-400">
                                  {item.sourceTimeFormatted}
                                </span>
                              </div>

                              <ArrowRight className="w-4 h-4 text-amber-400 hidden sm:block" />

                              {/* IST Time */}
                              <div className="text-left sm:text-right bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2">
                                <div className="flex items-baseline gap-1.5 justify-start sm:justify-end">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                                    IST ALARM
                                  </span>
                                  <span className="text-xl font-bold font-mono text-white tracking-tight">
                                    {item.istTimeFormatted}
                                  </span>
                                </div>
                                {item.istEndTimeFormatted && (
                                  <div className="text-[11px] font-mono text-slate-400">
                                    Window ends: {item.istEndTimeFormatted} IST
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {item.isDayAhead ? (
                                    <span className="text-indigo-300 font-medium">
                                      +1 day ahead in India ({item.istDateFormatted})
                                    </span>
                                  ) : (
                                    <span>{item.istDateFormatted}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium shrink-0 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Alarm Ready</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: CATEGORY-WISE ACCORDION */}
          {viewGrouping === 'categories' && (
            <div className="space-y-5">
              {activeCategories.map(catKey => {
                const items = groupedByCategory[catKey] || [];
                const catMeta = CATEGORY_DEFINITIONS[catKey];

                return (
                  <div
                    key={catKey}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden"
                  >
                    {/* Category Header Strip */}
                    <div className="bg-slate-800/70 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{catMeta.icon}</span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {catMeta.label}
                        </h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          {items.length} {items.length === 1 ? 'alarm time' : 'alarm times'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSetCategoryAlarms(catKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-700 hover:bg-amber-400 hover:text-slate-950 rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Set {items.length} Alarms in this Category</span>
                      </button>
                    </div>

                    {/* List of converted times in this category */}
                    <div className="divide-y divide-slate-800/60">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                        >
                          {/* Event Title & Source Info */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">
                                {item.title}
                              </span>
                              {item.matchLabel && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  🏏 {item.matchLabel}
                                </span>
                              )}
                              {item.dateStr && (
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {item.dateStr}
                                </span>
                              )}
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${catMeta.badge}`}>
                                {catMeta.label}
                              </span>
                            </div>

                            {/* Source timing breakdown */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1 text-slate-300 font-mono">
                                <span className="text-slate-400">{resolvedTz.city} ({resolvedTz.abbr}):</span>
                                <span className="font-semibold text-white">{item.timeStringWithSec}</span>
                                {item.endTimeString && (
                                  <span className="text-slate-400"> – {item.endTimeString}</span>
                                )}
                              </div>
                              <span>·</span>
                              <span className="text-slate-400">{item.diffSummaryLabel}</span>
                            </div>

                            {item.notes && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {item.notes}
                              </div>
                            )}
                          </div>

                          {/* Converted IST Time (Center & Right prominent conversion) */}
                          <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800 shrink-0">
                            {/* Visual conversion flow: Source -> IST */}
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <span className="text-[10px] uppercase text-slate-500 block font-mono">
                                  Original ({resolvedTz.abbr})
                                </span>
                                <span className="text-sm font-mono text-slate-400">
                                  {item.sourceTimeFormatted}
                                </span>
                              </div>

                              <ArrowRight className="w-4 h-4 text-amber-400 hidden sm:block" />

                              {/* IST Time */}
                              <div className="text-left sm:text-right bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2">
                                <div className="flex items-baseline gap-1.5 justify-start sm:justify-end">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                                    IST ALARM
                                  </span>
                                  <span className="text-xl font-bold font-mono text-white tracking-tight">
                                    {item.istTimeFormatted}
                                  </span>
                                </div>
                                {item.istEndTimeFormatted && (
                                  <div className="text-[11px] font-mono text-slate-400">
                                    Window ends: {item.istEndTimeFormatted} IST
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {item.isDayAhead ? (
                                    <span className="text-indigo-300 font-medium">
                                      +1 day ahead in India ({item.istDateFormatted})
                                    </span>
                                  ) : (
                                    <span>{item.istDateFormatted}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium shrink-0 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Alarm Ready</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
