import { PlayerClassId } from './ClassDatabase';

export type Gender = 'woman' | 'man';

export interface CharacterAppearance {
  classId: PlayerClassId;
  gender: Gender;
  skin: number;
  hair: number;
  eyes: number;
  outfit: number;
  shoes: number;
}

export interface GameSettings {
  sound: boolean;
  showControls: boolean;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  fullscreen: boolean;
}

export const HAIR_COLORS = [0x3a2418, 0xf2b632, 0x16131f, 0xb83b5e, 0xd9d2c3];
export const SKIN_COLORS = [0xf2c6a0, 0xc9875b, 0x8d5524, 0x5c3522];
export const EYE_COLORS = [0x2d8b57, 0x3f6db5, 0x6b3f26, 0x8f4bb8];
export const OUTFIT_COLORS = [0x263859, 0x8f2447, 0x315c4b, 0x5b3f8c, 0x8b5a2b];
export const SHOE_COLORS = [0x2b1d18, 0x20242c, 0x7b2637, 0xe1d7c6];

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  classId: 'knight',
  gender: 'woman',
  skin: 0,
  hair: 1,
  eyes: 0,
  outfit: 0,
  shoes: 0,
};

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  showControls: true,
  masterVolume: 0.8,
  musicVolume: 0.65,
  effectsVolume: 0.9,
  fullscreen: false,
};

const PROFILE_KEY = 'umbra-trail-profile';
const SETTINGS_KEY = 'umbra-trail-settings';

function load<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export function loadAppearance(): CharacterAppearance {
  return load(PROFILE_KEY, DEFAULT_APPEARANCE);
}

export function saveAppearance(appearance: CharacterAppearance): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(appearance));
}

export function loadSettings(): GameSettings {
  const settings = load(SETTINGS_KEY, DEFAULT_SETTINGS);
  return {
    sound: typeof settings.sound === 'boolean' ? settings.sound : DEFAULT_SETTINGS.sound,
    showControls: typeof settings.showControls === 'boolean'
      ? settings.showControls
      : DEFAULT_SETTINGS.showControls,
    masterVolume: volumeValue(settings.masterVolume, DEFAULT_SETTINGS.masterVolume),
    musicVolume: volumeValue(settings.musicVolume, DEFAULT_SETTINGS.musicVolume),
    effectsVolume: volumeValue(settings.effectsVolume, DEFAULT_SETTINGS.effectsVolume),
    fullscreen: typeof settings.fullscreen === 'boolean'
      ? settings.fullscreen
      : DEFAULT_SETTINGS.fullscreen,
  };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    sound: settings.sound,
    showControls: settings.showControls,
    masterVolume: volumeValue(settings.masterVolume, DEFAULT_SETTINGS.masterVolume),
    musicVolume: volumeValue(settings.musicVolume, DEFAULT_SETTINGS.musicVolume),
    effectsVolume: volumeValue(settings.effectsVolume, DEFAULT_SETTINGS.effectsVolume),
    fullscreen: settings.fullscreen,
  }));
}

function volumeValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}
