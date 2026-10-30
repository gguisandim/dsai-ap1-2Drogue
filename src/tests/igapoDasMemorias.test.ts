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
  ECO_DAS_AGUAS_DIALOGUE_ID,
  ECO_DAS_AGUAS_EVENT_ID,
  ECO_DAS_AGUAS_FLAG,
  ECO_DAS_AGUAS_INTEREST,
  IGAPO_DAS_MEMORIAS_STAGE,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_RETURN_ANCHOR,
  IGAPO_RETURN_EXIT_ID,
  StageLoader,
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

function navigate(adapter: GameMacroCampaignAdapter): void {
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
      revision: 1,
      chapterId: AGUAS_CHAPTER_MANIFEST.id,
      layout: { kind: 'authored' },
      exits: [{ id: IGAPO_RETURN_EXIT_ID, targetStageId: 'verse_01_atrium' }],
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

    first.value.level.tileMap[20][4] = 0;
    const third = stageLoader.load(request);
    if (!third.ok) throw third.error;
    expect(third.value.level.tileMap[20][4]).toBe(8);
  });

  it('has connected exploration, two viable branches and a reachable point of interest', () => {
    const level = loadIgapo().level;
    const map = level.tileMap;
    const spawn = findTile(map, 8);
    const all = reachable(map, spawn);

    expect(map).toHaveLength(25);
    expect(map.every(row => row.length === 40)).toBe(true);
    expect(map.flat().filter(tile => tile === 3).length).toBeGreaterThan(250);
    expect(map.flat().filter(tile => tile === 2).length).toBeGreaterThan(10);
    expect(all.has(tileKey(ECO_DAS_AGUAS_INTEREST.x, ECO_DAS_AGUAS_INTEREST.y))).toBe(true);
    expect(all.has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);

    const northCut = new Set([12, 13, 14].map(x => tileKey(x, 14)));
    const southCut = new Set([19, 20].map(y => tileKey(18, y)));
    expect(reachable(map, spawn, northCut)
      .has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);
    expect(reachable(map, spawn, southCut)
      .has(tileKey(IGAPO_RETURN_ANCHOR.x, IGAPO_RETURN_ANCHOR.y))).toBe(true);

    expect(level.tileMap).not.toEqual(VERSE_SECTIONS[1].tileMap);
  });

  it('places every encounter on reachable ground with portal clearance', () => {
    const level = loadIgapo().level;
    const spawn = findTile(level.tileMap, 8);
    const all = reachable(level.tileMap, spawn);
    const enemies = [
      ...level.enemies,
      ...(level.ambush ?? []),
      ...(level.waves ?? []).flatMap(wave => wave.enemies),
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
    expect(restored.value.registry.listEventRules(loaded.manifest.id)[0].id).toBe(ECO_DAS_AGUAS_EVENT_ID);
  });

  it('preserves hub, authored Igapó, hub and resumption through persisted macro state', () => {
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
    expect(reloadedInside.adapter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    const hubReload = create();
    navigate(hubReload.adapter);
    expect(hubReload.adapter.state().currentNodeId).toBe(nodeId);
    expect(hubReload.adapter.state().confirmedTransitionIds).toHaveLength(3);
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
    expect(migrated.value.adapter.state().graph.campaignRevision).toBe(3);
    expect(migrated.value.adapter.state().macroProgress?.definitionRevision).toBe(3);
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

