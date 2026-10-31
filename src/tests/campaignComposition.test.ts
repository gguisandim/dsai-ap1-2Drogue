import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CampaignCompositionService,
  CampaignExitBinder,
  CampaignGraphValidator,
  FIXED_NINE_COMPOSITION_SLOTS,
  PhysicalExitResolver,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  createFixedNineCompositionRequest,
  type CampaignCompositionCatalog,
  type CampaignCompositionRequest,
  type ChapterManifest,
  type StageCampaignCatalogMetadata,
  type StageExitDefinition,
  type StageModule,
} from '../stages';
import {
  CampaignRunSaveService,
  CampaignRouter,
  createCampaignRunState,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';

const CAMPAIGN_COMPLETE = 'campaign.complete' as const;
const stageId = (index: number): string => `stage.composition.${String(index).padStart(2, '0')}`;
const milestoneIndexes = new Map([[3, 'act-1'], [6, 'act-2'], [9, 'act-3']]);

function metadata(index: number): StageCampaignCatalogMetadata {
  const milestoneAct = milestoneIndexes.get(index);
  return Object.freeze({
    availability: 'available' as const,
    participation: milestoneAct ? 'narrative-milestone' as const : 'candidate' as const,
    role: milestoneAct ? 'milestone' as const : 'standard' as const,
    regionIds: Object.freeze([`region.fixture.${(index % 3) + 1}`]),
    biomeIds: Object.freeze(['crypt']),
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    allowedActIds: Object.freeze(milestoneAct ? [milestoneAct] : ['act-1', 'act-2', 'act-3']),
    maximumPhysicalExits: index % 5 === 0 ? 3 as const : 2 as const,
    revisit: index % 2 === 0 ? 'repeatable' as const : 'checkpoint' as const,
    ...(index === 4 ? { requiredBeatIds: Object.freeze(['beat.act-1']) } : {}),
    providesBeatIds: Object.freeze(milestoneAct ? [`beat.${milestoneAct}`] : []),
  });
}

function exitsTo(
  id: string,
  targets: readonly string[],
  anchor: StageExitDefinition['anchor'] = Object.freeze({ kind: 'map-exit' as const }),
): readonly StageExitDefinition[] {
  return Object.freeze([...new Set(targets)]
    .filter(target => target !== id)
    .sort()
    .map(target => Object.freeze({
      id: `exit.${id}.${target}`,
      anchor: Object.freeze({ ...anchor }),
      targetStageId: target as StageExitDefinition['targetStageId'],
    })));
}

function stage(
  index: number,
  metadataValue = metadata(index),
  targets: readonly string[] = [],
  anchor?: StageExitDefinition['anchor'],
): StageModule {
  const id = stageId(index);
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id,
      revision: 1,
      chapterId: 'chapter.composition.fixture',
      order: index - 1,
      title: `Composition fixture ${index}`,
      summary: 'Synthetic composition fixture.',
      layout: Object.freeze({ kind: 'legacy' as const, levelId: 'verse_01_atrium' }),
      exits: exitsTo(id, targets, anchor),
      campaignCatalog: metadataValue,
    }),
  });
}

function withFanOut(module: StageModule, universe: readonly string[]): StageModule {
  return Object.freeze({
    ...module,
    manifest: Object.freeze({
      ...module.manifest,
      exits: exitsTo(module.manifest.id, [...universe, CAMPAIGN_COMPLETE]),
    }),
  });
}

/**
 * Every fixture stage can lead to every other fixture stage, so any of them is
 * position-compatible with any slot while the chapter graph stays reachable and
 * terminal. This is what allows nine of many to vary by seed.
 */
function composableStages(
  count = 35,
  extras: readonly StageModule[] = [],
): readonly StageModule[] {
  const baseIds = Array.from({ length: count }, (_, index) => stageId(index + 1));
  const universe = [...baseIds, ...extras.map(item => item.manifest.id)];
  const base = baseIds.map((_, index) => withFanOut(stage(index + 1), universe));
  return Object.freeze([...base, ...extras.map(item => withFanOut(item, universe))]);
}

