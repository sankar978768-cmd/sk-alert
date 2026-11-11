import { Alarm, AlarmCategory, NextTriggerInfo, TimeZoneItem } from '../types';

export const IST_TIMEZONE = 'Asia/Kolkata';

// Curated list of popular global cities and timezones
export const POPULAR_TIMEZONES: TimeZoneItem[] = [
  // US & Americas
  { id: 'America/Los_Angeles', city: 'San Francisco / Los Angeles', country: 'United States', region: 'Americas', abbr: 'PT', flag: '🇺🇸', isCommon: true },
  { id: 'America/New_York', city: 'New York / Washington DC', country: 'United States', region: 'Americas', abbr: 'ET', flag: '🇺🇸', isCommon: true },
  { id: 'America/Chicago', city: 'Chicago / Dallas', country: 'United States', region: 'Americas', abbr: 'CT', flag: '🇺🇸', isCommon: true },
  { id: 'America/Denver', city: 'Denver / Phoenix', country: 'United States', region: 'Americas', abbr: 'MT', flag: '🇺🇸', isCommon: false },
  { id: 'America/Toronto', city: 'Toronto / Montreal', country: 'Canada', region: 'Americas', abbr: 'ET', flag: '🇨🇦', isCommon: true },
  { id: 'America/Vancouver', city: 'Vancouver', country: 'Canada', region: 'Americas', abbr: 'PT', flag: '🇨🇦', isCommon: false },
  { id: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', region: 'Americas', abbr: 'BRT', flag: '🇧🇷', isCommon: false },
  { id: 'America/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', region: 'Americas', abbr: 'ART', flag: '🇦🇷', isCommon: false },
  { id: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', region: 'Americas', abbr: 'CST', flag: '🇲🇽', isCommon: false },

  // Europe & UK
  { id: 'Europe/London', city: 'London / Dublin', country: 'United Kingdom', region: 'Europe', abbr: 'GMT/BST', flag: '🇬🇧', isCommon: true },
  { id: 'Europe/Paris', city: 'Paris / Berlin / Rome / Madrid', country: 'European Union', region: 'Europe', abbr: 'CET', flag: '🇪🇺', isCommon: true },
  { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', region: 'Europe', abbr: 'CET', flag: '🇳🇱', isCommon: false },
  { id: 'Europe/Zurich', city: 'Zurich / Geneva', country: 'Switzerland', region: 'Europe', abbr: 'CET', flag: '🇨🇭', isCommon: false },
  { id: 'Europe/Dublin', city: 'Dublin', country: 'Ireland', region: 'Europe', abbr: 'GMT/IST', flag: '🇮🇪', isCommon: false },
  { id: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', region: 'Europe', abbr: 'CET', flag: '🇸🇪', isCommon: false },
  { id: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', region: 'Europe', abbr: 'EET', flag: '🇫🇮', isCommon: false },
  { id: 'Europe/Athens', city: 'Athens / Bucharest', country: 'Greece', region: 'Europe', abbr: 'EET', flag: '🇬🇷', isCommon: false },

  // Middle East & Africa
  { id: 'Asia/Dubai', city: 'Dubai / Abu Dhabi', country: 'United Arab Emirates', region: 'Middle East', abbr: 'GST', flag: '🇦🇪', isCommon: true },
  { id: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', region: 'Middle East', abbr: 'AST', flag: '🇸🇦', isCommon: false },
  { id: 'Asia/Jerusalem', city: 'Tel Aviv / Jerusalem', country: 'Israel', region: 'Middle East', abbr: 'IST', flag: '🇮🇱', isCommon: false },
  { id: 'Africa/Johannesburg', city: 'Johannesburg / Cape Town', country: 'South Africa', region: 'Africa', abbr: 'SAST', flag: '🇿🇦', isCommon: false },
  { id: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', region: 'Africa', abbr: 'EEST', flag: '🇪🇬', isCommon: false },

  // Asia & Pacific
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', region: 'Asia', abbr: 'SGT', flag: '🇸🇬', isCommon: true },
  { id: 'Asia/Tokyo', city: 'Tokyo / Osaka', country: 'Japan', region: 'Asia', abbr: 'JST', flag: '🇯🇵', isCommon: true },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia', abbr: 'HKT', flag: '🇭🇰', isCommon: true },
  { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', region: 'Asia', abbr: 'KST', flag: '🇰🇷', isCommon: false },
  { id: 'Asia/Bangkok', city: 'Bangkok / Jakarta / Hanoi', country: 'Thailand', region: 'Asia', abbr: 'ICT', flag: '🇹🇭', isCommon: false },
  { id: 'Asia/Kolkata', city: 'New Delhi / Mumbai (IST)', country: 'India', region: 'Asia', abbr: 'IST', flag: '🇮🇳', isCommon: true },
  { id: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka', region: 'Asia', abbr: 'IST', flag: '🇱🇰', isCommon: false },
  { id: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal', region: 'Asia', abbr: 'NPT', flag: '🇳🇵', isCommon: false },
  { id: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', region: 'Asia', abbr: 'BST', flag: '🇧🇩', isCommon: false },
  { id: 'Australia/Sydney', city: 'Sydney / Melbourne', country: 'Australia', region: 'Pacific', abbr: 'AEST', flag: '🇦🇺', isCommon: true },
  { id: 'Australia/Perth', city: 'Perth', country: 'Australia', region: 'Pacific', abbr: 'AWST', flag: '🇦🇺', isCommon: false },
  { id: 'Pacific/Auckland', city: 'Auckland / Wellington', country: 'New Zealand', region: 'Pacific', abbr: 'NZST', flag: '🇳🇿', isCommon: true },
  { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', region: 'Pacific', abbr: 'HST', flag: '🇺🇸', isCommon: false },
  { id: 'UTC', city: 'Coordinated Universal Time', country: 'Global', region: 'Global', abbr: 'UTC', flag: '🌐', isCommon: true },
];

// Helper to get all supported timezones if user wants to search beyond popular
export function getAllAvailableTimeZones(): TimeZoneItem[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ianaList: string[] = (Intl as any).supportedValuesOf('timeZone');
      const popularIds = new Set(POPULAR_TIMEZONES.map(t => t.id));
      const extraList: TimeZoneItem[] = [];

      for (const id of ianaList) {
        if (!popularIds.has(id)) {
          const parts = id.split('/');
          const city = (parts[parts.length - 1] || id).replace(/_/g, ' ');
          const region = parts[0] || 'Other';
          extraList.push({
            id,
            city,
            country: region,
            region,
            abbr: getTzAbbreviation(id),
            flag: '🌐',
            isCommon: false
          });
        }
      }
      return [...POPULAR_TIMEZONES, ...extraList];
    }
  } catch {
    // fallback
  }
  return POPULAR_TIMEZONES;
}

/**
 * Get dynamic abbreviation for a timezone at current date
 */
export function getTzAbbreviation(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Get current UTC offset in minutes for a timezone at a specific date
 */
export function getUtcOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Format offset string e.g. "UTC+05:30", "UTC-08:00"
 */
export function formatOffsetString(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get human readable difference between IST and target timezone
 * e.g., "IST is 12h 30m ahead" or "IST is 3h 30m behind"
 */
export function getIstDifferenceSummary(sourceTimeZone: string, date: Date = new Date()): {
  diffMinutes: number;
  label: string;
  isAhead: boolean;
  isEqual: boolean;
} {
  const istOffset = 330; // +5h 30m = 330 mins
  const sourceOffset = getUtcOffsetMinutes(sourceTimeZone, date);
  const diffMinutes = istOffset - sourceOffset;

  if (diffMinutes === 0) {
    return { diffMinutes: 0, label: 'Same time as IST', isAhead: false, isEqual: true };
  }

  const absMins = Math.abs(diffMinutes);
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;
  const timeStr = `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();

  if (diffMinutes > 0) {
    return {
      diffMinutes,
      label: `IST is ${timeStr} ahead`,
      isAhead: true,
      isEqual: false
    };
  } else {
    return {
      diffMinutes,
      label: `IST is ${timeStr} behind`,
      isAhead: false,
      isEqual: false
    };
  }
}

/**
 * Converts a specific local date and time in source timezone to exact UTC Date.
 * Handles DST shifts and edge cases with 2-pass Intl refinement.
 */
export function convertSourceTimeToDate(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number, // 0-23
  minute: number, // 0-59
  timeZone: string,
  second: number = 0
): Date {
  // First approximation: treat components as UTC
  const approxUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const getParts = (d: Date) => {
    const parts = formatter.formatToParts(d);
    const extract = (type: string) => {
      const match = parts.find(p => p.type === type);
      return match ? parseInt(match.value, 10) : 0;
    };
    let h = extract('hour');
    if (h === 24) h = 0;
    return {
      y: extract('year'),
      m: extract('month'),
      d: extract('day'),
      h,
      min: extract('minute'),
      s: extract('second')
    };
  };

  // Pass 1
  const p1 = getParts(new Date(approxUtcMs));
  const p1Epoch = Date.UTC(p1.y, p1.m - 1, p1.d, p1.h, p1.min, p1.s);
  const diffMs = p1Epoch - approxUtcMs;
  let targetUtcMs = approxUtcMs - diffMs;

  // Pass 2 to eliminate DST discrepancies near boundary
  const p2 = getParts(new Date(targetUtcMs));
  const p2Epoch = Date.UTC(p2.y, p2.m - 1, p2.d, p2.h, p2.min, p2.s);
  const diff2 = p2Epoch - Date.UTC(year, month - 1, day, hour, minute, second);
  if (diff2 !== 0) {
    targetUtcMs -= diff2;
  }

  return new Date(targetUtcMs);
}

/**
 * Format a Date object in IST
 */
export function formatInIST(
  date: Date,
  options: {
    timeFormat?: '12h' | '24h';
    includeSeconds?: boolean;
    includeDate?: boolean;
    includeWeekday?: boolean;
  } = {}
): string {
  const {
    timeFormat = '12h',
    includeSeconds = false,
    includeDate = true,
    includeWeekday = true
  } = options;

  const intlOpts: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  };

  if (includeSeconds) {
    intlOpts.second = '2-digit';
  }
  if (includeDate) {
    intlOpts.month = 'short';
    intlOpts.day = 'numeric';
    intlOpts.year = 'numeric';
  }
  if (includeWeekday) {
    intlOpts.weekday = 'short';
  }

  return new Intl.DateTimeFormat('en-IN', intlOpts).format(date);
}

/**
 * Format a Date object in any given timezone
 */
export function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: {
    timeFormat?: '12h' | '24h';
    includeSeconds?: boolean;
    includeDate?: boolean;
    includeWeekday?: boolean;
    includeTzName?: boolean;
  } = {}
): string {
  const {
    timeFormat = '12h',
    includeSeconds = false,
    includeDate = true,
    includeWeekday = true,
    includeTzName = false
  } = options;

  const intlOpts: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  };

  if (includeSeconds) {
    intlOpts.second = '2-digit';
  }
  if (includeDate) {
    intlOpts.month = 'short';
    intlOpts.day = 'numeric';
  }
  if (includeWeekday) {
    intlOpts.weekday = 'short';
  }
  if (includeTzName) {
    intlOpts.timeZoneName = 'short';
  }

  return new Intl.DateTimeFormat('en-US', intlOpts).format(date);
}

/**
 * Get current year, month, day, hour, minute, second for any timezone
 */
export function getLocalComponentsInTz(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  let hour = parseInt(get('hour'), 10) || 0;
  if (hour === 24) hour = 0;

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour,
    minute: parseInt(get('minute'), 10) || 0,
    second: parseInt(get('second'), 10) || 0,
    weekday: get('weekday')
  };
}

/**
 * Compute the next upcoming trigger time for an alarm.
 * Takes into account:
 * - Recurrence: 'once', 'daily', 'weekdays', 'custom'
 * - Snoozed until
 * - Lead time (pre-alarm)
 */
export function calculateNextTrigger(alarm: Alarm, now: Date = new Date()): NextTriggerInfo | null {
  const timeParts = alarm.sourceTime.split(':').map(Number);
  const targetHour = timeParts[0] || 0;
  const targetMinute = timeParts[1] || 0;
  const targetSecond = timeParts[2] || 0;
  const hasSeconds = timeParts.length >= 3;
  const nowMs = now.getTime();

  // If currently snoozed and snooze time is in future:
  if (alarm.snoozedUntil && alarm.snoozedUntil > nowMs) {
    const triggerDate = new Date(alarm.snoozedUntil);
    return {
      alarmId: alarm.id,
      nextTriggerMs: alarm.snoozedUntil,
      istTimeString: formatInIST(triggerDate, { timeFormat: '12h', includeSeconds: hasSeconds, includeDate: false, includeWeekday: false }),
      istDateString: formatInIST(triggerDate, { includeSeconds: hasSeconds }),
      sourceTimeString: formatInTimeZone(triggerDate, alarm.sourceTimeZone, { timeFormat: '12h', includeSeconds: hasSeconds, includeDate: false, includeWeekday: false }),
      sourceDateString: formatInTimeZone(triggerDate, alarm.sourceTimeZone, { includeTzName: true }),
      timeRemainingMs: alarm.snoozedUntil - nowMs,
      isPreAlert: false,
      leadTimeSeconds: 0,
      leadSummary: undefined,
      isSnoozed: true,
      dayDrift: 0,
      matchLabel: alarm.matchLabel
    };
  }

  // Get current date components in the source timezone
  const sourceNow = getLocalComponentsInTz(now, alarm.sourceTimeZone);

  let targetDate: Date | null = null;
  const leadSec = alarm.leadTimeSeconds !== undefined
    ? alarm.leadTimeSeconds
    : (alarm.leadTimeMinutes || 0) * 60;
  const leadMs = leadSec * 1000;

  if (alarm.recurrence === 'once') {
    if (!alarm.sourceDate) {
      // default to today in source timezone
      alarm.sourceDate = `${sourceNow.year}-${String(sourceNow.month).padStart(2, '0')}-${String(sourceNow.day).padStart(2, '0')}`;
    }
    const [y, m, d] = alarm.sourceDate.split('-').map(v => parseInt(v, 10));
    const fullTargetDate = convertSourceTimeToDate(y, m, d, targetHour, targetMinute, alarm.sourceTimeZone, targetSecond);
    const triggerMs = fullTargetDate.getTime() - leadMs;

    if (triggerMs > nowMs) {
      targetDate = fullTargetDate;
    } else {
      // Past once alarm
      return null;
    }
  } else {
    // Recurring: check up to 14 days ahead in source timezone to find first valid match
    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
      // Compute candidate date in source timezone by offsetting from current source date
      const testBase = new Date(Date.UTC(sourceNow.year, sourceNow.month - 1, sourceNow.day + dayOffset, 12, 0, 0));
      const testParts = {
        y: testBase.getUTCFullYear(),
        m: testBase.getUTCMonth() + 1,
        d: testBase.getUTCDate(),
        dayOfWeek: testBase.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
      };

      // Check recurrence rule
      let matches = false;
      if (alarm.recurrence === 'daily') {
        matches = true;
      } else if (alarm.recurrence === 'weekdays') {
        matches = testParts.dayOfWeek >= 1 && testParts.dayOfWeek <= 5;
      } else if (alarm.recurrence === 'custom' && alarm.customDays) {
        matches = alarm.customDays.includes(testParts.dayOfWeek);
      }

      if (matches) {
        const candidateFullDate = convertSourceTimeToDate(
          testParts.y,
          testParts.m,
          testParts.d,
          targetHour,
          targetMinute,
          alarm.sourceTimeZone,
          targetSecond
        );

        const candidateTriggerMs = candidateFullDate.getTime() - leadMs;
        if (candidateTriggerMs > nowMs) {
          targetDate = candidateFullDate;
          break;
        }
      }
    }
  }

  if (!targetDate) {
    return null;
  }

  const actualTriggerMs = targetDate.getTime() - leadMs;
  const isPreAlert = leadMs > 0;

  // Day drift calculation between source date and IST date
  const sourceComps = getLocalComponentsInTz(targetDate, alarm.sourceTimeZone);
  const istComps = getLocalComponentsInTz(targetDate, IST_TIMEZONE);
  let dayDrift = 0;
  if (istComps.day !== sourceComps.day) {
    // If IST day is greater or turned into next month
    if (istComps.day > sourceComps.day || (istComps.day === 1 && sourceComps.day > 25)) {
      dayDrift = 1;
    } else {
      dayDrift = -1;
    }
  }

  let leadSummary: string | undefined = undefined;
  if (leadSec > 0) {
    if (leadSec < 60) {
      leadSummary = `${leadSec}s early`;
    } else if (leadSec % 60 === 0) {
      leadSummary = `${leadSec / 60}m early`;
    } else {
      leadSummary = `${Math.floor(leadSec / 60)}m ${leadSec % 60}s early`;
    }
  }

  return {
    alarmId: alarm.id,
    nextTriggerMs: actualTriggerMs,
    istTimeString: formatInIST(targetDate, { timeFormat: '12h', includeSeconds: hasSeconds, includeDate: false, includeWeekday: false }),
    istDateString: formatInIST(targetDate, { includeSeconds: hasSeconds }),
    sourceTimeString: formatInTimeZone(targetDate, alarm.sourceTimeZone, { timeFormat: '12h', includeSeconds: hasSeconds, includeDate: false, includeWeekday: false }),
    sourceDateString: formatInTimeZone(targetDate, alarm.sourceTimeZone, { includeTzName: true }),
    timeRemainingMs: Math.max(0, actualTriggerMs - nowMs),
    isPreAlert,
    leadTimeSeconds: leadSec,
    leadSummary,
    isSnoozed: false,
    dayDrift,
    matchLabel: alarm.matchLabel
  };
}

/**
 * Format remaining time nicely: "in 2h 15m 30s" or "in 45s"
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return 'Ringing now';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `in ${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `in ${minutes}m ${seconds}s`;
  }
  return `in ${seconds}s`;
}

// Comprehensive City / Location to TimeZone dictionary
const CITY_TO_TZ_MAP: Record<string, { id: string; city: string; country: string; flag: string; abbr: string }> = {
  // US & Canada
  seattle: { id: 'America/Los_Angeles', city: 'Seattle', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  portland: { id: 'America/Los_Angeles', city: 'Portland', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'san francisco': { id: 'America/Los_Angeles', city: 'San Francisco', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  sf: { id: 'America/Los_Angeles', city: 'San Francisco', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'los angeles': { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  la: { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'silicon valley': { id: 'America/Los_Angeles', city: 'Silicon Valley', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  cupertino: { id: 'America/Los_Angeles', city: 'Cupertino', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  california: { id: 'America/Los_Angeles', city: 'California', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'san diego': { id: 'America/Los_Angeles', city: 'San Diego', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'san jose': { id: 'America/Los_Angeles', city: 'San Jose', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  'las vegas': { id: 'America/Los_Angeles', city: 'Las Vegas', country: 'United States', flag: '🇺🇸', abbr: 'PT' },
  phoenix: { id: 'America/Phoenix', city: 'Phoenix', country: 'United States', flag: '🇺🇸', abbr: 'MST' },
  denver: { id: 'America/Denver', city: 'Denver', country: 'United States', flag: '🇺🇸', abbr: 'MT' },
  'salt lake city': { id: 'America/Denver', city: 'Salt Lake City', country: 'United States', flag: '🇺🇸', abbr: 'MT' },
  chicago: { id: 'America/Chicago', city: 'Chicago', country: 'United States', flag: '🇺🇸', abbr: 'CT' },
  austin: { id: 'America/Chicago', city: 'Austin', country: 'United States', flag: '🇺🇸', abbr: 'CT' },
  dallas: { id: 'America/Chicago', city: 'Dallas', country: 'United States', flag: '🇺🇸', abbr: 'CT' },
  houston: { id: 'America/Chicago', city: 'Houston', country: 'United States', flag: '🇺🇸', abbr: 'CT' },
  minneapolis: { id: 'America/Chicago', city: 'Minneapolis', country: 'United States', flag: '🇺🇸', abbr: 'CT' },
  'new york': { id: 'America/New_York', city: 'New York', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  nyc: { id: 'America/New_York', city: 'New York', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  boston: { id: 'America/New_York', city: 'Boston', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  'washington dc': { id: 'America/New_York', city: 'Washington DC', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  washington: { id: 'America/New_York', city: 'Washington DC', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  atlanta: { id: 'America/New_York', city: 'Atlanta', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  miami: { id: 'America/New_York', city: 'Miami', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  philadelphia: { id: 'America/New_York', city: 'Philadelphia', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  detroit: { id: 'America/Detroit', city: 'Detroit', country: 'United States', flag: '🇺🇸', abbr: 'ET' },
  toronto: { id: 'America/Toronto', city: 'Toronto', country: 'Canada', flag: '🇨🇦', abbr: 'ET' },
  montreal: { id: 'America/Toronto', city: 'Montreal', country: 'Canada', flag: '🇨🇦', abbr: 'ET' },
  vancouver: { id: 'America/Vancouver', city: 'Vancouver', country: 'Canada', flag: '🇨🇦', abbr: 'PT' },
  calgary: { id: 'America/Edmonton', city: 'Calgary', country: 'Canada', flag: '🇨🇦', abbr: 'MT' },
  'sao paulo': { id: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', abbr: 'BRT' },
  'buenos aires': { id: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', abbr: 'ART' },
  'mexico city': { id: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', abbr: 'CST' },

  // Europe & UK
  london: { id: 'Europe/London', city: 'London', country: 'United Kingdom', flag: '🇬🇧', abbr: 'GMT/BST' },
  uk: { id: 'Europe/London', city: 'London', country: 'United Kingdom', flag: '🇬🇧', abbr: 'GMT/BST' },
  england: { id: 'Europe/London', city: 'London', country: 'United Kingdom', flag: '🇬🇧', abbr: 'GMT/BST' },
  dublin: { id: 'Europe/Dublin', city: 'Dublin', country: 'Ireland', flag: '🇮🇪', abbr: 'GMT/IST' },
  ireland: { id: 'Europe/Dublin', city: 'Dublin', country: 'Ireland', flag: '🇮🇪', abbr: 'GMT/IST' },
  paris: { id: 'Europe/Paris', city: 'Paris', country: 'France', flag: '🇫🇷', abbr: 'CET' },
  france: { id: 'Europe/Paris', city: 'Paris', country: 'France', flag: '🇫🇷', abbr: 'CET' },
  berlin: { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', flag: '🇩🇪', abbr: 'CET' },
  germany: { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', flag: '🇩🇪', abbr: 'CET' },
  munich: { id: 'Europe/Berlin', city: 'Munich', country: 'Germany', flag: '🇩🇪', abbr: 'CET' },
  frankfurt: { id: 'Europe/Berlin', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪', abbr: 'CET' },
  amsterdam: { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', abbr: 'CET' },
  netherlands: { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', abbr: 'CET' },
  brussels: { id: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', flag: '🇧🇪', abbr: 'CET' },
  zurich: { id: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭', abbr: 'CET' },
  geneva: { id: 'Europe/Zurich', city: 'Geneva', country: 'Switzerland', flag: '🇨🇭', abbr: 'CET' },
  switzerland: { id: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭', abbr: 'CET' },
  vienna: { id: 'Europe/Vienna', city: 'Vienna', country: 'Austria', flag: '🇦🇹', abbr: 'CET' },
  madrid: { id: 'Europe/Madrid', city: 'Madrid', country: 'Spain', flag: '🇪🇸', abbr: 'CET' },
  barcelona: { id: 'Europe/Madrid', city: 'Barcelona', country: 'Spain', flag: '🇪🇸', abbr: 'CET' },
  rome: { id: 'Europe/Rome', city: 'Rome', country: 'Italy', flag: '🇮🇹', abbr: 'CET' },
  milan: { id: 'Europe/Rome', city: 'Milan', country: 'Italy', flag: '🇮🇹', abbr: 'CET' },
  stockholm: { id: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', flag: '🇸🇪', abbr: 'CET' },
  oslo: { id: 'Europe/Oslo', city: 'Oslo', country: 'Norway', flag: '🇳🇴', abbr: 'CET' },
  copenhagen: { id: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', flag: '🇩🇰', abbr: 'CET' },
  helsinki: { id: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', flag: '🇫🇮', abbr: 'EET' },
  athens: { id: 'Europe/Athens', city: 'Athens', country: 'Greece', flag: '🇬🇷', abbr: 'EET' },
  warsaw: { id: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', flag: '🇵🇱', abbr: 'CET' },
  prague: { id: 'Europe/Prague', city: 'Prague', country: 'Czechia', flag: '🇨🇿', abbr: 'CET' },

  // Middle East & Africa
  dubai: { id: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', abbr: 'GST' },
  uae: { id: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', abbr: 'GST' },
  'abu dhabi': { id: 'Asia/Dubai', city: 'Abu Dhabi', country: 'United Arab Emirates', flag: '🇦🇪', abbr: 'GST' },
  riyadh: { id: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', abbr: 'AST' },
  doha: { id: 'Asia/Qatar', city: 'Doha', country: 'Qatar', flag: '🇶🇦', abbr: 'AST' },
  'tel aviv': { id: 'Asia/Jerusalem', city: 'Tel Aviv', country: 'Israel', flag: '🇮🇱', abbr: 'IST' },
  cairo: { id: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', flag: '🇪🇬', abbr: 'EEST' },
  johannesburg: { id: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', abbr: 'SAST' },
  'cape town': { id: 'Africa/Johannesburg', city: 'Cape Town', country: 'South Africa', flag: '🇿🇦', abbr: 'SAST' },
  nairobi: { id: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya', flag: '🇰🇪', abbr: 'EAT' },

  // Asia & Pacific
  singapore: { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', abbr: 'SGT' },
  tokyo: { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', abbr: 'JST' },
  japan: { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', abbr: 'JST' },
  osaka: { id: 'Asia/Tokyo', city: 'Osaka', country: 'Japan', flag: '🇯🇵', abbr: 'JST' },
  kyoto: { id: 'Asia/Tokyo', city: 'Kyoto', country: 'Japan', flag: '🇯🇵', abbr: 'JST' },
  seoul: { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', abbr: 'KST' },
  korea: { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', abbr: 'KST' },
  'hong kong': { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', abbr: 'HKT' },
  taipei: { id: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan', flag: '🇹🇼', abbr: 'CST' },
  bangkok: { id: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', abbr: 'ICT' },
  jakarta: { id: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', abbr: 'WIB' },
  manila: { id: 'Asia/Manila', city: 'Manila', country: 'Philippines', flag: '🇵🇭', abbr: 'PST' },
  sydney: { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia', flag: '🇦🇺', abbr: 'AEST' },
  melbourne: { id: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', flag: '🇦🇺', abbr: 'AEST' },
  brisbane: { id: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', flag: '🇦🇺', abbr: 'AEST' },
  perth: { id: 'Australia/Perth', city: 'Perth', country: 'Australia', flag: '🇦🇺', abbr: 'AWST' },
  auckland: { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿', abbr: 'NZST' },
  wellington: { id: 'Pacific/Auckland', city: 'Wellington', country: 'New Zealand', flag: '🇳🇿', abbr: 'NZST' },
  honolulu: { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', flag: '🇺🇸', abbr: 'HST' },
  hawaii: { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', flag: '🇺🇸', abbr: 'HST' },

  // India
  kolkata: { id: 'Asia/Kolkata', city: 'Kolkata', country: 'India', flag: '🇮🇳', abbr: 'IST' },
  delhi: { id: 'Asia/Kolkata', city: 'New Delhi', country: 'India', flag: '🇮🇳', abbr: 'IST' },
  mumbai: { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India', flag: '🇮🇳', abbr: 'IST' },
  bangalore: { id: 'Asia/Kolkata', city: 'Bangalore', country: 'India', flag: '🇮🇳', abbr: 'IST' },
  hyderabad: { id: 'Asia/Kolkata', city: 'Hyderabad', country: 'India', flag: '🇮🇳', abbr: 'IST' },
  chennai: { id: 'Asia/Kolkata', city: 'Chennai', country: 'India', flag: '🇮🇳', abbr: 'IST' },

  // Nepal
  kathmandu: { id: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', abbr: 'NPT' },
  nepal: { id: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', abbr: 'NPT' },
};

/**
 * Resolve ANY location or city name in the world to its TimeZoneItem
 */
export function resolveLocationToTimeZone(input: string): TimeZoneItem {
  if (!input || !input.trim()) {
    return POPULAR_TIMEZONES[0];
  }

  const trimmed = input.trim();
  const clean = trimmed.toLowerCase();

  // 1. Check for explicit embedded IANA identifier e.g. "Asia/Kathmandu", "(27.702, 85.321, Asia/Kathmandu)"
  const ianaRegexMatch = trimmed.match(/\b([A-Z][a-zA-Z]+(?:\/[A-Za-z_]+)+)\b/);
  if (ianaRegexMatch) {
    const candidateId = ianaRegexMatch[1];
    const popularFind = POPULAR_TIMEZONES.find(t => t.id.toLowerCase() === candidateId.toLowerCase());
    if (popularFind) return popularFind;

    const all = getAllAvailableTimeZones();
    const allFind = all.find(t => t.id.toLowerCase() === candidateId.toLowerCase());
    if (allFind) return allFind;

    // Even if not in standard list, if Intl accepts it, construct item
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidateId });
      const parts = candidateId.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      return {
        id: candidateId,
        city,
        country: parts[0] || 'Global',
        region: parts[0] || 'Global',
        abbr: getTzAbbreviation(candidateId),
        flag: candidateId.includes('Kathmandu') ? '🇳🇵' : '🌐',
        isCommon: true
      };
    } catch {
      // invalid IANA id, continue
    }
  }

  // 2. Direct dictionary match
  if (CITY_TO_TZ_MAP[clean]) {
    const item = CITY_TO_TZ_MAP[clean];
    return {
      id: item.id,
      city: item.city,
      country: item.country,
      region: item.country,
      abbr: item.abbr,
      flag: item.flag,
      isCommon: true
    };
  }

  // 3. Partial dictionary match (check if input contains a known city name or vice-versa)
  // Sort keys by length descending to match longest specific city first (e.g. "san francisco" before "san")
  const sortedKeys = Object.keys(CITY_TO_TZ_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (clean.includes(key)) {
      const item = CITY_TO_TZ_MAP[key];
      return {
        id: item.id,
        city: item.city,
        country: item.country,
        region: item.country,
        abbr: item.abbr,
        flag: item.flag,
        isCommon: true
      };
    }
  }

  // 4. Search in popular timezones list
  const popularMatch = POPULAR_TIMEZONES.find(
    t =>
      clean.includes(t.id.toLowerCase()) ||
      t.id.toLowerCase().includes(clean) ||
      clean.includes(t.city.toLowerCase()) ||
      t.city.toLowerCase().includes(clean) ||
      clean.includes(t.country.toLowerCase()) ||
      t.country.toLowerCase().includes(clean) ||
      t.abbr.toLowerCase() === clean
  );
  if (popularMatch) return popularMatch;

  // 5. Search in full available IANA list
  const all = getAllAvailableTimeZones();
  const ianaMatch = all.find(
    t =>
      clean.includes(t.id.toLowerCase()) ||
      t.id.toLowerCase().includes(clean) ||
      clean.includes(t.city.toLowerCase()) ||
      t.city.toLowerCase().includes(clean) ||
      clean.includes(t.country.toLowerCase())
  );
  if (ianaMatch) return ianaMatch;

  // Fallback default
  return {
    id: 'America/Los_Angeles',
    city: input.trim(),
    country: 'Global',
    region: 'Americas',
    abbr: getTzAbbreviation('America/Los_Angeles'),
    flag: '🌐',
    isCommon: false
  };
}

export interface ParsedTimeWithLocation {
  success: boolean;
  rawInput: string;
  detectedLocationName: string;
  timeZoneItem: TimeZoneItem;
  sourceTime: string; // e.g. "09:30" or "09:32:23"
  hour: number;
  minute: number;
  second?: number;
  sourceDate?: string; // "YYYY-MM-DD"
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
  dateObj: Date;
}

export function formatLeadTimeSeconds(seconds: number): string {
  if (seconds <= 0) return 'Exact time (0s)';
  if (seconds < 60) return `${seconds}s before`;
  if (seconds % 60 === 0) return `${seconds / 60}m before`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s before`;
}

const MONTH_NAMES: Record<string, number> = {
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

/**
 * Parses user input containing time and location in a single string,
 * automatically detects the location & time, and computes the exact IST time.
 */
export function parsePastedTimeWithLocation(
  input: string,
  timeFormat: '12h' | '24h' = '12h',
  options?: {
    defaultLeadTimeSeconds?: number;
    defaultMatchLabel?: string;
  }
): ParsedTimeWithLocation | null {
  if (!input || !input.trim()) return null;

  const raw = input.trim();

  // 0. Extract Match Label if present (e.g. "Match: CSK vs MI", "csk vs mi", "ind vs nz", "[IND vs NZ]")
  let detectedMatchLabel: string | undefined = options?.defaultMatchLabel;
  let matchMatchStr = '';

  const explicitMatchRegex = /\b(?:match|game):\s*([A-Za-z0-9&.\s\-]+)/i;
  const vsRegex = /\b([A-Za-z0-9&.]{2,15}\s+(?:vs\.?|v)\s+[A-Za-z0-9&.]{2,15})\b/i;
  const bracketVsRegex = /\[([A-Za-z0-9&.\s]+?(?:vs\.?|v)\s+[A-Za-z0-9&.]+)\]/i;

  const bracketMatch = raw.match(bracketVsRegex);
  if (bracketMatch) {
    detectedMatchLabel = bracketMatch[1].trim();
    matchMatchStr = bracketMatch[0];
  } else {
    const expMatch = raw.match(explicitMatchRegex);
    if (expMatch) {
      detectedMatchLabel = expMatch[1].trim();
      matchMatchStr = expMatch[0];
    } else {
      const vsMatch = raw.match(vsRegex);
      if (vsMatch) {
        detectedMatchLabel = vsMatch[1].trim();
        matchMatchStr = vsMatch[0];
      }
    }
  }

  // Normalize detected match label uppercase for short team acronyms (e.g. "csk vs mi" -> "CSK vs MI")
  if (detectedMatchLabel) {
    detectedMatchLabel = detectedMatchLabel.replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase()).trim();
  }

  // Extract custom seconds before alarm if specified in text (e.g. "30s before", "15 sec early", "45s")
  let leadTimeSeconds = options?.defaultLeadTimeSeconds !== undefined ? options.defaultLeadTimeSeconds : 0;
  let leadMatchStr = '';
  const secLeadRegex = /\b(\d{1,3})\s*(?:s|sec|secs|seconds?)\s*(?:before|early|prior|alert)?\b/i;
  const minLeadRegex = /\b(\d{1,2})\s*(?:m|min|mins|minutes?)\s*(?:before|early|prior|alert)?\b/i;

  const secLeadMatch = raw.match(secLeadRegex);
  if (secLeadMatch) {
    leadTimeSeconds = parseInt(secLeadMatch[1], 10);
    leadMatchStr = secLeadMatch[0];
  } else {
    const minLeadMatch = raw.match(minLeadRegex);
    if (minLeadMatch) {
      leadTimeSeconds = parseInt(minLeadMatch[1], 10) * 60;
      leadMatchStr = minLeadMatch[0];
    }
  }

  // 1. Extract Time
  // Check time with seconds first: "09:32:23", "9:32:23 AM"
  let hour = -1;
  let minute = 0;
  let second: number | undefined = undefined;
  let timeMatchStr = '';

  const timeWithSecRegex = /\b(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?\b/i;
  const timeWithMinRegex = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i;
  const bareHourAmPmRegex = /\b(\d{1,2})\s*(am|pm)\b/i;

  const secMatch = raw.match(timeWithSecRegex);
  if (secMatch) {
    hour = parseInt(secMatch[1], 10);
    minute = parseInt(secMatch[2], 10);
    second = parseInt(secMatch[3], 10);
    const mer = secMatch[4]?.toLowerCase();
    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
    timeMatchStr = secMatch[0];
  } else {
    const minMatch = raw.match(timeWithMinRegex);
    if (minMatch) {
      hour = parseInt(minMatch[1], 10);
      minute = parseInt(minMatch[2], 10);
      const mer = minMatch[3]?.toLowerCase();
      if (mer === 'pm' && hour < 12) hour += 12;
      if (mer === 'am' && hour === 12) hour = 0;
      timeMatchStr = minMatch[0];
    } else {
      const bareMatch = raw.match(bareHourAmPmRegex);
      if (bareMatch) {
        hour = parseInt(bareMatch[1], 10);
        minute = 0;
        const mer = bareMatch[2]?.toLowerCase();
        if (mer === 'pm' && hour < 12) hour += 12;
        if (mer === 'am' && hour === 12) hour = 0;
        timeMatchStr = bareMatch[0];
      }
    }
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null; // No valid time detected
  }

  // 2. Extract Date (optional)
  let dateStr: string | undefined = undefined;
  let dateMatchStr = '';

  const dateTextMatch = raw.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (dateTextMatch) {
    const day = parseInt(dateTextMatch[1], 10);
    const monthKey = dateTextMatch[2].toLowerCase();
    const year = parseInt(dateTextMatch[3], 10);
    const monthNum = MONTH_NAMES[monthKey] || MONTH_NAMES[monthKey.slice(0, 3)];
    if (monthNum) {
      dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dateMatchStr = dateTextMatch[0];
    }
  } else {
    const isoDateMatch = raw.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoDateMatch) {
      dateStr = `${isoDateMatch[1]}-${String(parseInt(isoDateMatch[2], 10)).padStart(2, '0')}-${String(parseInt(isoDateMatch[3], 10)).padStart(2, '0')}`;
      dateMatchStr = isoDateMatch[0];
    }
  }

  // 3. Detect Location / TimeZone in text
  let detectedLocationName = '';
  let locationMatchStr = '';

  // Check for explicit IANA timezone pattern (e.g. Asia/Kathmandu, Europe/London, America/New_York)
  const ianaRegex = /\b([A-Z][a-zA-Z]+(?:\/[A-Za-z_]+)+)\b/;
  const ianaMatch = raw.match(ianaRegex);
  if (ianaMatch) {
    detectedLocationName = ianaMatch[1];
    locationMatchStr = ianaMatch[0];
  } else {
    // Check known city dictionary keys, ordered longest to shortest
    const lowerRaw = raw.toLowerCase();
    const sortedKeys = Object.keys(CITY_TO_TZ_MAP).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const keyRegex = new RegExp(`\\b${key}\\b`, 'i');
      if (keyRegex.test(lowerRaw)) {
        detectedLocationName = key;
        const match = raw.match(keyRegex);
        locationMatchStr = match ? match[0] : key;
        break;
      }
    }

    // Check timezone abbreviations if no city name matched
    if (!detectedLocationName) {
      const abbrRegex = /\b(pst|pdt|pt|est|edt|et|cst|cdt|ct|gmt|bst|cet|cest|jst|sgt|gst|aest|aedt|npt|utc)\b/i;
      const abbrMatch = raw.match(abbrRegex);
      if (abbrMatch) {
        detectedLocationName = abbrMatch[1];
        locationMatchStr = abbrMatch[0];
      }
    }
  }

  // If no location detected, default to input without time
  if (!detectedLocationName) {
    const remainder = raw
      .replace(timeMatchStr, '')
      .replace(dateMatchStr, '')
      .replace(matchMatchStr, '')
      .replace(/[-–—:;,]/g, ' ')
      .trim();
    if (remainder.length > 2) {
      detectedLocationName = remainder.split(/\s+/)[0];
    } else {
      detectedLocationName = 'London'; // sensible default
    }
  }

  const timeZoneItem = resolveLocationToTimeZone(detectedLocationName);

  // 4. Clean Event Title & Category
  let cleaned = raw
    .replace(timeMatchStr, '')
    .replace(dateMatchStr, '')
    .replace(locationMatchStr, '')
    .replace(matchMatchStr, '')
    .replace(leadMatchStr, '')
    .replace(/\b(at|in|on|for|with|time|window|possibility|timings|from|to)\b/gi, '')
    .replace(/[-–—:;,()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Category detection
  const lowerAll = raw.toLowerCase();
  let category: AlarmCategory = 'meeting';
  if (
    detectedMatchLabel ||
    lowerAll.includes('wicket') ||
    lowerAll.includes('cricket') ||
    lowerAll.includes('advert') ||
    lowerAll.includes('break') ||
    lowerAll.includes('match') ||
    lowerAll.includes('sports') ||
    lowerAll.includes('game')
  ) {
    category = 'sports';
  } else if (
    lowerAll.includes('market') ||
    lowerAll.includes('trad') ||
    lowerAll.includes('stock') ||
    lowerAll.includes('nyse') ||
    lowerAll.includes('bell')
  ) {
    category = 'market';
  } else if (
    lowerAll.includes('work') ||
    lowerAll.includes('task') ||
    lowerAll.includes('sprint') ||
    lowerAll.includes('review') ||
    lowerAll.includes('code')
  ) {
    category = 'work';
  } else if (
    lowerAll.includes('webinar') ||
    lowerAll.includes('learn') ||
    lowerAll.includes('train') ||
    lowerAll.includes('class')
  ) {
    category = 'webinar';
  } else if (
    lowerAll.includes('coffee') ||
    lowerAll.includes('lunch') ||
    lowerAll.includes('dinner') ||
    lowerAll.includes('gym') ||
    lowerAll.includes('personal')
  ) {
    category = 'personal';
  }

  if (!cleaned || cleaned.length < 2) {
    if (category === 'sports' && lowerAll.includes('wicket')) {
      cleaned = detectedMatchLabel ? `${detectedMatchLabel} Wicket Window` : 'Wicket Possibility';
    } else if (detectedMatchLabel) {
      cleaned = `${detectedMatchLabel} Timing`;
    } else {
      cleaned = `${timeZoneItem.city} ${category === 'meeting' ? 'Sync' : 'Alert'}`;
    }
  } else {
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 5. Convert Source Time to Exact IST
  const today = new Date();
  let y = today.getFullYear();
  let mon = today.getMonth() + 1;
  let d = today.getDate();

  if (dateStr) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      y = parts[0];
      mon = parts[1];
      d = parts[2];
    }
  }

  const dateObj = convertSourceTimeToDate(y, mon, d, hour, minute, timeZoneItem.id, second || 0);

  const hasSeconds = second !== undefined;
  const istTimeFormatted = formatInIST(dateObj, {
    timeFormat,
    includeSeconds: hasSeconds,
    includeDate: false
  });

  const istDateFormatted = formatInIST(dateObj, {
    includeSeconds: hasSeconds,
    includeWeekday: true
  });

  const sourceTimeFormatted = formatInTimeZone(dateObj, timeZoneItem.id, {
    timeFormat,
    includeSeconds: hasSeconds,
    includeDate: false,
    includeTzName: true
  });

  const diff = getIstDifferenceSummary(timeZoneItem.id, dateObj);

  const sourceComps = getLocalComponentsInTz(dateObj, timeZoneItem.id);
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

  const sourceTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}${second !== undefined ? `:${String(second).padStart(2, '0')}` : ''}`;

  return {
    success: true,
    rawInput: raw,
    detectedLocationName: timeZoneItem.city,
    timeZoneItem,
    sourceTime,
    hour,
    minute,
    second,
    sourceDate: dateStr,
    title: cleaned,
    category,
    matchLabel: detectedMatchLabel,
    leadTimeSeconds,
    istTimeFormatted,
    istDateFormatted,
    sourceTimeFormatted,
    diffSummaryLabel: diff.label,
    dayDriftNotice,
    isDayAhead,
    dateObj
  };
}
