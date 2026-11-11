import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Bell,
  Sparkles,
  Check,
  Calendar,
  AlertCircle,
  Copy,
  Zap,
  Volume2
} from 'lucide-react';
import { Alarm, AlarmCategory, RecurrenceType, SoundType } from '../types';
import { parsePastedTimeWithLocation, ParsedTimeWithLocation } from '../utils/timezone';
import { playTonePattern, SOUND_OPTIONS } from '../utils/audio';

interface QuickPasteAlarmBarProps {
  timeFormat: '12h' | '24h';
  onAddAlarm: (alarm: Alarm) => void;
  onGoToAlarms?: () => void;
}

export const QuickPasteAlarmBar: React.FC<QuickPasteAlarmBarProps> = ({
  timeFormat,
  onAddAlarm,
  onGoToAlarms
}) => {
  const [inputText, setInputText] = useState('');
  const [matchLabelInput, setMatchLabelInput] = useState('');
  const [leadTimeSeconds, setLeadTimeSeconds] = useState<number>(0);
  const [customSecondsInput, setCustomSecondsInput] = useState<string>('');
  const [isCustomSeconds, setIsCustomSeconds] = useState<boolean>(false);
  const [sound, setSound] = useState<SoundType>('droplet');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [successToast, setSuccessToast] = useState<{
    title: string;
    istTime: string;
    location: string;
    matchLabel?: string;
  } | null>(null);

  // Live real-time detection & IST calculation
  const parsedResult = useMemo<ParsedTimeWithLocation | null>(() => {
    return parsePastedTimeWithLocation(inputText, timeFormat, {
      defaultLeadTimeSeconds: leadTimeSeconds,
      defaultMatchLabel: matchLabelInput.trim() || undefined
    });
  }, [inputText, timeFormat, leadTimeSeconds, matchLabelInput]);

  // Sync auto-detected match label from input if user hasn't explicitly typed one
  useEffect(() => {
    if (parsedResult?.matchLabel && !matchLabelInput) {
      setMatchLabelInput(parsedResult.matchLabel);
    }
  }, [parsedResult?.matchLabel, matchLabelInput]);

  const effectiveLeadSec = isCustomSeconds
    ? (parseInt(customSecondsInput, 10) || 0)
    : leadTimeSeconds;

  const handleSetAlarm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedResult) return;

    const finalMatchLabel = matchLabelInput.trim() || parsedResult.matchLabel;

    const newAlarm: Alarm = {
      id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: parsedResult.title,
      sourceTimeZone: parsedResult.timeZoneItem.id,
      sourceCityLabel: `${parsedResult.timeZoneItem.city} (${parsedResult.timeZoneItem.abbr})`,
      sourceTime: parsedResult.sourceTime,
      sourceDate: parsedResult.sourceDate,
      recurrence: parsedResult.sourceDate ? 'once' : recurrence,
      leadTimeMinutes: Math.floor(effectiveLeadSec / 60),
      leadTimeSeconds: effectiveLeadSec,
      matchLabel: finalMatchLabel || undefined,
      sound,
      enabled: true,
      createdAt: Date.now(),
      category: parsedResult.category,
      notes: `Converted from ${parsedResult.timeZoneItem.city} (${parsedResult.sourceTimeFormatted}) to ${parsedResult.istTimeFormatted} IST${finalMatchLabel ? ` · Match: ${finalMatchLabel}` : ''}`
    };

    onAddAlarm(newAlarm);
    playTonePattern(sound, 0.5);

    setSuccessToast({
      title: parsedResult.title,
      istTime: parsedResult.istTimeFormatted,
      location: parsedResult.timeZoneItem.city,
      matchLabel: finalMatchLabel
    });

    // Auto clear toast after 6 seconds
    setTimeout(() => {
      setSuccessToast(null);
    }, 6000);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setInputText(text);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>Instant Paste: Time + Location to IST Alarm</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Paste Time with Location Name → Detect, Convert to IST & Set Alarm
          </h2>
        </div>
      </div>

      {/* Single Paste Input Field */}
      <div className="space-y-3">
        <div className="relative">
          <div className="relative flex items-center">
            <MapPin className="w-5 h-5 absolute left-3.5 text-amber-400 shrink-0" />
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && parsedResult) {
                  handleSetAlarm();
                }
              }}
              placeholder="e.g., 3:00 PM London, Kathmandu 09:32:23, New York 9:30 AM, 14:00 Tokyo, Seattle 9 AM..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-11 pr-24 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none font-medium shadow-inner"
            />

            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>

              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="p-1.5 text-xs text-slate-500 hover:text-slate-300 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Options Row: Match / Series Label, Alert Sound & Customize Pre-Alarm by Seconds */}
        <div className="space-y-2.5 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Match / Series Label */}
            <div className="md:col-span-6 flex flex-col justify-center">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>🏏 Match / Event Label</span>
                <span className="text-[10px] text-slate-500 font-normal">(e.g. CSK vs MI, IND vs NZ)</span>
              </label>
              <input
                type="text"
                value={matchLabelInput}
                onChange={e => setMatchLabelInput(e.target.value)}
                placeholder="e.g. CSK vs MI, IND vs NZ"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Alert Sound Picker (Includes 5 Mild 1s Tones) */}
            <div className="md:col-span-6 flex flex-col justify-center">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🔔 Alert Tone</span>
                  <span className="text-[10px] text-emerald-400 font-medium">(5 mild 1s tones available)</span>
                </span>
                <button
                  type="button"
                  onClick={() => playTonePattern(sound, 0.7)}
                  className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </label>
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
                  title="Test Alert Tone"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Customize Pre-Alarm By Seconds */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>⏱️ Pre-Alert Seconds</span>
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
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
                  className={`px-2 py-0.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    !isCustomSeconds && leadTimeSeconds === sec
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {sec === 0 ? '0s (Exact)' : `${sec}s`}
                </button>
              ))}

              {/* Custom Seconds Input */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5">
                <span className="text-[10px] text-slate-400">Custom:</span>
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
                <span className="text-[10px] text-slate-400">s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Detection & IST Conversion Card */}
      {parsedResult ? (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in shadow-lg">
          {/* Left: Detected Location & Time Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{parsedResult.timeZoneItem.flag}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detected Location:
                </span>
                <span className="text-sm font-bold text-white">
                  {parsedResult.timeZoneItem.city}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {parsedResult.timeZoneItem.abbr} ({parsedResult.timeZoneItem.id})
                </span>
              </div>

              {parsedResult.sourceDate && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {parsedResult.sourceDate}
                </span>
              )}

              {(matchLabelInput.trim() || parsedResult.matchLabel) && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                  🏏 Match: {matchLabelInput.trim() || parsedResult.matchLabel}
                </span>
              )}
            </div>

            {/* Time mapping conversion flow */}
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Given Time:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {parsedResult.sourceTime} {parsedResult.timeZoneItem.abbr}
                </span>
              </div>
              <span>·</span>
              <span className="text-amber-300 font-mono font-medium">
                {parsedResult.diffSummaryLabel}
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Event: <strong className="text-white">{parsedResult.title}</strong>
              </span>
              {effectiveLeadSec > 0 && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold">
                    Alert {effectiveLeadSec}s early
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Changed IST Result & Set Alarm Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            {/* IST Display */}
            <div className="text-left sm:text-right bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                Changed to Indian Standard Time (IST)
              </span>
              <div className="text-2xl font-black font-mono text-white tracking-tight mt-0.5">
                {parsedResult.istTimeFormatted} IST
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {parsedResult.isDayAhead ? (
                  <span className="text-indigo-300 font-medium">
                    +1 day in India ({parsedResult.istDateFormatted})
                  </span>
                ) : (
                  <span>{parsedResult.istDateFormatted}</span>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleSetAlarm()}
              className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>Set Alarm for {parsedResult.istTimeFormatted} IST</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400/80 shrink-0" />
          <span>
            Type or paste any time and location above (e.g. <code className="text-amber-300">10:00 AM London</code> or <code className="text-amber-300">Kathmandu 09:32:23</code>). ChronosIST detects the timezone, computes the IST moment, and equips the alarm.
          </span>
        </div>
      )}

      {/* Success Confirmation Toast */}
      {successToast && (
        <div className="bg-emerald-950/80 border border-emerald-600/60 rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Alarm Scheduled!</span> Changed {successToast.location} time to{' '}
              <strong className="text-emerald-300 font-mono text-sm">{successToast.istTime} IST</strong> for "{successToast.title}"
              {successToast.matchLabel && (
                <span className="text-amber-300 font-semibold ml-1">
                  (Match: {successToast.matchLabel})
                </span>
              )}
              .
            </div>
          </div>

          {onGoToAlarms && (
            <button
              onClick={onGoToAlarms}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition-colors shrink-0 cursor-pointer"
            >
              View in Alarms
            </button>
          )}
        </div>
      )}
    </div>
  );
};
