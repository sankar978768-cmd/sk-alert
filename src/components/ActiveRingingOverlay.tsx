import React, { useEffect, useState } from 'react';
import { Bell, Volume2, Clock, CheckCircle } from 'lucide-react';
import { Alarm, NextTriggerInfo } from '../types';
import { SOUND_OPTIONS } from '../utils/audio';

interface ActiveRingingOverlayProps {
  ringingAlarm: Alarm;
  triggerInfo: NextTriggerInfo | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  autoDismissSeconds?: number;
}

export const ActiveRingingOverlay: React.FC<ActiveRingingOverlayProps> = ({
  ringingAlarm,
  triggerInfo,
  onDismiss,
  onSnooze,
  autoDismissSeconds = 60
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoDismissSeconds);
  const soundMeta = SOUND_OPTIONS.find(s => s.id === ringingAlarm.sound);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      {/* Outer pulsating glow rings */}
      <div className="absolute w-96 h-96 rounded-full bg-amber-500/10 animate-ping pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Animated Bell Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 animate-bounce">
          <Bell className="w-10 h-10 animate-pulse" />
        </div>

        {/* Header banner */}
        <div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest border border-amber-400/40">
              IST Alarm Alert
            </span>
            {ringingAlarm.matchLabel && (
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/40">
                🏏 {ringingAlarm.matchLabel}
              </span>
            )}
            {soundMeta && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/40">
                {soundMeta.icon} {soundMeta.name} {soundMeta.category === 'mild' ? '(1s mild)' : ''}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            {ringingAlarm.title}
          </h2>
          {ringingAlarm.notes && (
            <p className="text-xs text-slate-300 mt-1 italic">
              "{ringingAlarm.notes}"
            </p>
          )}
        </div>

        {/* Time comparison callout */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-semibold uppercase tracking-wider">
              Arrived in IST
            </span>
            <span className="font-mono text-slate-400">Asia/Kolkata</span>
          </div>

          <div className="text-3xl font-black font-mono tabular-nums text-white">
            {triggerInfo?.istTimeString || 'Now'}
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-center gap-1.5">
            <span>Equivalent to</span>
            <span className="text-slate-200 font-semibold font-mono">
              {ringingAlarm.sourceTime} ({ringingAlarm.sourceCityLabel})
            </span>
          </div>
        </div>

        {/* Actions: Dismiss & Snooze */}
        <div className="space-y-3">
          <button
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Dismiss Alarm</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSnooze(5)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Snooze 5 Min
            </button>
            <button
              onClick={() => onSnooze(10)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Snooze 10 Min
            </button>
          </div>
        </div>

        {/* Auto dismiss timer */}
        <div className="text-xs text-slate-500 font-mono">
          Auto-dismissing in {secondsRemaining}s
        </div>
      </div>
    </div>
  );
};
