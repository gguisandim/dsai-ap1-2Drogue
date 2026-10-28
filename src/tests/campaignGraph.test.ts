import {
  CampaignGraphValidator,
} from '../stages';
import type {
  CampaignAct,
  CampaignEdge,
  CampaignGraph,
  CampaignNode,
} from '../stages';
import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../narrative';
import { narrativeContent, progression, saveIdentity } from './narrativeTestFixture';

const COMPLETE = 'campaign.complete';

function makeNode(
  overrides: Partial<CampaignNode> &
    Pick<CampaignNode, 'id' | 'slotId' | 'depth' | 'actId' | 'kind'>,
): CampaignNode {
  return {
    templateId: 'region.template-a',
    templateRevision: 1,
    stageId: 'legacy.start',
    stageSeed: `seed-${overrides.id}`,
    branchId: 'main',
    biomeId: 'cathedral',
    difficulty: 1,
    providesBeatIds: [],
    maximumPhysicalExits: 2,
    ...overrides,
  };
}

function makeEdge(
  id: string,
  sourceNodeId: string,
  targetNodeId: CampaignEdge['targetNodeId'],
  kind: CampaignEdge['kind'],
  exitSlotId: string,
): CampaignEdge {
  return {
    id,
    sourceNodeId,
    targetNodeId,
    exitSlotId,
    physicalExitId: `physical-${id.replace('edge.', '')}`,
    kind,
    traversalLimit: 1,
  };
}

function acts(): readonly CampaignAct[] {
  return [
    {
      id: 'act-1',
      ordinal: 1,
      depthRange: [0, 2],
      milestoneNodeId: 'node.act-1.milestone',
      requiredBeatIds: ['beat.act-1'],
    },
    {
      id: 'act-2',
      ordinal: 2,
      depthRange: [3, 5],
      milestoneNodeId: 'node.act-2.milestone',
      requiredBeatIds: ['beat.act-2'],
    },
    {
      id: 'act-3',
      ordinal: 3,
      depthRange: [6, 8],
      milestoneNodeId: 'node.act-3.milestone',
      requiredBeatIds: ['beat.act-3'],
    },
  ];
}

function validGraph(): CampaignGraph {
  const nodes: readonly CampaignNode[] = [
    makeNode({ id: 'node.entry', slotId: 'act-1.entry', depth: 0, actId: 'act-1', kind: 'intermediate' }),
    makeNode({ id: 'node.act-1.a', slotId: 'act-1.trail', depth: 1, actId: 'act-1', kind: 'intermediate' }),
    makeNode({
      id: 'node.act-1.milestone', slotId: 'act-1.milestone', depth: 2, actId: 'act-1',
      kind: 'milestone', providesBeatIds: ['beat.act-1'],
    }),
    makeNode({
      id: 'node.act-2.a', slotId: 'act-2.route-a', depth: 3, actId: 'act-2',
      kind: 'intermediate', branchId: 'route-a', stageId: 'legacy.route-a',
    }),
    makeNode({
      id: 'node.act-2.b', slotId: 'act-2.route-b', depth: 3, actId: 'act-2',
      kind: 'intermediate', branchId: 'route-b', stageId: 'legacy.route-b',
    }),
    makeNode({ id: 'node.act-2.rejoin', slotId: 'act-2.rejoin', depth: 4, actId: 'act-2', kind: 'intermediate' }),
    makeNode({
      id: 'node.act-2.milestone', slotId: 'act-2.milestone', depth: 5, actId: 'act-2',
      kind: 'milestone', providesBeatIds: ['beat.act-2'],
    }),
    makeNode({ id: 'node.act-3.a', slotId: 'act-3.trail', depth: 6, actId: 'act-3', kind: 'intermediate' }),
    makeNode({ id: 'node.act-3.b', slotId: 'act-3.approach', depth: 7, actId: 'act-3', kind: 'intermediate' }),
    makeNode({
      id: 'node.act-3.milestone', slotId: 'act-3.milestone', depth: 8, actId: 'act-3',
      kind: 'milestone', providesBeatIds: ['beat.act-3'],
    }),
  ];
  const edges: readonly CampaignEdge[] = [
    makeEdge('edge.01', 'node.entry', 'node.act-1.a', 'forward', 'exit.01'),
    makeEdge('edge.02', 'node.act-1.a', 'node.act-1.milestone', 'forward', 'exit.02'),
    makeEdge('edge.03', 'node.act-1.milestone', 'node.act-2.a', 'branch', 'exit.03'),
    makeEdge('edge.04', 'node.act-1.milestone', 'node.act-2.b', 'branch', 'exit.04'),
    makeEdge('edge.05', 'node.act-2.a', 'node.act-2.rejoin', 'rejoin', 'exit.05'),
    makeEdge('edge.06', 'node.act-2.b', 'node.act-2.rejoin', 'rejoin', 'exit.06'),
    makeEdge('edge.07', 'node.act-2.rejoin', 'node.act-2.milestone', 'forward', 'exit.07'),
    makeEdge('edge.08', 'node.act-2.milestone', 'node.act-3.a', 'forward', 'exit.08'),
    makeEdge('edge.09', 'node.act-3.a', 'node.act-3.b', 'forward', 'exit.09'),
    makeEdge('edge.10', 'node.act-3.b', 'node.act-3.milestone', 'forward', 'exit.10'),
    makeEdge('edge.11', 'node.act-3.milestone', COMPLETE, 'forward', 'exit.11'),
  ];
  return {
    schemaVersion: 1,
    generatorVersion: 1,
    id: 'graph.test',
    campaignId: 'campaign.test',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'run.test',
    runSeed: 'seed.2026',
    generationContextDigest: 'digest.abc',
    entryNodeId: 'node.entry',
    acts: acts(),
    nodes,
    edges,
    mandatoryBeatIds: ['beat.act-1', 'beat.act-2', 'beat.act-3'],
  };
}

