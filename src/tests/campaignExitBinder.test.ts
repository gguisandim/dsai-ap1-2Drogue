import { CampaignExitBinder } from '../stages';
import type {
  CampaignEdge,
  CampaignExitBindingRequest,
  CampaignGraph,
  CampaignNode,
  LoadedStage,
  PhysicalExit,
  PhysicalExitResult,
  StageExitDefinition,
} from '../stages';
import type { LevelDefinition } from '../data/LevelData';

const SOURCE_ID = 'node.campaign.test.run.1.act-1.entry.main';

function makeNode(id: string, stageId: string, overrides: Partial<CampaignNode> = {}): CampaignNode {
  return {
    id,
    slotId: `slot.${id}`,
    templateId: `region.${id}`,
    templateRevision: 1,
    stageId,
    stageSeed: `stage.${id}`,
    actId: 'act-1',
    depth: id === SOURCE_ID ? 0 : 1,
    branchId: 'main',
    kind: 'intermediate',
    biomeId: 'cathedral',
    difficulty: 1,
    providesBeatIds: [],
    maximumPhysicalExits: 3,
    ...overrides,
  };
}

function makeEdge(
  id: string,
  targetNodeId: string,
  overrides: Partial<CampaignEdge> = {},
): CampaignEdge {
  return {
    id,
    sourceNodeId: SOURCE_ID,
    targetNodeId,
    exitSlotId: `slot.${id}`,
    physicalExitId: `physical.${id}`,
    kind: 'forward',
    traversalLimit: 1,
    ...overrides,
  };
}

function makeGraph(nodes: readonly CampaignNode[], edges: readonly CampaignEdge[]): CampaignGraph {
  return {
    schemaVersion: 1,
    generatorVersion: 1,
    id: 'campaign-graph.test.run-1',
    campaignId: 'campaign.test',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'run-1',
    runSeed: 'seed-1',
    generationContextDigest: 'context.00000000',
    entryNodeId: SOURCE_ID,
    acts: [],
    nodes,
    edges,
    mandatoryBeatIds: [],
  };
}

function makeLevel(stageId = 'stage.source'): LevelDefinition {
  return {
    id: stageId,
    name: 'Binding fixture',
    description: 'Headless campaign exit binding fixture.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [[8, 0, 0, 0]],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 30,
    difficulty: 1,
  };
}

function makeStage(exits: readonly StageExitDefinition[] = []): LoadedStage {
  const level = makeLevel();
  return {
    manifest: {
      schemaVersion: 1,
      id: level.id,
      revision: 1,
      chapterId: 'chapter.test',
      order: 0,
      title: level.name,
      summary: level.description,
      layout: { kind: 'authored' },
      exits,
    },
    level,
    narrative: {},
    npcs: [],
    dialogues: [],
    missions: [],
    events: [],
    diagnostics: [],
  };
}

function makePhysical(edge: CampaignEdge, index: number, stageExitId = edge.exitSlotId): PhysicalExit {
  return {
    id: edge.physicalExitId,
    edgeId: edge.id,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    stageExitId,
    tile: { x: index + 1, y: 0 },
    placementAttempt: 0,
  };
}

function physicalSuccess(exits: readonly PhysicalExit[]): PhysicalExitResult {
  return {
    ok: true,
    value: {
      nodeId: SOURCE_ID,
      stageId: 'stage.source',
      levelDigest: 'level.12345678',
      exits,
    },
  };
}

function requestFor(
  graph: CampaignGraph,
  exits: readonly PhysicalExit[],
  stage: LoadedStage = makeStage(),
): CampaignExitBindingRequest {
  return {
    graph,
    sourceNodeId: SOURCE_ID,
    stage,
    physicalExitResult: physicalSuccess(exits),
  };
}

function bind(request: CampaignExitBindingRequest) {
  return new CampaignExitBinder().bind(request);
}

function simpleFixture(edgeCount = 1) {
  const targets = Array.from({ length: edgeCount }, (_, index) =>
    makeNode(`node.target.${index + 1}`, `stage.target.${index + 1}`));
  const source = makeNode(SOURCE_ID, 'stage.source');
  const edges = targets.map((target, index) => makeEdge(`edge.${index + 1}`, target.id));
  return { source, targets, edges, graph: makeGraph([source, ...targets], edges) };
}