function source(stages: readonly StageModule[], reverse = false) {
  const normalized = stages.map((item, index) => Object.freeze({
    ...item,
    manifest: Object.freeze({
      ...item.manifest,
      order: index,
      exits: Object.freeze(item.manifest.exits.map(exit => Object.freeze({ ...exit }))),
    }),
  }));
  const ordered = reverse ? [...normalized].reverse() : [...normalized];
  const chapter: ChapterManifest = Object.freeze({
    schemaVersion: 1 as const,
    id: 'chapter.composition.fixture',
    revision: 1,
    title: 'Composition fixture',
    stageIds: Object.freeze(normalized.map(item => item.manifest.id)),
    entryStageId: stageId(1),
  });
  return {
    listChapters: () => [chapter],
    listModules: () => ordered,
  };
}

function catalog(stages: readonly StageModule[], reverse = false): StageCatalogService {
  const result = StageCatalogService.create(source(stages, reverse));
  if (!result.ok) throw new Error(JSON.stringify(result.error.diagnostics));
  return result.value;
}

function request(seed = 'seed.composition.35-to-9'): CampaignCompositionRequest {
  return createFixedNineCompositionRequest({
    campaignId: 'campaign.composition.fixture',
    campaignRevision: 1,
    runId: 'run.composition.fixture',
    seed,
    entryStageId: stageId(1),
    requiredStageIds: Object.freeze([stageId(4)]),
    mandatoryMilestones: Object.freeze([
      Object.freeze({
        slotId: 'act-1.milestone', stageId: stageId(3), requiredBeatIds: Object.freeze(['beat.act-1']),
      }),
      Object.freeze({
        slotId: 'act-2.milestone', stageId: stageId(6), requiredBeatIds: Object.freeze(['beat.act-2']),
      }),
      Object.freeze({
        slotId: 'act-3.milestone', stageId: stageId(9), requiredBeatIds: Object.freeze(['beat.act-3']),
      }),
    ]),
  });
}

/**
 * A placeable explicit anchor (relative to the spawned tile) that is free in
 * the fixture level, so the physical resolver binds the declared manifest exit
 * instead of falling back to a synthetic slot.
 */
const CHAIN_ANCHOR: StageExitDefinition['anchor'] = Object.freeze({
  kind: 'player-spawn' as const, offsetX: 1, offsetY: 1,
});

function explicitChainStages(breakFirstDestination = false): readonly StageModule[] {
  return Object.freeze(Array.from({ length: 9 }, (_, offset) => {
    const index = offset + 1;
    const actId = index <= 3 ? 'act-1' : index <= 6 ? 'act-2' : 'act-3';
    const targets = breakFirstDestination && index === 1
      // Still reachable and terminal (1 -> 9 -> 2..8), but the entry cannot be
      // followed by its forced successor stage 2.
      ? [stageId(9)]
      : breakFirstDestination && index === 9
        ? [stageId(2), CAMPAIGN_COMPLETE]
        : [index < 9 ? stageId(index + 1) : CAMPAIGN_COMPLETE];
    return stage(index, Object.freeze({
      ...metadata(index),
      allowedActIds: Object.freeze([actId]),
      difficulty: Object.freeze({ minimum: index, maximum: index }),
      maximumPhysicalExits: 1 as const,
    }), targets, CHAIN_ANCHOR);
  }));
}

