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

import { ALL_LEVELS, EnemyPlacement, LevelDefinition, getNextLevel } from '../data/LevelData';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_SETTINGS,
  loadAppearance,
  loadSettings,
  saveAppearance,
  saveSettings,
} from '../data/PlayerProfile';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { SoundManager } from '../managers/SoundManager';
import {
  LocalProgressionStorage,
  MemoryProgressionStorage,
  ProgressionService,
  createProgressionState,
} from '../progression';
import { GameScene } from '../scenes/GameScene';
import { DocumentSerializer, EditorValue } from '../tools';

type SceneInternals = Record<string, any>;

const DEFAULT_PROCEDURAL_PRESETS = [
  'cathedral-intro',
  'crypt-crawl',
  'ruined-city',
  'inferno-caverns',
  'clockwork-maze',
  'garden-labyrinth',
  'celestial-bridges',
  'colosseum-gauntlet',
  'void-fracture',
] as const;

function createSceneShell(): { scene: GameScene; state: SceneInternals } {
  const scene = Object.create(GameScene.prototype) as GameScene;
  const state = scene as unknown as SceneInternals;
  state.dodgeHitTargets = new Set();
  state.floorImages = [];
  state.pendingExitTiles = [];
  return { scene, state };
}

function enemy(level: number, type = `enemy-${level}`): EnemyPlacement {
  return { type, x: level, y: level + 1, level };
}

function levelWith(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: 'characterization-stage',
    name: 'Characterization Stage',
    description: 'Fixture used to freeze legacy stage behavior.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1, 1],
      [1, 8, 5, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 90,
    difficulty: 2,
    ...overrides,
  };
}

function emptyGroup() {
  return { clear: jest.fn(), getChildren: jest.fn(() => []), countActive: jest.fn(() => 0) };
}

function configureWaveUpdate(state: SceneInternals, waves: Array<{ enemies: EnemyPlacement[] }>): void {
  const text = { setText: jest.fn(), setVisible: jest.fn() };
  Object.assign(state, {
    arrowChargeBar: { setVisible: jest.fn() },
    comboManager: { update: jest.fn(), registerHit: jest.fn() },
    playerDamageCooldown: 0,
    keyMenu: undefined,
    controlsGuideOpen: false,
    keyShop: undefined,
    shopUI: { getIsVisible: jest.fn(() => false) },
    isTransitioning: false,
    simulationBridge: {
      setPaused: jest.fn(),
      advance: jest.fn(),
      synchronizePlayer: jest.fn(),
      recordWaveCompleted: jest.fn(),
    },
    combatBridge: { advance: jest.fn(), synchronizePlayer: jest.fn() },
    player: {
      combatInputEnabled: true,
      updatePlayer: jest.fn(),
      x: 16,
      y: 16,
      hp: 5,
      maxHp: 5,
      magic: 10,
      maxMagic: 10,
      halos: 5000,
      isWitchTimeActive: false,
      meleeAttackId: 0,
      facingX: 1,
      facingY: 0,
      shieldCharges: 0,
      heroClass: {
        name: 'Knight',
        weaponName: 'Sword',
        primaryStyle: 'melee',
        accentColor: 0xffffff,
      },
      getChargeRatio: jest.fn(() => 0),
    },
    witchTimeOverlay: { setVisible: jest.fn() },
    enemies: emptyGroup(),
    enemyBullets: emptyGroup(),
    summons: [],
    waves,
    currentWaveIndex: 0,
    waveDelayTimer: 0,
    waveTransition: false,
    currentLevel: levelWith(),
    levelClearedBannerShowing: false,
    levelBannerText: text,
    lastHandledMeleeAttack: 0,
    hpHudText: text,
    magicHudText: text,
    haloHudText: text,
    progressionHudText: text,
    weaponHudText: text,
    progression: {
      levelProgress: jest.fn(() => ({ level: 1, current: 0, required: 100 })),
      snapshot: jest.fn(() => ({ skillPoints: 0 })),
    },
    aimReticle: { setScale: jest.fn(), setStrokeStyle: jest.fn(), setPosition: jest.fn() },
    input: { activePointer: { x: 100, y: 80 } },
  });
  state.updateArrowChargeBar = jest.fn();
  state.updateObjective = jest.fn();
}

