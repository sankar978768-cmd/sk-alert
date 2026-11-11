import React, { useState, useMemo } from 'react';
import { ArrowRight, Clock, Plus, Copy, Check, Calendar, Search } from 'lucide-react';
import {
  POPULAR_TIMEZONES,
  getAllAvailableTimeZones,
  convertSourceTimeToDate,
  formatInIST,
  formatInTimeZone,
  getIstDifferenceSummary,
  getLocalComponentsInTz,
  formatRemainingTime
} from '../utils/timezone';
import { TimeZoneItem } from '../types';

interface TimeZoneConverterCardProps {
  timeFormat: '12h' | '24h';
  onSetAlarm: (data: {
    sourceTimeZone: string;
    sourceCityLabel: string;
    sourceTime: string;
    sourceDate: string;
    title: string;
  }) => void;
}

export const TimeZoneConverterCard: React.FC<TimeZoneConverterCardProps> = ({
  timeFormat,
  onSetAlarm
}) => {
  const allTimezones = useMemo(() => getAllAvailableTimeZones(), []);

  // Default to US Pacific
  const [selectedTzId, setSelectedTzId] = useState<string>('America/Los_Angeles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTzDropdown, setShowTzDropdown] = useState<boolean>(false);

  // Time components
  const [sourceHour, setSourceHour] = useState<number>(9);
  const [sourceMinute, setSourceMinute] = useState<number>(0);

  // Date component (YYYY-MM-DD in source timezone)
  const todayInSource = useMemo(() => {
    const comps = getLocalComponentsInTz(new Date(), selectedTzId);
    return `${comps.year}-${String(comps.month).padStart(2, '0')}-${String(comps.day).padStart(2, '0')}`;
  }, [selectedTzId]);

  const [sourceDate, setSourceDate] = useState<string>(todayInSource);
  const [copied, setCopied] = useState(false);

  const selectedTz = useMemo(() => {
    return allTimezones.find(t => t.id === selectedTzId) || POPULAR_TIMEZONES[0];
  }, [allTimezones, selectedTzId]);

  // Filter timezones for search
  const filteredTzs = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_TIMEZONES;
    }
    const q = searchQuery.toLowerCase();
    return allTimezones.filter(
      t =>
        t.city.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [allTimezones, searchQuery]);

  // Compute exact UTC Date for input
  const calculatedResult = useMemo(() => {
    const [y, m, d] = (sourceDate || todayInSource).split('-').map(Number);
    const dateObj = convertSourceTimeToDate(y, m, d, sourceHour, sourceMinute, selectedTzId);

    const istFormatted = formatInIST(dateObj, {
      timeFormat,
      includeSeconds: false,
      includeDate: true,
      includeWeekday: true
    });

    const istTimeOnly = formatInIST(dateObj, {
      timeFormat,
      includeSeconds: false,
      includeDate: false,
      includeWeekday: false
    });

    const sourceFormatted = formatInTimeZone(dateObj, selectedTzId, {
      timeFormat,
      includeSeconds: false,
      includeDate: true,
      includeWeekday: true,
      includeTzName: true
    });

    const diffSummary = getIstDifferenceSummary(selectedTzId, dateObj);

    // Day drift calculation
    const sourceComps = getLocalComponentsInTz(dateObj, selectedTzId);
    const istComps = getLocalComponentsInTz(dateObj, 'Asia/Kolkata');
    let dayDriftNotice = 'Same calendar day';
    if (istComps.day !== sourceComps.day) {
      if (istComps.day > sourceComps.day || (istComps.day === 1 && sourceComps.day > 25)) {
        dayDriftNotice = '+1 day ahead in India';
      } else {
        dayDriftNotice = '-1 day behind in India';
      }
    }

    const nowMs = Date.now();
    const timeRemainingMs = dateObj.getTime() - nowMs;
    const isPast = timeRemainingMs < 0;

    return {
      dateObj,
      istFormatted,
      istTimeOnly,
      sourceFormatted,
      diffSummary,
      dayDriftNotice,
      isDayAhead: dayDriftNotice.includes('+1'),
      timeRemainingMs,
      isPast
    };
  }, [sourceDate, todayInSource, sourceHour, sourceMinute, selectedTzId, timeFormat]);

  const handleCopy = () => {
    const text = `Time in IST: ${calculatedResult.istFormatted} (corresponds to ${calculatedResult.sourceFormatted})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetAlarm = () => {
    const timeStr = `${String(sourceHour).padStart(2, '0')}:${String(sourceMinute).padStart(2, '0')}`;
    onSetAlarm({
      sourceTimeZone: selectedTz.id,
      sourceCityLabel: selectedTz.city,
      sourceTime: timeStr,
      sourceDate,
      title: `${selectedTz.city.split('/')[0].trim()} Time Alert`
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Timezone to IST Converter
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify any global time to calculate the exact Indian Standard Time (IST) and configure immediate alerts.
          </p>
        </div>

        {/* Quick presets for common international meeting times */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 mr-1 hidden lg:inline">Quick Time:</span>
          {[
            { label: '9:00 AM', h: 9, m: 0 },
            { label: '10:30 AM', h: 10, m: 30 },
            { label: '2:00 PM', h: 14, m: 0 },
            { label: '5:00 PM', h: 17, m: 0 },
            { label: '8:30 PM', h: 20, m: 30 }
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                setSourceHour(preset.h);
                setSourceMinute(preset.m);
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                sourceHour === preset.h && sourceMinute === preset.m
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: Source timezone and time configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Source Timezone & Location
            </label>
            <span className="text-xs text-slate-400">
              {selectedTz.flag} {selectedTz.abbr}
            </span>
          </div>

          {/* Timezone selector with searchable dropdown */}
          <div className="relative">
            <div
              onClick={() => setShowTzDropdown(!showTzDropdown)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{selectedTz.flag}</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {selectedTz.city}
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedTz.country} · {selectedTz.id}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedTz.abbr}
              </span>
            </div>

            {/* Quick popular city pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {[
                { id: 'America/Los_Angeles', label: 'San Francisco (PT)' },
                { id: 'America/New_York', label: 'New York (ET)' },
                { id: 'Europe/London', label: 'London (GMT)' },
                { id: 'Europe/Paris', label: 'Paris (CET)' },
                { id: 'Asia/Dubai', label: 'Dubai (GST)' },
                { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
                { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                { id: 'Australia/Sydney', label: 'Sydney (AEST)' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTzId(item.id)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    selectedTzId === item.id
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Dropdown list if opened */}
            {showTzDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 max-h-72 overflow-y-auto">
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search city, country, or timezone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  {filteredTzs.map(tz => (
                    <button
                      key={tz.id}
                      onClick={() => {
                        setSelectedTzId(tz.id);
                        setShowTzDropdown(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        selectedTzId === tz.id
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{tz.flag}</span>
                        <span className="truncate">{tz.city}</span>
                        <span className="text-slate-400 text-[10px]">({tz.country})</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">
                        {tz.abbr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time & Date pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                2. Source Time ({selectedTz.abbr})
              </label>
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1 text-sm font-mono text-white">
                  <select
                    value={sourceHour}
                    onChange={e => setSourceHour(parseInt(e.target.value, 10))}
                    aria-label="Source Hour"
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm font-mono focus:border-amber-400 focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {timeFormat === '12h'
                          ? `${i % 12 === 0 ? 12 : i % 12} ${i >= 12 ? 'PM' : 'AM'} (${String(i).padStart(2, '0')}:00)`
                          : `${String(i).padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={sourceMinute}
                    onChange={e => setSourceMinute(parseInt(e.target.value, 10))}
                    aria-label="Source Minute"
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm font-mono focus:border-amber-400 focus:outline-none"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                3. Date in {selectedTz.city.split('/')[0].trim()}
              </label>
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={sourceDate}
                  onChange={e => setSourceDate(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-full font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Calculated IST Output Card */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-amber-950/20 via-slate-800/50 to-slate-900/80 border border-amber-500/30 rounded-2xl p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Calculated Indian Standard Time (IST)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Asia/Kolkata (UTC+5:30)
              </span>
            </div>

            {/* Large Bold IST Time */}
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                {calculatedResult.istTimeOnly}
              </div>
              <div className="text-sm font-medium text-amber-200/90 mt-1">
                {calculatedResult.istFormatted}
              </div>
            </div>

            {/* Time difference and day drift badges */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 font-medium">
                {calculatedResult.diffSummary.label}
              </div>

              <div
                className={`px-2.5 py-1 rounded-md font-medium ${
                  calculatedResult.isDayAhead
                    ? 'bg-indigo-950/80 border border-indigo-700/50 text-indigo-300'
                    : 'bg-slate-800/90 text-slate-300'
                }`}
              >
                {calculatedResult.dayDriftNotice}
              </div>

              {!calculatedResult.isPast && (
                <div className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 font-mono">
                  {formatRemainingTime(calculatedResult.timeRemainingMs)}
                </div>
              )}
            </div>

            {/* Direct mapping summary */}
            <div className="mt-4 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 leading-relaxed">
              <span className="text-slate-300 font-medium">Equivalence: </span>
              {calculatedResult.sourceFormatted}
              <ArrowRight className="w-3.5 h-3.5 inline mx-1.5 text-amber-400" />
              <span className="text-white font-medium">{calculatedResult.istFormatted}</span>
            </div>
          </div>

          {/* Actions: Set Alarm or Copy */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSetAlarm}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Set Alarm for This IST Time</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
