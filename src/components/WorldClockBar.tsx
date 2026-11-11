import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { IST_TIMEZONE, formatInTimeZone, getLocalComponentsInTz } from '../utils/timezone';

interface WorldClockBarProps {
  currentTime: Date;
  timeFormat: '12h' | '24h';
}

export const WorldClockBar: React.FC<WorldClockBarProps> = ({ currentTime, timeFormat }) => {
  // IST components
  const istComps = getLocalComponentsInTz(currentTime, IST_TIMEZONE);
  const isIstDay = istComps.hour >= 6 && istComps.hour < 18;
  const istTimeStr = formatInTimeZone(currentTime, IST_TIMEZONE, {
    timeFormat,
    includeSeconds: true,
    includeDate: false
  });
  const istDateStr = formatInTimeZone(currentTime, IST_TIMEZONE, {
    includeDate: true,
    includeWeekday: true
  });

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Primary IST Anchor */}
        <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Indian Standard Time (IST)
            </span>
            <span className="text-xs text-amber-400/80 font-mono">UTC+05:30</span>
          </div>

          <div className="h-4 w-px bg-amber-500/30" />

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
              {istTimeStr}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {istDateStr}
            </span>
          </div>

          <div className="text-amber-400">
            {isIstDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Asia/Kolkata Reference</span>
        </div>
      </div>
    </div>
  );
};

