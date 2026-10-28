import {
  CampaignGraphGenerator,
  CampaignGraphValidator,
} from '../stages';
import type {
  CampaignGraph,
  CampaignGraphRequest,
  CampaignGraphResult,
  RegionTemplate,
} from '../stages';

function makeTemplate(
  overrides: Partial<RegionTemplate> & Pick<RegionTemplate, 'id' | 'stageId'>,
): RegionTemplate {
  return {
    revision: 1,
    allowedActIds: ['act-1', 'act-2', 'act-3'],
    allowedBiomeIds: ['cathedral'],
    difficulty: { minimum: 1, maximum: 9 },
    weight: 1,
    maximumPhysicalExits: 2,
    tags: [],
    providesBeatIds: ['beat.act-1', 'beat.act-2', 'beat.act-3'],
    revisit: 'repeatable',
    ...overrides,
  };
}

const RICH_CATALOG: readonly RegionTemplate[] = [
  makeTemplate({ id: 'region.a', stageId: 'legacy.a' }),
  makeTemplate({ id: 'region.b', stageId: 'legacy.b' }),
  makeTemplate({ id: 'region.c', stageId: 'legacy.c' }),
  makeTemplate({ id: 'region.d', stageId: 'legacy.d' }),
  makeTemplate({ id: 'region.e', stageId: 'legacy.e' }),
  makeTemplate({ id: 'region.f', stageId: 'legacy.f' }),
];

const MINIMAL_CATALOG: readonly RegionTemplate[] = [
  makeTemplate({ id: 'region.low-a', stageId: 'legacy.low-a', maximumPhysicalExits: 1 }),
  makeTemplate({ id: 'region.low-b', stageId: 'legacy.low-b', maximumPhysicalExits: 1 }),
];

function makeRequest(
  templates: readonly RegionTemplate[],
  overrides: Partial<CampaignGraphRequest> = {},
): CampaignGraphRequest {
  return {
    campaignId: 'campaign.test',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'run.1',
    runSeed: 'seed.2026',
    templates,
    context: {
      flags: {},
      completedEventIds: [],
      revealedBeatIds: [],
    },
    ...overrides,
  };
}