function withNodes(graph: CampaignGraph, nodes: readonly CampaignNode[]): CampaignGraph {
  return { ...graph, nodes };
}

function withEdges(
  graph: CampaignGraph,
  update: (edge: CampaignEdge) => CampaignEdge,
): CampaignGraph {
  return { ...graph, edges: graph.edges.map(update) };
}

function codes(graph: CampaignGraph): string[] {
  return new CampaignGraphValidator().validate(graph).map(diagnostic => diagnostic.code);
}

function directorFor(identity = saveIdentity()) {
  const created = StageDirector.create(narrativeContent(), undefined, progression, { identity });
  if (!created.ok) throw created.error;
  return created.value;
}

function enter(director: ReturnType<typeof directorFor>): readonly string[] {
  director.process({
    id: 'event.enter',
    signal: { type: 'stage.entered', stageId: director.stageId },
  });
  return director.snapshot().processedEventIds;
}

describe('campaign graph contracts', () => {
  it('accepts a nine-position graph with three acts, a fork and a rejoin', () => {
    const graph = validGraph();

    expect(graph.nodes).toHaveLength(10);
    expect(new CampaignGraphValidator().validate(graph)).toEqual([]);
  });

  it('keeps two occurrences of the same template distinct while rejecting seed reuse', () => {
    const graph = validGraph();
    const routeA = graph.nodes.find(node => node.id === 'node.act-2.a') as CampaignNode;
    const routeB = graph.nodes.find(node => node.id === 'node.act-2.b') as CampaignNode;

    expect(routeA.templateId).toBe(routeB.templateId);
    expect(routeA.id).not.toBe(routeB.id);
    expect(routeA.stageSeed).not.toBe(routeB.stageSeed);
    expect(codes(graph)).toEqual([]);

    const colliding = withNodes(graph, graph.nodes.map(node =>
      node.id === routeB.id ? { ...node, stageSeed: routeA.stageSeed } : node));
    expect(codes(colliding)).toContain('campaign.graph.instance-collision');
  });

  it('rejects duplicate node ids and unknown edge references', () => {
    const graph = validGraph();
    const duplicated = withNodes(graph, [...graph.nodes, { ...graph.nodes[0] }]);
    expect(codes(duplicated)).toContain('campaign.graph.node-duplicate');

    const dangling = withEdges(graph, edge =>
      edge.id === 'edge.10' ? { ...edge, targetNodeId: 'node.missing' } : edge);
    expect(codes(dangling)).toContain('campaign.graph.edge-reference');
  });

  it('requires the depth 2, 5 and 8 milestones to close their acts', () => {
    const graph = validGraph();
    const demoted = withNodes(graph, graph.nodes.map(node =>
      node.id === 'node.act-2.milestone' ? { ...node, kind: 'intermediate' as const } : node));

    const diagnostics = new CampaignGraphValidator().validate(demoted);
    expect(diagnostics.map(diagnostic => diagnostic.code))
      .toEqual(expect.arrayContaining(['campaign.graph.node-milestone', 'campaign.graph.milestone-invalid']));
  });

  it('rejects forks without a common rejoin and wider than two nodes', () => {
    const graph = validGraph();
    const divergent = withEdges(graph, edge =>
      edge.id === 'edge.06' ? { ...edge, targetNodeId: 'node.act-2.milestone' } : edge);
    expect(codes(divergent)).toContain('campaign.graph.fork-rejoin');

    const thirdRoute = makeNode({
      id: 'node.act-2.c', slotId: 'act-2.route-c', depth: 3, actId: 'act-2',
      kind: 'intermediate', branchId: 'route-a',
    });
    expect(codes(withNodes(graph, [...graph.nodes, thirdRoute])))
      .toContain('campaign.graph.fork-width');
  });

  it('rejects regressive forward edges and cycles', () => {
    const graph = withEdges(validGraph(), edge =>
      edge.id === 'edge.10' ? { ...edge, targetNodeId: 'node.act-3.a' } : edge);
    const result = codes(graph);

    expect(result).toContain('campaign.graph.edge-depth');
    expect(result).toContain('campaign.graph.cycle');
  });

  it('rejects unreachable nodes and paths without a forward exit', () => {
    const graph = validGraph();
    const broken = { ...graph, edges: graph.edges.filter(edge => edge.id !== 'edge.09') };
    const result = codes(broken);

    expect(result).toContain('campaign.graph.unreachable');
    expect(result).toContain('campaign.graph.softlock');
  });

  it('accepts only the last milestone as predecessor of campaign.complete', () => {
    const graph = withEdges(validGraph(), edge =>
      edge.id === 'edge.10' ? { ...edge, targetNodeId: COMPLETE } : edge);
    expect(codes(graph)).toContain('campaign.graph.edge-completion');
  });

  it('validates return edges against the same act and the previous depth', () => {
    const graph = validGraph();
    const returns = [
      ...graph.edges,
      makeEdge('edge.12', 'node.act-3.b', 'node.act-3.a', 'return', 'exit.12'),
      makeEdge('edge.13', 'node.act-3.a', 'node.act-2.milestone', 'return', 'exit.13'),
    ];
    const result = codes({ ...graph, edges: returns });

    expect(result).toContain('campaign.graph.edge-return');
  });

  it('scopes identical template occurrences by stageInstanceId and preserves legacy ids', () => {
    const routeA = directorFor(saveIdentity({ stageInstanceId: 'node.act-2.a' }));
    const routeB = directorFor(saveIdentity({ stageInstanceId: 'node.act-2.b' }));
    const legacy = directorFor();

    const idsA = enter(routeA);
    const idsB = enter(routeB);
    const legacyIds = enter(legacy);

    expect(idsA[0]).toBe(
      'run.test.run-1.chapter.test.chapter.stage.test.stage.revision.3.instance.node.act-2.a.event.event.enter',
    );
    expect(legacyIds[0]).toBe(
      'run.test.run-1.chapter.test.chapter.stage.test.stage.revision.3.event.event.enter',
    );
    expect(idsA[0]).not.toBe(idsB[0]);
  });

  it('rejects a campaign save loaded under another node identity', () => {
    const saves = new CampaignSaveService(new MemorySaveStorage());
    expect(saves.save(saveIdentity({ stageInstanceId: 'node.act-2.a' }), new NarrativeState()).ok)
      .toBe(true);

    expect(saves.loadAndRestore(
      saveIdentity({ stageInstanceId: 'node.act-2.b' }),
      new NarrativeState(),
    )).toMatchObject({ ok: false, error: { code: 'identity-mismatch' } });
  });

  it('keeps legacy saves compatible through the stageId fallback', () => {
    const saves = new CampaignSaveService(new MemorySaveStorage());
    expect(saves.save(saveIdentity(), new NarrativeState()).ok).toBe(true);

    expect(saves.loadAndRestore(
      saveIdentity({ stageInstanceId: 'node.act-2.b' }),
      new NarrativeState(),
    )).toMatchObject({ ok: true, value: { status: 'loaded' } });
  });
});
