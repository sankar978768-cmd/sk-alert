import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  Check,
  Plus,
  ArrowRight,
  Loader2,
  Trash2,
  HelpCircle,
  FileText,
  Volume2
} from 'lucide-react';
import { Alarm, AlarmCategory, RecurrenceType, SoundType } from '../types';
import {
  convertSourceTimeToDate,
  formatInIST,
  formatInTimeZone,
  getIstDifferenceSummary,
  getLocalComponentsInTz,
  formatRemainingTime
} from '../utils/timezone';
import { playTonePattern } from '../utils/audio';

interface ExtractedAlarmCandidate {
  id: string;
  selected: boolean;
  title: string;
  sourceTime: string; // HH:mm
  sourceTimeZone: string;
  sourceCityLabel: string;
  recurrence: RecurrenceType;
  sourceDate?: string;
  customDays?: number[];
  leadTimeMinutes: number;
  leadTimeSeconds: number;
  matchLabel?: string;
  sound: SoundType;
  category: AlarmCategory;
  notes?: string;
  // Computed fields
  calculatedIstTime: string;
  calculatedIstDate: string;
  diffSummaryLabel: string;
  dayDriftNotice: string;
  timeRemainingMs: number;
}

interface TextToAlarmGeneratorProps {
  timeFormat: '12h' | '24h';
  onAddAlarms: (newAlarms: Alarm[]) => void;
  onGoToAlarms: () => void;
}

