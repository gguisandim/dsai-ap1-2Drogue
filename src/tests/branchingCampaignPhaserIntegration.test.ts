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

import { GameStageCompositionRoot } from '../application/stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { GameScene } from '../scenes/GameScene';

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
    progression: { recordStageCompleted: jest.fn(() => ({ currencyAwarded: 19 })) },
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
  state.showChapterTitle = jest.fn();
}

describe('GameScene branching campaign pilot', () => {
  it('keeps branchingCampaign off by default and does not create a router', () => {
    const { scene, state } = sceneShell();
    scene.init();
    expect(state.branchingCampaign).toBe(false);
    expect(state.branchingStageSource).toBe('legacy');
    expect(state.campaignRouter).toBeUndefined();
    expect(state.currentLevel).toBe(VERSE_SECTIONS[0]);
  });

  it('activates the real pilot only when requested and uses inspect physical ids', () => {
    const { scene, state } = sceneShell();
    scene.init({
      branchingCampaign: true,
      branchingRunId: 'pilot.scene-run',
      branchingRunSeed: 'scene-seed',
    } as any);
    state.queueCampaignExitTiles();

    expect(state.branchingStageSource).toBe('campaign');
    expect(state.campaignRouter).toBeDefined();
    expect(state.campaignNavigation.snapshot.destinations).toHaveLength(2);
    expect(state.pendingExitTiles.map((exit: any) => exit.physicalExitId)).toEqual(
      state.campaignNavigation.snapshot.destinations.map((exit: any) => exit.physicalExitId),
    );
  });

  it('prepares and confirms the selected physical exit, then rebuilds the target legacy stage', () => {
    const { scene, state } = sceneShell();
    scene.init({
      branchingCampaign: true,
      branchingRunId: 'pilot.scene-transition',
      branchingRunSeed: 'scene-seed',
    } as any);
    prepareTransitionScene(state);
    const beforeNode = state.campaignRouter.state().currentNodeId;
    const selected = state.campaignNavigation.snapshot.destinations[1];

    state.handleCampaignExitProximity(selected.physicalExitId, true, false);
    expect(state.campaignRouter.state().currentNodeId).toBe(beforeNode);
    expect(state.objectiveText.setText).toHaveBeenCalledWith('PRESSIONE E PARA ATRAVESSAR');
    state.handleCampaignExitProximity(selected.physicalExitId, false, true);
    expect(state.campaignRouter.state().currentNodeId).toBe(beforeNode);
    state.handleCampaignExitProximity(selected.physicalExitId, true, true);

    expect(state.campaignRouter.state().currentNodeId).toBe(selected.targetNodeId);
    expect(state.campaignRouter.state().currentNodeId).not.toBe(beforeNode);
    expect(state.currentLevel.id).toBe(selected.targetStageId);
    expect(state.progression.recordStageCompleted).toHaveBeenCalledTimes(1);
    expect(state.player.addHalos).toHaveBeenCalledWith(19);
    expect(state.buildMapFromDefinition).toHaveBeenCalledWith(state.currentLevel);
    expect(state.isTransitioning).toBe(false);
  });

  it('keeps the current map and reward untouched when confirmation rolls back', () => {
    const { scene, state } = sceneShell();
    scene.init();
    prepareTransitionScene(state);
    const current = state.currentLevel;
    state.campaignRouter = {
      prepare: jest.fn(() => ({ ok: true, value: { preparationId: 'prepare.test' } })),
      confirm: jest.fn(() => ({
        ok: false,
        error: { code: 'persistence-failed', recovery: 'rolled-back' },
      })),
    };

    state.navigateCampaignExit('physical.test');

    expect(state.currentLevel).toBe(current);
    expect(state.progression.recordStageCompleted).not.toHaveBeenCalled();
    expect(state.buildMapFromDefinition).not.toHaveBeenCalled();
    expect(state.isTransitioning).toBe(false);
  });

  it('falls back to the exact legacy flow when pilot creation fails', () => {
    const create = jest.spyOn(GameStageCompositionRoot.prototype, 'createBranchingCampaign')
      .mockReturnValue({
        ok: false,
        error: {
          code: 'run-persistence-failed',
          error: { code: 'storage-read-failed', message: 'offline', diagnostics: [], recovery: 'storage-state-unknown' },
        },
      });
    const { scene, state } = sceneShell();
    scene.init({ branchingCampaign: true } as any);

    expect(state.branchingStageSource).toBe('rollback');
    expect(state.campaignRouter).toBeUndefined();
    expect(state.currentLevel).toBe(VERSE_SECTIONS[0]);
    expect(state.allLevels).toBe(VERSE_SECTIONS);
    create.mockRestore();
  });

  it('preserves branching identity when death restarts the confirmed node', () => {
    const { scene, state } = sceneShell();
    scene.init({
      branchingCampaign: true,
      branchingRunId: 'pilot.restart-run',
      branchingRunSeed: 731,
    } as any);
    const player = {
      hp: 5, halos: 4321,
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
      branchingCampaign: true,
      branchingRunId: 'pilot.restart-run',
      branchingRunSeed: 731,
      halos: 4321,
    }));
  });
});
