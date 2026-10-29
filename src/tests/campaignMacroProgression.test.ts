import {
  CampaignMacroProgression,
  CampaignRunSaveService,
  GameStageCompositionRoot,
  UMBRA_CAMPAIGN_SKELETON,
  validateCampaignMacroDefinition,
  type CampaignMacroCommand,
  type CampaignRunSavePort,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';

type MacroSession = CampaignMacroProgression;

function createPilotRun(storage?: MemorySaveStorage) {
  const memory = storage ?? new MemorySaveStorage();
  const root = new GameStageCompositionRoot({ campaignStorage: memory });
  const created = root.createBranchingCampaign({
    runId: 'run.macro-skeleton-test',
    runSeed: 'macro-seed-731',
  });
  if (!created.ok) throw created.error;
  return { storage: memory, run: created.value.router.state() };
}

function createMacroSession(storage?: MemorySaveStorage): {
  readonly storage: MemorySaveStorage;
  readonly session: MacroSession;
} {
  const pilot = createPilotRun(storage);
  const created = CampaignMacroProgression.create(
    UMBRA_CAMPAIGN_SKELETON,
    pilot.run,
    new CampaignRunSaveService({ storage: pilot.storage }),
  );
  if (!created.ok) throw created.error;
  return { storage: pilot.storage, session: created.value };
}

function process(session: MacroSession, command: CampaignMacroCommand) {
  const result = session.process(command);
  if (!result.ok) throw result.error;
  return result.value;
}

function completeRoute(session: MacroSession, routeId: string, ordinal: number): readonly string[] {
  const route = UMBRA_CAMPAIGN_SKELETON.routes.find(item => item.id === routeId);
  if (!route) throw new Error(`Unknown route ${routeId}.`);
  process(session, { type: 'route.enter', operationId: `test.${ordinal}.enter.${routeId}`, routeId });
  route.regions.forEach((region, index) => {
    if (index > 0) process(session, {
      type: 'route.region-entered',
      operationId: `test.${ordinal}.entered.${region.id}`,
      routeId,
      regionId: region.id,
    });
    process(session, {
      type: 'route.region-completed',
      operationId: `test.${ordinal}.completed.${region.id}`,
      routeId,
      regionId: region.id,
    });
  });
  return process(session, {
    type: 'milestone.completed',
    operationId: `test.${ordinal}.milestone.${routeId}`,
    milestoneId: route.completionMilestoneId,
  }).emittedOperationIds;
}

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index), ...values.slice(index + 1),
  ]).map(rest => [value, ...rest]));
}

