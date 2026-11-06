import {
  CampaignRunSaveService,
  GameStageCompositionRoot,
  UMBRA_CAMPAIGN_ROUTE_SLICE,
  UMBRA_ROUTE_SLICE_HUB_CONTEXT,
  UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
} from '../application/stages';
import type { GameMacroCampaignAdapter } from '../application/stages';
import type { CampaignRunState } from '../application/stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { WorldLabMacroDataService } from '../devtools/world-lab';
import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
  type CampaignSaveIdentity,
} from '../narrative';
import {
  AGUAS_CHAPTER_MANIFEST,
  CORACAO_CORROMPIDO_ENCOUNTER_ID,
  CORACAO_CORROMPIDO_EXIT_ANCHOR,
  CORACAO_CORROMPIDO_MAP_HEIGHT,
  CORACAO_CORROMPIDO_MAP_WIDTH,
  CORACAO_CORROMPIDO_MISSION_ID,
  CORACAO_CORROMPIDO_RETURN_ANCHOR,
  CORACAO_CORROMPIDO_SOURCE,
  CORACAO_CORROMPIDO_STAGE,
  CORACAO_CORROMPIDO_STAGE_ID,
  ECO_DAS_AGUAS_DIALOGUE_ID,
  ECO_DAS_AGUAS_EVENT_ID,
  ECO_DAS_AGUAS_FLAG,
  ECO_DAS_AGUAS_INTEREST,
  ECO_DAS_AGUAS_NPC_ID,
  IGAPO_CORRUPTION_FOUND_FLAG,
  IGAPO_DISCOVERY_MISSION_ID,
  IGAPO_DAS_MEMORIAS_STAGE,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_MAP_HEIGHT,
  IGAPO_MAP_WIDTH,
  IGAPO_RETURN_ANCHOR,
  IGAPO_RETURN_EXIT_ID,
  StageLoader,
  StageCatalogService,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';

const WALKABLE = new Set([0, 5, 6, 7, 8, 9]);

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function loader(): StageLoader {
  return new StageLoader(registry());
}

function loadIgapo(runId = 'run.igapo-tests', runSeed = 'seed.igapo-tests') {
  const result = loader().load({ stageId: IGAPO_DAS_MEMORIAS_STAGE_ID, runId, runSeed });
  if (!result.ok) throw result.error;
  return result.value;
}

function loadCorruptedHeart(
  runId = 'run.corrupted-heart-tests',
  runSeed = 'seed.corrupted-heart-tests',
) {
  const result = loader().load({ stageId: CORACAO_CORROMPIDO_STAGE_ID, runId, runSeed });
  if (!result.ok) throw result.error;
  return result.value;
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

function findTile(map: readonly (readonly number[])[], tile: number): { x: number; y: number } {
  for (let y = 0; y < map.length; y += 1) {
    const x = map[y].indexOf(tile);
    if (x >= 0) return { x, y };
  }
  throw new Error(`tile ${tile} not found`);
}

function reachable(
  map: readonly (readonly number[])[],
  start: { readonly x: number; readonly y: number },
  blocked: ReadonlySet<string> = new Set(),
): ReadonlySet<string> {
  const visited = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const point = queue.shift()!;
    const key = tileKey(point.x, point.y);
    if (visited.has(key) || blocked.has(key) || !WALKABLE.has(map[point.y]?.[point.x])) continue;
    visited.add(key);
    queue.push(
      { x: point.x + 1, y: point.y },
      { x: point.x - 1, y: point.y },
      { x: point.x, y: point.y + 1 },
      { x: point.x, y: point.y - 1 },
    );
  }
  return visited;
}

/**
 * Flood-fills half-tile player-center positions whose 42x58 Arcade body does
 * not overlap any blocked tile. This catches routes that are connected by
 * tile but too narrow for the production character body.
 */
function physicallyReachable(
  map: readonly (readonly number[])[],
  start: { readonly x: number; readonly y: number },
): ReadonlySet<string> {
  const tileSize = 32;
  const step = tileSize / 2;
  const halfWidth = 42 / 2;
  const halfHeight = 58 / 2;
  const width = map[0].length * tileSize;
  const height = map.length * tileSize;
  const valid = (x: number, y: number): boolean => {
    if (x - halfWidth < 0 || y - halfHeight < 0 ||
      x + halfWidth > width || y + halfHeight > height) return false;
    const minX = Math.floor((x - halfWidth) / tileSize);
    const maxX = Math.floor((x + halfWidth - 0.001) / tileSize);
    const minY = Math.floor((y - halfHeight) / tileSize);
    const maxY = Math.floor((y + halfHeight - 0.001) / tileSize);
    for (let tileY = minY; tileY <= maxY; tileY += 1) {
      for (let tileX = minX; tileX <= maxX; tileX += 1) {
        if (!WALKABLE.has(map[tileY]?.[tileX])) return false;
      }
    }
    return true;
  };
  const startPixels = { x: start.x * tileSize + tileSize / 2, y: start.y * tileSize + tileSize / 2 };
  const visited = new Set<string>();
  const queue = [startPixels];
  while (queue.length > 0) {
    const point = queue.shift()!;
    const key = tileKey(point.x, point.y);
    if (visited.has(key) || !valid(point.x, point.y)) continue;
    visited.add(key);
    queue.push(
      { x: point.x + step, y: point.y },
      { x: point.x - step, y: point.y },
      { x: point.x, y: point.y + step },
      { x: point.x, y: point.y - step },
    );
  }
  return visited;
}

function physicalKey(point: { readonly x: number; readonly y: number }): string {
  return tileKey(point.x * 32 + 16, point.y * 32 + 16);
}

/**
 * Authored exits are narratively gated. Grant the access that the narrative
 * projection would produce, then exercise the macro transition itself.
 */
function grantNarrativeAccess(adapter: GameMacroCampaignAdapter): void {
  const inspected = adapter.inspect();
  if (!inspected.ok) throw inspected.error;
  const state = adapter.state();
  adapter.setAccess(Object.freeze({
    eligibleEdgeIds: Object.freeze(state.graph.edges
      .filter(edge => edge.sourceNodeId === state.currentNodeId)
      .map(edge => edge.id)
      .sort()),
    unlockedStageExitIds: Object.freeze(inspected.value.snapshot.destinations
      .map(destination => destination.stageExitId)
      .sort()),
  }));
}

function navigate(adapter: GameMacroCampaignAdapter): void {
  grantNarrativeAccess(adapter);
  const inspected = adapter.inspect();
  if (!inspected.ok) throw inspected.error;
  const prepared = adapter.prepare(inspected.value.snapshot.destinations[0].physicalExitId);
  if (!prepared.ok) throw prepared.error;
  const confirmed = adapter.confirm(prepared.value.preparationId);
  if (!confirmed.ok) throw confirmed.error;
}

describe('Igapó das Memórias authored chapter', () => {
  it('registers a valid self-contained manifest with stable references', () => {
    const stages = registry();
    expect(stages.getChapter(AGUAS_CHAPTER_MANIFEST.id)).toEqual(AGUAS_CHAPTER_MANIFEST);
    expect(stages.require(IGAPO_DAS_MEMORIAS_STAGE_ID).manifest).toMatchObject({
      revision: 2,
      chapterId: AGUAS_CHAPTER_MANIFEST.id,
      layout: { kind: 'authored' },
      exits: [{
        id: IGAPO_RETURN_EXIT_ID,
        targetStageId: CORACAO_CORROMPIDO_STAGE_ID,
        condition: { type: 'flag.equals', flag: IGAPO_CORRUPTION_FOUND_FLAG, value: true },
      }],
    });
    expect(stages.require(CORACAO_CORROMPIDO_STAGE_ID).manifest).toMatchObject({
      revision: 1,
      chapterId: AGUAS_CHAPTER_MANIFEST.id,
      order: 1,
      layout: { kind: 'authored' },
    });
    const diagnostics = stages.validate();
    expect(diagnostics.filter(item => item.severity === 'error')).toEqual([]);
    expect(diagnostics.filter(item => item.code === 'capability.unavailable')).toEqual([]);
  });

  it('loads deterministically without sharing mutable map state', () => {
    const stageLoader = loader();
    const request = {
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      runId: 'run.igapo-deterministic',
      runSeed: 'seed.igapo-deterministic',
    };
    const first = stageLoader.load(request);
    const second = stageLoader.load(request);
    if (!first.ok || !second.ok) throw new Error('Igapó did not load.');
    expect(first.value).toEqual(second.value);
    expect(first.value.diagnostics.filter(item => item.severity === 'error')).toEqual([]);

    first.value.level.tileMap[17][4] = 0;
    const third = stageLoader.load(request);
    if (!third.ok) throw third.error;
    expect(third.value.level.tileMap[17][4]).toBe(8);
  });

  it('has connected exploration, two viable branches and a reachable point of interest', () => {
    const level = loadIgapo().level;
    const map = level.tileMap;
    const spawn = findTile(map, 8);
    const all = reachable(map, spawn);

    expect(map).toHaveLength(IGAPO_MAP_HEIGHT);
    expect(map.every(row => row.length === IGAPO_MAP_WIDTH)).toBe(true);
    expect(IGAPO_MAP_WIDTH * 32).toBeGreaterThan(1280);
    expect(map.flat().filter(tile => tile === 3).length).toBeGreaterThan(1_000);
    expect(map.flat().filter(tile => tile === 2).length).toBeGreaterThan(20);
    expect(map[8][53]).toBe(3);
    expect(all.has(tileKey(ECO_DAS_AGUAS_INTEREST.x, ECO_DAS_AGUAS_INTEREST.y))).toBe(true);
    expect(all.has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);

    const northCut = new Set([42, 43].flatMap(x =>
      Array.from({ length: 8 }, (_, index) => tileKey(x, index + 9))));
    const southCut = new Set([17, 18].map(y => tileKey(31, y)));
    expect(reachable(map, spawn, northCut)
      .has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);
    expect(reachable(map, spawn, southCut)
      .has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);

    expect(level.tileMap).not.toEqual(VERSE_SECTIONS[1].tileMap);
  });

  it('places every encounter on reachable ground with portal clearance', () => {
    const loaded = loadIgapo();
    const level = loaded.level;
    const spawn = findTile(level.tileMap, 8);
    const all = reachable(level.tileMap, spawn);
    const enemies = [
      ...level.enemies,
      ...(level.ambush ?? []),
      ...(loaded.encounter?.waves ?? []).flatMap(wave => wave.enemies),
    ];
    expect(enemies.length).toBeGreaterThanOrEqual(5);
    enemies.forEach(enemy => {
      expect(WALKABLE.has(level.tileMap[enemy.y][enemy.x])).toBe(true);
      expect(all.has(tileKey(enemy.x, enemy.y))).toBe(true);
      enemy.patrol?.forEach(point => expect(all.has(tileKey(point.x, point.y))).toBe(true));
    });
    for (let y = IGAPO_RETURN_ANCHOR.y - 1; y <= IGAPO_RETURN_ANCHOR.y + 1; y += 1) {
      for (let x = IGAPO_RETURN_ANCHOR.x - 1; x <= IGAPO_RETURN_ANCHOR.x + 1; x += 1) {
        expect(WALKABLE.has(level.tileMap[y][x])).toBe(true);
      }
    }
  });

  it('keeps both panoramas traversable by the production 42x58 player body', () => {
    const igapo = loadIgapo().level;
    const igapoReachable = physicallyReachable(igapo.tileMap, findTile(igapo.tileMap, 8));
    expect(igapoReachable.has(physicalKey(ECO_DAS_AGUAS_INTEREST))).toBe(true);
    expect(igapoReachable.has(physicalKey(IGAPO_RETURN_ANCHOR))).toBe(true);

    const heart = loadCorruptedHeart().level;
    const heartReachable = physicallyReachable(heart.tileMap, findTile(heart.tileMap, 8));
    expect(heartReachable.has(physicalKey(CORACAO_CORROMPIDO_SOURCE))).toBe(true);
    expect(heartReachable.has(physicalKey(CORACAO_CORROMPIDO_EXIT_ANCHOR))).toBe(true);
    expect(heartReachable.has(physicalKey(CORACAO_CORROMPIDO_RETURN_ANCHOR))).toBe(true);
  });

  it('processes and persists Eco das Águas once, then traverses its dialogue', () => {
    const loaded = loadIgapo('run.echo', 'seed.echo');
    const identity: CampaignSaveIdentity = {
      campaignId: UMBRA_CAMPAIGN_ROUTE_SLICE.id,
      runId: 'run.echo',
      runSeed: 'seed.echo',
      chapterId: loaded.manifest.chapterId,
      stageId: loaded.manifest.id,
      manifestRevision: loaded.manifest.revision,
      stageInstanceId: 'node.campaign.umbra-trail.route-slice.run.echo.act-1.depth-1.main',
    };
    const content = {
      chapterId: loaded.manifest.chapterId,
      stageId: loaded.manifest.id,
      definition: loaded.narrative,
      npcs: loaded.npcs,
      dialogues: loaded.dialogues,
      missions: loaded.missions,
      events: loaded.events,
      exitIds: loaded.manifest.exits.map(exit => exit.id),
    };
    const first = StageDirector.create(content, undefined, { level: 1, unlockedContent: [] }, { identity });
    if (!first.ok) throw first.error;
    const event = first.value.process({
      id: 'scene.stage-entered',
      signal: { type: 'stage.entered', stageId: IGAPO_DAS_MEMORIAS_STAGE_ID },
    });
    if (!event.ok) throw event.error;
    expect(event.value.status).toBe('processed');
    expect(event.value.commands).toEqual(expect.arrayContaining([
      { type: 'dialogue.start', dialogueId: ECO_DAS_AGUAS_DIALOGUE_ID },
      { type: 'flag.set', flag: ECO_DAS_AGUAS_FLAG, value: true },
    ]));
    expect(first.value.snapshot().flags[ECO_DAS_AGUAS_FLAG]).toBe(true);

    const turn = first.value.dialogues.start(
      ECO_DAS_AGUAS_DIALOGUE_ID,
      first.value.state,
      { level: 1, unlockedContent: [] },
    );
    if (!turn.ok) throw turn.error;
    expect(turn.value.node.text).toContain('rosto sem nome');
    const ending = first.value.dialogues.continue(
      turn.value.session,
      first.value.state,
      { level: 1, unlockedContent: [] },
    );
    if (!ending.ok || ending.value.status !== 'active') throw new Error('Dialogue did not advance.');
    expect(ending.value.node.text).toContain('memórias do Igapó');

    const storage = new MemorySaveStorage();
    const saves = new CampaignSaveService(storage);
    expect(saves.save(identity, first.value.state).ok).toBe(true);
    const restoredState = new NarrativeState();
    expect(saves.loadAndRestore(identity, restoredState)).toMatchObject({
      ok: true,
      value: { status: 'loaded' },
    });
    const restored = StageDirector.create(
      content,
      restoredState.snapshot(),
      { level: 1, unlockedContent: [] },
      { identity },
    );
    if (!restored.ok) throw restored.error;
    const duplicate = restored.value.process({
      id: 'scene.stage-entered',
      signal: { type: 'stage.entered', stageId: IGAPO_DAS_MEMORIAS_STAGE_ID },
    });
    expect(duplicate).toMatchObject({ ok: true, value: { status: 'duplicate', commands: [] } });
    const laterOccurrence = restored.value.process({
      id: 'scene.stage-entered.reload',
      signal: { type: 'stage.entered', stageId: IGAPO_DAS_MEMORIAS_STAGE_ID },
    });
    expect(laterOccurrence).toMatchObject({ ok: true, value: { status: 'processed', commands: [] } });
    expect(restored.value.snapshot().flags[ECO_DAS_AGUAS_FLAG]).toBe(true);
    expect(restored.value.registry.listEventRules(loaded.manifest.id)
      .some(rule => rule.id === ECO_DAS_AGUAS_EVENT_ID)).toBe(true);
  });

  it('completes the discovery mission and unlocks the eastern exit through npc.interacted', () => {
    const loaded = loadIgapo('run.discovery', 'seed.discovery');
    const created = StageDirector.create({
      chapterId: loaded.manifest.chapterId,
      stageId: loaded.manifest.id,
      definition: loaded.narrative,
      npcs: loaded.npcs,
      dialogues: loaded.dialogues,
      missions: loaded.missions,
      events: loaded.events,
      exitIds: loaded.manifest.exits.map(exit => exit.id),
    }, undefined, { level: 1, unlockedContent: [] }, {
      identity: Object.freeze({
        campaignId: UMBRA_CAMPAIGN_ROUTE_SLICE.id,
        runId: 'run.discovery',
        runSeed: 'seed.discovery',
        chapterId: loaded.manifest.chapterId,
        stageId: loaded.manifest.id,
        manifestRevision: loaded.manifest.revision,
        stageInstanceId: 'node.discovery',
      }),
    });
    if (!created.ok) throw created.error;
    expect(created.value.process({
      id: 'discovery.entered',
      signal: { type: 'stage.entered', stageId: IGAPO_DAS_MEMORIAS_STAGE_ID },
    }).ok).toBe(true);
    expect(created.value.snapshot().missionStates[IGAPO_DISCOVERY_MISSION_ID]?.status).toBe('active');

    const interacted = created.value.process({
      id: 'discovery.npc',
      signal: { type: 'npc.interacted', npcId: ECO_DAS_AGUAS_NPC_ID },
    });
    if (!interacted.ok) throw interacted.error;
    const snapshot = created.value.snapshot();
    expect(snapshot.missionStates[IGAPO_DISCOVERY_MISSION_ID]?.status).toBe('completed');
    expect(snapshot.flags[IGAPO_CORRUPTION_FOUND_FLAG]).toBe(true);
    expect(snapshot.unlockedExitIds).toContain(IGAPO_RETURN_EXIT_ID);
    expect(snapshot.completedStageOccurrences).toEqual([
      expect.objectContaining({ exitId: IGAPO_RETURN_EXIT_ID }),
    ]);
  });

  it('loads an independent corrupted panorama with its own encounter and connected conclusion', () => {
    const loaded = loadCorruptedHeart();
    const map = loaded.level.tileMap;
    const spawn = findTile(map, 8);
    const all = reachable(map, spawn);

    expect(map).toHaveLength(CORACAO_CORROMPIDO_MAP_HEIGHT);
    expect(map.every(row => row.length === CORACAO_CORROMPIDO_MAP_WIDTH)).toBe(true);
    expect(CORACAO_CORROMPIDO_MAP_WIDTH * 32).toBeGreaterThan(1280);
    expect(all.has(tileKey(
      CORACAO_CORROMPIDO_EXIT_ANCHOR.x,
      CORACAO_CORROMPIDO_EXIT_ANCHOR.y,
    ))).toBe(true);
    expect(loaded.encounter?.id).toBe(CORACAO_CORROMPIDO_ENCOUNTER_ID);
    expect(loaded.encounter?.waves.flatMap(wave => wave.enemies)).toHaveLength(5);
    expect(loaded.manifest.completionMissionId).toBe(CORACAO_CORROMPIDO_MISSION_ID);
    expect(loaded.level.tileMap).not.toEqual(loadIgapo().level.tileMap);
    expect(CORACAO_CORROMPIDO_STAGE.authoredLevel?.tileMap)
      .not.toEqual(IGAPO_DAS_MEMORIAS_STAGE.authoredLevel?.tileMap);
  });

  it('reserves the corrupted phase for narrative sequencing instead of random composition', () => {
    const catalog = StageCatalogService.create(registry());
    if (!catalog.ok) throw new Error('Stage catalog did not load.');
    expect(catalog.value.get(CORACAO_CORROMPIDO_STAGE_ID)).toMatchObject({
      participation: 'narrative-milestone',
      eligibility: 'narrative-reserved',
      loadability: 'loadable',
    });
    expect(catalog.value.candidates().map(candidate => candidate.stageId))
      .not.toContain(CORACAO_CORROMPIDO_STAGE_ID);
  });

  it('completes the corrupted confrontation through the existing narrative runtime', () => {
    const loaded = loadCorruptedHeart('run.corrupted-narrative', 'seed.corrupted-narrative');
    const identity: CampaignSaveIdentity = {
      campaignId: UMBRA_CAMPAIGN_ROUTE_SLICE.id,
      runId: 'run.corrupted-narrative',
      runSeed: 'seed.corrupted-narrative',
      chapterId: loaded.manifest.chapterId,
      stageId: loaded.manifest.id,
      manifestRevision: loaded.manifest.revision,
      stageInstanceId: 'node.corrupted-heart',
    };
    const created = StageDirector.create({
      chapterId: loaded.manifest.chapterId,
      stageId: loaded.manifest.id,
      definition: loaded.narrative,
      npcs: loaded.npcs,
      dialogues: loaded.dialogues,
      missions: loaded.missions,
      events: loaded.events,
      exitIds: loaded.manifest.exits.map(exit => exit.id),
    }, undefined, { level: 1, unlockedContent: [] }, { identity });
    if (!created.ok) throw created.error;
    const entered = created.value.process({
      id: 'corrupted.entered',
      signal: { type: 'stage.entered', stageId: CORACAO_CORROMPIDO_STAGE_ID },
    });
    if (!entered.ok) throw entered.error;
    expect(created.value.snapshot().missionStates[CORACAO_CORROMPIDO_MISSION_ID]?.status)
      .toBe('active');

    const completed = created.value.process({
      id: 'corrupted.encounter-completed',
      signal: { type: 'encounter.completed', encounterId: CORACAO_CORROMPIDO_ENCOUNTER_ID },
    });
    if (!completed.ok) throw completed.error;
    expect(created.value.snapshot().missionStates[CORACAO_CORROMPIDO_MISSION_ID]?.status)
      .toBe('completed');
    expect(completed.value.commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'stage.complete' }),
      expect.objectContaining({ type: 'dialogue.start' }),
    ]));
    expect(created.value.snapshot().completedStageOccurrences).toHaveLength(1);
  });

  it('preserves hub, both water phases, hub and resumption through persisted macro state', () => {
    const storage = new MemorySaveStorage();
    const create = () => {
      const result = new GameStageCompositionRoot({ campaignStorage: storage }).createMacroCampaign({
        runId: 'run.igapo-cycle',
        runSeed: 'seed.igapo-cycle',
      });
      if (!result.ok) throw result.error;
      return result.value;
    };
    const first = create();
    navigate(first.adapter);
    const entered = first.adapter.inspect();
    if (!entered.ok) throw entered.error;
    const nodeId = entered.value.currentNode.id;
    expect(entered.value.loadedStage.manifest.id).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(first.adapter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);

    const reloadedInside = create();
    const restored = reloadedInside.adapter.inspect();
    if (!restored.ok) throw restored.error;
    expect(reloadedInside.persistence).toBe('restored');
    expect(restored.value.currentNode.id).toBe(nodeId);
    expect(restored.value.loadedStage.manifest.id).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);

    navigate(reloadedInside.adapter);
    const corrupted = reloadedInside.adapter.inspect();
    if (!corrupted.ok) throw corrupted.error;
    expect(corrupted.value.loadedStage.manifest.id).toBe(CORACAO_CORROMPIDO_STAGE_ID);
    expect(reloadedInside.adapter.state().activeGraphContextId)
      .toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);

    const reloadedCorrupted = create();
    const restoredCorrupted = reloadedCorrupted.adapter.inspect();
    if (!restoredCorrupted.ok) throw restoredCorrupted.error;
    expect(restoredCorrupted.value.loadedStage.manifest.id).toBe(CORACAO_CORROMPIDO_STAGE_ID);
    const corruptedNodeId = restoredCorrupted.value.currentNode.id;
    navigate(reloadedCorrupted.adapter);
    expect(reloadedCorrupted.adapter.state().activeGraphContextId)
      .toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);

    const hubReload = create();
    navigate(hubReload.adapter);
    expect(hubReload.adapter.state().currentNodeId).toBe(corruptedNodeId);
    expect(hubReload.adapter.state().currentNodeId).not.toBe(nodeId);
    expect(hubReload.adapter.state().confirmedTransitionIds).toHaveLength(4);
  });

  it('migrates a revision 2 route save explicitly without losing its active region', () => {
    const current = new GameStageCompositionRoot().createMacroCampaign({
      runId: 'run.igapo-revision-2',
      runSeed: 'seed.igapo-revision-2',
    });
    if (!current.ok) throw current.error;
    navigate(current.value.adapter);
    const revision3 = current.value.adapter.state();
    const oldGraph = Object.freeze({
      ...revision3.graph,
      campaignRevision: 2,
      nodes: Object.freeze(revision3.graph.nodes.map(node => Object.freeze({
        ...node,
        stageId: node.depth === 1 ? 'verse_02_galeria' : node.stageId,
      }))),
    });
    const revision2: CampaignRunState = {
      ...revision3,
      graph: oldGraph,
      physicalExits: {},
      nodeResumes: {},
      macroProgress: revision3.macroProgress
        ? { ...revision3.macroProgress, definitionRevision: 2 }
        : undefined,
      parkedGraphContexts: Object.fromEntries(Object.entries(revision3.parkedGraphContexts ?? {})
        .map(([contextId, context]) => [contextId, {
          ...context,
          graph: oldGraph,
          physicalExits: {},
          nodeResumes: {},
        }])),
    };
    const storage = new MemorySaveStorage();
    const saves = new CampaignRunSaveService({ storage });
    expect(saves.save(revision2).ok).toBe(true);
    const previousBytes = storage.read('umbra-trail-run-v1');

    const migrated = new GameStageCompositionRoot({ campaignStorage: storage }).createMacroCampaign({
      runId: 'run.igapo-revision-2',
      runSeed: 'seed.igapo-revision-2',
    });
    if (!migrated.ok) throw migrated.error;
    const inspected = migrated.value.adapter.inspect();
    if (!inspected.ok) throw inspected.error;

    expect(migrated.value.persistence).toBe('restored');
    expect(inspected.value.currentNode.stageId).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(migrated.value.adapter.state().graph.campaignRevision).toBe(5);
    expect(migrated.value.adapter.state().macroProgress?.definitionRevision).toBe(5);
    expect(migrated.value.adapter.state().confirmedTransitionIds)
      .toEqual(revision2.confirmedTransitionIds);
    expect(storage.read('umbra-trail-run-v1')).not.toBe(previousBytes);
  });

  it('projects real geometry, encounters, interest and physical return in World Lab', () => {
    const generated = new WorldLabMacroDataService().generate('world-lab-igapo-authored');
    if (!generated.ok) throw generated.error;
    const macroNode = generated.value.nodes.find(node => node.id === 'region.aguas.igapo');
    expect(macroNode).toMatchObject({
      title: 'Igapó das Memórias',
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      contentState: 'loadable',
      legacyPlaceholder: false,
    });
    const stage = generated.value.graph.stages.find(item => item.nodeId === macroNode?.stageNodeId);
    expect(stage?.tiles.flat()).toContain(3);
    expect(stage?.tiles.flat()).toContain(2);
    expect(stage?.markers).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'spawn' }),
      expect.objectContaining({ kind: 'enemy' }),
      expect.objectContaining({ kind: 'npc', x: ECO_DAS_AGUAS_INTEREST.x, y: ECO_DAS_AGUAS_INTEREST.y }),
      expect.objectContaining({ kind: 'anchor', id: IGAPO_RETURN_EXIT_ID }),
      expect.objectContaining({ kind: 'physical-exit', x: IGAPO_RETURN_ANCHOR.x, y: IGAPO_RETURN_ANCHOR.y }),
    ]));
    expect(generated.value.graph.diagnostics.filter(diagnostic =>
      diagnostic.nodeId === macroNode?.stageNodeId && diagnostic.severity === 'error')).toEqual([]);
  });

  it('leaves the legacy Galeria Sombria registered and unchanged', () => {
    const legacy = loader().load({
      stageId: 'verse_02_galeria',
      runId: 'run.legacy-unchanged',
      runSeed: 'seed.legacy-unchanged',
    });
    if (!legacy.ok) throw legacy.error;
    expect(legacy.value.level).toEqual(VERSE_SECTIONS[1]);
    expect(legacy.value.level.name).toBe('Galeria Sombria');
    expect(IGAPO_DAS_MEMORIAS_STAGE.authoredLevel?.tileMap).not.toEqual(VERSE_SECTIONS[1].tileMap);
  });
});
