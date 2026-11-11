import { Alarm, AppSettings } from '../types';

const STORAGE_KEY_ALARMS = 'chronos_ist_alarms_v1';
const STORAGE_KEY_SETTINGS = 'chronos_ist_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: '12h',
  sound: 'droplet',
  volume: 0.8,
  enableAudio: true,
  enableBrowserNotification: true,
  theme: 'dark',
  autoDismissSeconds: 60
};

export const INITIAL_ALARMS: Alarm[] = [];

export function loadAlarmsFromStorage(): Alarm[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALARMS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any legacy hardcoded demo alarms
      const clean = parsed.filter(a => !a.id?.startsWith('alarm-demo-'));
      return clean;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveAlarmsToStorage(alarms: Alarm[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALARMS, JSON.stringify(alarms));
  } catch (err) {
    console.warn('Failed to save alarms to localStorage:', err);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings:', err);
  }
}