class FakeLocalStorage {
  private readonly values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public keys(): string[] {
    return [...this.values.keys()].sort();
  }
}

describe('legacy stage selection and generation characterization', () => {
  it('uses the three verse sections as the default run and clamps resumed indices', () => {
    const first = createSceneShell();
    first.scene.init();

    expect(first.state.allLevels.map((level: LevelDefinition) => level.id)).toEqual([
      'verse_01_atrium',
      'verse_02_galeria',
      'verse_03_santuario',
    ]);
    expect(first.state.currentLevel.id).toBe('verse_01_atrium');
    expect(first.state.startingHalos).toBe(5000);

    const resumed = createSceneShell();
    resumed.scene.init({ levelIndex: 99, halos: -4 });
    expect(resumed.state.currentLevelIndex).toBe(2);
    expect(resumed.state.currentLevel.id).toBe('verse_03_santuario');
    expect(resumed.state.startingHalos).toBe(0);
  });

  it('freezes the authored level catalogue order and its linear next-stage rule', () => {
    expect(ALL_LEVELS.map(level => level.id)).toEqual([
      'level_01_vestibule',
      'level_02_nave',
      'level_03_vigrid_streets',
      'level_04_colosseum',
      'level_05_clocktower',
      'level_06_inferno',
      'level_07_witches_crypt',
      'level_08_paradiso',
      'level_09_limbo',
      'level_10_ithavoll',
    ]);
    expect(getNextLevel('level_01_vestibule')?.id).toBe('level_02_nave');
    expect(getNextLevel('level_10_ithavoll')).toBeUndefined();
    expect(getNextLevel('unknown-stage')).toBeUndefined();
  });

  it('uses the fixed nine-preset procedural run with stable ids, themes and difficulty', () => {
    const generated = createSceneShell();
    generated.scene.init({ proceduralSeed: 'stage-characterization-seed' });

    expect(generated.state.proceduralPresets).toEqual(DEFAULT_PROCEDURAL_PRESETS);
    expect(generated.state.allLevels.map((level: LevelDefinition) => ({
      id: level.id,
      theme: level.theme,
      difficulty: level.difficulty,
    }))).toEqual([
      { id: 'procedural-floor-1', theme: 'gothic_cathedral', difficulty: 1 },
      { id: 'procedural-floor-2', theme: 'witches_crypt', difficulty: 2 },
      { id: 'procedural-floor-3', theme: 'roman_ruins', difficulty: 3 },
      { id: 'procedural-floor-4', theme: 'inferno_pit', difficulty: 4 },
      { id: 'procedural-floor-5', theme: 'clocktower', difficulty: 5 },
      { id: 'procedural-floor-6', theme: 'paradiso_garden', difficulty: 6 },
      { id: 'procedural-floor-7', theme: 'celestial_tower', difficulty: 7 },
      { id: 'procedural-floor-8', theme: 'colosseum', difficulty: 8 },
      { id: 'procedural-floor-9', theme: 'limbo_void', difficulty: 9 },
    ]);
  });

  it('produces the same stage definitions for the same seed and custom preset sequence', () => {
    const presets = ['crypt-crawl', 'void-fracture'] as const;
    const first = createSceneShell();
    const second = createSceneShell();
    first.scene.init({ proceduralSeed: 8421, proceduralPresets: [...presets] });
    second.scene.init({ proceduralSeed: 8421, proceduralPresets: [...presets] });

    expect(second.state.allLevels).toEqual(first.state.allLevels);
    expect(first.state.allLevels.map((level: LevelDefinition) => level.id)).toEqual([
      'procedural-floor-1',
      'procedural-floor-2',
    ]);
  });
});