describe('CampaignMacroProgression', () => {
  it('declares the hub, three independent routes, corrupted layer and final with stable identities', () => {
    expect(validateCampaignMacroDefinition(UMBRA_CAMPAIGN_SKELETON)).toEqual([]);
    expect(UMBRA_CAMPAIGN_SKELETON.hub).toMatchObject({
      id: 'hub.floresta-das-raizes', title: 'Floresta das Raízes', difficultyLayer: 0,
    });
    expect(UMBRA_CAMPAIGN_SKELETON.routes.map(route => ({
      id: route.id,
      regions: route.regions.map(region => region.title),
    }))).toEqual([
      { id: 'route.aguas', regions: ['Igapó', 'Mangues', 'Porto'] },
      { id: 'route.floresta', regions: ['Fungos', 'Copas', 'Flores'] },
      { id: 'route.terra', regions: ['Areias', 'Ruínas', 'Cicatriz'] },
    ]);
    expect(UMBRA_CAMPAIGN_SKELETON.corruptedLayer.regions.map(region => region.title))
      .toEqual(['Minas', 'Cinzas', 'Temporal', 'Complexo Industrial']);
    expect(UMBRA_CAMPAIGN_SKELETON.final.title).toBe('Palácio do Credor');
  });

  it('starts at Floresta das Raízes with every planned destination non-exposable', () => {
    const { session } = createMacroSession();
    const view = session.inspect();

    expect(view.currentLocation).toEqual({ kind: 'hub', hubId: 'hub.floresta-das-raizes' });
    expect(Object.values(view.routes).map(route => route.status)).toEqual([
      'not-started', 'not-started', 'not-started',
    ]);
    expect(view.choices.filter(choice => choice.kind === 'enter-route')).toHaveLength(3);
    expect(view.choices.every(choice => choice.requiresPhysicalExit)).toBe(true);
    expect(view.choices.every(choice => choice.exposePhysicalExit === false)).toBe(true);
    expect(view.choices.filter(choice => choice.unlocked).every(choice =>
      choice.blockedReason === 'content-not-loadable')).toBe(true);
  });

  it('produces deterministic World Lab inspections and rejects a route without hub return', () => {
    const first = createMacroSession().session.inspect();
    const second = createMacroSession().session.inspect();
    expect(second).toEqual(first);

    const invalid: any = structuredClone(UMBRA_CAMPAIGN_SKELETON);
    invalid.routes[0].regions.forEach((region: any) => { region.allowsHubReturn = false; });
    expect(validateCampaignMacroDefinition(invalid)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'macro.route.hub-return-missing', referenceId: 'route.aguas' }),
    ]));
  });

  it.each(permutations(UMBRA_CAMPAIGN_SKELETON.routes.map(route => route.id))
    .map(order => [order] as const))(
    'unlocks the corrupted layer after route order %j',
    order => {
      const { session } = createMacroSession();
      order.forEach((routeId, index) => completeRoute(session, routeId, index));

      const progress = session.macroProgress();
      expect(Object.values(progress.routes).every(route => route.status === 'completed')).toBe(true);
      expect(progress.corrupted.status).toBe('available');
      expect(progress.currentLocation.kind).toBe('hub');
    },
  );

  it('keeps the corrupted layer locked while one independent route is missing', () => {
    const { session } = createMacroSession();
    completeRoute(session, 'route.terra', 1);
    completeRoute(session, 'route.aguas', 2);

    expect(session.macroProgress().routes['route.floresta'].status).toBe('not-started');
    expect(session.macroProgress().corrupted.status).toBe('locked');
    const blocked = session.process({ type: 'corrupted.enter', operationId: 'test.corrupted.early' });
    expect(blocked).toMatchObject({ ok: false, error: { code: 'layer-locked' } });
  });

  it('returns to the hub and continues a route at its next ordered region', () => {
    const { session } = createMacroSession();
    const route = UMBRA_CAMPAIGN_SKELETON.routes[0];
    process(session, { type: 'route.enter', operationId: 'test.route.enter', routeId: route.id });
    process(session, {
      type: 'route.region-completed', operationId: 'test.route.first-complete',
      routeId: route.id, regionId: route.regions[0].id,
    });
    process(session, { type: 'hub.returned', operationId: 'test.route.return' });

    expect(session.macroProgress().currentLocation.kind).toBe('hub');
    expect(session.macroProgress().routes[route.id].completedRegionIds).toEqual([route.regions[0].id]);
    process(session, { type: 'route.enter', operationId: 'test.route.continue', routeId: route.id });
    expect(session.macroProgress().currentLocation).toEqual({
      kind: 'route', routeId: route.id, regionId: route.regions[1].id,
    });
  });

  it('does not complete a route from region count alone and enforces region order', () => {
    const { session } = createMacroSession();
    const route = UMBRA_CAMPAIGN_SKELETON.routes[1];
    process(session, { type: 'route.enter', operationId: 'test.order.enter', routeId: route.id });
    const skipped = session.process({
      type: 'route.region-completed', operationId: 'test.order.skip',
      routeId: route.id, regionId: route.regions[2].id,
    });
    expect(skipped).toMatchObject({ ok: false, error: { code: 'region-out-of-order' } });
    route.regions.forEach((region, index) => {
      if (index > 0) process(session, {
        type: 'route.region-entered', operationId: `test.order.entered-${index}`,
        routeId: route.id, regionId: region.id,
      });
      process(session, {
        type: 'route.region-completed', operationId: `test.order.completed-${index}`,
        routeId: route.id, regionId: region.id,
      });
    });
    expect(session.macroProgress().routes[route.id].status).toBe('in-progress');
    expect(session.macroProgress().corrupted.status).toBe('locked');
  });

  it('unlocks the final only after every corrupted region and its mandatory milestone', () => {
    const { session } = createMacroSession();
    UMBRA_CAMPAIGN_SKELETON.routes.forEach((route, index) => completeRoute(session, route.id, index));
    expect(session.macroProgress().finalStatus).toBe('locked');
    expect(session.process({ type: 'final.enter', operationId: 'test.final.early' }))
      .toMatchObject({ ok: false, error: { code: 'final-locked' } });

    process(session, { type: 'corrupted.enter', operationId: 'test.corrupted.enter' });
    UMBRA_CAMPAIGN_SKELETON.corruptedLayer.regions.forEach((region, index) => {
      if (index > 0) process(session, {
        type: 'corrupted.region-entered',
        operationId: `test.corrupted.entered-${index}`,
        regionId: region.id,
      });
      process(session, {
        type: 'corrupted.region-completed',
        operationId: `test.corrupted.completed-${index}`,
        regionId: region.id,
      });
    });
    expect(session.macroProgress().finalStatus).toBe('locked');
    const milestone = process(session, {
      type: 'milestone.completed',
      operationId: 'test.corrupted.milestone',
      milestoneId: UMBRA_CAMPAIGN_SKELETON.corruptedLayer.completionMilestoneId,
    });
    expect(milestone.emittedOperationIds).toEqual(['macro.complete.corrupted.primary.v1']);
    expect(session.macroProgress().finalStatus).toBe('available');
    process(session, { type: 'final.enter', operationId: 'test.final.enter' });
    expect(session.macroProgress()).toMatchObject({
      finalStatus: 'entered',
      currentLocation: { kind: 'final', finalId: 'final.palacio-do-credor' },
    });
  });

  it('deduplicates repeated events and never emits a milestone operation twice', () => {
    const { session } = createMacroSession();
    const emitted = completeRoute(session, 'route.aguas', 1);
    expect(emitted).toEqual(['macro.complete.route.aguas.v1']);
    const processedCount = session.macroProgress().processedOperationIds.length;

    const repeatedEvent = session.process({
      type: 'milestone.completed',
      operationId: 'test.1.milestone.route.aguas',
      milestoneId: 'milestone.route.aguas',
    });
    expect(repeatedEvent).toMatchObject({
      ok: true, value: { status: 'duplicate', emittedOperationIds: [], persistence: 'skipped' },
    });
    const differentEvent = session.process({
      type: 'milestone.completed',
      operationId: 'test.route.aguas.replayed-with-new-event',
      milestoneId: 'milestone.route.aguas',
    });
    expect(differentEvent).toMatchObject({
      ok: true, value: { status: 'duplicate', emittedOperationIds: [], persistence: 'skipped' },
    });
    expect(session.macroProgress().processedOperationIds).toHaveLength(processedCount);
  });

  it('persists and restores macro progress without losing graph identity or history', () => {
    const { storage, session } = createMacroSession();
    const graphBefore = session.state().graph;
    completeRoute(session, 'route.terra', 1);
    const bytes = storage.read('umbra-trail-run-v1');
    expect(bytes).toEqual(expect.any(String));

    const loaded = new CampaignRunSaveService({ storage }).load({
      campaignId: graphBefore.campaignId,
      campaignRevision: graphBefore.campaignRevision,
      runId: graphBefore.runId,
      runSeed: graphBefore.runSeed,
      graphId: graphBefore.id,
    });
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Run was not restored.');
    const restored = CampaignMacroProgression.create(UMBRA_CAMPAIGN_SKELETON, loaded.value.envelope.state);
    if (!restored.ok) throw restored.error;

    expect(restored.value.state().graph).toEqual(graphBefore);
    expect(restored.value.macroProgress().routes['route.terra'].status).toBe('completed');
    expect(restored.value.macroProgress().currentLocation.kind).toBe('hub');
  });

  it('keeps legacy run bytes free of macro state until explicit initialization', () => {
    const { storage, run } = createPilotRun();
    const before = storage.read('umbra-trail-run-v1');
    expect(JSON.parse(before as string).state.macroProgress).toBeUndefined();

    const loaded = new CampaignRunSaveService({ storage }).load();
    expect(loaded.ok).toBe(true);
    expect(storage.read('umbra-trail-run-v1')).toBe(before);
    const initialized = CampaignMacroProgression.create(
      UMBRA_CAMPAIGN_SKELETON,
      run,
      new CampaignRunSaveService({ storage }),
    );
    expect(initialized.ok).toBe(true);
    expect(JSON.parse(storage.read('umbra-trail-run-v1') as string).state.macroProgress)
      .toBeDefined();
  });

  it('rolls back memory when macro persistence fails', () => {
    const pilot = createPilotRun();
    const volatile = CampaignMacroProgression.create(UMBRA_CAMPAIGN_SKELETON, pilot.run);
    if (!volatile.ok) throw volatile.error;
    const failingSaves: CampaignRunSavePort = {
      save: () => ({
        ok: false,
        error: {
          code: 'storage-write-failed', message: 'disk full', diagnostics: [],
          recovery: 'previous-preserved',
        },
      }),
    };
    const created = CampaignMacroProgression.create(
      UMBRA_CAMPAIGN_SKELETON,
      volatile.value.state(),
      failingSaves,
    );
    if (!created.ok) throw created.error;
    const before = created.value.state();

    const result = created.value.process({
      type: 'route.enter', operationId: 'test.persistence.failure', routeId: 'route.aguas',
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'persistence-failed', recovery: 'rolled-back' },
    });
    expect(created.value.state()).toBe(before);
  });

  it('rejects inconsistent external macro snapshots without overwriting their bytes', () => {
    const { storage } = createMacroSession();
    const parsed = JSON.parse(storage.read('umbra-trail-run-v1') as string);
    parsed.state.macroProgress.finalStatus = 'entered';
    const corruptBytes = JSON.stringify(parsed);
    storage.write('umbra-trail-run-v1', corruptBytes);

    const loaded = new CampaignRunSaveService({ storage }).load();
    expect(loaded).toMatchObject({ ok: false, error: { code: 'invalid-state' } });
    expect(storage.read('umbra-trail-run-v1')).toBe(corruptBytes);
  });
});
