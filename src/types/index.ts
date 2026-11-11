export type RecurrenceType = 'once' | 'daily' | 'weekdays' | 'custom';

export type SoundType =
  | 'droplet'
  | 'softchime'
  | 'subtlepop'
  | 'calmharp'
  | 'whisper'
  | 'breeze'
  | 'digital'
  | 'marimba'
  | 'radar'
  | 'gentle';

export type AlarmCategory = 'meeting' | 'work' | 'market' | 'sports' | 'webinar' | 'personal' | 'custom';

export interface Alarm {
  id: string;
  title: string;
  sourceTimeZone: string;
  sourceCityLabel: string;
  sourceTime: string; // HH:mm or HH:mm:ss in 24h
  sourceDate?: string; // YYYY-MM-DD for 'once'
  recurrence: RecurrenceType;
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat in source timezone
  leadTimeMinutes?: number; // legacy support
  leadTimeSeconds: number; // customizable in seconds: 0, 10, 15, 30, 45, 60, etc.
  matchLabel?: string; // e.g. "CSK vs MI", "IND vs NZ"
  sound: SoundType;
  enabled: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  snoozedUntil?: number; // epoch ms if snoozed
  notes?: string;
  category?: AlarmCategory;
}

export interface NextTriggerInfo {
  alarmId: string;
  nextTriggerMs: number;
  istTimeString: string;
  istDateString: string;
  sourceTimeString: string;
  sourceDateString: string;
  timeRemainingMs: number;
  isPreAlert: boolean;
  leadTimeSeconds: number;
  leadSummary?: string; // e.g. "30s before"
  isSnoozed: boolean;
  dayDrift: number; // -1, 0, or 1 day difference
  matchLabel?: string;
}

export interface TimeZoneItem {
  id: string; // e.g. America/Los_Angeles
  city: string; // e.g. Los Angeles
  country: string; // e.g. United States
  region: string; // Americas, Europe, Asia, etc.
  abbr: string; // PST/PDT
  flag: string; // emoji flag
  isCommon?: boolean;
}

export interface AppSettings {
  timeFormat: '12h' | '24h';
  sound: SoundType;
  volume: number;
  enableAudio: boolean;
  enableBrowserNotification: boolean;
  theme: 'dark' | 'light';
  autoDismissSeconds: number;
}
