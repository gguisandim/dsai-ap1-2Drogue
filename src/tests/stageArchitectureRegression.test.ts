jest.mock('phaser', () => ({
  __esModule: true,
  default: {
    Scene: class {},
    Physics: { Arcade: { Sprite: class {} } },
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
      Linear: (start: number, end: number, ratio: number) => start + (end - start) * ratio,
    },
    Input: { Keyboard: { JustDown: () => false } },
  },
}));

import { GameStageCompositionRoot } from '../application/stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { MemorySaveStorage } from '../narrative';
import { GameScene } from '../scenes/GameScene';

type SceneInternals = Record<string, any>;

function sceneShell(): { scene: GameScene; state: SceneInternals } {
  const scene = Object.create(GameScene.prototype) as GameScene;
  const state = scene as unknown as SceneInternals;
  state.dodgeHitTargets = new Set();
  state.floorImages = [];
  state.pendingExitTiles = [];
  return { scene, state };
}

function configureFatalDamage(state: SceneInternals): jest.Mock {
  const player = {
    hp: 1,
    halos: 91,
    takeDamage: jest.fn((amount: number) => { player.hp = Math.max(0, player.hp - amount); }),
    setVelocity: jest.fn(),
    setActive: jest.fn(),
  };
  const restart = jest.fn();
  Object.assign(state, {
    player,
    simulationBridge: { recordDamage: jest.fn() },
    progression: { recordDamageTaken: jest.fn() },
    levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
    time: { delayedCall: jest.fn((_delay: number, callback: () => void) => callback()) },
    scene: { restart },
    playerDamageCooldown: 0,
    isTransitioning: false,
  });
  return restart;
}

describe('modular architecture regression matrix', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps a legacy death restart free of modular identity while the flag is off', () => {
    const { scene, state } = sceneShell();
    scene.init({ levelIndex: 0, halos: 91 } as any);
    const restart = configureFatalDamage(state);

    state.damagePlayer(5);

    expect(restart).toHaveBeenCalledWith({
      skipControls: true,
      levelIndex: 0,
      halos: 91,
      proceduralSeed: undefined,
      proceduralPresets: undefined,
    });
  });

  it('keeps rollback recoverable across restart without inventing a persistent run id', () => {
    jest.spyOn(GameStageCompositionRoot.prototype, 'resolveStage').mockReturnValue({
      source: 'rollback',
      level: VERSE_SECTIONS[0],
      failure: { code: 'load-failed', stageId: 'verse_01_atrium', diagnostics: [] },
    });
    const { scene, state } = sceneShell();
    scene.init({ modularStageLoading: true, modularRunSeed: 'fallback-seed' } as any);
    const restart = configureFatalDamage(state);

    state.damagePlayer(5);

    expect(state.currentLevel).toBe(VERSE_SECTIONS[0]);
    expect(restart).toHaveBeenCalledWith({
      skipControls: true,
      levelIndex: 0,
      halos: 91,
      proceduralSeed: undefined,
      proceduralPresets: undefined,
      modularStageLoading: true,
      modularRunSeed: 'fallback-seed',
    });
  });

  it('round-trips modular narrative state without changing legacy save keys', () => {
    const legacy = {
      'umbra-trail-profile': 'profile-bytes',
      'umbra-trail-settings': 'settings-bytes',
      'vigrid-progression-v1': 'progression-bytes',
    };
    const storage = new MemorySaveStorage(legacy);
    const firstRoot = new GameStageCompositionRoot({ campaignStorage: storage });
    const resolved = firstRoot.resolveStage({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'regression.run',
      runSeed: 'regression.seed',
    });
    if (resolved.source !== 'modular') throw new Error('pilot stage did not load');
    const identity = {
      campaignId: 'legacy.verse',
      runId: 'regression.run',
      runSeed: 'regression.seed',
    };
    const first = firstRoot.createNarrativeSession(
      resolved.loadedStage, identity, { level: 1, unlockedContent: [] },
    );
    if (!first.ok) throw first.error;
    expect(first.session.enterStage()).toEqual({ ok: true, persistence: 'saved' });
    const savedSnapshot = first.session.director.snapshot();

    const secondRoot = new GameStageCompositionRoot({ campaignStorage: storage });
    const restored = secondRoot.createNarrativeSession(
      resolved.loadedStage, identity, { level: 1, unlockedContent: [] },
    );
    if (!restored.ok) throw restored.error;

    expect(restored.session.director.snapshot()).toEqual(savedSnapshot);
    expect(storage.snapshot()).toMatchObject(legacy);
    expect(storage.read('umbra-trail-run-v1')).toBeUndefined();
  });
});
