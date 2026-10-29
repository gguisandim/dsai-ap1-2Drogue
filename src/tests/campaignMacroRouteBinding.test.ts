import {
  CampaignRunSaveService,
  UMBRA_CAMPAIGN_ROUTE_SLICE,
  UMBRA_ROUTE_SLICE_HUB_CONTEXT,
  UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
  UmbraCampaignRouteSliceFactory,
  createUmbraCampaignRouteSliceGraph,
} from '../application/stages';
import { WorldLabMacroDataService } from '../devtools/world-lab';
import { MemorySaveStorage, type SaveStoragePort } from '../narrative';
import { StageLoader, StageRegistry, registerLegacyStages } from '../stages';

const HUB_TO_WATERS = 'connection.hub.floresta-das-raizes.route.aguas';
const IGAPO_TO_HUB = 'connection.region.aguas.igapo.hub.floresta-das-raizes';

function loader(): StageLoader {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  return new StageLoader(registry);
}

function create(storage?: SaveStoragePort) {
  const result = new UmbraCampaignRouteSliceFactory(loader(), storage).create({
    runId: 'run.route-slice-test',
    runSeed: 'seed.route-slice-test',
  });
  if (!result.ok) throw result.error;
  return result.value;
}

function navigate(
  binder: ReturnType<typeof create>['binder'],
  connectionId: string,
) {
  const prepared = binder.prepare(connectionId);
  if (!prepared.ok) throw new Error(JSON.stringify(prepared.error));
  const confirmed = binder.confirm(prepared.value.preparation.preparationId);
  if (!confirmed.ok) throw new Error(JSON.stringify(confirmed.error));
  return confirmed.value;
}

class ToggleStorage implements SaveStoragePort {
  public failWrites = false;
  public readonly memory = new MemorySaveStorage();

  public read(key: string): string | undefined {
    return this.memory.read(key);
  }

  public write(key: string, value: string): void {
    if (this.failWrites) throw new Error('write disabled for rollback test');
    this.memory.write(key, value);
  }
}

