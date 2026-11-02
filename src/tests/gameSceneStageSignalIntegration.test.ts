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
    Input: { Keyboard: { JustDown: () => false, KeyCodes: { B: 66, ESC: 27, E: 69, UP: 38, DOWN: 40 } } },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

import { GameScene } from '../scenes/GameScene';

type SceneState = Record<string, any>;

function sceneShell(): { scene: GameScene; state: SceneState } {
  const scene = Object.create(GameScene.prototype) as GameScene;
  return { scene, state: scene as unknown as SceneState };
}

describe('GameScene confirmed gameplay signal producers', () => {
  it('forwards a confirmed common or boss defeat after preserving legacy progression', () => {
    const { state } = sceneShell();
    const dispatch = jest.fn(() => ({ ok: true }));
    const addHalos = jest.fn();
    Object.assign(state, {
      progression: {
        recordEnemyDefeat: jest.fn(() => ({ currencyAwarded: 11, levelsGained: 0 })),
      },
      player: { addHalos },
      stageSignalAdapter: { dispatch },
    });

    state.handleEnemyDefeated({
      role: 'boss', enemyType: 'fortitudo', maximumHealth: 900, difficulty: 5,
      enemyId: 'node.test.visit.1.wave.2.enemy.0', archetype: 'boss',
    });

    expect(state.progression.recordEnemyDefeat).toHaveBeenCalledTimes(1);
    expect(addHalos).toHaveBeenCalledWith(11);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'enemy.defeated',
      occurrenceId: 'node.test.visit.1.wave.2.enemy.0',
      enemyId: 'node.test.visit.1.wave.2.enemy.0',
      archetype: 'boss',
    });
  });

  it('forwards a collection only after legacy effects and ignores a repeated collision', () => {
    const { state } = sceneShell();
    const order: string[] = [];
    const dispatch = jest.fn(() => { order.push('narrative'); return { ok: true }; });
    const item: SceneState = {
      active: true,
      itemType: 'item_halo',
      x: 64,
      y: 96,
      getData: jest.fn(() => 'node.test.visit.1.item.authored.0'),
      destroy: jest.fn(() => { order.push('destroy'); item.active = false; }),
    };
    Object.assign(state, {
      simulationBridge: { recordItem: jest.fn(() => order.push('simulation')) },
      progression: { recordItemCollected: jest.fn(() => order.push('progression')) },
      player: { addHalos: jest.fn(() => order.push('inventory')) },
      stageSignalAdapter: { dispatch },
    });

    state.collectItem(item);
    state.collectItem(item);

    expect(order).toEqual(['simulation', 'progression', 'inventory', 'destroy', 'narrative']);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'item.collected',
      occurrenceId: 'node.test.visit.1.item.authored.0',
      itemId: 'node.test.visit.1.item.authored.0',
      itemType: 'item_halo',
    });
  });

  it('uses the durable revisit count when identifying encounter completion', () => {
    const { state } = sceneShell();
    const dispatch = jest.fn(() => ({ ok: true }));
    Object.assign(state, {
      campaignRouter: {
        state: () => ({ currentNodeId: 'node.test', revisitCounts: { 'node.test': 3 } }),
      },
      stageSignalAdapter: { dispatch },
    });

    state.notifyEncounterCompleted('wave.1', 'wave.0.completed');

    expect(dispatch).toHaveBeenCalledWith({
      type: 'encounter.completed',
      occurrenceId: 'node.test.visit.3.wave.0.completed',
      encounterId: 'wave.1',
    });
  });

  const destination = {
    physicalExitId: 'physical.test.return',
    stageExitId: 'exit.test.return',
  };

  it('requests the narrative exit before preparing the physical transition', () => {
    const { state } = sceneShell();
    const order: string[] = [];
    const dispatch = jest.fn(() => { order.push('narrative'); return { ok: true }; });
    const prepare = jest.fn(() => {
      order.push('prepare');
      return { ok: true, value: { preparationId: 'prepare.transition.test' } };
    });
    const confirm = jest.fn(() => {
      order.push('confirm');
      return { ok: false, error: { code: 'router-failed', recovery: 'unchanged' } };
    });
    Object.assign(state, {
      isTransitioning: false,
      campaignPersistenceUncertain: false,
      campaignNavigation: { snapshot: { destinations: [destination] } },
      campaignRouter: { state: () => ({ currentNodeId: 'node.test', revisitCounts: { 'node.test': 1 } }),
        prepare, confirm },
      levelBannerText: { setText: jest.fn(), setVisible: jest.fn() },
      stageSignalAdapter: { dispatch },
      showCampaignTransitionFailure: jest.fn(),
    });

    state.navigateCampaignExit('physical.test.return');

    expect(order).toEqual(['narrative', 'prepare', 'confirm']);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'stage.exit.requested',
      occurrenceId: 'node.test.visit.1.exit.exit.test.return',
      exitId: 'exit.test.return',
    });
    expect(prepare).toHaveBeenCalledWith('physical.test.return');
  });

  it('stops before preparing the physical transition when narrative persistence fails', () => {
    const { state } = sceneShell();
    const prepare = jest.fn();
    const confirm = jest.fn();
    const dispatch = jest.fn(() => ({
      ok: false,
      error: { code: 'storage-write-failed', message: 'denied', diagnostics: [] },
    }));
    const showCampaignTransitionFailure = jest.fn();
    Object.assign(state, {
      isTransitioning: false,
      campaignPersistenceUncertain: false,
      campaignNavigation: { snapshot: { destinations: [destination] } },
      currentLevel: { id: 'stage.test' },
      campaignRouter: { prepare, confirm },
      stageSignalAdapter: { dispatch },
      showCampaignTransitionFailure,
    });

    state.navigateCampaignExit('physical.test.return');

    expect(prepare).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(state.isTransitioning).toBe(false);
    expect(showCampaignTransitionFailure).toHaveBeenCalledWith(
      'PROGRESSO NARRATIVO NÃO SALVO: storage-write-failed',
    );
  });

  it('keeps the scene thin and stops before preparing when reward settlement remains pending', () => {
    const { state } = sceneShell();
    const prepare = jest.fn();
    const confirm = jest.fn();
    const showCampaignTransitionFailure = jest.fn();
    Object.assign(state, {
      isTransitioning: false,
      campaignPersistenceUncertain: false,
      campaignNavigation: { snapshot: { destinations: [destination] } },
      currentLevel: { id: 'stage.test' },
      campaignRouter: { prepare, confirm },
      stageSignalAdapter: { dispatch: jest.fn(() => ({ ok: true, persistence: 'saved' })) },
      narrativeRewardSettlement: { settlePending: jest.fn(() => ({
        ok: false,
        settlements: [],
        error: { code: 'progression-failed', message: 'denied' },
      })) },
      showCampaignTransitionFailure,
    });

    state.navigateCampaignExit('physical.test.return');

    expect(prepare).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(showCampaignTransitionFailure).toHaveBeenCalledWith(
      'RECOMPENSA NARRATIVA PENDENTE: progression-failed',
    );
  });

  it('shows the narrative mission as the primary objective and its unlock hint', () => {
    const { state } = sceneShell();
    Object.assign(state, {
      stageNarrativeStage: {
        missions: [{
          id: 'mission.test', title: 'Rastrear a água',
          description: 'Confirme a origem.', objectives: [{
            id: 'objective.test', description: 'Encontre o Vestígio.', target: 1,
          }],
        }],
      },
      modularNarrativeSession: {
        director: { snapshot: () => ({
          missionStates: { 'mission.test': { status: 'active', objectives: { 'objective.test': 0 } } },
        }) },
      },
    });

    expect(state.narrativeObjective()).toBe('MISSÃO: Rastrear a água — Encontre o Vestígio.');

    state.modularNarrativeSession.director.snapshot = () => ({
      missionStates: { 'mission.test': { status: 'completed', objectives: { 'objective.test': 1 } } },
    });
    expect(state.narrativeObjective()).toBe(
      'MISSÃO CONCLUÍDA: Rastrear a água — saída liberada. Pressione E no portal.',
    );
  });

  it('accepts a mission-unlocked portal as clear of the combat seal', () => {
    const { state } = sceneShell();
    const door = { getData: (key: string) => key === 'physicalExitId' ? 'physical.test' : undefined };
    Object.assign(state, {
      campaignNavigation: { snapshot: { destinations: [{
        physicalExitId: 'physical.test', stageExitId: 'exit.test.return',
      }] } },
      modularNarrativeSession: {
        director: { snapshot: () => ({ unlockedExitIds: ['exit.test.return'] }) },
      },
    });

    expect(state.isNarrativelyUnlockedExit(door)).toBe(true);

    state.modularNarrativeSession.director.snapshot = () => ({ unlockedExitIds: [] });
    expect(state.isNarrativelyUnlockedExit(door)).toBe(false);
  });

  it('reports a missing physical exit without touching the narrative or router', () => {
    const { state } = sceneShell();
    const prepare = jest.fn();
    const dispatch = jest.fn();
    const showCampaignTransitionFailure = jest.fn();
    Object.assign(state, {
      isTransitioning: false,
      campaignPersistenceUncertain: false,
      campaignNavigation: { snapshot: { destinations: [] } },
      currentLevel: { id: 'stage.test' },
      campaignRouter: { prepare },
      stageSignalAdapter: { dispatch },
      showCampaignTransitionFailure,
    });

    state.navigateCampaignExit('physical.missing');

    expect(dispatch).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
    expect(showCampaignTransitionFailure).toHaveBeenCalledWith('SAÍDA INDISPONÍVEL: exit-not-found');
  });
});
