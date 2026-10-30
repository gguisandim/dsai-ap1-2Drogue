import type { LevelDefinition } from '../../data/LevelData';
import {
  CampaignExitBinder,
  CampaignGraphGenerator,
  PhysicalExitResolver,
  StageRegistry,
  type CampaignGraph,
  type ChapterManifest,
  type RegionTemplate,
  type StageLoadRequest,
  type StageLoadResult,
  type StageModule,
} from '../../stages';
import {
  CampaignRouter,
  CampaignRunSaveService,
  GameStageCompositionRoot,
  createBrowserCampaignSaveStorage,
  createCampaignRunState,
  type GameNarrativeSession,
} from '../../application/stages';
import { LocalProgressionStorage, ProgressionService } from '../../progression';
import type { GameSceneCampaignRuntime } from '../../scenes/GameScene';

export const NARRATIVE_CYCLE_CAMPAIGN_ID = 'dev.narrative-cycle';
export const NARRATIVE_CYCLE_RUN_ID = 'dev.narrative-cycle.run';
export const NARRATIVE_CYCLE_SEED = 'dev.narrative-cycle.seed';
export const NARRATIVE_CYCLE_CHAPTER_ID = 'chapter.dev.narrative-cycle';
export const NARRATIVE_CYCLE_STAGE_ID = 'stage.dev.narrative-cycle.trial';
export const NARRATIVE_CYCLE_DESTINATION_ID = 'stage.dev.narrative-cycle.destination';
export const NARRATIVE_CYCLE_NPC_ID = 'npc.dev.narrative-cycle.keeper';
export const NARRATIVE_CYCLE_DIALOGUE_ID = 'dialogue.dev.narrative-cycle.keeper';
export const NARRATIVE_CYCLE_MISSION_ID = 'mission.dev.narrative-cycle.proof';
export const NARRATIVE_CYCLE_EXIT_ID = 'exit.dev.narrative-cycle.destination';
export const NARRATIVE_CYCLE_REWARD_UNLOCK = 'unlock.dev.narrative-cycle.verified';
export const NARRATIVE_CYCLE_RUN_STORAGE_KEY = 'umbra-trail-dev-narrative-cycle-run-v1';
export const NARRATIVE_CYCLE_PROGRESSION_STORAGE_KEY =
  'umbra-trail-dev-narrative-cycle-progression-v1';

export const NARRATIVE_CYCLE_FLAGS = Object.freeze({
  accepted: 'flag.dev.narrative-cycle.accepted',
  deferred: 'flag.dev.narrative-cycle.deferred',
  completed: 'flag.dev.narrative-cycle.completed',
});

const TRIAL_EXIT = Object.freeze({ x: 16, y: 5 });

function room(
  width: number,
  height: number,
  spawn: { readonly x: number; readonly y: number },
  exit?: { readonly x: number; readonly y: number },
): number[][] {
  const map: number[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? 1 : 0));
  map[spawn.y][spawn.x] = 8;
  if (exit) map[exit.y][exit.x] = 5;
  return map;
}

const TRIAL_LEVEL: LevelDefinition = {
  id: NARRATIVE_CYCLE_STAGE_ID,
  name: 'Laboratório do Ciclo Narrativo',
  description: 'Câmara isolada para homologar narrativa, combate, coleta e transição.',
  theme: 'witches_crypt' as const,
  music: 'ost_vestibule',
  ambientColor: 0x173b35,
  fogColor: 0x071b1d,
  fogDensity: 0.22,
  lightIntensity: 0.68,
  tileMap: room(19, 11, { x: 2, y: 5 }, TRIAL_EXIT),
  enemies: [{ type: 'affinity', x: 9, y: 4, level: 1 }],
  items: [{ type: 'key', x: 12, y: 6, quantity: 1 }],
  decorations: [{ type: 'narrative_cycle_marker', x: 3, y: 5, tint: 0x8fe0c8 }],
  waves: [],
  parTime: 90,
  difficulty: 1,
};

const DESTINATION_LEVEL: LevelDefinition = {
  id: NARRATIVE_CYCLE_DESTINATION_ID,
  name: 'Destino Confirmado',
  description: 'A segunda câmara confirma o destino canônico da travessia.',
  theme: 'gothic_cathedral' as const,
  music: 'none',
  ambientColor: 0x273047,
  fogColor: 0x101522,
  fogDensity: 0.15,
  lightIntensity: 0.75,
  tileMap: room(15, 9, { x: 2, y: 4 }, { x: 12, y: 4 }),
  enemies: [],
  items: [],
  decorations: [],
  waves: [],
  parTime: 30,
  difficulty: 1,
};

