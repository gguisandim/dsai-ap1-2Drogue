import { SoundManager } from '../managers/SoundManager';
import { StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import {
  AGUAS_CHAPTER_MANIFEST,
  IGAPO_AUDIO_PROFILE_ID,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_ENVIRONMENT_ID,
  StageLoader,
  StageRegistry,
  StageVisualRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import type { ResolvedStageAudioProfile } from '../stages';

class FakeParam {
  public values: number[] = [];
  public setValueAtTime(value: number): void { this.values.push(value); }
  public exponentialRampToValueAtTime(value: number): void { this.values.push(value); }
  public cancelScheduledValues(): void {}
}

class FakeOscillator {
  public type = 'sine';
  public frequency = new FakeParam();
  public started = 0;
  public stopped = 0;
  public connect(): void {}
  public disconnect(): void {}
  public start(): void { this.started += 1; }
  public stop(): void { this.stopped += 1; }
}

class FakeGain {
  public gain = new FakeParam();
  public connect(): void {}
  public disconnect(): void {}
}

class FakeAudioContext {
  public state: 'running' | 'suspended' = 'running';
  public currentTime = 10;
  public destination = {};
  public oscillators: FakeOscillator[] = [];
  public gains: FakeGain[] = [];
  public resumeFailure = false;
  public createOscillator(): OscillatorNode {
    const value = new FakeOscillator();
    this.oscillators.push(value);
    return value as unknown as OscillatorNode;
  }
  public createGain(): GainNode {
    const value = new FakeGain();
    this.gains.push(value);
    return value as unknown as GainNode;
  }
  public async resume(): Promise<void> {
    if (this.resumeFailure) throw new Error('autoplay blocked');
    this.state = 'running';
  }
  public reset(): void {
    this.state = 'running';
    this.resumeFailure = false;
    this.oscillators = [];
    this.gains = [];
  }
}

function loadIgapo() {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  const result = new StageLoader(registry).load({
    stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    runId: 'run.ambient-presentation',
    runSeed: 'seed.ambient-presentation',
  });
  if (!result.ok || !result.value.presentation) throw new Error('Igapó ambient presentation did not load.');
  return result.value as typeof result.value & { presentation: NonNullable<typeof result.value.presentation> };
}

describe('stage audio and environment presentation', () => {
  const context = new FakeAudioContext();
  const listeners = new Map<string, () => void>();
  const previousWindow = (globalThis as any).window;

  beforeAll(() => {
    (globalThis as any).window = {
      AudioContext: function AudioContext() { return context; },
      addEventListener: jest.fn((event: string, handler: () => void) => listeners.set(event, handler)),
      removeEventListener: jest.fn((event: string) => listeners.delete(event)),
    };
  });

  beforeEach(() => {
    SoundManager.stopStageAudio();
    SoundManager.setEnabled(true);
    context.reset();
    listeners.clear();
  });

  afterAll(() => {
    SoundManager.stopStageAudio();
    (globalThis as any).window = previousWindow;
  });

  it('resolves music, ambient/event sounds, light and fog from chapter data', () => {
    const presentation = loadIgapo().presentation;
    expect(presentation.audio).toMatchObject({
      id: IGAPO_AUDIO_PROFILE_ID,
      music: { id: 'sound.aguas.memory-current', kind: 'synth' },
      ambient: { id: 'sound.aguas.flooded-canopy', kind: 'synth' },
      eventSounds: {
        'npc.interacted': { id: 'sound.aguas.echo-touched' },
        'enemy.defeated': { id: 'sound.aguas.memory-broken' },
      },
    });
    expect(presentation.environment).toEqual({
      id: IGAPO_ENVIRONMENT_ID,
      ambientColor: 0x153e39,
      lightIntensity: 0.62,
      fog: { color: 0x123d42, opacity: 0.16, depth: 4 },
    });
  });

  it('starts one profile, deduplicates a revisit and stops old loops on transition', async () => {
    const profile = loadIgapo().presentation.audio!;
    await expect(SoundManager.applyStageAudio(profile)).resolves.toBe('started');
    expect(SoundManager.stageAudioState()).toEqual({
      desiredProfileId: profile.id, activeProfileId: profile.id, loopCount: 2,
    });
    const firstLoops = [...context.oscillators];
    await expect(SoundManager.applyStageAudio(profile)).resolves.toBe('unchanged');
    expect(context.oscillators).toHaveLength(2);

    const next: ResolvedStageAudioProfile = { ...profile, id: 'audio-profile.fixture.next' };
    await expect(SoundManager.applyStageAudio(next)).resolves.toBe('started');
    expect(firstLoops.every(loop => loop.stopped === 1)).toBe(true);
    expect(SoundManager.stageAudioState()).toMatchObject({ activeProfileId: next.id, loopCount: 2 });
  });

  it('keeps autoplay-blocked audio pending without partial loops and retries after a gesture', async () => {
    const profile = loadIgapo().presentation.audio!;
    context.state = 'suspended';
    context.resumeFailure = true;
    await expect(SoundManager.applyStageAudio(profile)).resolves.toBe('blocked');
    expect(context.oscillators).toHaveLength(0);
    expect(SoundManager.stageAudioState()).toEqual({ desiredProfileId: profile.id, loopCount: 0 });
    expect(listeners.has('pointerdown')).toBe(true);

    context.resumeFailure = false;
    listeners.get('pointerdown')?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(SoundManager.stageAudioState()).toMatchObject({ activeProfileId: profile.id, loopCount: 2 });
  });

  it('plays declared event sounds and releases every loop on shutdown', async () => {
    const profile = loadIgapo().presentation.audio!;
    await SoundManager.applyStageAudio(profile);
    expect(SoundManager.playStageEvent('npc.interacted')).toBe(true);
    expect(context.oscillators).toHaveLength(3);
    expect(context.oscillators[2].stopped).toBe(1);
    SoundManager.stopStageAudio();
    expect(SoundManager.stageAudioState()).toEqual({ loopCount: 0 });
    expect(context.oscillators.slice(0, 2).every(loop => loop.stopped === 1)).toBe(true);
  });

  it('renders ambient light and fog below entities without adding collision bodies', () => {
    const loaded = loadIgapo();
    const rectangles: Array<{ depth?: number; alpha: number; color: number }> = [];
    const makeVisual = () => ({
      setTint() { return this; }, setAlpha() { return this; }, setDepth() { return this; },
      setScale() { return this; }, setRotation() { return this; }, refreshBody() { return this; },
    });
    const scene = {
      textures: { exists: () => true }, anims: { exists: () => true },
      cameras: { main: { width: 1280, height: 720 } },
      add: {
        image: jest.fn(makeVisual),
        rectangle: jest.fn((_x: number, _y: number, _w: number, _h: number, color: number, alpha: number) => {
          const rectangle = {
            color, alpha, depth: undefined as number | undefined,
            setScrollFactor() { return this; },
            setDepth(value: number) { this.depth = value; return this; },
          };
          rectangles.push(rectangle);
          return rectangle;
        }),
      },
    } as any;
    const collisionGroup = { create: jest.fn(makeVisual) } as any;
    const result = new StageMapRenderer().render(
      scene, loaded.level, loaded.presentation, collisionGroup, false,
    );
    expect(result.environmentObjects).toHaveLength(2);
    expect(rectangles).toEqual([
      expect.objectContaining({ color: 0x153e39, depth: 3 }),
      expect.objectContaining({ color: 0x123d42, alpha: 0.16, depth: 4 }),
    ]);
    expect(rectangles.every(rectangle => (rectangle.depth ?? 0) < 5)).toBe(true);
  });

  it('diagnoses unknown audio/environment resources and invalid referenced sounds', () => {
    const loaded = loadIgapo();
    const registry = new StageVisualRegistry();
    registry.registerChapter(AGUAS_CHAPTER_MANIFEST);
    const diagnostics = registry.validateManifest({
      ...loaded.manifest,
      presentation: {
        ...loaded.manifest.presentation!,
        audioProfileId: 'audio-profile.missing',
        environmentId: 'environment.missing',
      },
    }, loaded.npcs);
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.audio-profile.unknown', referenceId: 'audio-profile.missing' }),
      expect.objectContaining({ code: 'stage.visual.environment.unknown', referenceId: 'environment.missing' }),
    ]));

    const broken = new StageVisualRegistry();
    broken.registerChapter({
      ...AGUAS_CHAPTER_MANIFEST,
      id: 'chapter.audio.broken', stageIds: [], entryStageId: 'stage.audio.broken',
      visualResources: {
        textures: [], tilesets: [], themes: [], sounds: [],
        audioProfiles: [{
          id: 'audio-profile.broken', musicSoundId: 'sound.missing', masterVolume: 1,
        }],
      },
    });
    expect(broken.diagnostics()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'stage.visual.audio-profile.sound-missing', referenceId: 'sound.missing',
      }),
    ]));
  });
});
