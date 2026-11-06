jest.mock('phaser', () => ({
  __esModule: true,
  default: {
    Scene: class {},
    Physics: { Arcade: { Sprite: class {} } },
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
      Linear: (start: number, end: number, ratio: number) => start + (end - start) * ratio,
      Distance: { Between: () => 0 },
    },
    Input: { Keyboard: { JustDown: () => false, KeyCodes: { B: 66, ESC: 27, E: 69 } } },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

import {
  GameStageCompositionRoot,
  UMBRA_ROUTE_SLICE_HUB_CONTEXT,
  UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
} from '../application/stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { MemorySaveStorage } from '../narrative';
import { GameScene } from '../scenes/GameScene';
import {
  CORACAO_CORROMPIDO_STAGE_ID,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  WORLD_ROOT_STAGE_ID,
} from '../stages';

type SceneState = Record<string, any>;

function sceneShell(): { scene: GameScene; state: SceneState } {
  const scene = Object.create(GameScene.prototype) as GameScene;
  const state = scene as unknown as SceneState;
  state.dodgeHitTargets = new Set();
  state.floorImages = [];
  state.pendingExitTiles = [];
  return { scene, state };
}

function emptyGroup() {
  return { clear: jest.fn(), getChildren: jest.fn(() => []), countActive: jest.fn(() => 0) };
}

function prepareTransitionScene(state: SceneState): void {
  const groups = Array.from({ length: 6 }, emptyGroup);
  Object.assign(state, {
    progression: {
      recordStageCompletedIdempotent: jest.fn(() => ({
        ok: true,
        value: { status: 'applied', update: { currencyAwarded: 23 } },
      })),
    },
    player: {
      halos: 100,
      addHalos: jest.fn(), setPosition: jest.fn(), setVelocity: jest.fn(),
      setVisible: jest.fn(), setActive: jest.fn(), setAlpha: jest.fn(),
      resetResourcesForNextStage: jest.fn(),
    },
    levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
    objectiveText: { setText: jest.fn() },
    cameras: { main: { flash: jest.fn(), setBounds: jest.fn() } },
    time: { now: 0, delayedCall: jest.fn((_delay: number, callback: () => void) => callback()) },
    scene: { start: jest.fn(), restart: jest.fn() },
    simulationBridge: { recordRoomEntered: jest.fn() },
    enemies: groups[0], items: groups[1], bullets: groups[2], enemyBullets: groups[3],
    wallTiles: groups[4], stairTiles: groups[5], summons: [],
    physics: { world: { setBounds: jest.fn() } },
    floorImages: [], pendingExitTiles: [], exitsRevealed: true,
    levelClearedBannerShowing: false, currentWaveIndex: 0, waveTransition: false,
  });
  state.buildMapFromDefinition = jest.fn();
  state.spawnEnemiesAndItems = jest.fn();
  state.spawnWave = jest.fn();
  state.revealExits = jest.fn(() => { state.exitsRevealed = true; });
  state.showChapterTitle = jest.fn();
}

function grantNarrativeAccess(state: SceneState): void {
  const inspected = state.campaignRouter.inspect();
  if (!inspected.ok) throw inspected.error;
  const campaignState = state.campaignRouter.state();
  state.campaignRouter.setAccess({
    eligibleEdgeIds: campaignState.graph.edges
      .filter((edge: { sourceNodeId: string }) => edge.sourceNodeId === campaignState.currentNodeId)
      .map((edge: { id: string }) => edge.id)
      .sort(),
    unlockedStageExitIds: inspected.value.snapshot.destinations
      .map((destination: { stageExitId: string }) => destination.stageExitId)
      .sort(),
  });
  const refreshed = state.campaignRouter.inspect();
  if (!refreshed.ok) throw refreshed.error;
  state.campaignNavigation = refreshed.value;
}

describe('GameScene macro campaign vertical slice', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps the new mode off by default and gives macro precedence over branching', () => {
    const legacy = sceneShell();
    legacy.scene.init();
    expect(legacy.state.macroCampaign).toBe(false);
    expect(legacy.state.branchingCampaign).toBe(false);
    expect(legacy.state.campaignRouter).toBeUndefined();
    expect(legacy.state.currentLevel).toBe(VERSE_SECTIONS[0]);

    const macro = sceneShell();
    macro.scene.init({
      macroCampaign: true,
      branchingCampaign: true,
      macroRunId: 'run.scene-precedence',
      macroRunSeed: 'seed.scene-precedence',
    } as any);
    expect(macro.state.macroStageSource).toBe('campaign');
    expect(macro.state.macroLoadedStage).toBeDefined();
    expect(macro.state.macroLoadedStage.manifest.id).toBe(WORLD_ROOT_STAGE_ID);
    expect(macro.state.branchingCampaign).toBe(false);
    expect(macro.state.branchingStageSource).toBe('legacy');
    expect(macro.state.currentLevel.id).toBe(WORLD_ROOT_STAGE_ID);
    expect(macro.state.campaignNavigation.snapshot.destinations).toHaveLength(1);
  });

  it('treats the authored hub as a playable prologue with its own encounter', () => {
    const { scene, state } = sceneShell();
    scene.init({ macroCampaign: true, macroRunId: 'run.scene-hub' } as any);
    state.spawnEnemiesAndItems = jest.fn();
    state.spawnWave = jest.fn();
    state.revealExits = jest.fn();
    state.levelClearedBannerShowing = false;

    state.prepareCurrentStageEncounter();
    state.startCurrentStageEncounter();

    expect(state.macroCampaignAdapter.location()).toMatchObject({ isHub: false });
    expect(state.spawnEnemiesAndItems).toHaveBeenCalledWith(state.currentLevel);
    expect(state.spawnWave).toHaveBeenCalledWith(0);
    expect(state.revealExits).not.toHaveBeenCalled();
    expect(state.levelClearedBannerShowing).toBe(false);
  });

  it('plays hub, Igapó, corrupted heart, return and resumption through the shared portal flow', () => {
    const { scene, state } = sceneShell();
    scene.init({
      macroCampaign: true,
      macroRunId: 'run.scene-cycle',
      macroRunSeed: 'seed.scene-cycle',
    } as any);
    prepareTransitionScene(state);
    const initialGraphId = state.campaignRouter.state().graph.id;
    grantNarrativeAccess(state);
    const firstExit = state.campaignNavigation.snapshot.destinations[0];

    state.handleCampaignExitProximity(firstExit.physicalExitId, true, false);
    expect(state.objectiveText.setText).toHaveBeenCalledWith('PRESSIONE E PARA ATRAVESSAR');
    state.handleCampaignExitProximity(firstExit.physicalExitId, true, true);
    const igapoNodeId = state.campaignRouter.state().currentNodeId;
    expect(state.currentLevel.id).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(state.macroCampaignAdapter.location()).toMatchObject({
      routeName: 'Rota das Águas', regionName: 'Igapó das Memórias', isHub: false,
    });
    expect(state.campaignRouter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);
    expect(state.spawnEnemiesAndItems).toHaveBeenCalledWith(state.currentLevel);

    grantNarrativeAccess(state);
    const corruptedExit = state.campaignNavigation.snapshot.destinations[0];
    state.handleCampaignExitProximity(corruptedExit.physicalExitId, true, true);
    const corruptedNodeId = state.campaignRouter.state().currentNodeId;
    expect(state.currentLevel.id).toBe(CORACAO_CORROMPIDO_STAGE_ID);
    expect(state.campaignRouter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);

    grantNarrativeAccess(state);
    const returnExit = state.campaignNavigation.snapshot.destinations[0];
    state.handleCampaignExitProximity(returnExit.physicalExitId, true, true);
    expect(state.currentLevel.id).toBe(WORLD_ROOT_STAGE_ID);
    expect(state.campaignRouter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    expect(state.campaignRouter.state().parkedGraphContexts[UMBRA_ROUTE_SLICE_WATERS_CONTEXT].currentNodeId)
      .toBe(corruptedNodeId);

    grantNarrativeAccess(state);
    const resumeExit = state.campaignNavigation.snapshot.destinations[0];
    state.handleCampaignExitProximity(resumeExit.physicalExitId, true, true);
    expect(state.currentLevel.id).toBe(CORACAO_CORROMPIDO_STAGE_ID);
    expect(state.campaignRouter.state().currentNodeId).toBe(corruptedNodeId);
    expect(state.campaignRouter.state().currentNodeId).not.toBe(igapoNodeId);
    expect(state.campaignRouter.state().graph.id).toBe(initialGraphId);
    expect(state.campaignRouter.state().confirmedTransitionIds).toHaveLength(4);
    expect(state.progression.recordStageCompletedIdempotent).toHaveBeenCalledTimes(4);
  });

  it('does not advance or leave the input guard set when macro persistence fails', () => {
    const { scene, state } = sceneShell();
    scene.init();
    prepareTransitionScene(state);
    const current = state.currentLevel;
    state.campaignRouter = {
      prepare: jest.fn(() => ({
        ok: true,
        value: { preparationId: 'prepare.macro', transitionId: 'transition.macro' },
      })),
      confirm: jest.fn(() => ({
        ok: false,
        error: { code: 'persistence-failed', message: 'fixture', recovery: 'rolled-back' },
      })),
    };
    state.campaignNavigation = {
      snapshot: {
        destinations: [{ physicalExitId: 'physical.macro', stageExitId: 'exit.test.macro' }],
      },
    };

    state.navigateCampaignExit('physical.macro');

    expect(state.currentLevel).toBe(current);
    expect(state.isTransitioning).toBe(false);
    expect(state.progression.recordStageCompletedIdempotent).not.toHaveBeenCalled();
    expect(state.buildMapFromDefinition).not.toHaveBeenCalled();
    expect(state.levelBannerText.setText).toHaveBeenLastCalledWith(
      'TRANSIÇÃO CANCELADA: persistence-failed',
    );
  });

  it('shows blocked physical exits without preparing a transition', () => {
    const { scene, state } = sceneShell();
    scene.init();
    prepareTransitionScene(state);
    state.campaignRouter = { prepare: jest.fn() };

    state.handleCampaignExitProximity('physical.blocked', false, true);

    expect(state.objectiveText.setText).toHaveBeenCalledWith('SAÍDA BLOQUEADA');
    expect(state.campaignRouter.prepare).not.toHaveBeenCalled();
  });

  it('preserves macro run identity when death restarts the scene', () => {
    const { scene, state } = sceneShell();
    scene.init({
      macroCampaign: true,
      macroRunId: 'run.scene-death',
      macroRunSeed: 927,
    } as any);
    const player = {
      hp: 5, halos: 777,
      takeDamage: jest.fn((amount: number) => { player.hp = Math.max(0, player.hp - amount); }),
      setVelocity: jest.fn(), setActive: jest.fn(),
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

    state.damagePlayer(10);

    expect(restart).toHaveBeenCalledWith(expect.objectContaining({
      macroCampaign: true,
      macroRunId: 'run.scene-death',
      macroRunSeed: 927,
      halos: 777,
    }));
    expect(restart.mock.calls[0][0]).not.toHaveProperty('branchingCampaign');
  });

  it('restores a run directly inside an authored stage outside the legacy array', () => {
    const storage = new MemorySaveStorage();
    const root = new GameStageCompositionRoot({ campaignStorage: storage });
    const first = root.createMacroCampaign({
      runId: 'run.scene-authored-restore',
      runSeed: 'seed.scene-authored-restore',
    });
    if (!first.ok) throw first.error;
    const hub = first.value.adapter.inspect();
    if (!hub.ok) throw hub.error;
    first.value.adapter.setAccess({
      eligibleEdgeIds: first.value.adapter.state().graph.edges
        .filter(edge => edge.sourceNodeId === first.value.adapter.state().currentNodeId)
        .map(edge => edge.id),
      unlockedStageExitIds: hub.value.snapshot.destinations.map(destination => destination.stageExitId),
    });
    const prepared = first.value.adapter.prepare(hub.value.snapshot.destinations[0].physicalExitId);
    if (!prepared.ok) throw prepared.error;
    const confirmed = first.value.adapter.confirm(prepared.value.preparationId);
    if (!confirmed.ok) throw confirmed.error;

    const restored = new GameStageCompositionRoot({ campaignStorage: storage }).createMacroCampaign({
      runId: 'run.scene-authored-restore',
      runSeed: 'seed.scene-authored-restore',
    });
    if (!restored.ok) throw restored.error;
    jest.spyOn(GameStageCompositionRoot.prototype, 'createMacroCampaign').mockReturnValue(restored);

    const { scene, state } = sceneShell();
    scene.init({
      macroCampaign: true,
      macroRunId: 'run.scene-authored-restore',
      macroRunSeed: 'seed.scene-authored-restore',
    } as any);

    expect(state.macroStageSource).toBe('campaign');
    expect(state.currentLevel.id).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(state.allLevels.map((level: { id: string }) => level.id))
      .toContain(IGAPO_DAS_MEMORIAS_STAGE_ID);
  });

  it('renders authored dark water with the existing collidable water tile', () => {
    const loaded = new GameStageCompositionRoot().loader.load({
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      runId: 'run.scene-water',
      runSeed: 'seed.scene-water',
    });
    if (!loaded.ok) throw loaded.error;
    const { state } = sceneShell();
    const visual = () => ({
      x: 0,
      y: 0,
      setTint: jest.fn().mockReturnThis(),
      clearTint: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setRotation: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
      refreshBody: jest.fn().mockReturnThis(),
    });
    state.textures = {
      exists: jest.fn(() => true),
      getFrame: jest.fn(() => ({})),
    };
    state.anims = { exists: jest.fn(() => true) };
    state.add = {
      image: jest.fn(() => visual()),
      rectangle: jest.fn(() => visual()),
      circle: jest.fn(() => visual()),
      ellipse: jest.fn(() => visual()),
    };
    state.tweens = { add: jest.fn(() => ({ stop: jest.fn(), remove: jest.fn() })) };
    state.cameras = { main: { width: 1280, height: 720 } };
    state.wallTiles = { create: jest.fn(() => visual()) };
    state.macroLoadedStage = loaded.value;
    state.campaignRouter = {};

    state.buildMapFromDefinition(loaded.value.level);

    const waterCount = loaded.value.level.tileMap.flat().filter(tile => tile === 3).length;
    const water = loaded.value.presentation?.tiles.water;
    expect(water).toBeDefined();
    const waterVisuals = new Set([water, ...(water?.variants ?? [])].map(visual =>
      `${visual?.textureKey}#${visual?.frame}`));
    expect(state.wallTiles.create.mock.calls.filter((call: unknown[]) =>
      waterVisuals.has(`${call[2]}#${call[3]}`))).toHaveLength(waterCount);
  });
});