function generate(request: CampaignGraphRequest): CampaignGraph {
  const result = new CampaignGraphGenerator().generate(request);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function failWith(
  request: CampaignGraphRequest,
): Extract<CampaignGraphResult, { ok: false }> {
  const result = new CampaignGraphGenerator().generate(request);
  if (result.ok) throw new Error('expected the generator to fail');
  return result;
}

function nodesAt(graph: CampaignGraph, depth: number) {
  return graph.nodes.filter(node => node.depth === depth);
}

describe('campaign graph generator', () => {
  it('generates twelve nodes with three forks, three rejoin points and three milestones', () => {
    const graph = generate(makeRequest(RICH_CATALOG));

    expect(graph.nodes).toHaveLength(12);
    expect([...new Set(graph.nodes.map(node => node.depth))].sort((a, b) => a - b))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (const depth of [1, 3, 6]) expect(nodesAt(graph, depth)).toHaveLength(2);
    for (const depth of [0, 2, 4, 5, 7, 8]) expect(nodesAt(graph, depth)).toHaveLength(1);

    const milestones = [2, 5, 8].map(depth => nodesAt(graph, depth)[0]);
    expect(milestones.map(node => node.kind)).toEqual(['milestone', 'milestone', 'milestone']);
    expect(milestones[0].providesBeatIds).toContain('beat.act-1');
    expect(milestones[1].providesBeatIds).toContain('beat.act-2');
    expect(milestones[2].providesBeatIds).toContain('beat.act-3');

    const branchEdges = graph.edges.filter(edge => edge.kind === 'branch');
    const rejoinEdges = graph.edges.filter(edge => edge.kind === 'rejoin');
    expect(branchEdges).toHaveLength(6);
    expect(rejoinEdges).toHaveLength(6);

    for (const depth of [1, 3, 6]) {
      const pair = nodesAt(graph, depth);
      const successors = pair.map(node => new Set(graph.edges
        .filter(edge => edge.sourceNodeId === node.id)
        .map(edge => edge.targetNodeId)));
      expect(successors[0].size).toBe(1);
      expect(successors[1].size).toBe(1);
      expect([...successors[0]]).toEqual([...successors[1]]);
    }

    expect(new CampaignGraphValidator().validate(graph)).toEqual([]);
  });

  it('keeps node, edge, physical exit and stage seed identities distinct', () => {
    const graph = generate(makeRequest(RICH_CATALOG));

    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(graph.nodes.length);
    expect(new Set(graph.nodes.map(node => node.stageSeed)).size).toBe(graph.nodes.length);
    expect(new Set(graph.edges.map(edge => edge.id)).size).toBe(graph.edges.length);
    expect(new Set(graph.edges.map(edge => edge.physicalExitId)).size).toBe(graph.edges.length);

    const repeated = graph.nodes.filter(node =>
      graph.nodes.some(other => other.id !== node.id && other.templateId === node.templateId));
    expect(repeated.length).toBeGreaterThan(0);
    for (const node of repeated) {
      const peers = graph.nodes.filter(other =>
        other.id !== node.id && other.templateId === node.templateId);
      for (const peer of peers) {
        expect(node.id).not.toBe(peer.id);
        expect(node.stageSeed).not.toBe(peer.stageSeed);
      }
    }
  });

  it('is deterministic for equal requests and independent of catalog order', () => {
    const first = generate(makeRequest(RICH_CATALOG));
    const second = generate(makeRequest(RICH_CATALOG));
    const reversed = generate(makeRequest([...RICH_CATALOG].reverse()));

    expect(second).toEqual(first);
    expect(reversed).toEqual(first);
  });

  it('normalizes frozen context order and changes only seeds when runSeed changes', () => {
    const contextA = {
      flags: { 'flag.b': true, 'flag.a': 3 },
      completedEventIds: ['event.b', 'event.a'],
      revealedBeatIds: [] as string[],
    };
    const contextB = {
      flags: { 'flag.a': 3, 'flag.b': true },
      completedEventIds: ['event.a', 'event.b'],
      revealedBeatIds: [] as string[],
    };
    const first = generate(makeRequest(RICH_CATALOG, { context: contextA }));
    const reordered = generate(makeRequest(RICH_CATALOG, { context: contextB }));
    const otherSeed = generate(makeRequest(RICH_CATALOG, { runSeed: 'seed.other' }));

    expect(reordered).toEqual(first);
    expect(otherSeed).not.toEqual(first);
    expect(otherSeed.nodes.map(node => node.stageSeed).sort())
      .not.toEqual(first.nodes.map(node => node.stageSeed).sort());
  });

  it('falls back to nine nodes when templates cannot fork or converge', () => {
    const graph = generate(makeRequest(MINIMAL_CATALOG));

    expect(graph.nodes).toHaveLength(9);
    expect(graph.edges.some(edge => edge.kind === 'branch')).toBe(false);
    expect(graph.edges.some(edge => edge.kind === 'rejoin')).toBe(false);
    expect(new CampaignGraphValidator().validate(graph)).toEqual([]);
  });

  it('selects milestones by tag, difficulty and frozen narrative context', () => {
    const catalog: readonly RegionTemplate[] = [
      makeTemplate({
        id: 'region.generic-a', stageId: 'legacy.generic-a',
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
      makeTemplate({
        id: 'region.generic-b', stageId: 'legacy.generic-b',
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
      makeTemplate({
        id: 'region.generic-c', stageId: 'legacy.generic-c',
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
      makeTemplate({
        id: 'region.generic-d', stageId: 'legacy.generic-d',
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
      makeTemplate({
        id: 'region.decoy', stageId: 'legacy.decoy',
        tags: ['slot.act-1.entry'],
      }),
      makeTemplate({
        id: 'region.shallow', stageId: 'legacy.shallow',
        tags: ['slot.act-3.milestone'],
        difficulty: { minimum: 1, maximum: 3 },
      }),
      makeTemplate({
        id: 'region.temple', stageId: 'legacy.temple',
        tags: ['slot.act-3.milestone'],
        requiredFlags: [{ type: 'flag.equals', flag: 'run.blessed', value: true }],
      }),
    ];
    const blessed = {
      flags: { 'run.blessed': true },
      completedEventIds: [],
      revealedBeatIds: [],
    };

    for (let index = 0; index < 10; index += 1) {
      const graph = generate(makeRequest(catalog, {
        runSeed: `seed.${index}`,
        context: blessed,
      }));
      expect(nodesAt(graph, 8)[0].templateId).toBe('region.temple');
    }

    const unblessed = failWith(makeRequest(catalog, {
      context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
    }));
    expect(unblessed.error.code).toBe('milestone-unavailable');
  });

  it('returns typed failures for invalid requests, templates and impossible catalogs', () => {
    expect(failWith(makeRequest([], { campaignId: 'Campaign.Test' })).error.code)
      .toBe('invalid-request');

    expect(failWith(makeRequest([])).error.code)
      .toBe('insufficient-eligible-regions');

    expect(failWith(makeRequest([
      makeTemplate({ id: 'region.same', stageId: 'legacy.same' }),
      makeTemplate({ id: 'region.same', stageId: 'legacy.same-two' }),
    ])).error.code).toBe('duplicate-id');

    expect(failWith(makeRequest([
      makeTemplate({ id: 'region.bad', stageId: 'legacy.bad', weight: 0 }),
    ])).error.code).toBe('invalid-template');

    expect(failWith(makeRequest([
      makeTemplate({
        id: 'region.no-act-3-a', stageId: 'legacy.no-act-3-a', maximumPhysicalExits: 1,
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
      makeTemplate({
        id: 'region.no-act-3-b', stageId: 'legacy.no-act-3-b', maximumPhysicalExits: 1,
        providesBeatIds: ['beat.act-1', 'beat.act-2'],
      }),
    ], { runSeed: 'seed.2026' })).error.code).toBe('milestone-unavailable');
  });

  it('rejects a request whose context is not frozen scalar data', () => {
    const request = makeRequest(RICH_CATALOG);
    const invalid = {
      ...request,
      context: {
        ...request.context,
        flags: { broken: Number.NaN },
      },
    } as unknown as CampaignGraphRequest;

    expect(failWith(invalid).error.code).toBe('invalid-request');
  });
});
