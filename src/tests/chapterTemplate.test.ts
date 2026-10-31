import {
  CHAPTER_TEMPLATE,
  CHAPTER_TEMPLATE_ENTRY,
  CHAPTER_TEMPLATE_IDS,
  CHAPTER_TEMPLATE_STAGE_ID,
  createChapterTemplate,
  createChapterTemplateRegistry,
  registerChapterTemplate,
  TEMPLATE_EXIT_POSITION,
  TEMPLATE_NPC_POSITION,
} from '../examples/chapter-template';
import {
  CampaignGraphGenerator,
  CAMPAIGN_CHAPTER_CATALOG,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  StageValidator,
  type StageModule,
} from '../stages';
import {
  GameSessionService,
  GameStageCompositionRoot,
  StageSignalAdapter,
} from '../application/stages';
import {
  MemorySaveStorage,
  StageDirector,
  type NarrativeContent,
} from '../narrative';
import { WorldLabDataService } from '../devtools/world-lab';
import { WORLD_LAB_FIXTURE_CATALOG } from '../devtools/world-lab/fixtures/fixtureCatalog';

const IDS = CHAPTER_TEMPLATE_IDS;
const RUN_ID = `run.${IDS.namespace}.template`;
const RUN_SEED = `seed.${IDS.namespace}.template`;
const CAMPAIGN_ID = `campaign.${IDS.namespace}.template`;
const INSTANCE_ID = `node.${IDS.namespace}.template.1`;
const STORAGE_KEY = `test.${IDS.namespace}.narrative`;

function templateRegistry(): StageRegistry {
  return createChapterTemplateRegistry(CHAPTER_TEMPLATE_ENTRY);
}

function loaderFor(registry = templateRegistry()): StageLoader {
  return new StageLoader(registry);
}

function loadTemplate(stageId = CHAPTER_TEMPLATE_STAGE_ID) {
  const loaded = loaderFor().load({ stageId, runId: RUN_ID, runSeed: RUN_SEED });
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.error));
  return loaded.value;
}

function createSession(storage = new MemorySaveStorage()) {
  const registry = templateRegistry();
  const composition = new GameStageCompositionRoot({ registry, campaignStorage: storage });
  const loaded = composition.loader.load({
    stageId: CHAPTER_TEMPLATE_STAGE_ID,
    runId: RUN_ID,
    runSeed: RUN_SEED,
  });
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.error));
  const created = composition.createNarrativeSession(
    loaded.value,
    {
      campaignId: CAMPAIGN_ID,
      runId: RUN_ID,
      runSeed: RUN_SEED,
      stageInstanceId: INSTANCE_ID,
    },
    { level: 1, unlockedContent: [] },
    STORAGE_KEY,
  );
  if (!created.ok) throw new Error(JSON.stringify(created.error));
  return created.session;
}

function acceptMission(session: ReturnType<typeof createSession>): void {
  const started = session.startDialogue(IDS.dialogueId);
  if (!started.ok || started.value.status !== 'active') throw new Error('dialogue did not start');
  const initial = session.applyDialogueTurn(started.value);
  if (!initial.ok) throw initial.error;
  const chosen = session.chooseDialogue(started.value.session, 'accept');
  if (!chosen.ok) throw chosen.error;
  const applied = session.applyDialogueTurn(chosen.value);
  if (!applied.ok) throw applied.error;
  const advanced = session.advanceDialogue(chosen.value.session);
  if (!advanced.ok) throw advanced.error;
  session.save();
}

function pendingReward(session: ReturnType<typeof createSession>) {
  const [pending] = session.pendingRewardCommands();
  if (!pending || pending.type !== 'reward.grant') throw new Error('expected a pending reward');
  return pending;
}

function narrativeContent(loaded: ReturnType<typeof loadTemplate>): NarrativeContent {
  return {
    chapterId: loaded.manifest.chapterId,
    stageId: loaded.manifest.id,
    definition: loaded.narrative,
    npcs: loaded.npcs,
    dialogues: loaded.dialogues,
    missions: loaded.missions,
    events: loaded.events,
    exitIds: loaded.manifest.exits.map(exit => exit.id),
  };
}