export const NARRATIVE_CYCLE_TRIAL_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: NARRATIVE_CYCLE_STAGE_ID,
    revision: 1,
    chapterId: NARRATIVE_CYCLE_CHAPTER_ID,
    order: 0,
    title: 'Laboratório do Ciclo Narrativo',
    summary: 'Prova isolada do ciclo diálogo, objetivos, recompensa e saída.',
    layout: Object.freeze({ kind: 'authored' as const }),
    completionMissionId: NARRATIVE_CYCLE_MISSION_ID,
    exits: Object.freeze([Object.freeze({
      id: NARRATIVE_CYCLE_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...TRIAL_EXIT }),
      targetStageId: NARRATIVE_CYCLE_DESTINATION_ID,
      condition: Object.freeze({
        type: 'mission.status' as const,
        missionId: NARRATIVE_CYCLE_MISSION_ID,
        status: 'completed' as const,
      }),
    })]),
    tags: Object.freeze(['development', 'narrative-cycle', 'isolated']),
  }),
  authoredLevel: TRIAL_LEVEL,
  narrative: Object.freeze({
    flags: Object.freeze({
      [NARRATIVE_CYCLE_FLAGS.accepted]: false,
      [NARRATIVE_CYCLE_FLAGS.deferred]: false,
      [NARRATIVE_CYCLE_FLAGS.completed]: false,
    }),
  }),
  npcs: Object.freeze([Object.freeze({
    id: NARRATIVE_CYCLE_NPC_ID,
    displayName: 'Guardiã da Prova',
    role: 'quest' as const,
    presentationId: 'environment.narrative-cycle-keeper',
    spawn: Object.freeze({ kind: 'tile' as const, x: 3, y: 5 }),
    interactionDialogueId: NARRATIVE_CYCLE_DIALOGUE_ID,
  })]),
  dialogues: Object.freeze([Object.freeze({
    id: NARRATIVE_CYCLE_DIALOGUE_ID,
    startNodeId: 'offer',
    nodes: Object.freeze([
      Object.freeze({
        id: 'offer',
        speakerId: NARRATIVE_CYCLE_NPC_ID,
        text: 'A prova exige ação e memória. Você aceita registrar seus dois vestígios?',
        choices: Object.freeze([
          Object.freeze({
            id: 'accept',
            text: 'Aceitar a prova',
            nextNodeId: 'accepted',
            commands: Object.freeze([
              Object.freeze({
                type: 'flag.set' as const,
                flag: NARRATIVE_CYCLE_FLAGS.accepted,
                value: true,
              }),
              Object.freeze({
                type: 'mission.start' as const,
                missionId: NARRATIVE_CYCLE_MISSION_ID,
              }),
            ]),
          }),
          Object.freeze({
            id: 'defer',
            text: 'Observar antes de aceitar',
            nextNodeId: 'deferred',
            commands: Object.freeze([Object.freeze({
              type: 'flag.set' as const,
              flag: NARRATIVE_CYCLE_FLAGS.deferred,
              value: true,
            })]),
          }),
        ]),
      }),
      Object.freeze({
        id: 'accepted',
        speakerId: 'narrator' as const,
        text: 'Derrote o guardião e recolha a chave. A saída responderá aos dois registros.',
      }),
      Object.freeze({
        id: 'deferred',
        speakerId: 'player' as const,
        text: 'Primeiro observo. A decisão ficará registrada, mas ainda posso voltar.',
      }),
    ]),
  })]),
  missions: Object.freeze([Object.freeze({
    id: NARRATIVE_CYCLE_MISSION_ID,
    title: 'Prova dos Dois Vestígios',
    description: 'Confirmar um vestígio de combate e outro de coleta.',
    scope: 'stage' as const,
    start: 'dialogue' as const,
    objectives: Object.freeze([
      Object.freeze({
        id: 'combat',
        description: 'Derrotar o guardião de afinidade',
        signal: 'enemy.defeated' as const,
        target: 1,
        filter: Object.freeze({ field: 'archetype' as const, equals: 'affinity' }),
      }),
      Object.freeze({
        id: 'collection',
        description: 'Coletar a chave da prova',
        signal: 'item.collected' as const,
        target: 1,
        filter: Object.freeze({ field: 'itemType' as const, equals: 'item_key' }),
      }),
    ]),
    rewards: Object.freeze([
      Object.freeze({ type: 'progression.currency' as const, amount: 37 }),
      Object.freeze({
        type: 'progression.unlock' as const,
        contentId: NARRATIVE_CYCLE_REWARD_UNLOCK,
      }),
    ]),
  })]),
  events: Object.freeze([Object.freeze({
    id: 'event.dev.narrative-cycle.completed',
    once: true,
    when: 'mission.completed' as const,
    filter: Object.freeze({
      field: 'missionId' as const,
      equals: NARRATIVE_CYCLE_MISSION_ID,
    }),
    commands: Object.freeze([
      Object.freeze({
        type: 'flag.set' as const,
        flag: NARRATIVE_CYCLE_FLAGS.completed,
        value: true,
      }),
      Object.freeze({ type: 'stage.complete' as const, exitId: NARRATIVE_CYCLE_EXIT_ID }),
    ]),
  })]),
});

