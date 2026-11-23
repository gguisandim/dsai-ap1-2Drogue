import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../data/PlayerProfile';
import { SoundManager } from '../managers/SoundManager';
import { firstFocusableIndex, moveFocus } from '../presentation/MenuNavigation';
import fs from 'node:fs';
import path from 'node:path';

describe('menu navigation and preferences', () => {
  it('uses Novo Jogo and removes the main-menu credits navigation', () => {
    const menuSource = fs.readFileSync(path.resolve(__dirname, '../scenes/MenuScene.ts'), 'utf8');
    const mainSource = fs.readFileSync(path.resolve(__dirname, '../main.ts'), 'utf8');

    expect(menuSource).toContain("label: 'NOVO JOGO'");
    expect(menuSource).not.toContain("label: 'NOVA CAMPANHA'");
    expect(menuSource).not.toContain("label: 'CRÉDITOS'");
    expect(mainSource).not.toContain('CreditsScene');
  });

  it('wraps focus while skipping disabled entries', () => {
    const items = [true, false, true];
    expect(firstFocusableIndex([false, true])).toBe(1);
    expect(moveFocus(items, 0, 1)).toBe(2);
    expect(moveFocus(items, 2, 1)).toBe(0);
    expect(moveFocus([false, false], 0, 1)).toBe(-1);
  });

  it('migrates older settings and persists the new audio and display preferences', () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const values = new Map<string, string>([
      ['umbra-trail-settings', JSON.stringify({ sound: false })],
    ]);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });

    try {
      expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, sound: false });
      const settings = {
        ...DEFAULT_SETTINGS,
        masterVolume: 0.4,
        musicVolume: 0.25,
        effectsVolume: 0.75,
        fullscreen: true,
      };
      saveSettings(settings);
      expect(loadSettings()).toEqual(settings);

      SoundManager.setVolumeLevels(
        settings.masterVolume,
        settings.musicVolume,
        settings.effectsVolume,
      );
      expect(SoundManager.volumeLevels()).toEqual({
        master: 0.4,
        music: 0.25,
        effects: 0.75,
      });
    } finally {
      if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});