describe('campaign exit binder', () => {
  it('binds a single edge through its stable synthetic exit slot', () => {
    const fixture = simpleFixture();
    const result = bind(requestFor(fixture.graph, [makePhysical(fixture.edges[0], 0)]));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bindings).toEqual([expect.objectContaining({
      edgeId: 'edge.1',
      exitSlotId: 'slot.edge.1',
      stageExitId: 'slot.edge.1',
      physicalExitId: 'physical.edge.1',
      targetNodeId: 'node.target.1',
      targetStageId: 'stage.target.1',
      association: 'synthetic-slot',
    })]);
  });

  it('keeps both branches distinct and associates explicit manifest exits by id', () => {
    const fixture = simpleFixture(2);
    const exits: readonly StageExitDefinition[] = fixture.edges.map((edge, index) => ({
      id: `manifest.${edge.id}`,
      anchor: { kind: 'tile', x: index + 1, y: 0 },
      targetStageId: fixture.targets[index].stageId,
    }));
    const physical = fixture.edges.map((edge, index) =>
      makePhysical(edge, index, exits[index].id));

    const result = bind(requestFor(fixture.graph, physical, makeStage(exits)));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bindings.map(binding => [
      binding.edgeId,
      binding.stageExitId,
      binding.physicalExitId,
      binding.targetNodeId,
    ])).toEqual([
      ['edge.1', 'manifest.edge.1', 'physical.edge.1', 'node.target.1'],
      ['edge.2', 'manifest.edge.2', 'physical.edge.2', 'node.target.2'],
    ]);
  });

  it('supports three outgoing exits without positional identity', () => {
    const fixture = simpleFixture(3);
    const result = bind(requestFor(
      fixture.graph,
      fixture.edges.map((edge, index) => makePhysical(edge, index)),
    ));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bindings.map(binding => binding.edgeId))
      .toEqual(['edge.1', 'edge.2', 'edge.3']);
    expect(new Set(result.value.bindings.map(binding => binding.physicalExitId)).size).toBe(3);
  });

  it('preserves an explicit tile anchor and the complete manifest definition', () => {
    const fixture = simpleFixture();
    const manifestExit: StageExitDefinition = {
      id: 'manifest.north',
      anchor: { kind: 'tile', x: 1, y: 0 },
      targetStageId: fixture.targets[0].stageId,
    };
    const result = bind(requestFor(
      fixture.graph,
      [makePhysical(fixture.edges[0], 0, manifestExit.id)],
      makeStage([manifestExit]),
    ));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bindings[0].manifestExit).toEqual(manifestExit);
    expect(result.value.bindings[0].physicalExit.tile).toEqual({ x: 1, y: 0 });
  });

  it('rejects a physical stage exit absent from the manifest when it is not the edge slot', () => {
    const fixture = simpleFixture();
    const result = bind(requestFor(
      fixture.graph,
      [makePhysical(fixture.edges[0], 0, 'manifest.missing')],
    ));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('manifest-exit-mismatch');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('campaign-exit.manifest-exit-missing');
  });

  it('rejects duplicate edge, manifest and physical identifiers', () => {
    const fixture = simpleFixture(2);
    const duplicateEdge = {
      ...fixture.edges[1],
      id: fixture.edges[0].id,
      exitSlotId: fixture.edges[0].exitSlotId,
      physicalExitId: fixture.edges[0].physicalExitId,
    };
    const graph = makeGraph([fixture.source, ...fixture.targets], [fixture.edges[0], duplicateEdge]);
    const duplicateManifest: readonly StageExitDefinition[] = [
      { id: 'manifest.same', anchor: { kind: 'map-exit' }, targetStageId: 'stage.target.1' },
      { id: 'manifest.same', anchor: { kind: 'map-exit' }, targetStageId: 'stage.target.2' },
    ];
    const duplicatePhysical = [
      makePhysical(fixture.edges[0], 0, 'manifest.same'),
      { ...makePhysical(fixture.edges[1], 1, 'manifest.same'), id: fixture.edges[0].physicalExitId },
    ];

    const result = bind(requestFor(graph, duplicatePhysical, makeStage(duplicateManifest)));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code)).toEqual(expect.arrayContaining([
      'campaign-exit.edge-duplicate',
      'campaign-exit.manifest-exit-duplicate',
      'campaign-exit.physical-exit-duplicate',
    ]));
  });

  it('rejects a missing physical exit without returning partial bindings', () => {
    const fixture = simpleFixture(2);
    const result = bind(requestFor(fixture.graph, [makePhysical(fixture.edges[0], 0)]));

    expect(result).toEqual(expect.objectContaining({ ok: false }));
    expect('value' in result).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code)).toEqual(expect.arrayContaining([
      'campaign-exit.physical-exit-missing',
      'campaign-exit.binding-cardinality',
    ]));
  });

  it('rejects an additional physical exit', () => {
    const fixture = simpleFixture();
    const unexpectedEdge = makeEdge('edge.unexpected', fixture.targets[0].id);
    const result = bind(requestFor(fixture.graph, [
      makePhysical(fixture.edges[0], 0),
      makePhysical(unexpectedEdge, 1),
    ]));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('campaign-exit.physical-exit-unexpected');
  });

  it('rejects a physical destination inconsistent with its edge', () => {
    const fixture = simpleFixture();
    const physical = {
      ...makePhysical(fixture.edges[0], 0),
      targetNodeId: 'node.wrong',
    };
    const result = bind(requestFor(fixture.graph, [physical]));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('physical-exit-mismatch');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('campaign-exit.physical-exit-incompatible');
  });

  it('rejects a manifest destination inconsistent with the destination node stage', () => {
    const fixture = simpleFixture();
    const manifestExit: StageExitDefinition = {
      id: 'manifest.wrong',
      anchor: { kind: 'map-exit' },
      targetStageId: 'stage.wrong',
    };
    const result = bind(requestFor(
      fixture.graph,
      [makePhysical(fixture.edges[0], 0, manifestExit.id)],
      makeStage([manifestExit]),
    ));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('destination-mismatch');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('campaign-exit.destination-mismatch');
  });

  it('is independent of graph, manifest and physical exit array order', () => {
    const fixture = simpleFixture(3);
    const manifest = fixture.edges.map((edge, index): StageExitDefinition => ({
      id: `manifest.${edge.id}`,
      anchor: { kind: 'tile', x: index + 1, y: 0 },
      targetStageId: fixture.targets[index].stageId,
    }));
    const physical = fixture.edges.map((edge, index) => makePhysical(edge, index, manifest[index].id));
    const first = bind(requestFor(fixture.graph, physical, makeStage(manifest)));
    const reorderedGraph = makeGraph(
      [fixture.source, ...fixture.targets].reverse(),
      [...fixture.edges].reverse(),
    );
    const reordered = bind(requestFor(
      reorderedGraph,
      [...physical].reverse(),
      makeStage([...manifest].reverse()),
    ));

    expect(reordered).toEqual(first);
  });

  it('keeps converging routes distinct while resolving the same destination node', () => {
    const target = makeNode('node.shared', 'stage.shared', { depth: 2 });
    const sourceA = makeNode(SOURCE_ID, 'stage.source');
    const sourceB = makeNode('node.source.b', 'stage.source.b', { branchId: 'route-b' });
    const edgeA = makeEdge('edge.from-a', target.id);
    const edgeB = makeEdge('edge.from-b', target.id, { sourceNodeId: sourceB.id });
    const graph = makeGraph([sourceA, sourceB, target], [edgeA, edgeB]);
    const resultA = bind(requestFor(graph, [makePhysical(edgeA, 0)]));
    const stageB = {
      ...makeStage(),
      manifest: { ...makeStage().manifest, id: sourceB.stageId },
    };
    const physicalB: PhysicalExitResult = {
      ok: true,
      value: {
        nodeId: sourceB.id,
        stageId: sourceB.stageId,
        levelDigest: 'level.87654321',
        exits: [makePhysical(edgeB, 0)],
      },
    };
    const resultB = new CampaignExitBinder().bind({
      graph,
      sourceNodeId: sourceB.id,
      stage: stageB,
      physicalExitResult: physicalB,
    });

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (!resultA.ok || !resultB.ok) return;
    expect(resultA.value.bindings[0].targetNodeId).toBe(target.id);
    expect(resultB.value.bindings[0].targetNodeId).toBe(target.id);
    expect(resultA.value.bindings[0].edgeId).not.toBe(resultB.value.bindings[0].edgeId);
    expect(resultA.value.bindings[0].physicalExitId)
      .not.toBe(resultB.value.bindings[0].physicalExitId);
  });

  it('propagates a typed physical resolver failure without attempting a binding', () => {
    const fixture = simpleFixture();
    const physicalExitResult: PhysicalExitResult = {
      ok: false,
      error: {
        code: 'insufficient-exit-space',
        diagnostics: [{
          code: 'physical-exit.insufficient-space',
          severity: 'error',
          message: 'No space.',
          path: ['stage', 'level'],
        }],
      },
    };

    const result = new CampaignExitBinder().bind({
      graph: fixture.graph,
      sourceNodeId: SOURCE_ID,
      stage: makeStage(),
      physicalExitResult,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('physical-resolution-failed');
    expect(result.error.physicalExitFailure).toEqual(physicalExitResult.error);
  });

  it('returns the same immutable canonical resolution on repeated calls', () => {
    const fixture = simpleFixture(2);
    const request = requestFor(
      fixture.graph,
      fixture.edges.map((edge, index) => makePhysical(edge, index)),
    );

    const first = bind(request);
    const repeated = bind(request);

    expect(repeated).toEqual(first);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(Object.isFrozen(first.value)).toBe(true);
    expect(Object.isFrozen(first.value.bindings)).toBe(true);
    expect(first.value.bindings.every(binding => Object.isFrozen(binding))).toBe(true);
  });
});