export const NARRATIVE_CYCLE_DESTINATION_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: NARRATIVE_CYCLE_DESTINATION_ID,
    revision: 1,
    chapterId: NARRATIVE_CYCLE_CHAPTER_ID,
    order: 1,
    title: 'Destino Confirmado',
    summary: 'Destino canônico do cenário integrado.',
    layout: Object.freeze({ kind: 'authored' as const }),
    exits: Object.freeze([Object.freeze({
      id: 'exit.dev.narrative-cycle.complete',
      anchor: Object.freeze({ kind: 'map-exit' as const }),
      targetStageId: 'campaign.complete' as const,
    })]),
    tags: Object.freeze(['development', 'narrative-cycle', 'isolated']),
  }),
  authoredLevel: DESTINATION_LEVEL,
});

export const NARRATIVE_CYCLE_CHAPTER: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: NARRATIVE_CYCLE_CHAPTER_ID,
  revision: 1,
  title: 'Laboratório do Ciclo Narrativo',
  stageIds: Object.freeze([NARRATIVE_CYCLE_STAGE_ID, NARRATIVE_CYCLE_DESTINATION_ID]),
  entryStageId: NARRATIVE_CYCLE_STAGE_ID,
  tags: Object.freeze(['development', 'isolated']),
});

const TEMPLATES: readonly RegionTemplate[] = Object.freeze(
  Array.from({ length: 9 }, (_, index) => Object.freeze({
    id: `dev.narrative-cycle.region-${index + 1}`,
    revision: 1,
    stageId: index === 0 ? NARRATIVE_CYCLE_STAGE_ID : NARRATIVE_CYCLE_DESTINATION_ID,
    allowedActIds: Object.freeze(['act-1', 'act-2', 'act-3']),
    allowedBiomeIds: ['crypt'] as const,
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    weight: 1,
    maximumPhysicalExits: 2 as const,
    tags: Object.freeze(['development']),
    providesBeatIds: Object.freeze(['beat.act-1', 'beat.act-2', 'beat.act-3']),
    revisit: 'repeatable' as const,
  })),
);

function scenarioGraph(): CampaignGraph {
  const generated = new CampaignGraphGenerator().generate({
    campaignId: NARRATIVE_CYCLE_CAMPAIGN_ID,
    campaignRevision: 1,
    catalogRevision: 1,
    runId: NARRATIVE_CYCLE_RUN_ID,
    runSeed: NARRATIVE_CYCLE_SEED,
    templates: TEMPLATES,
    context: Object.freeze({ flags: {}, completedEventIds: [], revealedBeatIds: [] }),
  });
  if (!generated.ok) throw new Error(`Narrative-cycle graph failed: ${generated.error.code}`);
  const entry = generated.value.entryNodeId;
  const authoredEntryEdgeId = generated.value.edges
    .filter(edge => edge.sourceNodeId === entry)
    .map(edge => edge.id)
    .sort()[0];
  return Object.freeze({
    ...generated.value,
    nodes: Object.freeze(generated.value.nodes.map(node => Object.freeze({
      ...node,
      stageId: node.id === entry ? NARRATIVE_CYCLE_STAGE_ID : NARRATIVE_CYCLE_DESTINATION_ID,
    }))),
    edges: Object.freeze(generated.value.edges.map(edge => Object.freeze({
      ...edge,
      ...(edge.id === authoredEntryEdgeId ? {
        condition: Object.freeze({
          type: 'mission.status' as const,
          missionId: NARRATIVE_CYCLE_MISSION_ID,
          status: 'completed' as const,
        }),
      } : edge.sourceNodeId === entry ? {
        // The generated graph may expose a second branch at depth zero. It is
        // deliberately kept unavailable so the lab has one canonical exit.
        condition: Object.freeze({
          type: 'flag.equals' as const,
          flag: 'flag.dev.narrative-cycle.unused-branch',
          value: true,
        }),
      } : {}),
    }))),
  });
}

/** The graph owns post-proof routing; the manifest exit exists for standalone validation. */
class NarrativeCycleGraphLoader {
  public constructor(private readonly delegate: GameStageCompositionRoot['loader']) {}

