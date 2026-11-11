import React from 'react';
import { Bell, Plus, Settings, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  activeTab: 'alarms' | 'bulk-converter' | 'text-generator' | 'converter';
  setActiveTab: (tab: 'alarms' | 'bulk-converter' | 'text-generator' | 'converter') => void;
  onOpenNewAlarm: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onToggleMute: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  activeAlarmCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAlarm,
  onOpenSettings,
  settings,
  onToggleMute,
  notificationPermission,
  onRequestNotifications,
  activeAlarmCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element wordmark as per Top Bar Contract) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Chronos<span className="text-amber-400">IST</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links / Workspace Tabs */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('alarms')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'alarms'
                ? 'border-amber-400 text-white font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Alarms & Alerts
            {activeAlarmCount > 0 && (
              <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {activeAlarmCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bulk-converter')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'bulk-converter'
                ? 'border-amber-400 text-white font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Bulk Location Times 📍
          </button>
          <button
            onClick={() => setActiveTab('text-generator')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'text-generator'
                ? 'border-amber-400 text-white font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Freeform Text ✨
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'converter'
                ? 'border-amber-400 text-white font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Converter
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {notificationPermission !== 'granted' && (
            <button
              onClick={onRequestNotifications}
              title="Enable browser notifications"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg hover:bg-amber-900/40 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Browser Alerts</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            title={settings.enableAudio ? 'Mute Alarm Sounds' : 'Unmute Alarm Sounds'}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            {settings.enableAudio ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings & Audio Preview"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewAlarm}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set IST Alarm</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 bg-slate-900/60 border-t border-slate-800/60 text-[11px] overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('alarms')}
          className={`px-2 py-1 rounded-md shrink-0 ${
            activeTab === 'alarms' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Alarms ({activeAlarmCount})
        </button>
        <button
          onClick={() => setActiveTab('bulk-converter')}
          className={`px-2 py-1 rounded-md shrink-0 ${
            activeTab === 'bulk-converter' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Bulk 📍
        </button>
        <button
          onClick={() => setActiveTab('text-generator')}
          className={`px-2 py-1 rounded-md shrink-0 ${
            activeTab === 'text-generator' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Text ✨
        </button>
        <button
          onClick={() => setActiveTab('converter')}
          className={`px-2 py-1 rounded-md shrink-0 ${
            activeTab === 'converter' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          Converter
        </button>
      </div>
    </header>
  );
};
