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

import { VERSE_SECTIONS } from '../data/VerseLevelData';
import type { LevelDefinition } from '../data/LevelData';
import { GameStageCompositionRoot } from '../application/stages';
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

function emptyGroup() {
  return { clear: jest.fn(), getChildren: jest.fn(() => []), countActive: jest.fn(() => 0) };
}

describe('GameScene incremental modular stage integration', () => {
  it('keeps the feature flag off by default and uses only legacy references', () => {
    const { scene, state } = sceneShell();
    scene.init();
    expect(state.modularStageLoading).toBe(false);
    expect(state.modularStageSource).toBe('legacy');
    expect(state.modularComposition).toBeUndefined();
    expect(state.currentLevel).toBe(VERSE_SECTIONS[0]);
    expect(state.allLevels).toBe(VERSE_SECTIONS);
  });

  it('loads only the first legacy stage through StageLoader when enabled', () => {
    const { scene, state } = sceneShell();
    scene.init({
      modularStageLoading: true,
      modularRunId: 'test.run',
      modularRunSeed: 'seed-731',
    } as any);
    expect(state.modularStageSource).toBe('modular');
    expect(state.currentLevel).toEqual(VERSE_SECTIONS[0]);
    expect(state.currentLevel).not.toBe(VERSE_SECTIONS[0]);
    expect(state.allLevels[1]).toBe(VERSE_SECTIONS[1]);
    expect(state.modularLoadedStage.manifest.id).toBe('verse_01_atrium');
  });

  it('rolls the scene back to the selected legacy reference when loading fails', () => {
    const resolve = jest.spyOn(GameStageCompositionRoot.prototype, 'resolveStage')
      .mockReturnValue({
        source: 'rollback',
        level: VERSE_SECTIONS[0],
        failure: {
          code: 'load-failed',
          stageId: 'verse_01_atrium',
          diagnostics: [],
        },
      });
    const { scene, state } = sceneShell();

    scene.init({ modularStageLoading: true, modularRunSeed: 'seed-731' } as any);

    expect(state.modularStageSource).toBe('rollback');
    expect(state.currentLevel).toBe(VERSE_SECTIONS[0]);
    expect(state.allLevels).toBe(VERSE_SECTIONS);
    expect(state.modularComposition).toBeUndefined();
    resolve.mockRestore();
  });

  it('leaves procedural and resumed non-pilot stages on the legacy path', () => {
    const procedural = sceneShell();
    procedural.scene.init({
      modularStageLoading: true,
      proceduralSeed: 'procedural-seed',
      proceduralPresets: ['cathedral-intro'],
    } as any);
    expect(procedural.state.modularStageSource).toBe('legacy');
    expect(procedural.state.modularComposition).toBeUndefined();
    expect(procedural.state.currentLevel.id).toBe('procedural-floor-1');

    const second = sceneShell();
    second.scene.init({ modularStageLoading: true, levelIndex: 1 } as any);
    expect(second.state.modularStageSource).toBe('legacy');
    expect(second.state.currentLevel).toBe(VERSE_SECTIONS[1]);
  });

  it('preserves reward and transition behavior then returns to the next legacy object', () => {
    const { scene, state } = sceneShell();
    scene.init({ modularStageLoading: true, modularRunId: 'test.run', modularRunSeed: 'seed' } as any);
    const loadedFirst = state.currentLevel as LevelDefinition;
    const next = VERSE_SECTIONS[1];
    state.allLevels = [loadedFirst, next];
    const groups = [emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup()];
    const session = { requestExit: jest.fn(() => ({ ok: true, persistence: 'skipped' })) };
    Object.assign(state, {
      modularNarrativeSession: session,
      progression: { recordStageCompleted: jest.fn(() => ({ currencyAwarded: 17 })) },
      player: {
        addHalos: jest.fn(), setPosition: jest.fn(), setVelocity: jest.fn(),
        setVisible: jest.fn(), setActive: jest.fn(), setAlpha: jest.fn(),
        resetResourcesForNextStage: jest.fn(),
      },
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      cameras: { main: { flash: jest.fn(), setBounds: jest.fn() } },
      time: { delayedCall: jest.fn((_delay: number, callback: () => void) => callback()) },
      scene: { start: jest.fn() },
      enemies: groups[0], items: groups[1], bullets: groups[2], enemyBullets: groups[3],
      wallTiles: groups[4], stairTiles: groups[5], summons: [],
      physics: { world: { setBounds: jest.fn() } },
      floorImages: [], pendingExitTiles: [], exitsRevealed: true,
    });
    state.buildMapFromDefinition = jest.fn();
    state.spawnEnemiesAndItems = jest.fn();
    state.spawnWave = jest.fn();
    state.showChapterTitle = jest.fn();

    scene.advanceToNextLevel();

    expect(session.requestExit).toHaveBeenCalledWith('legacy.next');
    expect(state.progression.recordStageCompleted).toHaveBeenCalledWith({
      stageId: loadedFirst.id,
      difficulty: loadedFirst.difficulty,
      parSeconds: loadedFirst.parTime,
    });
    expect(state.player.addHalos).toHaveBeenCalledWith(17);
    expect(state.currentLevel).toBe(next);
    expect(state.buildMapFromDefinition).toHaveBeenCalledWith(next);
    expect(state.modularNarrativeSession).toBeUndefined();
    expect(state.modularStageSource).toBe('legacy');
  });

  it('saves before death and propagates modular identity without changing legacy restart fields', () => {
    const { scene, state } = sceneShell();
    scene.init({
      modularStageLoading: true,
      modularRunId: 'test.run',
      modularRunSeed: 731,
      levelIndex: 0,
    } as any);
    const player = {
      hp: 5,
      halos: 4321,
      takeDamage: jest.fn((amount: number) => { player.hp = Math.max(0, player.hp - amount); }),
      setVelocity: jest.fn(),
      setActive: jest.fn(),
    };
    const session = { save: jest.fn(() => ({
      ok: false,
      error: { code: 'storage-write-failed', message: 'unavailable' },
    })) };
    const restart = jest.fn();
    Object.assign(state, {
      player,
      modularNarrativeSession: session,
      simulationBridge: { recordDamage: jest.fn() },
      progression: { recordDamageTaken: jest.fn() },
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      time: { delayedCall: jest.fn((_delay: number, callback: () => void) => callback()) },
      scene: { restart },
      playerDamageCooldown: 0,
      isTransitioning: false,
    });

    state.damagePlayer(10);

    expect(session.save).toHaveBeenCalledTimes(1);
    expect(restart).toHaveBeenCalledWith({
      skipControls: true,
      levelIndex: 0,
      halos: 4321,
      proceduralSeed: undefined,
      proceduralPresets: undefined,
      modularStageLoading: true,
      modularRunId: 'test.run',
      modularRunSeed: 731,
    });
  });
});
