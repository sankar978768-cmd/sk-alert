import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Calendar, Volume2, Search, Check, AlertCircle } from 'lucide-react';
import { Alarm, AlarmCategory, RecurrenceType, SoundType } from '../types';
import {
  POPULAR_TIMEZONES,
  getAllAvailableTimeZones,
  convertSourceTimeToDate,
  formatInIST,
  formatInTimeZone,
  getIstDifferenceSummary,
  getLocalComponentsInTz
} from '../utils/timezone';
import { playTonePattern, SOUND_OPTIONS } from '../utils/audio';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarmData: Omit<Alarm, 'id' | 'createdAt'>) => void;
  initialAlarm?: Alarm | null;
  initialPreset?: {
    sourceTimeZone: string;
    sourceCityLabel: string;
    sourceTime: string;
    sourceDate?: string;
    title?: string;
  } | null;
  timeFormat: '12h' | '24h';
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAlarm,
  initialPreset,
  timeFormat
}) => {
  const allTimezones = useMemo(() => getAllAvailableTimeZones(), []);

  // Form states
  const [title, setTitle] = useState('');
  const [matchLabel, setMatchLabel] = useState('');
  const [sourceTzId, setSourceTzId] = useState('America/Los_Angeles');
  const [sourceHour, setSourceHour] = useState(9);
  const [sourceMinute, setSourceMinute] = useState(0);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [sourceDate, setSourceDate] = useState('');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [leadTimeSeconds, setLeadTimeSeconds] = useState(0);
  const [customSecondsInput, setCustomSecondsInput] = useState('');
  const [isCustomSeconds, setIsCustomSeconds] = useState(false);
  const [sound, setSound] = useState<SoundType>('breeze');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<AlarmCategory>('meeting');

  // Search filter for TZ
  const [searchTz, setSearchTz] = useState('');
  const [showTzDropdown, setShowTzDropdown] = useState(false);

  // Initialize form when opened or when initial values change
  useEffect(() => {
    if (initialAlarm) {
      setTitle(initialAlarm.title);
      setMatchLabel(initialAlarm.matchLabel || '');
      setSourceTzId(initialAlarm.sourceTimeZone);
      const [h, m] = initialAlarm.sourceTime.split(':').map(Number);
      setSourceHour(h || 9);
      setSourceMinute(m || 0);
      setRecurrence(initialAlarm.recurrence);
      setSourceDate(initialAlarm.sourceDate || '');
      setCustomDays(initialAlarm.customDays || [1, 2, 3, 4, 5]);
      const initialSec = initialAlarm.leadTimeSeconds !== undefined
        ? initialAlarm.leadTimeSeconds
        : (initialAlarm.leadTimeMinutes || 0) * 60;
      setLeadTimeSeconds(initialSec);
      setSound(initialAlarm.sound || 'breeze');
      setNotes(initialAlarm.notes || '');
      setCategory(initialAlarm.category || 'meeting');
    } else if (initialPreset) {
      setTitle(initialPreset.title || 'International Sync');
      setMatchLabel('');
      setSourceTzId(initialPreset.sourceTimeZone);
      const [h, m] = initialPreset.sourceTime.split(':').map(Number);
      setSourceHour(h || 9);
      setSourceMinute(m || 0);
      setRecurrence(initialPreset.sourceDate ? 'once' : 'daily');
      setSourceDate(initialPreset.sourceDate || '');
      setLeadTimeSeconds(0);
      setSound('breeze');
      setNotes('');
      setCategory('meeting');
    } else {
      // Default new alarm (clear / empty title)
      setTitle('');
      setMatchLabel('');
      setSourceTzId('America/Los_Angeles');
      setSourceHour(9);
      setSourceMinute(0);
      setRecurrence('weekdays');
      const today = new Date();
      setSourceDate(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      );
      setCustomDays([1, 2, 3, 4, 5]);
      setLeadTimeSeconds(0);
      setSound('breeze');
      setNotes('');
      setCategory('meeting');
    }
  }, [initialAlarm, initialPreset, isOpen]);

  const selectedTz = useMemo(() => {
    return allTimezones.find(t => t.id === sourceTzId) || POPULAR_TIMEZONES[0];
  }, [allTimezones, sourceTzId]);

  // Filter timezones for search
  const filteredTzs = useMemo(() => {
    if (!searchTz.trim()) return POPULAR_TIMEZONES;
    const q = searchTz.toLowerCase();
    return allTimezones.filter(
      t =>
        t.city.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [allTimezones, searchTz]);

  // Compute live IST preview
  const previewCalculation = useMemo(() => {
    const today = new Date();
    let y = today.getFullYear();
    let m = today.getMonth() + 1;
    let d = today.getDate();

    if (sourceDate) {
      const parts = sourceDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        [y, m, d] = parts;
      }
    }

    const dateObj = convertSourceTimeToDate(y, m, d, sourceHour, sourceMinute, sourceTzId);
    const istTime = formatInIST(dateObj, { timeFormat, includeDate: false });
    const istDate = formatInIST(dateObj, { includeSeconds: false });
    const diff = getIstDifferenceSummary(sourceTzId, dateObj);

    const sourceComps = getLocalComponentsInTz(dateObj, sourceTzId);
    const istComps = getLocalComponentsInTz(dateObj, 'Asia/Kolkata');
    const dayDiff = istComps.day !== sourceComps.day;

    return {
      istTime,
      istDate,
      diffLabel: diff.label,
      dayDiff
    };
  }, [sourceDate, sourceHour, sourceMinute, sourceTzId, timeFormat]);

  const handleTestSound = (snd: SoundType) => {
    playTonePattern(snd, 0.8);
  };

  const toggleCustomDay = (dayIndex: number) => {
    setCustomDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const effectiveLeadSec = isCustomSeconds
    ? (parseInt(customSecondsInput, 10) || 0)
    : leadTimeSeconds;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeStr = `${String(sourceHour).padStart(2, '0')}:${String(sourceMinute).padStart(2, '0')}`;
    onSave({
      title: title.trim() || `${selectedTz.city.split('/')[0].trim()} Time Alarm`,
      sourceTimeZone: sourceTzId,
      sourceCityLabel: `${selectedTz.city} (${selectedTz.abbr})`,
      sourceTime: timeStr,
      sourceDate: recurrence === 'once' ? sourceDate : undefined,
      recurrence,
      customDays: recurrence === 'custom' ? customDays : undefined,
      leadTimeMinutes: Math.floor(effectiveLeadSec / 60),
      leadTimeSeconds: effectiveLeadSec,
      matchLabel: matchLabel.trim() || undefined,
      sound,
      enabled: true,
      notes: notes.trim() || undefined,
      category
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {initialAlarm ? 'Edit IST Alarm' : 'Set New Timezone to IST Alarm'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify time in the foreign timezone; ChronosIST computes and rings at the exact IST moment.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Alarm Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., California Morning Standup, Wicket Window"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AlarmCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="sports">🏏 Sports & Broadcast</option>
                <option value="meeting">👥 Meeting / Sync</option>
                <option value="work">💼 Work & Tasks</option>
                <option value="market">📈 Market Open / Close</option>
                <option value="webinar">🎓 Webinar / Live</option>
                <option value="personal">☕ Personal / Friends</option>
                <option value="custom">🔔 General Reminder</option>
              </select>
            </div>
          </div>

          {/* Match / Series Label */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              🏏 Match / Event Series (Optional, e.g. CSK vs MI, IND vs NZ)
            </label>
            <input
              type="text"
              value={matchLabel}
              onChange={e => setMatchLabel(e.target.value)}
              placeholder="e.g., CSK vs MI, IND vs NZ, Ind vs Pak"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Source Timezone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Source Timezone
              </label>
              <span className="text-xs text-slate-400">
                {selectedTz.flag} {selectedTz.abbr}
              </span>
            </div>

            <div className="relative">
              <div
                onClick={() => setShowTzDropdown(!showTzDropdown)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedTz.flag}</span>
                  <span className="text-sm font-semibold text-white">
                    {selectedTz.city} ({selectedTz.country})
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {selectedTz.abbr}
                </span>
              </div>

              {showTzDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2.5 max-h-56 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search city, country, or zone..."
                      value={searchTz}
                      onChange={e => setSearchTz(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredTzs.map(tz => (
                      <button
                        type="button"
                        key={tz.id}
                        onClick={() => {
                          setSourceTzId(tz.id);
                          setShowTzDropdown(false);
                          setSearchTz('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                          sourceTzId === tz.id
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'text-slate-200 hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{tz.flag}</span>
                          <span className="truncate">{tz.city}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[10px] shrink-0 ml-1">
                          {tz.abbr}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Source Time & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Source Time ({selectedTz.abbr})
              </label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={sourceHour}
                  onChange={e => setSourceHour(parseInt(e.target.value, 10))}
                  aria-label="Modal Source Hour"
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-sm font-mono focus:border-amber-400 focus:outline-none flex-1"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {timeFormat === '12h'
                        ? `${i % 12 === 0 ? 12 : i % 12} ${i >= 12 ? 'PM' : 'AM'}`
                        : `${String(i).padStart(2, '0')}:00`}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={sourceMinute}
                  onChange={e => setSourceMinute(parseInt(e.target.value, 10))}
                  aria-label="Modal Source Minute"
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-sm font-mono focus:border-amber-400 focus:outline-none flex-1"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurrence selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="daily">Daily (Every Day)</option>
                <option value="weekdays">Weekdays (Monday - Friday)</option>
                <option value="once">Once (Specific Date)</option>
                <option value="custom">Custom Days of Week</option>
              </select>
            </div>
          </div>

          {/* Once Date Picker */}
          {recurrence === 'once' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Date in {selectedTz.city}
              </label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={sourceDate}
                  onChange={e => setSourceDate(e.target.value)}
                  required
                  className="bg-transparent text-sm text-white focus:outline-none w-full font-mono"
                />
              </div>
            </div>
          )}

          {/* Custom Days Checkbox Row */}
          {recurrence === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Select Active Days (in {selectedTz.abbr})
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                  const isChecked = customDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleCustomDay(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isChecked
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sound & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alarm Sound Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Alarm Sound
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sound}
                  onChange={e => setSound(e.target.value as SoundType)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <optgroup label="✨ Very Mild Notification Alerts (~1 sec)">
                    {SOUND_OPTIONS.filter(s => s.category === 'mild').map(snd => (
                      <option key={snd.id} value={snd.id}>
                        {snd.icon} {snd.name} (1s mild alert)
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
                  onClick={() => handleTestSound(sound)}
                  title="Preview Alarm Sound"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lead Time (Pre-Alarm in seconds) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Pre-Alert (Seconds)
                </label>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  {effectiveLeadSec === 0 ? 'Exact (0s)' : `${effectiveLeadSec}s before IST`}
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
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {sec === 0 ? '0s' : `${sec}s`}
                  </button>
                ))}
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
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
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Agenda: review Q4 metrics"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Live Calculated IST Preview Card */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Calculated IST Trigger Moment
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
                {previewCalculation.istTime} IST
              </div>
              <div className="text-xs text-amber-200/80 mt-0.5">
                {previewCalculation.istDate} · {previewCalculation.diffLabel}
                {previewCalculation.dayDiff && ' (shifts calendar day in India)'}
              </div>
            </div>

            <span className="text-2xl">🇮🇳</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow transition-all cursor-pointer"
            >
              {initialAlarm ? 'Save Changes' : 'Create Alarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