describe('legacy wave and exit characterization', () => {
  it('uses authored wave membership while discarding authored delays and base enemies', () => {
    const { state } = createSceneShell();
    const firstWave = [enemy(3, 'authored-a')];
    const secondWave = [enemy(5, 'authored-b')];
    state.currentLevelIndex = 0;
    state.foundKeys = new Set();

    state.spawnEnemiesAndItems(levelWith({
      enemies: [enemy(1, 'base-enemy')],
      waves: [
        { delay: 5000, enemies: firstWave },
        { delay: 12000, enemies: secondWave },
      ],
    }));

    expect(state.waves).toEqual([{ enemies: firstWave }, { enemies: secondWave }]);
    expect(state.currentWaveIndex).toBe(0);
    expect(state.waveDelayTimer).toBe(0);
    expect(state.waveTransition).toBe(false);
  });

  it('sorts fallback enemies by level, chunks eight per wave and appends the indexed miniboss', () => {
    const { state } = createSceneShell();
    state.currentLevelIndex = 1;
    state.foundKeys = new Set();
    const enemies = [10, 1, 8, 2, 9, 3, 7, 4, 6, 5].map(value => enemy(value));

    state.spawnEnemiesAndItems(levelWith({ enemies }));

    expect(state.waves).toHaveLength(3);
    expect(state.waves[0].enemies.map((entry: EnemyPlacement) => entry.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(state.waves[1].enemies.map((entry: EnemyPlacement) => entry.level)).toEqual([9, 10]);
    expect(state.waves[2]).toEqual({
      enemies: [{ type: 'miniboss', x: 30, y: 9, level: 9 }],
    });
  });

  it('spawns the requested wave and journals its one-based number and enemy count', () => {
    const { state } = createSceneShell();
    const members = [enemy(1), enemy(2)];
    state.waves = [{ enemies: members }];
    state.currentLevel = levelWith({ name: 'Frozen Wave' });
    state.spawnSingleEnemy = jest.fn();
    state.simulationBridge = { recordWaveStarted: jest.fn() };
    state.levelBannerText = undefined;

    state.spawnWave(0);

    expect(state.spawnSingleEnemy.mock.calls.map((call: EnemyPlacement[]) => call[0])).toEqual(members);
    expect(state.simulationBridge.recordWaveStarted).toHaveBeenCalledWith('Frozen Wave', 1, 2);
  });

  it('journals wave completion, waits 1200 ms and advances to the next wave', () => {
    const { scene, state } = createSceneShell();
    configureWaveUpdate(state, [{ enemies: [enemy(1)] }, { enemies: [enemy(2)] }]);
    state.spawnWave = jest.fn();

    scene.update(0, 0);
    expect(state.simulationBridge.recordWaveCompleted).toHaveBeenCalledWith('Characterization Stage', 1);
    expect(state.waveTransition).toBe(true);
    expect(state.waveDelayTimer).toBe(1200);

    scene.update(1200, 1200);
    expect(state.currentWaveIndex).toBe(1);
    expect(state.spawnWave).toHaveBeenCalledWith(1);
    expect(state.waveTransition).toBe(false);
  });

  it('reveals exits once only after the final wave has no active enemies', () => {
    const { scene, state } = createSceneShell();
    configureWaveUpdate(state, [{ enemies: [enemy(1)] }]);
    state.revealExits = jest.fn();

    scene.update(0, 0);
    scene.update(1, 0);

    expect(state.revealExits).toHaveBeenCalledTimes(1);
    expect(state.levelClearedBannerShowing).toBe(true);
    expect(state.levelBannerText.setText).toHaveBeenCalledWith('CAMINHO LIBERADO!\nEncontre o portal dourado');
  });
});

describe('legacy transition, reward and restart characterization', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rewards the current stage and rebuilds the next stage after the 400 ms transition', () => {
    const { scene, state } = createSceneShell();
    const destroyed = { destroy: jest.fn() };
    const groups = [emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup(), emptyGroup()];
    const player = {
      addHalos: jest.fn(),
      setPosition: jest.fn(),
      setVelocity: jest.fn(),
      setVisible: jest.fn(),
      setActive: jest.fn(),
      setAlpha: jest.fn(),
      resetResourcesForNextStage: jest.fn(),
    };
    const delayedCall = jest.fn((delay: number, callback: () => void) => callback());
    const next = VERSE_SECTIONS[1];
    const spawnRow = next.tileMap.findIndex(row => row.includes(8));
    const spawnColumn = next.tileMap[spawnRow].indexOf(8);
    jest.spyOn(SoundManager, 'playWitchTimeActivate').mockImplementation(() => undefined);
    Object.assign(state, {
      isTransitioning: false,
      allLevels: VERSE_SECTIONS.slice(0, 2),
      currentLevelIndex: 0,
      currentLevel: VERSE_SECTIONS[0],
      progression: {
        recordStageCompleted: jest.fn(() => ({ currencyAwarded: 17 })),
      },
      player,
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      cameras: { main: { flash: jest.fn(), setBounds: jest.fn() } },
      time: { delayedCall },
      scene: { start: jest.fn() },
      floorImages: [destroyed],
      enemies: groups[0],
      items: groups[1],
      bullets: groups[2],
      enemyBullets: groups[3],
      wallTiles: groups[4],
      stairTiles: groups[5],
      summons: [{ destroy: jest.fn() }],
      pendingExitTiles: [{ x: 1, y: 1 }],
      exitsRevealed: true,
      physics: { world: { setBounds: jest.fn() } },
      levelClearedBannerShowing: true,
    });
    state.buildMapFromDefinition = jest.fn();
    state.spawnEnemiesAndItems = jest.fn();
    state.spawnWave = jest.fn();
    state.showChapterTitle = jest.fn();

    scene.advanceToNextLevel();

    expect(state.progression.recordStageCompleted).toHaveBeenCalledWith({
      stageId: 'verse_01_atrium',
      difficulty: VERSE_SECTIONS[0].difficulty,
      parSeconds: VERSE_SECTIONS[0].parTime,
    });
    expect(player.addHalos).toHaveBeenCalledWith(17);
    expect(delayedCall).toHaveBeenCalledWith(400, expect.any(Function));
    expect(state.currentLevelIndex).toBe(1);
    expect(state.currentLevel).toBe(next);
    expect(destroyed.destroy).toHaveBeenCalledTimes(1);
    groups.forEach(group => expect(group.clear).toHaveBeenCalledWith(true, true));
    expect(state.buildMapFromDefinition).toHaveBeenCalledWith(next);
    expect(state.spawnEnemiesAndItems).toHaveBeenCalledWith(next);
    expect(state.spawnWave).toHaveBeenCalledWith(0);
    expect(player.setPosition).toHaveBeenCalledWith(spawnColumn * 32 + 16, spawnRow * 32 + 16);
    expect(player.resetResourcesForNextStage).toHaveBeenCalledTimes(1);
    expect(state.showChapterTitle).toHaveBeenCalledWith(next.name);
    expect(state.isTransitioning).toBe(false);
  });

  it('rewards the final stage and returns to the menu after 1800 ms without rebuilding', () => {
    const { scene, state } = createSceneShell();
    const delayedCall = jest.fn((delay: number, callback: () => void) => callback());
    Object.assign(state, {
      isTransitioning: false,
      allLevels: [VERSE_SECTIONS[2]],
      currentLevelIndex: 0,
      currentLevel: VERSE_SECTIONS[2],
      progression: { recordStageCompleted: jest.fn(() => ({ currencyAwarded: 31 })) },
      player: { addHalos: jest.fn() },
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      cameras: { main: { flash: jest.fn() } },
      time: { delayedCall },
      scene: { start: jest.fn() },
    });

    scene.advanceToNextLevel();

    expect(state.player.addHalos).toHaveBeenCalledWith(31);
    expect(delayedCall).toHaveBeenCalledWith(1800, expect.any(Function));
    expect(state.scene.start).toHaveBeenCalledWith('MenuScene');
    expect(state.levelBannerText.setText).toHaveBeenCalledWith('PASSAGEM CONCLUÍDA!');
    expect(state.currentLevel).toBe(VERSE_SECTIONS[2]);
  });

  it('does not reward or transition again while a transition is already active', () => {
    const { scene, state } = createSceneShell();
    state.isTransitioning = true;
    state.progression = { recordStageCompleted: jest.fn() };

    scene.advanceToNextLevel();

    expect(state.progression.recordStageCompleted).not.toHaveBeenCalled();
  });

  it('restarts the same authored or procedural position after death and carries transient halos', () => {
    const { state } = createSceneShell();
    const player = {
      hp: 6,
      halos: 4321,
      takeDamage: jest.fn((amount: number) => {
        player.hp = Math.max(0, player.hp - amount);
      }),
      setVelocity: jest.fn(),
      setActive: jest.fn(),
    };
    const restart = jest.fn();
    Object.assign(state, {
      player,
      playerDamageCooldown: 0,
      simulationBridge: { recordDamage: jest.fn() },
      progression: { recordDamageTaken: jest.fn() },
      isTransitioning: false,
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      time: { delayedCall: jest.fn((delay: number, callback: () => void) => callback()) },
      scene: { restart },
      currentLevelIndex: 4,
      proceduralSeed: 'run-seed',
      proceduralPresets: ['clockwork-maze'],
    });

    state.damagePlayer(10);

    expect(state.simulationBridge.recordDamage).toHaveBeenCalledWith(6);
    expect(state.progression.recordDamageTaken).toHaveBeenCalledWith(6);
    expect(state.playerDamageCooldown).toBe(500);
    expect(state.time.delayedCall).toHaveBeenCalledWith(1500, expect.any(Function));
    expect(restart).toHaveBeenCalledWith({
      skipControls: true,
      levelIndex: 4,
      halos: 4321,
      proceduralSeed: 'run-seed',
      proceduralPresets: ['clockwork-maze'],
    });
  });
});