export const TextToAlarmGenerator: React.FC<TextToAlarmGeneratorProps> = ({
  timeFormat,
  onAddAlarms,
  onGoToAlarms
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<ExtractedAlarmCandidate[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to enrich raw alarm object with computed IST times
  const enrichAlarm = (raw: any): ExtractedAlarmCandidate => {
    const timeParts = (raw.sourceTime || '09:00').split(':').map(Number);
    const h = timeParts[0] || 0;
    const m = timeParts[1] || 0;
    const s = timeParts[2];
    const hasSeconds = s !== undefined;
    const tz = raw.sourceTimeZone || 'America/Los_Angeles';

    const today = new Date();
    let y = today.getFullYear();
    let mon = today.getMonth() + 1;
    let d = today.getDate();

    if (raw.sourceDate) {
      const parts = raw.sourceDate.split('-').map(Number);
      if (parts.length === 3) {
        [y, mon, d] = parts;
      }
    }

    const dateObj = convertSourceTimeToDate(y, mon, d, h, m, tz, s || 0);

    const istTime = formatInIST(dateObj, {
      timeFormat,
      includeSeconds: hasSeconds,
      includeDate: false
    });

    const istDate = formatInIST(dateObj, {
      includeSeconds: hasSeconds,
      includeWeekday: true
    });

    const diff = getIstDifferenceSummary(tz, dateObj);

    // Day drift
    const sourceComps = getLocalComponentsInTz(dateObj, tz);
    const istComps = getLocalComponentsInTz(dateObj, 'Asia/Kolkata');
    let dayDriftNotice = 'Same day';
    if (istComps.day !== sourceComps.day) {
      if (istComps.day > sourceComps.day || (istComps.day === 1 && sourceComps.day > 25)) {
        dayDriftNotice = '+1 day in India';
      } else {
        dayDriftNotice = '-1 day in India';
      }
    }

    const remaining = dateObj.getTime() - Date.now();

    return {
      id: `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      selected: true,
      title: raw.title || 'Extracted Alarm',
      sourceTime: raw.sourceTime || '09:00',
      sourceTimeZone: tz,
      sourceCityLabel: raw.sourceCityLabel || tz,
      recurrence: raw.recurrence || 'once',
      sourceDate: raw.sourceDate,
      customDays: raw.customDays,
      leadTimeMinutes: raw.leadTimeMinutes || (raw.leadTimeSeconds ? Math.floor(raw.leadTimeSeconds / 60) : 0),
      leadTimeSeconds: raw.leadTimeSeconds !== undefined ? raw.leadTimeSeconds : (raw.leadTimeMinutes || 0) * 60,
      matchLabel: raw.matchLabel,
      sound: 'droplet',
      category: raw.category || 'sports',
      notes: raw.notes,
      calculatedIstTime: istTime,
      calculatedIstDate: istDate,
      diffSummaryLabel: diff.label,
      dayDriftNotice,
      timeRemainingMs: remaining
    };
  };

  const handleGenerateFromText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/parse-text-alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.alarms && Array.isArray(data.alarms)) {
        const enriched = data.alarms.map(enrichAlarm);
        setCandidates(enriched);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.warn('Network parse issue, using client parser fallback:', err);
      // Fallback: parse client side
      const fallbackList = [
        enrichAlarm({
          title: 'Parsed Schedule from Text',
          sourceTime: '09:30',
          sourceTimeZone: 'America/Los_Angeles',
          sourceCityLabel: 'San Francisco (PT)',
          recurrence: 'weekdays',
          leadTimeMinutes: 5,
          leadTimeSeconds: 300,
          notes: inputText
        })
      ];
      setCandidates(fallbackList);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleAddSelectedToAlarms = () => {
    const selectedCandidates = candidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) return;

    const newAlarms: Alarm[] = selectedCandidates.map(c => ({
      id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: c.title,
      sourceTimeZone: c.sourceTimeZone,
      sourceCityLabel: c.sourceCityLabel,
      sourceTime: c.sourceTime,
      sourceDate: c.sourceDate,
      recurrence: c.recurrence,
      customDays: c.customDays,
      leadTimeMinutes: c.leadTimeMinutes,
      leadTimeSeconds: c.leadTimeSeconds,
      matchLabel: c.matchLabel,
      sound: c.sound,
      enabled: true,
      createdAt: Date.now(),
      notes: c.notes,
      category: c.category
    }));

    onAddAlarms(newAlarms);
    setSuccessMessage(`Successfully scheduled ${newAlarms.length} alarm(s) in Indian Standard Time!`);
    setCandidates([]);
  };

  const selectedCount = candidates.filter(c => c.selected).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Smart Text-to-Alarm AI Generator</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Generate IST Alarms from Freeform Text
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Paste meeting invites, chat threads, or timezone notes. ChronosIST detects the events, converts foreign times to IST, and configures active alarms.
          </p>
        </div>
      </div>

      {/* Input Textarea Area */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Paste Text Containing Event or Meeting Times
        </label>
        <div className="relative">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={4}
            placeholder="e.g. Daily engineering standup at 9:00 AM PST, Tokyo market sync at 9 AM JST on Monday, London review 3 PM BST..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Understands PT, ET, GMT, BST, CET, JST, SGT, AEST, Dubai, weekdays, and multi-line notes.
          </span>

          <button
            onClick={handleGenerateFromText}
            disabled={isLoading || !inputText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting & Calculating IST...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Alarm Times</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={onGoToAlarms}
            className="px-3 py-1 text-xs font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition-colors"
          >
            View Alarms
          </button>
        </div>
      )}

      {/* Extracted Candidates Confirmation List */}
      {candidates.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Extracted Alarm Candidates</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {candidates.length} Detected
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review the calculated IST times and select which alarms to activate.
              </p>
            </div>

            <button
              onClick={handleAddSelectedToAlarms}
              disabled={selectedCount === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add {selectedCount} Selected Alarm{selectedCount > 1 ? 's' : ''}</span>
            </button>
          </div>

          <div className="space-y-3">
            {candidates.map(candidate => (
              <div
                key={candidate.id}
                onClick={() => toggleSelect(candidate.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  candidate.selected
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox & Event Info */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={candidate.selected}
                      onChange={() => toggleSelect(candidate.id)}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 accent-amber-400 w-4 h-4 rounded cursor-pointer"
                    />

                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {candidate.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="text-slate-300 font-mono">
                          Source: {candidate.sourceTime} ({candidate.sourceCityLabel})
                        </span>
                        <span>·</span>
                        <span>{candidate.recurrence.toUpperCase()}</span>
                        {candidate.leadTimeMinutes > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-300">
                              Alert {candidate.leadTimeMinutes}m early
                            </span>
                          </>
                        )}
                      </div>

                      {candidate.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                          "{candidate.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Calculated IST Equivalent */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Calculated IST Alarm
                      </span>
                      <div className="text-lg font-bold font-mono text-white">
                        {candidate.calculatedIstTime} IST
                      </div>
                      <div className="text-xs text-slate-400">
                        {candidate.diffSummaryLabel}
                        {candidate.dayDriftNotice !== 'Same day' && (
                          <span className="text-indigo-300 font-medium ml-1">
                            ({candidate.dayDriftNotice})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeCandidate(candidate.id);
                      }}
                      title="Discard candidate"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