  public load(request: StageLoadRequest): StageLoadResult {
    const loaded = this.delegate.load(request);
    if (!loaded.ok || request.stageId !== NARRATIVE_CYCLE_DESTINATION_ID) return loaded;
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        ...loaded.value,
        manifest: Object.freeze({ ...loaded.value.manifest, exits: Object.freeze([]) }),
      }),
    });
  }
}

export interface NarrativeCycleDiagnostics {
  readonly runId: string;
  readonly stageId: string;
  readonly nodeId: string;
  readonly visit: number;
  readonly flags: Readonly<Record<string, boolean | number | string>>;
  readonly missions: Readonly<Record<string, unknown>>;
  readonly pendingOperationIds: readonly string[];
  readonly confirmedRewardOperationIds: readonly string[];
  readonly completions: readonly unknown[];
  readonly destinations: readonly unknown[];
}

export interface NarrativeCycleScenario {
  readonly runtime: GameSceneCampaignRuntime;
  inspect(): NarrativeCycleDiagnostics;
}

export function createNarrativeCycleScenario(): NarrativeCycleScenario {
  const storage = createBrowserCampaignSaveStorage();
  const registry = new StageRegistry();
  registry.registerChapter(NARRATIVE_CYCLE_CHAPTER, [
    NARRATIVE_CYCLE_TRIAL_STAGE,
    NARRATIVE_CYCLE_DESTINATION_STAGE,
  ]);
  const diagnostics = registry.validate();
  if (diagnostics.some(item => item.severity === 'error')) {
    throw new Error(`Narrative-cycle content is invalid: ${diagnostics[0]?.code}`);
  }
  const composition = new GameStageCompositionRoot({ registry, campaignStorage: storage });
  const graph = scenarioGraph();
  const saves = storage
    ? new CampaignRunSaveService({ storage, storageKey: NARRATIVE_CYCLE_RUN_STORAGE_KEY })
    : undefined;
  let state = createCampaignRunState(graph);
  if (saves) {
    const loaded = saves.load({
      campaignId: graph.campaignId,
      campaignRevision: graph.campaignRevision,
      runId: graph.runId,
      runSeed: graph.runSeed,
      graphId: graph.id,
    });
    if (!loaded.ok) throw new Error(`Narrative-cycle run restore failed: ${loaded.error.code}`);
    if (loaded.value.status === 'loaded') state = loaded.value.envelope.state;
  }
  const router = new CampaignRouter(state, {
    loader: new NarrativeCycleGraphLoader(composition.loader),
    resolver: new PhysicalExitResolver(),
    binder: new CampaignExitBinder(),
    ...(saves ? { saves } : {}),
  });
  const navigation = router.inspect();
  if (!navigation.ok) throw new Error(`Narrative-cycle navigation failed: ${navigation.error.code}`);
  if (saves) {
    const loaded = saves.load();
    if (loaded.ok && loaded.value.status === 'empty') {
      const created = saves.save(state);
      if (!created.ok) throw new Error(`Narrative-cycle initial save failed: ${created.error.code}`);
    }
  }
  const progression = new ProgressionService({
    storage: new LocalProgressionStorage(NARRATIVE_CYCLE_PROGRESSION_STORAGE_KEY),
  });
  let session: GameNarrativeSession | undefined;
  const runtime: GameSceneCampaignRuntime = Object.freeze({
    campaignId: NARRATIVE_CYCLE_CAMPAIGN_ID,
    runId: NARRATIVE_CYCLE_RUN_ID,
    runSeed: NARRATIVE_CYCLE_SEED,
    composition,
    router,
    navigation: navigation.value,
    progression,
    onNarrativeSession: (value: GameNarrativeSession) => { session = value; },
  });
  return Object.freeze({
    runtime,
    inspect: (): NarrativeCycleDiagnostics => {
      const run = router.state();
      const current = run.graph.nodes.find(node => node.id === run.currentNodeId);
      const narrative = session?.director.snapshot();
      const inspected = router.inspect();
      const progressionSnapshot = progression.snapshot();
      return Object.freeze({
        runId: run.graph.runId,
        stageId: current?.stageId ?? 'unknown',
        nodeId: run.currentNodeId,
        visit: run.revisitCounts[run.currentNodeId] ?? 0,
        flags: narrative?.flags ?? {},
        missions: narrative?.missionStates ?? {},
        pendingOperationIds: Object.freeze((narrative?.pendingOperations ?? [])
          .map(operation => operation.operationId)),
        confirmedRewardOperationIds: Object.freeze([...progressionSnapshot.operationLedger.applied]),
        completions: Object.freeze([...(session?.stageCompletions() ?? [])]),
        destinations: Object.freeze(inspected.ok ? [...inspected.value.snapshot.destinations] : []),
      });
    },
  });
}
