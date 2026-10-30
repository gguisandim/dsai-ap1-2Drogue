let mockDialogueHooks: { onOpen: () => void; onClose: () => void } | undefined;

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
    Input: {
      Keyboard: {
        JustDown: jest.fn(() => false),
        KeyCodes: { B: 66, ESC: 27, E: 69, UP: 38, DOWN: 40 },
      },
    },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));

jest.mock('../ui/DialogueOverlay', () => ({
  DialogueOverlay: class {
    public constructor(
      _scene: unknown,
      _narrative: unknown,
      _speakerName: unknown,
      hooks: { onOpen: () => void; onClose: () => void },
    ) {
      mockDialogueHooks = hooks;
    }

    public destroy(): void {}
  },
}));

import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

type SceneState = Record<string, any>;

function sceneShell(): { scene: GameScene; state: SceneState } {
  const scene = Object.create(GameScene.prototype) as GameScene;
  return { scene, state: scene as unknown as SceneState };
}

describe('GameScene dialogue modal integration', () => {
  beforeEach(() => {
    mockDialogueHooks = undefined;
    (Phaser.Input.Keyboard.JustDown as jest.Mock).mockReset().mockReturnValue(false);
  });

  it('pauses and resumes physics, simulation and combat input through overlay hooks', () => {
    const { scene, state } = sceneShell();
    const session = {};
    Object.assign(state, {
      modularLoadedStage: {
        manifest: { id: 'stage.test.dialogue', chapterId: 'chapter.test.dialogue' },
        npcs: [],
      },
      modularComposition: {
        createNarrativeSession: jest.fn(() => ({ ok: true, session })),
      },
      progression: {
        snapshot: jest.fn(() => ({ level: 1, unlockedContent: [] })),
      },
      modularRunId: 'run.test.dialogue',
      modularRunSeed: 'seed.test.dialogue',
      player: { combatInputEnabled: true, setVelocity: jest.fn() },
      physics: { world: { pause: jest.fn(), resume: jest.fn() } },
      simulationBridge: { setPaused: jest.fn() },
      dialogueOpen: false,
    });

    state.initializeModularNarrative();
    expect(mockDialogueHooks).toBeDefined();
    mockDialogueHooks!.onOpen();
    expect(state.dialogueOpen).toBe(true);
    expect(state.player.setVelocity).toHaveBeenCalledWith(0, 0);
    expect(state.player.combatInputEnabled).toBe(false);
    expect(state.physics.world.pause).toHaveBeenCalledTimes(1);
    expect(state.simulationBridge.setPaused).toHaveBeenCalledWith(true);

    mockDialogueHooks!.onClose();
    expect(state.dialogueOpen).toBe(false);
    expect(state.player.combatInputEnabled).toBe(true);
    expect(state.physics.world.resume).toHaveBeenCalledTimes(1);
    expect(state.simulationBridge.setPaused).toHaveBeenLastCalledWith(false);
  });

  it('gives an open dialogue exclusive ownership of E for the frame', () => {
    const { scene, state } = sceneShell();
    const confirm = jest.fn();
    const updateWorldInteraction = jest.fn();
    Object.assign(state, {
      arrowChargeBar: { setVisible: jest.fn() },
      comboManager: { update: jest.fn() },
      playerDamageCooldown: 0,
      dialogueOverlay: { isOpen: () => true, confirm },
      interactionPromptText: { setVisible: jest.fn() },
      keyInteract: {},
      updateWorldInteraction,
      simulationBridge: { advance: jest.fn() },
    });
    (Phaser.Input.Keyboard.JustDown as jest.Mock).mockReturnValue(true);

    scene.update(0, 16);

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(updateWorldInteraction).not.toHaveBeenCalled();
    expect(state.simulationBridge.advance).not.toHaveBeenCalled();
  });
});