describe('legacy progression and persistence characterization', () => {
  it('persists every stage completion and currently rewards repeated stage ids', () => {
    const storage = new MemoryProgressionStorage();
    const progression = new ProgressionService({ storage, now: () => 1000 });

    const first = progression.recordStageCompleted({ stageId: 'repeatable', difficulty: 2, parSeconds: 90 });
    const second = progression.recordStageCompleted({ stageId: 'repeatable', difficulty: 2, parSeconds: 90 });
    const snapshot = progression.snapshot();

    expect(first.experienceAwarded).toBe(118);
    expect(first.currencyAwarded).toBe(81);
    expect(second.experienceAwarded).toBe(118);
    expect(second.currencyAwarded).toBe(81);
    expect(snapshot.counters.stagesCompleted).toBe(2);
    expect(snapshot.chapter).toBe(3);
    expect(snapshot.unlockedContent.filter(id => id === 'stage-repeatable')).toHaveLength(1);
    expect(storage.load()).toEqual(snapshot);
  });

  it('keeps the three current storage keys and round-trips their version-one formats', () => {
    const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const localStorage = new FakeLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage });

    try {
      const appearance = { ...DEFAULT_APPEARANCE, hair: 3 };
      const settings = { ...DEFAULT_SETTINGS, showControls: false };
      const progression = createProgressionState(777);
      progression.currency = 91;

      saveAppearance(appearance);
      saveSettings(settings);
      const storage = new LocalProgressionStorage();
      storage.save(progression);

      expect(localStorage.keys()).toEqual([
        'umbra-trail-profile',
        'umbra-trail-settings',
        'vigrid-progression-v1',
      ]);
      expect(loadAppearance()).toEqual(appearance);
      expect(loadSettings()).toEqual(settings);
      expect(storage.load()).toEqual(progression);
    } finally {
      if (previousDescriptor) Object.defineProperty(globalThis, 'localStorage', previousDescriptor);
      else delete (globalThis as SceneInternals).localStorage;
    }
  });

  it('round-trips an existing level through the editor document v1 envelope', () => {
    const serializer = new DocumentSerializer();
    const payload = JSON.parse(JSON.stringify(VERSE_SECTIONS[0])) as EditorValue;

    const source = serializer.serialize(payload);
    const envelope = JSON.parse(source) as { format: string; version: number; checksum: string };

    expect(envelope.format).toBe('umbra-editor-document');
    expect(envelope.version).toBe(1);
    expect(envelope.checksum).toEqual(expect.any(String));
    expect(serializer.deserialize(source)).toEqual(payload);
  });
});