describe('independent chapter template', () => {
  it('validates and registers the template without changing the production catalog', () => {
    const registry = templateRegistry();
    expect(registry.validate().filter(item => item.severity === 'error')).toEqual([]);

    const catalog = StageCatalogService.create(registry);
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.value.get(IDS.stageId)).toMatchObject({
        chapterId: IDS.chapterId,
        manifestRevision: 1,
        layoutKind: 'authored',
        eligibility: 'individual-only',
        loadability: 'loadable',
      });
      expect(catalog.value.eligible().some(entry => entry.stageId === IDS.stageId)).toBe(false);
    }

    expect(CAMPAIGN_CHAPTER_CATALOG.some(entry => entry.chapter.id === IDS.chapterId)).toBe(false);
    const production = new GameSessionService();
    expect(production.catalog?.get(IDS.stageId)).toBeUndefined();
    expect(production.menuState().individualStages.some(item => item.stageId === IDS.stageId))
      .toBe(false);
  });

  it('loads with no production catalog and no legacy stages', () => {
    const isolated = new StageRegistry();
    registerChapterTemplate(isolated, CHAPTER_TEMPLATE_ENTRY);
    expect(isolated.validate().filter(item => item.severity === 'error')).toEqual([]);
    const loaded = new StageLoader(isolated).load({
      stageId: CHAPTER_TEMPLATE_STAGE_ID,
      runId: RUN_ID,
      runSeed: RUN_SEED,
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.manifest.chapterId).toBe(IDS.chapterId);
    expect(loaded.value.level.id).toBe(IDS.stageId);
  });

  it('loads the map, encounter, presentation, NPC, dialogue, mission and events', () => {
    const loaded = loadTemplate();
    expect(loaded.manifest.id).toBe(IDS.stageId);
    expect(loaded.manifest.layout).toEqual({ kind: 'authored' });
    expect(loaded.level.id).toBe(IDS.stageId);
    expect(loaded.level.tileMap).toHaveLength(11);
    expect(loaded.level.tileMap.every(row => row.length === 19)).toBe(true);
    expect(loaded.level.tileMap[TEMPLATE_NPC_POSITION.y][TEMPLATE_NPC_POSITION.x]).toBe(0);
    expect(loaded.level.tileMap[TEMPLATE_EXIT_POSITION.y][TEMPLATE_EXIT_POSITION.x]).toBe(5);

    expect(loaded.encounter?.source).toBe('declarative');
    expect(loaded.encounter?.waves).toHaveLength(1);
    expect(loaded.encounter?.waves[0].enemies.map(enemy => enemy.type)).toEqual(['affinity', 'ranged']);
    expect(loaded.presentation).toMatchObject({
      themeId: IDS.visual.themeId,
      tilesetId: IDS.visual.tilesetId,
    });
    expect(loaded.presentation?.npcSprites[IDS.visual.npcPresentationId]).toBeDefined();
    expect(loaded.presentation?.audio?.music).toBeDefined();
    expect(loaded.npcs.map(npc => npc.id)).toEqual([IDS.npcId]);
    expect(loaded.dialogues[0].nodes[0].choices?.map(choice => choice.id))
      .toEqual(['accept', 'observe']);
    expect(loaded.missions[0].id).toBe(IDS.missionId);
    expect(loaded.events.map(event => event.id)).toEqual([
      IDS.events.arrival,
      IDS.events.warden,
      IDS.events.beaconLit,
      IDS.events.depart,
    ]);
    expect(loaded.diagnostics.filter(item => item.severity === 'error')).toEqual([]);
  });

  it('starts the template in individual mode without campaign eligibility', () => {
    const registry = templateRegistry();
    const service = new GameSessionService({ registry });
    const view = service.menuState().individualStages.find(item => item.stageId === IDS.stageId);
    expect(view).toMatchObject({
      chapterId: IDS.chapterId,
      eligibility: 'individual-only',
      enabled: true,
    });

    const started = service.startIndividualStage(IDS.stageId);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.loadedStage.manifest.id).toBe(IDS.stageId);
    expect(started.value.loadedStage.encounter?.waves[0].enemies).toHaveLength(2);
    expect(started.value.loadedStage.presentation?.themeId).toBe(IDS.visual.themeId);
  });

  it('runs enter, NPC, dialogue choice, encounter, reward, exit and completion', () => {
    const storage = new MemorySaveStorage();
    const session = createSession(storage);

    expect(session.enterStage().ok).toBe(true);
    expect(session.director.snapshot().flags[IDS.flags.arrived]).toBe(true);

    expect(session.interactNpc(IDS.npcId).ok).toBe(true);
    acceptMission(session);
    expect(session.director.snapshot().flags[IDS.flags.accepted]).toBe(true);
    expect(session.director.snapshot().missionStates[IDS.missionId].status).toBe('active');

    const signals = new StageSignalAdapter(session);
    expect(signals.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'visit-1.encounter',
      encounterId: IDS.encounterId,
    }).ok).toBe(true);

    const afterEncounter = session.director.snapshot();
    expect(afterEncounter.missionStates[IDS.missionId]).toMatchObject({
      status: 'completed',
      objectives: { [IDS.objectiveId]: 1 },
    });
    expect(afterEncounter.flags[IDS.flags.beaconLit]).toBe(true);
    expect(afterEncounter.unlockedExitIds).toContain(IDS.exitId);
    expect(session.pendingRewardCommands()).toHaveLength(1);
    expect(pendingReward(session).reward).toEqual({
      type: 'progression.currency',
      amount: 40,
    });
    expect(session.conditionSatisfied({
      type: 'flag.equals',
      flag: IDS.flags.beaconLit,
      value: true,
    })).toBe(true);

    // Replaying the same fact or a new occurrence never duplicates the reward.
    expect(signals.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'visit-1.encounter',
      encounterId: IDS.encounterId,
    }).ok).toBe(true);
    expect(signals.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'visit-1.encounter.replay',
      encounterId: IDS.encounterId,
    }).ok).toBe(true);
    expect(session.pendingRewardCommands()).toHaveLength(1);

    expect(session.requestExit(IDS.exitId).ok).toBe(true);
    expect(session.stageCompletions()).toEqual([{
      occurrenceId: expect.any(String),
      exitId: IDS.exitId,
    }]);

    const pending = pendingReward(session);
    expect(session.confirmOperation(pending.operationId).ok).toBe(true);
    expect(session.pendingRewardCommands()).toHaveLength(0);
    expect(session.confirmOperation(pending.operationId)).toMatchObject({
      ok: false,
      error: { code: 'operation-not-pending' },
    });

    const restored = createSession(storage);
    const snapshot = restored.director.snapshot();
    expect(snapshot.flags[IDS.flags.beaconLit]).toBe(true);
    expect(snapshot.missionStates[IDS.missionId].status).toBe('completed');
    expect(snapshot.appliedOperationIds).toEqual(expect.arrayContaining([
      expect.stringContaining(IDS.rewardOperationId),
    ]));
    expect(restored.stageCompletions()).toHaveLength(1);
    expect(restored.pendingRewardCommands()).toHaveLength(0);

    // The restored session remains idempotent for the same gameplay fact.
    const restoredSignals = new StageSignalAdapter(restored);
    expect(restoredSignals.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'visit-1.encounter.replay',
      encounterId: IDS.encounterId,
    }).ok).toBe(true);
    expect(restored.pendingRewardCommands()).toHaveLength(0);
    expect(restored.stageCompletions()).toHaveLength(1);
  });

  it('copies the template into a second chapter with its own IDs and revision', () => {
    const second = createChapterTemplate('example.signal', {
      revision: 2,
      title: 'Sinal de Vidro',
      stageTitle: 'Sinal de Vidro — Aproximação',
    });
    expect(second.chapter.id).toBe('chapter.example.signal');
    expect(second.stage.manifest.id).toBe('stage.example.signal.approach');
    expect(second.stage.manifest.revision).toBe(2);
    expect(second.chapter.revision).toBe(2);

    const registry = templateRegistry();
    registerChapterTemplate(registry, second.entry);
    expect(registry.validate().filter(item => item.severity === 'error')).toEqual([]);

    const catalog = StageCatalogService.create(registry);
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.value.get(second.ids.stageId)).toMatchObject({
        chapterId: second.ids.chapterId,
        manifestRevision: 2,
        eligibility: 'individual-only',
      });
      expect(catalog.value.get(IDS.stageId)).toBeDefined();
    }

    const loaded = loaderFor(registry).load({
      stageId: second.ids.stageId,
      runId: 'run.example.signal',
      runSeed: 'seed.example.signal',
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.manifest.chapterId).toBe(second.ids.chapterId);
    expect(loaded.value.level.id).toBe(second.ids.stageId);
    expect(loaded.value.presentation?.themeId).toBe(second.ids.visual.themeId);
    expect(loaded.value.encounter?.id).toBe(second.ids.encounterId);
  });

  it('produces typed diagnostics for controlled manifest, encounter and catalog mutations', () => {
    const validator = new StageValidator();
    const stage = CHAPTER_TEMPLATE.stage;
    const chapter = CHAPTER_TEMPLATE.chapter;
    const contains = (diagnostics: readonly { readonly code: string }[], code: string): boolean =>
      diagnostics.some(item => item.code === code);

    const invalidTitle: StageModule = {
      ...stage,
      manifest: { ...stage.manifest, title: '' },
    };
    expect(contains(validator.validateModule(invalidTitle), 'stage.title.required')).toBe(true);

    expect(contains(validator.validate([chapter], [stage, stage]), 'registry.stage.duplicate'))
      .toBe(true);

    const missingTarget: StageModule = {
      ...stage,
      manifest: {
        ...stage.manifest,
        exits: [{ ...stage.manifest.exits[0], targetStageId: 'stage.missing' }],
      },
    };
    expect(contains(validator.validate([chapter], [missingTarget]), 'stage.exit.target-missing'))
      .toBe(true);

    const plannedCapability: StageModule = {
      ...stage,
      manifest: {
        ...stage.manifest,
        capabilities: [
          ...(stage.manifest.capabilities ?? []),
          {
            id: 'theme.gothic-cathedral',
            category: 'theme' as const,
            minimumVersion: 1,
            requirement: 'required' as const,
          },
        ],
      },
    };
    expect(contains(validator.validateModule(plannedCapability), 'capability.unavailable')).toBe(true);

    const missingDependency = {
      ...chapter,
      dependencies: [{ chapterId: 'chapter.missing', minimumRevision: 1 }],
    };
    expect(contains(validator.validate([missingDependency], [stage]), 'chapter.dependency.missing'))
      .toBe(true);

    const emptyWaves: StageModule = {
      ...stage,
      encounter: {
        ...stage.encounter!,
        source: { kind: 'authored-waves' as const, waves: [] },
      },
    };
    expect(contains(validator.validateModule(emptyWaves), 'stage.encounter.waves.empty')).toBe(true);

    const unknownEnemy: StageModule = {
      ...stage,
      encounter: {
        ...stage.encounter!,
        source: {
          kind: 'authored-waves' as const,
          waves: [{
            id: 'wave.1',
            delayBeforeMs: 0,
            enemies: [{ type: 'dragon' as any, x: 10, y: 4, level: 1 }],
          }],
        },
      },
    };
    expect(contains(validator.validateModule(unknownEnemy), 'stage.encounter.archetype.unknown'))
      .toBe(true);

    const missingTheme: StageModule = {
      ...stage,
      manifest: {
        ...stage.manifest,
        presentation: { ...stage.manifest.presentation!, themeId: 'theme.missing' },
      },
    };
    expect(contains(validator.validate([chapter], [missingTheme]), 'stage.visual.theme.unknown'))
      .toBe(true);

    const invalidRevision: StageModule = {
      ...stage,
      manifest: { ...stage.manifest, revision: 0 },
    };
    expect(contains(validator.validateModule(invalidRevision), 'stage.revision.invalid')).toBe(true);
  });

  it('reports narrative references and exit anchors through existing validators', () => {
    const loaded = loadTemplate();
    const brokenNarrative: NarrativeContent = {
      ...narrativeContent(loaded),
      npcs: [{ ...loaded.npcs[0], interactionDialogueId: 'dialogue.missing' }],
    };
    const directed = StageDirector.create(brokenNarrative);
    expect(directed).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-content',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: 'narrative.npc.dialogue.missing' }),
        ]),
      },
    });

    const brokenExit: StageModule = {
      ...CHAPTER_TEMPLATE.stage,
      manifest: {
        ...CHAPTER_TEMPLATE.stage.manifest,
        exits: [{
          ...CHAPTER_TEMPLATE.stage.manifest.exits[0],
          anchor: { kind: 'tile' as const, x: 0, y: 0 },
        }],
      },
    };
    const registry = new StageRegistry();
    registry.registerChapter(CHAPTER_TEMPLATE.chapter, [brokenExit]);
    const result = new StageLoader(registry).load({
      stageId: CHAPTER_TEMPLATE_STAGE_ID,
      runId: RUN_ID,
      runSeed: RUN_SEED,
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-level',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: 'stage.exit.anchor-not-walkable' }),
        ]),
      },
    });
  });

  it('is projected by World Lab when its registry is injected', () => {
    const registry = templateRegistry();
    const generated = new CampaignGraphGenerator().generate({
      campaignId: 'world-lab.template',
      campaignRevision: 1,
      catalogRevision: 1,
      runId: 'world-lab.template.run',
      runSeed: 'world-lab.template.seed',
      templates: WORLD_LAB_FIXTURE_CATALOG,
      context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    const target = generated.value.nodes.find(node => node.depth === 8) ?? generated.value.nodes[0];
    const graph = {
      ...generated.value,
      nodes: generated.value.nodes.map(node => node.id === target.id
        ? { ...node, stageId: CHAPTER_TEMPLATE_STAGE_ID }
        : node),
    };
    const document = new WorldLabDataService({ registry })
      .generateGraph('world-lab.template.seed', graph);
    expect(document.ok).toBe(true);
    if (!document.ok) return;
    expect(document.value.nodes.find(node => node.id === target.id)?.stageId)
      .toBe(CHAPTER_TEMPLATE_STAGE_ID);
  });
});
