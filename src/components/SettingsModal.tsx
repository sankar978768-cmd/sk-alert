import React, { useState } from 'react';
import { X, Volume2, Bell, Clock, ShieldCheck, Download, Upload, Play, Sparkles } from 'lucide-react';
import { AppSettings, SoundType, Alarm } from '../types';
import { playTonePattern, SOUND_OPTIONS } from '../utils/audio';
import { sendTestNotificationToDevice } from '../utils/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  onTest5SecAlarm: () => void;
  alarms: Alarm[];
  onImportAlarms: (alarms: Alarm[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  notificationPermission,
  onRequestNotifications,
  onTest5SecAlarm,
  alarms,
  onImportAlarms
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testAlarmTriggered, setTestAlarmTriggered] = useState(false);

  if (!isOpen) return null;

  const handleTestSound = (snd: SoundType) => {
    setIsPlayingTest(true);
    playTonePattern(snd, settings.volume);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const handleTrigger5SecTest = () => {
    setTestAlarmTriggered(true);
    onTest5SecAlarm();
    setTimeout(() => setTestAlarmTriggered(false), 6000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alarms, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chronos_ist_alarms_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportAlarms(parsed);
          alert(`Successfully imported ${parsed.length} alarms!`);
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Alarm & Audio Settings
              </h2>
              <p className="text-xs text-slate-400">
                Customize sounds, notifications, and time display format.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Test 5-Second Alarm Feature */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Verification
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Trigger a live test alarm in 5 seconds to verify browser notifications and audio ringtone.
              </p>
            </div>
            <button
              onClick={handleTrigger5SecTest}
              disabled={testAlarmTriggered}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                testAlarmTriggered
                  ? 'bg-amber-500/40 text-amber-200 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-[0.98] shadow cursor-pointer'
              }`}
            >
              {testAlarmTriggered ? 'Ringing in 5s...' : 'Test 5s Alarm'}
            </button>
          </div>

          {/* Browser Notifications Permission */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Browser Web Notifications
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">
                    Android & Mobile System Alerts
                  </div>
                  <div className="text-xs text-slate-400">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        notificationPermission === 'granted'
                          ? 'text-emerald-400'
                          : notificationPermission === 'denied'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {notificationPermission === 'granted' ? 'CONNECTED (Active)' : notificationPermission.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {notificationPermission !== 'granted' ? (
                  <button
                    onClick={onRequestNotifications}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Enable Alerts
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendTestNotificationToDevice();
                      alert(res.message);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Test Signal to Phone</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Time Display Format */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Time Display Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeFormat: '12h' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  settings.timeFormat === '12h'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                12-Hour (e.g. 10:30 PM IST)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeFormat: '24h' })}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  settings.timeFormat === '24h'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                24-Hour (e.g. 22:30 IST)
              </button>
            </div>
          </div>

          {/* Sound & Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Alarm Ringtone & Volume
              </label>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={e => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Very Mild Notification Alerts (~1 sec)
                  </span>
                  <span className="text-[10px] text-slate-400">Soft, unobtrusive 1s pings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOUND_OPTIONS.filter(s => s.category === 'mild').map(snd => (
                    <div
                      key={snd.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        settings.sound === snd.id
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ sound: snd.id })}
                        className="text-left flex-1 min-w-0 pr-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{snd.icon}</span>
                          <span className="text-xs font-semibold truncate">{snd.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                            {snd.durationLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{snd.description}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestSound(snd.id)}
                        title="Preview sound"
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Classic Alarm Tones
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOUND_OPTIONS.filter(s => s.category === 'classic').map(snd => (
                    <div
                      key={snd.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        settings.sound === snd.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ sound: snd.id })}
                        className="text-left flex-1 min-w-0 pr-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{snd.icon}</span>
                          <span className="text-xs font-semibold truncate">{snd.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{snd.description}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestSound(snd.id)}
                        title="Preview sound"
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Backup & Sync
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Alarms (JSON)</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Alarms</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