function compose(service: CampaignCompositionService, value = request()) {
  const result = service.compose(value);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function manualSelection(stageIds: readonly string[]) {
  return Object.freeze(FIXED_NINE_COMPOSITION_SLOTS.map((slot, index) => Object.freeze({
    slotId: slot.slotId,
    stageId: stageIds[index],
  })));
}

function manualRequest(stageIds: readonly string[], seed = 'seed.manual') {
  return createFixedNineCompositionRequest({
    ...request(seed),
    manualAssignments: manualSelection(stageIds),
  });
}

describe('CampaignCompositionService', () => {
  const stages = composableStages();

  it('selects exactly nine definitions from 35 and delegates fixed topology to the graph generator', () => {
    const value = compose(new CampaignCompositionService(catalog(stages)));

    expect(value.snapshot.assignments).toHaveLength(9);
    expect(new Set(value.snapshot.assignments.map(item => item.stageId)).size).toBe(9);
    expect(value.snapshot.assignments.map(item => item.depth)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(value.snapshot.assignments.filter(item => item.kind === 'milestone').map(item => item.stageId))
      .toEqual([stageId(3), stageId(6), stageId(9)]);
    expect(value.snapshot.assignments.find(item => item.stageId === stageId(4))?.actId).toBe('act-2');
    expect(value.graph.nodes).toHaveLength(9);
    expect(value.graph.edges).toHaveLength(9);
    expect(new CampaignGraphValidator().validate(value.graph)).toEqual([]);
    expect(value.graph.nodes.every(node => value.snapshot.assignments.some(item =>
      item.slotId === node.slotId && item.stageId === node.stageId))).toBe(true);
    expect(value.snapshot.assignments.every(assignment =>
      assignment.declaredExits.every((exit, index, values) =>
        index === 0 || values[index - 1].id <= exit.id))).toBe(true);
  });

  it('is deterministic, independent of catalog order and varies across viable seeds', () => {
    const first = compose(new CampaignCompositionService(catalog(stages)), request('seed.same'));
    const repeated = compose(new CampaignCompositionService(catalog(stages)), request('seed.same'));
    const reordered = compose(new CampaignCompositionService(catalog(stages, true)), request('seed.same'));
    const other = compose(new CampaignCompositionService(catalog(stages)), request('seed.other'));

    expect(repeated).toEqual(first);
    expect(reordered).toEqual(first);
    expect(other.snapshot.assignments.map(item => item.stageId))
      .not.toEqual(first.snapshot.assignments.map(item => item.stageId));
  });

  it('never selects planned, individual-only, incompatible or unrequested reserved definitions', () => {
    const extras: readonly StageModule[] = [
      stage(36, Object.freeze({ ...metadata(36), availability: 'planned' as const })),
      stage(37, Object.freeze({
        ...metadata(37), participation: 'individual-only' as const, role: 'standard' as const,
      })),
      stage(39, Object.freeze({
        ...metadata(39), participation: 'narrative-milestone' as const, role: 'milestone' as const,
        providesBeatIds: Object.freeze(['beat.unrequested']),
      })),
    ];
    const all = composableStages(35, extras);
    const base = source(all);
    const incompatible: StageModule = Object.freeze({
      ...stage(38),
      manifest: Object.freeze({
        ...stage(38).manifest,
        id: 'stage.composition.incompatible',
        chapterId: 'chapter.composition.incompatible',
        order: 0,
        exits: Object.freeze([Object.freeze({
          id: 'exit.stage.composition.incompatible',
          anchor: Object.freeze({ kind: 'map-exit' as const }),
          targetStageId: CAMPAIGN_COMPLETE,
        })]),
        capabilities: Object.freeze([Object.freeze({
          id: 'theme.gothic-cathedral', category: 'theme' as const,
          minimumVersion: 1, requirement: 'required' as const,
        })]),
      }),
    });
    const incompatibleChapter: ChapterManifest = Object.freeze({
      schemaVersion: 1 as const,
      id: 'chapter.composition.incompatible',
      revision: 1,
      title: 'Incompatible fixture',
      stageIds: Object.freeze([incompatible.manifest.id]),
      entryStageId: incompatible.manifest.id,
    });
    const discovered = StageCatalogService.create({
      listChapters: () => [...base.listChapters(), incompatibleChapter],
      listModules: () => [...base.listModules(), incompatible],
    });
    if (!discovered.ok) throw new Error(JSON.stringify(discovered.error));
    const value = compose(new CampaignCompositionService(discovered.value));
    expect(value.snapshot.assignments.map(item => item.stageId)).not.toEqual(expect.arrayContaining([
      stageId(36), stageId(37), stageId(39), incompatible.manifest.id,
    ]));
  });

  it('returns typed atomic failures for insufficient catalogs and physical capacity', () => {
    const small = composableStages(8);
    const insufficient = new CampaignCompositionService(catalog(small)).compose(request());
    expect(insufficient).toMatchObject({ ok: false, error: { code: expect.stringMatching(
      /candidates-insufficient|milestone-unavailable|stage-reference-missing/,
    ) } });
    if (!insufficient.ok) expect(insufficient.error).not.toHaveProperty('value');

    const capacity = new CampaignCompositionService(catalog(stages)).compose(
      createFixedNineCompositionRequest({
        ...request(),
        minimumPhysicalExitsBySlot: Object.freeze({ 'act-1.intermediate': 3 as const }),
        candidateStageIds: Object.freeze(stages
          .filter((_, index) => (index + 1) % 5 !== 0)
          .map(item => item.manifest.id)),
      }),
    );
    expect(capacity).toMatchObject({ ok: false, error: { code: 'exit-capacity-insufficient' } });
  });

  it('reports act, difficulty and narrative dependency impossibilities distinctly', () => {
    const remapMetadata = (
      transform: (value: StageCampaignCatalogMetadata, index: number) => StageCampaignCatalogMetadata,
    ): readonly StageModule[] => stages.map((item, index) => Object.freeze({
      ...item,
      manifest: Object.freeze({
        ...item.manifest,
        campaignCatalog: transform(item.manifest.campaignCatalog as StageCampaignCatalogMetadata, index + 1),
      }),
    }));
    const actBlocked = remapMetadata((value, index) => milestoneIndexes.has(index) ? value : Object.freeze({
      ...value, allowedActIds: Object.freeze(['act-1', 'act-2']),
    }));
    expect(new CampaignCompositionService(catalog(actBlocked)).compose(request()))
      .toMatchObject({ ok: false, error: { code: 'act-incompatible' } });

    const difficultyBlocked = remapMetadata((value, index) => milestoneIndexes.has(index) ? value : Object.freeze({
      ...value, difficulty: Object.freeze({ minimum: 1, maximum: 7 }),
    }));
    expect(new CampaignCompositionService(catalog(difficultyBlocked)).compose(request()))
      .toMatchObject({ ok: false, error: { code: 'difficulty-incompatible' } });

    const narrativeBlocked = remapMetadata(value => value.role === 'milestone' ? value : Object.freeze({
      ...value, requiredEventIds: Object.freeze(['event.unavailable']),
    }));
    expect(new CampaignCompositionService(catalog(narrativeBlocked)).compose(request()))
      .toMatchObject({ ok: false, error: { code: 'narrative-dependency-impossible' } });
  });

  it('rejects unsupported quantities and missing mandatory references without partial output', () => {
    const service = new CampaignCompositionService(catalog(stages));
    const quantity = service.compose({ ...request(), desiredStageCount: 8 });
    expect(quantity).toMatchObject({ ok: false, error: { code: 'topology-incompatible' } });
    const missing = service.compose({ ...request(), candidateStageIds: ['stage.missing'] });
    expect(missing).toMatchObject({ ok: false, error: { code: 'stage-reference-missing' } });
  });

  it('accepts canonical explicit destinations and rejects an incompatible successor atomically', () => {
    const valid = new CampaignCompositionService(catalog(explicitChainStages())).compose(request());
    expect(valid.ok).toBe(true);
    const invalid = new CampaignCompositionService(catalog(explicitChainStages(true))).compose(request());
    expect(invalid).toMatchObject({ ok: false, error: { code: 'destination-incompatible' } });
    if (!invalid.ok) expect(invalid.error).not.toHaveProperty('value');
  });

  it('accepts multiple declared exits when one destination matches the selected successor', () => {
    const stagesWithAlternate = explicitChainStages().map((item, index) => {
      if (index !== 0) return item;
      return Object.freeze({
        ...item,
        manifest: Object.freeze({
          ...item.manifest,
          exits: Object.freeze([
            ...item.manifest.exits,
            Object.freeze({
              id: `exit.${item.manifest.id}.${stageId(9)}`,
              anchor: Object.freeze({ kind: 'map-exit' as const }),
              targetStageId: stageId(9),
            }),
          ].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)),
        }),
      });
    });
    const value = compose(new CampaignCompositionService(catalog(stagesWithAlternate)));
    const entry = value.snapshot.assignments[0];
    expect(entry.stageId).toBe(stageId(1));
    expect(entry.declaredExits.map(exit => exit.targetStageId)).toEqual([stageId(2), stageId(9)]);
  });

  it('validates manual nine-slot selections through the same composer', () => {
    const chain = explicitChainStages();
    const ids = Array.from({ length: 9 }, (_, index) => stageId(index + 1));
    const value = compose(
      new CampaignCompositionService(catalog(chain)),
      manualRequest(ids),
    );
    expect(value.snapshot.assignments.map(item => item.stageId)).toEqual(ids);
    expect(value.snapshot.assignments.map(item => item.slotId))
      .toEqual(FIXED_NINE_COMPOSITION_SLOTS.map(slot => slot.slotId));
  });

  it('rejects incomplete, duplicated, ineligible and misplaced manual selections', () => {
    const chain = explicitChainStages();
    const service = new CampaignCompositionService(catalog(chain));
    const ids = Array.from({ length: 9 }, (_, index) => stageId(index + 1));

    expect(service.compose(createFixedNineCompositionRequest({
      ...request(), manualAssignments: manualSelection(ids).slice(0, 8),
    }))).toMatchObject({ ok: false, error: { code: 'manual-selection-invalid' } });

    const duplicated = [...ids.slice(0, 8), ids[0]];
    expect(service.compose(manualRequest(duplicated)))
      .toMatchObject({ ok: false, error: { code: 'manual-selection-invalid' } });

    const missing = [...ids.slice(0, 8), 'stage.missing'];
    expect(service.compose(manualRequest(missing)))
      .toMatchObject({ ok: false, error: { code: 'stage-reference-missing' } });

    const misplaced = [...ids];
    [misplaced[1], misplaced[4]] = [misplaced[4], misplaced[1]];
    expect(service.compose(manualRequest(misplaced)))
      .toMatchObject({ ok: false, error: { code: expect.stringMatching(
        /milestone-unavailable|act-incompatible|difficulty-incompatible/,
      ) } });
  });

  it('rejects a manual chain whose explicit destination contradicts its successor', () => {
    const ids = Array.from({ length: 9 }, (_, index) => stageId(index + 1));
    expect(new CampaignCompositionService(catalog(explicitChainStages(true)))
      .compose(manualRequest(ids)))
      .toMatchObject({ ok: false, error: { code: 'destination-incompatible' } });
  });

  it('treats definitions without declared exits as synthetic-slot compatible', () => {
    const entries = catalog(stages).list().map(entry => Object.freeze({ ...entry, exits: Object.freeze([]) }));
    const synthetic: CampaignCompositionCatalog = { list: () => entries };
    const value = compose(new CampaignCompositionService(synthetic));
    expect(value.snapshot.assignments).toHaveLength(9);
    expect(value.snapshot.assignments.every(assignment => assignment.declaredExits.length === 0)).toBe(true);
  });

  it('restores the exact snapshot without reselection after reorder or catalog growth', () => {
    const originalService = new CampaignCompositionService(catalog(stages));
    const original = compose(originalService);
    const bytes = JSON.stringify(original.snapshot);
    const growthModule = withFanOut(Object.freeze({
      ...stage(40),
      manifest: Object.freeze({
        ...stage(40).manifest,
        chapterId: 'chapter.composition.growth',
      }),
    }), [stageId(40)]);
    const growthChapter: ChapterManifest = Object.freeze({
      schemaVersion: 1 as const,
      id: 'chapter.composition.growth',
      revision: 1,
      title: 'Growth fixture',
      stageIds: Object.freeze([growthModule.manifest.id]),
      entryStageId: growthModule.manifest.id,
    });
    const reordered = source(stages, true);
    const expanded = StageCatalogService.create({
      listChapters: () => [...reordered.listChapters(), growthChapter],
      listModules: () => [...reordered.listModules(), growthModule],
    });
    if (!expanded.ok) throw new Error(JSON.stringify(expanded.error));
    const restored = new CampaignCompositionService(expanded.value).restore(JSON.parse(bytes));
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.value.snapshot).toEqual(original.snapshot);
    expect(restored.value.graph).toEqual(original.graph);
  });

  it('fails restoration when a selected stage revision is unavailable', () => {
    const original = compose(new CampaignCompositionService(catalog(stages)));
    const changed = stages.map(item => item.manifest.id === original.snapshot.assignments[0].stageId
      ? Object.freeze({ ...item, manifest: Object.freeze({ ...item.manifest, revision: 2 }) })
      : item);
    const restored = new CampaignCompositionService(catalog(changed)).restore(original.snapshot);
    expect(restored).toMatchObject({ ok: false, error: { code: 'stage-revision-incompatible' } });
  });

  it('rejects a malformed persisted snapshot without rerunning selection', () => {
    const service = new CampaignCompositionService(catalog(stages));
    const original = compose(service);
    const invalid = { ...original.snapshot, version: 2 };
    expect(service.restore(invalid)).toMatchObject({
      ok: false,
      error: { code: 'persisted-composition-invalid' },
    });
  });

  it('feeds the existing router, physical resolver and canonical exit binder', () => {
    const chain = explicitChainStages();
    const sourceValue = source(chain);
    const registry = new StageRegistry();
    registry.registerChapter(sourceValue.listChapters()[0], sourceValue.listModules());
    const value = compose(new CampaignCompositionService(catalog(chain)));
    const loader = new StageLoader(registry);
    const router = new CampaignRouter(createCampaignRunState(value.graph, value.snapshot), {
      loader,
      resolver: new PhysicalExitResolver(),
      binder: new CampaignExitBinder(),
    });
    const inspection = router.inspect();
    expect(inspection.ok).toBe(true);
    if (inspection.ok) {
      expect(inspection.value.snapshot.currentStageId).toBe(value.snapshot.assignments[0].stageId);
      expect(inspection.value.snapshot.destinations).toHaveLength(1);
      expect(inspection.value.bindings).toHaveLength(1);
      expect(inspection.value.snapshot.destinations[0].physicalExitId).toBe(
        inspection.value.bindings[0].physicalExitId,
      );
      // The declared manifest exit is bound and its destination matches the
      // composed successor stage definition.
      expect(inspection.value.bindings[0].association).toBe('manifest-exit');
      expect(inspection.value.bindings[0].targetStageId).toBe(value.snapshot.assignments[1].stageId);
      expect(inspection.value.bindings[0].manifestExit?.id).toBe(
        value.snapshot.assignments[0].declaredExits
          .find(exit => exit.targetStageId === value.snapshot.assignments[1].stageId)?.id,
      );
    }
  });

  it('persists composition additively in run save v1 and accepts legacy saves without it', () => {
    const value = compose(new CampaignCompositionService(catalog(stages)));
    const storage = new MemorySaveStorage();
    const saves = new CampaignRunSaveService({ storage });
    const state = createCampaignRunState(value.graph, value.snapshot);
    expect(saves.save(state).ok).toBe(true);
    const loaded = saves.load({
      campaignId: value.graph.campaignId,
      campaignRevision: value.graph.campaignRevision,
      runId: value.graph.runId,
      runSeed: value.graph.runSeed,
      graphId: value.graph.id,
    });
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value.status === 'loaded') {
      expect(loaded.value.envelope.version).toBe(1);
      expect(loaded.value.envelope.state.composition).toEqual(value.snapshot);
    }
    const legacy = createCampaignRunState(value.graph);
    expect(new CampaignRunSaveService({ storage: new MemorySaveStorage() }).serialize(legacy).ok).toBe(true);
  });

  it('is headless and has no Phaser, scene, DOM or storage dependency', () => {
    const service = readFileSync(join(
      __dirname, '..', 'stages', 'runtime', 'CampaignCompositionService.ts',
    ), 'utf8');
    const adapter = readFileSync(join(
      __dirname, '..', 'stages', 'runtime', 'CampaignCompositionGraphAdapter.ts',
    ), 'utf8');
    expect(`${service}\n${adapter}`).not.toMatch(/from ['"]phaser['"]|GameScene|localStorage|window\.|document\./);
  });
});
