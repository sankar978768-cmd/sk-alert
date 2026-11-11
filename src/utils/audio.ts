import { SoundType } from '../types';

let audioCtx: AudioContext | null = null;
let activeLoopTimer: number | null = null;
let isCurrentlyRinging = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a synthesized tone pattern once
 */
export function playTonePattern(sound: SoundType, volume = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), now);
  masterGain.connect(ctx.destination);

  switch (sound) {
    // 5 VERY MILD NOTIFICATION ALERTS (~1 SEC)
    case 'droplet': {
      // 1. Water Droplet: Pure sine glide from 1760Hz to 1240Hz with soft overtone (~0.85s)
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();
      const overGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.04);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(2480, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      overGain.gain.setValueAtTime(0.03, now);
      overGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);

      overtone.connect(overGain);
      overGain.connect(masterGain);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 0.86);
      overtone.stop(now + 0.26);
      break;
    }

    case 'softchime': {
      // 2. Soft Chime: Warm ambient dual-bell (880Hz + 1046.5Hz) with gentle 15ms attack (~1.0s)
      const notes = [880, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const targetGain = idx === 0 ? 0.15 : 0.09;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(targetGain, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.98);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.0);
      });
      break;
    }

    case 'subtlepop': {
      // 3. Subtle Blip: Discrete two-tap mobile notification alert (1046Hz -> 1396Hz) (~0.65s)
      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.065);

      // Pulse 2 (0.09s later)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1396.9, now + 0.09);
      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.14, now + 0.098);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.66);
      break;
    }

    case 'calmharp': {
      // 4. Calm Harp: Acoustic pluck tone (D5 587Hz + octave overtone) with gentle ring (~0.95s)
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(1174.66, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.92);

      osc.connect(filter);
      harmonic.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.95);
      harmonic.stop(now + 0.25);
      break;
    }

    case 'whisper': {
      // 5. Whisper Tone: Ultra-mild zen harmonic pulse (659Hz + 830Hz) with soft 40ms attack (~0.95s)
      const notes = [659.25, 830.61];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const targetGain = idx === 0 ? 0.11 : 0.08;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(targetGain, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.96);
      });
      break;
    }

    // CLASSIC ALARM TONES
    case 'digital': {
      // Classic crisp digital watch double-beep pattern: beep-beep ... beep-beep
      const beeps = [0, 0.12, 0.4, 0.52];
      beeps.forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2048, now + offset);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
      break;
    }

    case 'marimba': {
      // Warm marimba arpeggio (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const offset = idx * 0.14;
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(freq * 3, now + offset);

        noteGain.gain.setValueAtTime(0.25, now + offset);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);

        osc.connect(noteGain);
        oscHarmonic.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + offset);
        oscHarmonic.start(now + offset);
        osc.stop(now + offset + 0.36);
        oscHarmonic.stop(now + offset + 0.36);
      });
      break;
    }

    case 'radar': {
      // Sonar / radar pulse with pitch bend and echo
      [0, 0.3].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = idx === 0 ? 880 : 987;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + offset + 0.18);

        gain.gain.setValueAtTime(0.22, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.29);
      });
      break;
    }

    case 'gentle': {
      // Soothing rising bell triad (E4, G#4, B4, E5)
      const triad = [329.63, 415.3, 493.88, 659.25];
      triad.forEach((freq, idx) => {
        const offset = idx * 0.2;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.82);
      });
      break;
    }

    case 'breeze':
    default: {
      // Harmonious wind chime progression (A4 - C#5 - E5 - A5)
      const chimeFreqs = [440, 554.37, 659.25, 880];
      chimeFreqs.forEach((freq, idx) => {
        const offset = idx * 0.12;
        const osc = ctx.createOscillator();
        const shimmer = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(freq * 2.01, now + offset);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.6);

        osc.connect(gain);
        shimmer.connect(gain);
        gain.connect(masterGain);

        osc.start(now + offset);
        shimmer.start(now + offset);
        osc.stop(now + offset + 0.62);
        shimmer.stop(now + offset + 0.62);
      });
      break;
    }
  }
}

/**
 * Start continuous looping ringing until stopped
 */
export function startAlarmLoop(sound: SoundType, volume = 0.8) {
  stopAlarmLoop();
  isCurrentlyRinging = true;

  // Initial ring
  playTonePattern(sound, volume);

  // Interval repeat every 2.4 seconds
  activeLoopTimer = window.setInterval(() => {
    if (!isCurrentlyRinging) {
      stopAlarmLoop();
      return;
    }
    playTonePattern(sound, volume);
  }, 2400);
}

/**
 * Stop alarm loop immediately
 */
export function stopAlarmLoop() {
  isCurrentlyRinging = false;
  if (activeLoopTimer !== null) {
    clearInterval(activeLoopTimer);
    activeLoopTimer = null;
  }
}

export function isAlarmRinging(): boolean {
  return isCurrentlyRinging;
}

export interface SoundMetadata {
  id: SoundType;
  name: string;
  category: 'mild' | 'classic';
  description: string;
  durationLabel: string;
  icon: string;
}

export const SOUND_OPTIONS: SoundMetadata[] = [
  // 5 Very Mild Notification Alerts (~1 sec)
  {
    id: 'droplet',
    name: 'Water Droplet',
    category: 'mild',
    description: 'Crisp delicate water drop ping',
    durationLabel: '1 sec mild',
    icon: '💧'
  },
  {
    id: 'softchime',
    name: 'Soft Chime',
    category: 'mild',
    description: 'Warm ambient dual bell chime',
    durationLabel: '1 sec mild',
    icon: '🔔'
  },
  {
    id: 'subtlepop',
    name: 'Subtle Blip',
    category: 'mild',
    description: 'Discrete mobile notification pop',
    durationLabel: '1 sec mild',
    icon: '💬'
  },
  {
    id: 'calmharp',
    name: 'Calm Harp',
    category: 'mild',
    description: 'Serene acoustic string pluck',
    durationLabel: '1 sec mild',
    icon: '🎵'
  },
  {
    id: 'whisper',
    name: 'Whisper Tone',
    category: 'mild',
    description: 'Ultra-mild zen harmonic pulse',
    durationLabel: '1 sec mild',
    icon: '🍃'
  },

  // Classic Alarm Tones
  {
    id: 'breeze',
    name: 'Breeze Chimes',
    category: 'classic',
    description: 'Melodic wind chime progression',
    durationLabel: 'Melodic',
    icon: '🌬️'
  },
  {
    id: 'digital',
    name: 'Digital Pulse',
    category: 'classic',
    description: 'Classic wrist watch beep-beep',
    durationLabel: 'Crisp',
    icon: '⏰'
  },
  {
    id: 'marimba',
    name: 'Marimba Arpeggio',
    category: 'classic',
    description: 'Warm four-note acoustic acoustic run',
    durationLabel: 'Acoustic',
    icon: '🪵'
  },
  {
    id: 'radar',
    name: 'Radar Ping',
    category: 'classic',
    description: 'Crisp sonar radar pulse',
    durationLabel: 'Pulse',
    icon: '📡'
  },
  {
    id: 'gentle',
    name: 'Gentle Bell Swell',
    category: 'classic',
    description: 'Soothing rising bell triad',
    durationLabel: 'Swell',
    icon: '🌅'
  }
];

