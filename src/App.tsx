import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Calendar,
  Globe2,
  ArrowRight,
  MapPin,
  Layers
} from 'lucide-react';
import { Alarm, AppSettings, NextTriggerInfo, SoundType } from './types';
import {
  loadAlarmsFromStorage,
  saveAlarmsToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage
} from './utils/storage';
import { calculateNextTrigger } from './utils/timezone';
import { startAlarmLoop, stopAlarmLoop, playTonePattern } from './utils/audio';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  triggerSystemNotification
} from './utils/notifications';

import { Header } from './components/Header';
import { WorldClockBar } from './components/WorldClockBar';
import { TimeZoneConverterCard } from './components/TimeZoneConverterCard';
import { AlarmCard } from './components/AlarmCard';
import { AlarmModal } from './components/AlarmModal';
import { ActiveRingingOverlay } from './components/ActiveRingingOverlay';
import { SettingsModal } from './components/SettingsModal';
import { TextToAlarmGenerator } from './components/TextToAlarmGenerator';
import { BulkLocationTimesConverter } from './components/BulkLocationTimesConverter';
import { QuickPasteAlarmBar } from './components/QuickPasteAlarmBar';
import { AlarmCategory } from './types';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadAlarmsFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  const [activeTab, setActiveTab] = useState<'alarms' | 'bulk-converter' | 'text-generator' | 'converter'>('alarms');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [groupMode, setGroupMode] = useState<'matches' | 'categories' | 'flat'>('matches');

  // Alarm modal state
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [presetForModal, setPresetForModal] = useState<{
    sourceTimeZone: string;
    sourceCityLabel: string;
    sourceTime: string;
    sourceDate?: string;
    title?: string;
  } | null>(null);

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active Ringing state
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [ringingTriggerInfo, setRingingTriggerInfo] = useState<NextTriggerInfo | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'matches' | 'sports' | 'meetings' | 'markets'>('all');

  // Notification status
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    setNotificationPermission(getNotificationPermissionStatus());
  }, []);

  // Sync alarms to localStorage
  useEffect(() => {
    saveAlarmsToStorage(alarms);
  }, [alarms]);

  // Sync settings to localStorage
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  // Main 1-second clock loop & alarm monitor
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check all enabled alarms
      alarms.forEach(alarm => {
        if (!alarm.enabled) return;

        const info = calculateNextTrigger(alarm, now);
        if (!info) return;

        // Check if trigger time is reached (within 2 seconds tolerance) and hasn't been triggered in the last 60 seconds
        const diffMs = info.nextTriggerMs - now.getTime();
        const hasTriggeredRecently = alarm.lastTriggeredAt && now.getTime() - alarm.lastTriggeredAt < 60000;

        if (diffMs <= 1000 && diffMs >= -2500 && !hasTriggeredRecently) {
          // Trigger the alarm!
          triggerAlarm(alarm, info);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, settings]);

  // Trigger an alarm (sound + modal + browser notification)
  const triggerAlarm = useCallback(
    (alarm: Alarm, info: NextTriggerInfo) => {
      // 1. Play sound loop if audio enabled
      if (settings.enableAudio) {
        startAlarmLoop(alarm.sound || settings.sound, settings.volume);
      }

      // Android / Mobile vibration feedback pattern: 400ms on, 200ms off, 400ms on
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400, 200, 800]);
        } catch {
          // Vibration not supported or gesture policy blocked
        }
      }

      // 2. Open active ringing overlay
      setRingingAlarm(alarm);
      setRingingTriggerInfo(info);

      // 3. Trigger browser push notification
      const bodyText = `Time arrived in IST: ${info.istTimeString} (${alarm.sourceTime} in ${alarm.sourceCityLabel})`;
      triggerSystemNotification(`⏰ ${alarm.title}`, bodyText);

      // 4. Update alarm's lastTriggeredAt
      setAlarms(prev =>
        prev.map(a => {
          if (a.id === alarm.id) {
            return {
              ...a,
              lastTriggeredAt: Date.now(),
              snoozedUntil: undefined,
              // If once, auto-disable after triggering
              enabled: a.recurrence === 'once' ? false : a.enabled
            };
          }
          return a;
        })
      );
    },
    [settings]
  );

  // Dismiss ringing alarm
  const handleDismissAlarm = useCallback(() => {
    stopAlarmLoop();
    setRingingAlarm(null);
    setRingingTriggerInfo(null);
  }, []);

  // Snooze ringing alarm
  const handleSnoozeAlarm = useCallback(
    (minutes: number) => {
      stopAlarmLoop();
      if (!ringingAlarm) return;

      const snoozeUntil = Date.now() + minutes * 60 * 1000;
      setAlarms(prev =>
        prev.map(a => (a.id === ringingAlarm.id ? { ...a, snoozedUntil: snoozeUntil } : a))
      );

      setRingingAlarm(null);
      setRingingTriggerInfo(null);
    },
    [ringingAlarm]
  );

  // Request browser notifications
  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
  };

  // Toggle alarm enabled/disabled
  const handleToggleAlarm = (id: string, enabled: boolean) => {
    setAlarms(prev =>
      prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            enabled,
            snoozedUntil: enabled ? a.snoozedUntil : undefined
          };
        }
        return a;
      })
    );
  };

  // Delete alarm
  const handleDeleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  // Edit alarm
  const handleEditAlarm = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setPresetForModal(null);
    setIsAlarmModalOpen(true);
  };

  // Immediate simulation of alarm ring
  const handleSimulateRing = (alarm: Alarm) => {
    const info = calculateNextTrigger(alarm, new Date()) || {
      alarmId: alarm.id,
      nextTriggerMs: Date.now(),
      istTimeString: 'Now',
      istDateString: 'Today',
      sourceTimeString: alarm.sourceTime,
      sourceDateString: alarm.sourceCityLabel,
      timeRemainingMs: 0,
      leadTimeSeconds: alarm.leadTimeSeconds || (alarm.leadTimeMinutes || 0) * 60,
      isPreAlert: false,
      isSnoozed: false,
      dayDrift: 0
    };
    triggerAlarm(alarm, info);
  };

  // Schedule a 5-second test alarm
  const handleTest5SecAlarm = () => {
    const testAlarm: Alarm = {
      id: `test-${Date.now()}`,
      title: '5-Second Test Alarm (IST Verification)',
      sourceTimeZone: 'America/Los_Angeles',
      sourceCityLabel: 'Test Signal',
      sourceTime: '00:00',
      recurrence: 'once',
      leadTimeMinutes: 0,
      leadTimeSeconds: 0,
      sound: settings.sound,
      enabled: true,
      createdAt: Date.now(),
      snoozedUntil: Date.now() + 5000,
      notes: 'Verifying sound synthesizer and notifications'
    };

    setAlarms(prev => [testAlarm, ...prev]);
  };

  // Save alarm (new or edited)
  const handleSaveAlarm = (data: Omit<Alarm, 'id' | 'createdAt'>) => {
    if (editingAlarm) {
      setAlarms(prev =>
        prev.map(a => (a.id === editingAlarm.id ? { ...a, ...data } : a))
      );
      setEditingAlarm(null);
    } else {
      const newAlarm: Alarm = {
        ...data,
        id: `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now()
      };
      setAlarms(prev => [newAlarm, ...prev]);
    }
  };

  // Batch add alarms from Text-to-Alarm generator
  const handleBatchAddAlarms = (newAlarms: Alarm[]) => {
    setAlarms(prev => [...newAlarms, ...prev]);
  };

  // Triggered from Converter or Timeline
  const handleSetAlarmFromPreset = (preset: {
    sourceTimeZone: string;
    sourceCityLabel: string;
    sourceTime: string;
    sourceDate?: string;
    title?: string;
  }) => {
    setEditingAlarm(null);
    setPresetForModal(preset);
    setIsAlarmModalOpen(true);
  };

  // Compute trigger info for each alarm
  const alarmsWithTriggers = useMemo(() => {
    return alarms.map(alarm => {
      const trigger = calculateNextTrigger(alarm, currentTime);
      return {
        alarm,
        trigger
      };
    });
  }, [alarms, currentTime]);

  // Filtered alarms
  const filteredAlarms = useMemo(() => {
    return alarmsWithTriggers.filter(({ alarm, trigger }) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = alarm.title.toLowerCase().includes(q);
        const matchesCity = alarm.sourceCityLabel.toLowerCase().includes(q);
        const matchesNotes = alarm.notes?.toLowerCase().includes(q);
        const matchesMatch = alarm.matchLabel?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCity && !matchesNotes && !matchesMatch) return false;
      }

      // Filter category
      if (filterType === 'active') return alarm.enabled;
      if (filterType === 'matches') return Boolean(alarm.matchLabel);
      if (filterType === 'sports') return alarm.category === 'sports';
      if (filterType === 'meetings') return alarm.category === 'meeting';
      if (filterType === 'markets') return alarm.category === 'market';
      return true;
    });
  }, [alarmsWithTriggers, searchQuery, filterType]);

  const activeAlarmCount = alarms.filter(a => a.enabled).length;

  const categoryDefinitions: Record<AlarmCategory, { label: string; icon: string }> = {
    sports: { label: 'Sports & Broadcast', icon: '🏏' },
    meeting: { label: 'Meetings & Syncs', icon: '👥' },
    work: { label: 'Work & Tasks', icon: '💼' },
    market: { label: 'Trading & Markets', icon: '📈' },
    webinar: { label: 'Webinars & Learning', icon: '🎓' },
    personal: { label: 'Personal & Social', icon: '☕' },
    custom: { label: 'General Reminders', icon: '🔔' }
  };

  // Group by Match (e.g. CSK vs MI, IND vs NZ)
  const groupedByMatch = useMemo(() => {
    const groups: Record<string, typeof filteredAlarms> = {};
    for (const item of filteredAlarms) {
      const matchKey = item.alarm.matchLabel
        ? `🏏 Match: ${item.alarm.matchLabel}`
        : 'Other Timings & Reminders';
      if (!groups[matchKey]) groups[matchKey] = [];
      groups[matchKey].push(item);
    }
    return groups;
  }, [filteredAlarms]);

  const matchKeys = Object.keys(groupedByMatch);

  // Group by Category
  const categorizedAlarms = useMemo(() => {
    const groups: Partial<Record<AlarmCategory, typeof filteredAlarms>> = {};
    for (const item of filteredAlarms) {
      const cat = (item.alarm.category as AlarmCategory) || 'custom';
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(item);
    }
    return groups;
  }, [filteredAlarms]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar adhering to strict Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAlarm={() => {
          setEditingAlarm(null);
          setPresetForModal(null);
          setIsAlarmModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        settings={settings}
        onToggleMute={() => setSettings(s => ({ ...s, enableAudio: !s.enableAudio }))}
        notificationPermission={notificationPermission}
        onRequestNotifications={handleRequestNotifications}
        activeAlarmCount={activeAlarmCount}
      />

      {/* World Clock Strip (IST Primary Anchor + Global Hubs) */}
      <WorldClockBar
        currentTime={currentTime}
        timeFormat={settings.timeFormat}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* VIEW 1: ALARMS & ALERTS DASHBOARD */}
        {activeTab === 'alarms' && (
          <div className="space-y-6">
            {/* Quick Hero Banner with IST Next Trigger Summary */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <Globe2 className="w-4 h-4" />
                    <span>Cross-Timezone to Indian Standard Time (IST)</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Reliable Alarms for Global Timelines
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Set events in US Pacific, Eastern, London, Tokyo, or any world zone. ChronosIST calculates the exact moment in India, counts down live, and fires audio & browser notifications.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab('bulk-converter')}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Paste Location & Bulk Times</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('text-generator')}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Freeform Text</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingAlarm(null);
                      setPresetForModal(null);
                      setIsAlarmModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Single Alarm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Paste: Time + Location Name -> Detect, Convert to IST & Set Alarm */}
            <QuickPasteAlarmBar
              timeFormat={settings.timeFormat}
              onAddAlarm={(newAlarm) => {
                setAlarms(prev => [newAlarm, ...prev]);
              }}
            />

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Category Segmented Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({alarms.length})
                </button>
                <button
                  onClick={() => setFilterType('active')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'active'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({activeAlarmCount})
                </button>
                <button
                  onClick={() => setFilterType('matches')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'matches'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏏 Matches
                </button>
                <button
                  onClick={() => setFilterType('sports')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'sports'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sports
                </button>
                <button
                  onClick={() => setFilterType('meetings')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'meetings'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Meetings
                </button>
                <button
                  onClick={() => setFilterType('markets')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterType === 'markets'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Markets
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative w-full sm:w-52">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search alarms / matches..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 3-Way Group View Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => setGroupMode('matches')}
                    title="Group alarms under their cricket/sports match"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      groupMode === 'matches'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🏏 Matches
                  </button>
                  <button
                    onClick={() => setGroupMode('categories')}
                    title="Group alarms by category"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      groupMode === 'categories'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => setGroupMode('flat')}
                    title="Flat chronological list"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      groupMode === 'flat'
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Flat
                  </button>
                </div>
              </div>
            </div>

            {/* Alarms Render: Match-Wise, Category-Wise, or Flat Grid */}
            {filteredAlarms.length > 0 ? (
              groupMode === 'matches' ? (
                /* Grouped Match-Wise View */
                <div className="space-y-6">
                  {matchKeys.map(matchKey => {
                    const matchItems = groupedByMatch[matchKey] || [];
                    const isGeneral = matchKey.startsWith('Other');

                    return (
                      <div key={matchKey} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                          <span className="text-base">{isGeneral ? '🔔' : '🏏'}</span>
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {matchKey}
                          </h3>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                            {matchItems.length} {matchItems.length === 1 ? 'alarm' : 'alarms'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchItems.map(({ alarm, trigger }) => (
                            <AlarmCard
                              key={alarm.id}
                              alarm={alarm}
                              triggerInfo={trigger}
                              onToggle={handleToggleAlarm}
                              onEdit={handleEditAlarm}
                              onDelete={handleDeleteAlarm}
                              onTriggerNow={handleSimulateRing}
                              timeFormat={settings.timeFormat}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : groupMode === 'categories' ? (
                /* Grouped Category-Wise View */
                <div className="space-y-6">
                  {(Object.keys(categorizedAlarms) as AlarmCategory[]).map(catKey => {
                    const catItems = categorizedAlarms[catKey] || [];
                    const catMeta = categoryDefinitions[catKey] || categoryDefinitions.custom;

                    return (
                      <div key={catKey} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                          <span className="text-base">{catMeta.icon}</span>
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {catMeta.label}
                          </h3>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {catItems.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {catItems.map(({ alarm, trigger }) => (
                            <AlarmCard
                              key={alarm.id}
                              alarm={alarm}
                              triggerInfo={trigger}
                              onToggle={handleToggleAlarm}
                              onEdit={handleEditAlarm}
                              onDelete={handleDeleteAlarm}
                              onTriggerNow={handleSimulateRing}
                              timeFormat={settings.timeFormat}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Flat Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAlarms.map(({ alarm, trigger }) => (
                    <AlarmCard
                      key={alarm.id}
                      alarm={alarm}
                      triggerInfo={trigger}
                      onToggle={handleToggleAlarm}
                      onEdit={handleEditAlarm}
                      onDelete={handleDeleteAlarm}
                      onTriggerNow={handleSimulateRing}
                      timeFormat={settings.timeFormat}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Empty State adhering to §2.D */
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {searchQuery ? 'No matching alarms found' : 'No alarms configured yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {searchQuery
                      ? 'Try clearing the search query or changing filters.'
                      : 'Set up an alarm for your foreign meetings or events; we will calculate the IST time and alert you automatically.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('bulk-converter')}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer"
                  >
                    Paste Location & Bulk Times
                  </button>
                  <button
                    onClick={() => {
                      setEditingAlarm(null);
                      setPresetForModal(null);
                      setIsAlarmModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    Single Alarm
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: BULK LOCATION & TIMES CONVERTER */}
        {activeTab === 'bulk-converter' && (
          <div className="space-y-6">
            <BulkLocationTimesConverter
              timeFormat={settings.timeFormat}
              onAddAlarms={handleBatchAddAlarms}
              onGoToAlarms={() => setActiveTab('alarms')}
            />
          </div>
        )}

        {/* VIEW: TEXT TO ALARMS GENERATOR */}
        {activeTab === 'text-generator' && (
          <div className="space-y-6">
            <TextToAlarmGenerator
              timeFormat={settings.timeFormat}
              onAddAlarms={handleBatchAddAlarms}
              onGoToAlarms={() => setActiveTab('alarms')}
            />
          </div>
        )}

        {/* VIEW 2: TIMEZONE CONVERTER & CALCULATOR */}
        {activeTab === 'converter' && (
          <div className="space-y-6">
            <TimeZoneConverterCard
              timeFormat={settings.timeFormat}
              onSetAlarm={handleSetAlarmFromPreset}
            />
          </div>
        )}
      </main>

      {/* Alarm Modal (Create / Edit) */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => {
          setIsAlarmModalOpen(false);
          setEditingAlarm(null);
          setPresetForModal(null);
        }}
        onSave={handleSaveAlarm}
        initialAlarm={editingAlarm}
        initialPreset={presetForModal}
        timeFormat={settings.timeFormat}
      />

      {/* Active Ringing Overlay Modal */}
      {ringingAlarm && (
        <ActiveRingingOverlay
          ringingAlarm={ringingAlarm}
          triggerInfo={ringingTriggerInfo}
          onDismiss={handleDismissAlarm}
          onSnooze={handleSnoozeAlarm}
          autoDismissSeconds={settings.autoDismissSeconds}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
        notificationPermission={notificationPermission}
        onRequestNotifications={handleRequestNotifications}
        onTest5SecAlarm={handleTest5SecAlarm}
        alarms={alarms}
        onImportAlarms={imported => setAlarms(imported)}
      />
    </div>
  );
}