describe('CampaignMacroRouteBinder vertical slice', () => {
  it('declares only the hub and Igapó as explicit loadable legacy placeholders', () => {
    expect(UMBRA_CAMPAIGN_ROUTE_SLICE.revision).toBe(2);
    expect(UMBRA_CAMPAIGN_ROUTE_SLICE.hub.content).toMatchObject({
      kind: 'stage', stageId: 'verse_01_atrium', placeholder: { kind: 'legacy-map' },
    });
    const regions = UMBRA_CAMPAIGN_ROUTE_SLICE.routes.flatMap(route => route.regions);
    expect(regions.find(region => region.id === 'region.aguas.igapo')?.content).toMatchObject({
      kind: 'stage', stageId: 'verse_02_galeria', placeholder: { kind: 'legacy-map' },
    });
    expect(regions.filter(region => region.id !== 'region.aguas.igapo')
      .every(region => region.content.kind === 'planned')).toBe(true);
  });

  it('builds a deterministic valid graph with stable forward and return bindings', () => {
    const first = createUmbraCampaignRouteSliceGraph('run.slice-graph', 'seed.slice-graph');
    const second = createUmbraCampaignRouteSliceGraph('run.slice-graph', 'seed.slice-graph');
    expect(first).toEqual(second);
    if (!first.ok) throw first.error;
    expect(first.value.nodes).toHaveLength(9);
    expect(first.value.nodes.find(node => node.depth === 0)?.stageId).toBe('verse_01_atrium');
    expect(first.value.nodes.find(node => node.depth === 1)?.stageId).toBe('verse_02_galeria');
    expect(first.bindings.map(binding => binding.connectionId)).toEqual([
      HUB_TO_WATERS, IGAPO_TO_HUB,
    ]);
    expect(first.value.edges.find(edge => edge.id === first.bindings[1].edgeId)).toMatchObject({
      kind: 'return', traversalLimit: 2,
    });
  });

  it('navigates by physical exit through hub, Igapó, hub and route resumption', () => {
    const storage = new MemorySaveStorage();
    const session = create(storage);
    const initial = session.binder.inspect();
    if (!initial.ok) throw initial.error;
    const waters = initial.value.choices.find(choice => choice.choice.connectionId === HUB_TO_WATERS);
    expect(waters).toMatchObject({ status: 'bound', physicalExitId: expect.any(String) });
    expect(initial.value.choices.filter(choice => choice.choice.kind === 'enter-route' &&
      choice.choice.connectionId !== HUB_TO_WATERS).every(choice => choice.status === 'blocked')).toBe(true);

    const entered = navigate(session.binder, HUB_TO_WATERS);
    expect(entered.state).toMatchObject({
      activeGraphContextId: UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
      macroProgress: {
        currentLocation: { kind: 'route', routeId: 'route.aguas', regionId: 'region.aguas.igapo' },
        routes: { 'route.aguas': { status: 'in-progress' } },
      },
    });
    const runIdentity = {
      runId: entered.state.graph.runId,
      runSeed: entered.state.graph.runSeed,
      id: entered.state.graph.id,
    };

    const returned = navigate(session.binder, IGAPO_TO_HUB);
    expect(returned.state.activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    expect(returned.state.macroProgress?.currentLocation.kind).toBe('hub');
    expect(returned.state.parkedGraphContexts?.[UMBRA_ROUTE_SLICE_WATERS_CONTEXT]?.currentNodeId)
      .toBe(entered.state.currentNodeId);

    const restored = create(storage);
    expect(restored.persistence).toBe('restored');
    expect(restored.binder.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    const resumed = navigate(restored.binder, HUB_TO_WATERS);
    expect(resumed.state.activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);
    expect(resumed.state.currentNodeId).toBe(entered.state.currentNodeId);
    expect(resumed.state.graph).toMatchObject(runIdentity);
    expect(resumed.state.confirmedTransitionIds).toHaveLength(3);
    expect(Object.keys(resumed.state.rewards)).toHaveLength(3);
    expect(resumed.state.parkedGraphContexts?.[UMBRA_ROUTE_SLICE_HUB_CONTEXT]).toBeDefined();
  });

  it('keeps planned routes isolated and preserves state and bytes on blocked selection', () => {
    const storage = new MemorySaveStorage();
    const session = create(storage);
    const before = session.binder.state();
    const bytes = storage.read('umbra-trail-run-v1');
    const result = session.binder.prepare('connection.hub.floresta-das-raizes.route.floresta');

    expect(result).toMatchObject({ ok: false, error: { code: 'choice-blocked', recovery: 'unchanged' } });
    expect(session.binder.state()).toBe(before);
    expect(storage.read('umbra-trail-run-v1')).toBe(bytes);
    expect(before.macroProgress?.routes['route.floresta'].status).toBe('not-started');
  });

  it('rolls back in-memory navigation and preserves the previous save when persistence fails', () => {
    const storage = new ToggleStorage();
    const session = create(storage);
    const before = session.binder.state();
    const bytes = storage.read('umbra-trail-run-v1');
    const prepared = session.binder.prepare(HUB_TO_WATERS);
    if (!prepared.ok) throw prepared.error;
    storage.failWrites = true;
    const confirmed = session.binder.confirm(prepared.value.preparation.preparationId);

    expect(confirmed).toMatchObject({
      ok: false,
      error: { code: 'persistence-failed', recovery: 'rolled-back' },
    });
    expect(session.binder.state()).toBe(before);
    expect(storage.read('umbra-trail-run-v1')).toBe(bytes);
  });

  it('loads a legacy run without graph contexts and adds them only through explicit binding', () => {
    const graph = createUmbraCampaignRouteSliceGraph('run.legacy-context', 'seed.legacy-context');
    if (!graph.ok) throw graph.error;
    const storage = new MemorySaveStorage();
    const legacy = createCampaignRunStateForTest(graph.value);
    const saves = new CampaignRunSaveService({ storage });
    expect(saves.save(legacy).ok).toBe(true);
    const bytes = storage.read('umbra-trail-run-v1');
    const loaded = saves.load();
    expect(loaded.ok).toBe(true);
    expect(storage.read('umbra-trail-run-v1')).toBe(bytes);
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Legacy state not loaded.');
    expect(loaded.value.envelope.state.activeGraphContextId).toBeUndefined();
  });

  it('exposes the real bound connection and planned blocked choices through World Lab', () => {
    const generated = new WorldLabMacroDataService().generate('world-lab-route-slice');
    if (!generated.ok) throw generated.error;
    const waters = generated.value.connections.find(connection => connection.connectionId === HUB_TO_WATERS);
    expect(waters).toMatchObject({
      status: 'bound',
      contentKind: 'stage',
      stageId: 'verse_02_galeria',
      edgeId: expect.any(String),
      physicalExitId: expect.any(String),
    });
    expect(generated.value.connections.filter(connection => connection.connectionId !== HUB_TO_WATERS)
      .every(connection => connection.status === 'blocked')).toBe(true);
    expect(generated.value.graph.edges.find(edge => edge.id === waters?.edgeId)).toMatchObject({
      bindingStatus: 'bound',
      physicalExitId: waters?.physicalExitId,
    });
  });
});

function createCampaignRunStateForTest(
  graph: import('../stages').CampaignGraph,
): import('../application/stages').CampaignRunState {
  const entryEdges = graph.edges.filter(edge => edge.sourceNodeId === graph.entryNodeId).map(edge => edge.id);
  return {
    version: 1,
    graph,
    status: 'active',
    currentNodeId: graph.entryNodeId,
    visitedNodeIds: [graph.entryNodeId],
    traversedEdgeIds: [],
    revealedEdgeIds: entryEdges,
    revisitCounts: { [graph.entryNodeId]: 1 },
    physicalExits: {},
    nodeResumes: {},
    confirmedTransitionIds: [],
    rewards: {},
  };
}
