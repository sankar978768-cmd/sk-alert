import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Volume2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Alarm, NextTriggerInfo } from '../types';
import { formatRemainingTime } from '../utils/timezone';
import { playTonePattern, SOUND_OPTIONS } from '../utils/audio';

interface AlarmCardProps {
  alarm: Alarm;
  triggerInfo: NextTriggerInfo | null;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  onTriggerNow: (alarm: Alarm) => void;
  timeFormat: '12h' | '24h';
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  triggerInfo,
  onToggle,
  onEdit,
  onDelete,
  onTriggerNow,
  timeFormat
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingTest(true);
    playTonePattern(alarm.sound, 0.8);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const isEnabled = alarm.enabled;
  const isSnoozed = triggerInfo?.isSnoozed ?? false;
  const isUpcoming = triggerInfo !== null && isEnabled;

  const recurrenceLabel = {
    once: alarm.sourceDate ? `Once: ${alarm.sourceDate}` : 'Once',
    daily: 'Every day',
    weekdays: 'Weekdays (Mon - Fri)',
    custom: alarm.customDays?.length
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .filter((_, idx) => alarm.customDays?.includes(idx))
          .join(', ')
      : 'Custom days'
  }[alarm.recurrence];

  const soundMeta = SOUND_OPTIONS.find(s => s.id === alarm.sound);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 ${
        !isEnabled
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
          : isSnoozed
          ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700/80 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Alarm Details */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                !isEnabled
                  ? 'bg-slate-600'
                  : isSnoozed
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            <h3 className="text-base font-semibold text-white truncate">
              {alarm.title}
            </h3>

            {alarm.matchLabel && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                🏏 {alarm.matchLabel}
              </span>
            )}

            {isSnoozed && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Snoozed
              </span>
            )}

            {alarm.category && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {alarm.category === 'sports' ? '🏏 Sports & Broadcast' :
                 alarm.category === 'meeting' ? '👥 Meeting' :
                 alarm.category === 'work' ? '💼 Work' :
                 alarm.category === 'market' ? '📈 Market' :
                 alarm.category === 'webinar' ? '🎓 Webinar' :
                 alarm.category === 'personal' ? '☕ Personal' : '🔔 Reminder'}
              </span>
            )}
          </div>

          {/* Time mapping info */}
          <div className="flex items-baseline gap-2 flex-wrap">
            {/* Primary IST Time */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                IST
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {triggerInfo?.istTimeString || '--:--'}
              </span>
            </div>

            <span className="text-slate-600">·</span>

            {/* Source Time */}
            <div className="flex items-baseline gap-1 text-xs text-slate-300">
              <span className="text-slate-400">Source:</span>
              <span className="font-mono font-medium text-slate-200">
                {alarm.sourceTime} ({alarm.sourceCityLabel})
              </span>
            </div>
          </div>

          {/* Recurrence & Day Shift Details */}
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{recurrenceLabel}</span>
            </div>

            {triggerInfo && triggerInfo.dayDrift !== 0 && (
              <div className="flex items-center gap-1 text-indigo-300">
                <span>·</span>
                <span>
                  {triggerInfo.dayDrift > 0 ? '+1 day in India' : '-1 day in India'}
                </span>
              </div>
            )}

            {((alarm.leadTimeSeconds !== undefined && alarm.leadTimeSeconds > 0) || (alarm.leadTimeMinutes !== undefined && alarm.leadTimeMinutes > 0)) && (
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <span>·</span>
                <span>
                  Alert {alarm.leadTimeSeconds !== undefined && alarm.leadTimeSeconds > 0
                    ? alarm.leadTimeSeconds < 60
                      ? `${alarm.leadTimeSeconds}s`
                      : alarm.leadTimeSeconds % 60 === 0
                      ? `${alarm.leadTimeSeconds / 60}m`
                      : `${Math.floor(alarm.leadTimeSeconds / 60)}m ${alarm.leadTimeSeconds % 60}s`
                    : `${alarm.leadTimeMinutes}m`
                  } early
                </span>
              </div>
            )}

            {soundMeta && (
              <div className="flex items-center gap-1 text-slate-400">
                <span>·</span>
                <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                  <span>{soundMeta.icon}</span>
                  <span>{soundMeta.name}</span>
                  {soundMeta.category === 'mild' && (
                    <span className="text-[9px] text-emerald-400 font-semibold font-mono">1s mild</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {alarm.notes && (
            <p className="text-xs text-slate-400 italic line-clamp-1">
              {alarm.notes}
            </p>
          )}
        </div>

        {/* Right Side: Status Ticker, Toggle, Controls */}
        <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {isEnabled ? 'Active' : 'Disabled'}
            </span>
            <button
              onClick={() => onToggle(alarm.id, !isEnabled)}
              aria-label={isEnabled ? 'Disable alarm' : 'Enable alarm'}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isEnabled ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform absolute top-0.5 ${
                  isEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Countdown badge */}
          {isUpcoming && triggerInfo ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-emerald-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatRemainingTime(triggerInfo.timeRemainingMs)}</span>
            </div>
          ) : !isEnabled ? (
            <span className="text-xs text-slate-500 font-mono">Alarm paused</span>
          ) : (
            <span className="text-xs text-rose-400/80 font-mono">Completed / Expired</span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto pt-1">
            <button
              onClick={handleTestSound}
              title="Test Alarm Sound"
              className={`p-1.5 text-xs rounded-lg transition-colors border ${
                isPlayingTest
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-slate-800/60 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onTriggerNow(alarm)}
              title="Simulate Ringing Now"
              className="p-1.5 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onEdit(alarm)}
              title="Edit Alarm"
              className="p-1.5 text-xs rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDelete(alarm.id)}
              title="Delete Alarm"
              className="p-1.5 text-xs rounded-lg bg-slate-800/60 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
