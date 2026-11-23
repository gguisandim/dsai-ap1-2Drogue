import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  StageCatalogService,
  StageLoader,
  StageRegistry,
  StageValidator,
  registerCampaignChapters,
  registerLegacyStages,
  type StageModule,
} from '../stages';
import { UMBRA_CAMPAIGN_SKELETON } from '../application/stages';
import { CAMPAIGN_CHAPTER_CATALOG } from '../stages/chapters/CampaignChapterCatalog';
import {
  PALACIO_DO_CREDOR_ACCEPTED_FLAG,
  PALACIO_DO_CREDOR_ARUA_ID,
  PALACIO_DO_CREDOR_BOSS,
  PALACIO_DO_CREDOR_CHAPTER_ID,
  PALACIO_DO_CREDOR_DEFEATED_FLAG,
  PALACIO_DO_CREDOR_ENCOUNTER_ID,
  PALACIO_DO_CREDOR_ENTRY_FLAG,
  PALACIO_DO_CREDOR_EXIT,
  PALACIO_DO_CREDOR_EXIT_ID,
  PALACIO_DO_CREDOR_HEIGHT,
  PALACIO_DO_CREDOR_MISSION_ID,
  PALACIO_DO_CREDOR_REFUSED_FLAG,
  PALACIO_DO_CREDOR_SPAWN,
  PALACIO_DO_CREDOR_STAGE,
  PALACIO_DO_CREDOR_STAGE_ID,
  PALACIO_DO_CREDOR_WIDTH,
  PALACIO_CORRUPTED_THEME_ID,
  PALACIO_CORRUPTED_VARIANT_ID,
  PALACIO_DECAYED_VARIANT_ID,
  PALACIO_THEME_ID,
  createPalacioDoCredorMap,
} from '../stages/chapters/palacio-do-credor';
import {
  PALACIO_ASSETS,
  PALACIO_CREDOR_TEXTURE_KEY,
} from '../presentation/assets/palacioAssetCatalog';
import { WorldLabDataService } from '../devtools/world-lab';

const WALKABLE = new Set([0, 5, 6, 7, 8, 9]);

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function load(variantId?: string) {
  const result = new StageLoader(registry()).load({
    stageId: PALACIO_DO_CREDOR_STAGE_ID,
    runId: 'run.palacio.tests',
    runSeed: 'seed.palacio.tests',
    ...(variantId ? { presentationVariantId: variantId } : {}),
  });
  if (!result.ok) throw result.error;
  return result.value;
}

function reachable(
  map: readonly (readonly number[])[],
  start: Readonly<{ x: number; y: number }>,
): ReadonlySet<string> {
  const visited = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const point = queue.shift()!;
    const key = `${point.x},${point.y}`;
    if (visited.has(key) || !WALKABLE.has(map[point.y]?.[point.x])) continue;
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

describe('Palácio do Credor', () => {
  it('registers the chapter and exposes it in individual mode', () => {
    expect(CAMPAIGN_CHAPTER_CATALOG.some(entry =>
      entry.chapter.id === PALACIO_DO_CREDOR_CHAPTER_ID)).toBe(true);
    const catalog = StageCatalogService.create(registry());
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    const entry = catalog.value.get(PALACIO_DO_CREDOR_STAGE_ID);
    expect(entry).toMatchObject({
      chapterId: PALACIO_DO_CREDOR_CHAPTER_ID,
      loadability: 'loadable',
      eligibility: 'individual-only',
    });
    expect(entry?.regionIds).toEqual(['final.palacio-do-credor']);
    const loaded = load();
    expect(loaded.manifest.id).toBe(PALACIO_DO_CREDOR_STAGE_ID);
    expect(loaded.npcs).toHaveLength(3);
  });

  it('keeps the canonical macro final region planned and unbound', () => {
    expect(UMBRA_CAMPAIGN_SKELETON.final.id).toBe('final.palacio-do-credor');
    expect(UMBRA_CAMPAIGN_SKELETON.final.content.kind).toBe('planned');
    expect(UMBRA_CAMPAIGN_SKELETON.final.unlockCondition).toMatchObject({
      type: 'milestone.completed',
      milestoneId: 'milestone.corrupted.primary',
    });
    const entry = CAMPAIGN_CHAPTER_CATALOG.find(item =>
      item.chapter.id === PALACIO_DO_CREDOR_CHAPTER_ID);
    expect(entry?.regions).toEqual([]);
  });

  it('validates manifest, IDs, exits, NPCs and narrative through the real validator', () => {
    const diagnostics = new StageValidator().validateModule(PALACIO_DO_CREDOR_STAGE);
    expect(diagnostics.filter(item => item.severity === 'error')).toEqual([]);
    expect(PALACIO_DO_CREDOR_STAGE.manifest.exits).toEqual([expect.objectContaining({
      id: PALACIO_DO_CREDOR_EXIT_ID,
      targetStageId: 'campaign.complete',
      condition: { type: 'flag.equals', flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true },
    })]);
    expect(PALACIO_DO_CREDOR_STAGE.manifest.completionMissionId).toBe(PALACIO_DO_CREDOR_MISSION_ID);
    expect(PALACIO_DO_CREDOR_STAGE.manifest.entryDialogueId).toBeTruthy();
  });

  it('has a closed dialogue graph with valid speakers and choices', () => {
    const stage = PALACIO_DO_CREDOR_STAGE;
    const npcIds = new Set((stage.npcs ?? []).map(npc => npc.id));
    const dialogueIds = new Set((stage.dialogues ?? []).map(dialogue => dialogue.id));
    for (const dialogue of stage.dialogues ?? []) {
      const nodeIds = new Set(dialogue.nodes.map(node => node.id));
      expect(nodeIds.has(dialogue.startNodeId)).toBe(true);
      for (const node of dialogue.nodes) {
        if (node.speakerId !== 'player' && node.speakerId !== 'narrator') {
          expect(npcIds.has(node.speakerId)).toBe(true);
        }
        if (node.nextNodeId) expect(nodeIds.has(node.nextNodeId)).toBe(true);
        for (const choice of node.choices ?? []) {
          expect(nodeIds.has(choice.nextNodeId)).toBe(true);
          for (const command of choice.commands ?? []) {
            if (command.type === 'dialogue.start') expect(dialogueIds.has(command.dialogueId)).toBe(true);
          }
        }
      }
    }
    const arua = stage.dialogues?.find(dialogue => dialogue.nodes.some(node =>
      node.choices?.some(choice => choice.id === 'choice.final.palacio.recusar')));
    expect(arua).toBeDefined();
  });

  it('declares a real victory condition, mission and persistent epilogue', () => {
    const mission = PALACIO_DO_CREDOR_STAGE.missions?.find(item =>
      item.id === PALACIO_DO_CREDOR_MISSION_ID);
    expect(mission).toBeDefined();
    expect(mission?.start).toBe('stage-enter');
    expect(mission?.objectives).toEqual(expect.arrayContaining([
      expect.objectContaining({
        signal: 'npc.interacted',
        filter: { field: 'npcId', equals: PALACIO_DO_CREDOR_ARUA_ID },
      }),
      expect.objectContaining({
        signal: 'encounter.completed',
        filter: { field: 'encounterId', equals: PALACIO_DO_CREDOR_ENCOUNTER_ID },
      }),
    ]));
    expect(mission?.rewards).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'progression.unlock', contentId: 'beat.final.palacio-do-credor' }),
      expect.objectContaining({ type: 'stage.flag', flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true }),
    ]));

    const completionEvents = (PALACIO_DO_CREDOR_STAGE.events ?? []).filter(event =>
      event.when === 'mission.completed' &&
      event.filter?.field === 'missionId' &&
      event.filter.equals === PALACIO_DO_CREDOR_MISSION_ID);
    expect(completionEvents).toHaveLength(3);
    const commands = completionEvents.flatMap(event => event.commands);
    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'flag.set', flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true }),
      expect.objectContaining({ type: 'exit.unlock', exitId: PALACIO_DO_CREDOR_EXIT_ID }),
      expect.objectContaining({ type: 'reward.grant' }),
    ]));
    const exitEvent = (PALACIO_DO_CREDOR_STAGE.events ?? []).find(event =>
      event.when === 'stage.exit.requested' &&
      event.filter?.field === 'exitId' &&
      event.filter.equals === PALACIO_DO_CREDOR_EXIT_ID);
    expect(exitEvent?.condition).toEqual({
      type: 'flag.equals', flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true,
    });
    expect(exitEvent?.commands).toEqual([
      expect.objectContaining({ type: 'stage.complete', exitId: PALACIO_DO_CREDOR_EXIT_ID }),
    ]);
    expect(JSON.stringify(completionEvents.map(event => event.condition))).toContain(PALACIO_DO_CREDOR_REFUSED_FLAG);
    expect(JSON.stringify(completionEvents.map(event => event.condition))).toContain(PALACIO_DO_CREDOR_ACCEPTED_FLAG);
    expect(JSON.stringify(PALACIO_DO_CREDOR_STAGE.narrative?.flags)).toContain(PALACIO_DO_CREDOR_ENTRY_FLAG);
  });

  it('gates the boss behind sequential waves and a walkable encounter', () => {
    const encounter = PALACIO_DO_CREDOR_STAGE.encounter;
    expect(encounter?.source.kind).toBe('authored-waves');
    if (encounter?.source.kind !== 'authored-waves') return;
    const waves = encounter.source.waves;
    expect(waves).toHaveLength(4);
    expect(waves[0].delayBeforeMs).toBe(0);
    const lastWave = waves[waves.length - 1];
    expect(lastWave.enemies.some(enemy => enemy.type === 'boss')).toBe(true);
    expect(waves.slice(0, -1).flatMap(wave => wave.enemies)
      .some(enemy => enemy.type === 'boss')).toBe(false);
    const map = createPalacioDoCredorMap();
    for (const wave of waves) {
      for (const enemy of wave.enemies) {
        expect(WALKABLE.has(map[enemy.y]?.[enemy.x])).toBe(true);
        expect(enemy.level).toBeGreaterThanOrEqual(1);
        expect(enemy.level).toBeLessThanOrEqual(10);
      }
    }
  });

  it('validates the optional authored boss hp through the reusable encounter field', () => {
    const encounter = PALACIO_DO_CREDOR_STAGE.encounter;
    if (encounter?.source.kind !== 'authored-waves') throw new Error('Encounter is not authored.');
    const source = encounter.source;
    const boss = source.waves[source.waves.length - 1].enemies
      .find(enemy => enemy.type === 'boss');
    expect(boss?.hp).toBe(700);
    const invalidWaves = source.waves.map((wave, waveIndex) => waveIndex === source.waves.length - 1
      ? {
          ...wave,
          enemies: wave.enemies.map(enemy => enemy.type === 'boss' ? { ...enemy, hp: 0 } : enemy),
        }
      : wave);
    const invalid: StageModule = {
      ...PALACIO_DO_CREDOR_STAGE,
      encounter: {
        ...encounter,
        source: { kind: 'authored-waves' as const, waves: invalidWaves },
      },
    };
    const diagnostics = new StageValidator().validateModule(invalid);
    expect(diagnostics.some(item => item.code === 'stage.encounter.enemy-hp.invalid')).toBe(true);
  });

  it('produces a deterministic, closed map with a reachable route and exit', () => {
    const first = createPalacioDoCredorMap();
    const second = createPalacioDoCredorMap();
    expect(second).toEqual(first);
    expect(first).toHaveLength(PALACIO_DO_CREDOR_HEIGHT);
    first.forEach(row => expect(row).toHaveLength(PALACIO_DO_CREDOR_WIDTH));
    for (let x = 0; x < PALACIO_DO_CREDOR_WIDTH; x += 1) {
      expect(first[0][x]).toBe(1);
      expect(first[PALACIO_DO_CREDOR_HEIGHT - 1][x]).toBe(1);
    }
    for (let y = 0; y < PALACIO_DO_CREDOR_HEIGHT; y += 1) {
      expect(first[y][0]).toBe(1);
      expect(first[y][PALACIO_DO_CREDOR_WIDTH - 1]).toBe(1);
    }
    expect(first[PALACIO_DO_CREDOR_SPAWN.y][PALACIO_DO_CREDOR_SPAWN.x]).toBe(8);
    expect(first[PALACIO_DO_CREDOR_EXIT.y][PALACIO_DO_CREDOR_EXIT.x]).toBe(5);
    expect(first[PALACIO_DO_CREDOR_BOSS.y][PALACIO_DO_CREDOR_BOSS.x]).toBe(9);
    const reach = reachable(first, PALACIO_DO_CREDOR_SPAWN);
    expect(reach.has(`${PALACIO_DO_CREDOR_EXIT.x},${PALACIO_DO_CREDOR_EXIT.y}`)).toBe(true);
    for (const npc of PALACIO_DO_CREDOR_STAGE.npcs ?? []) {
      if (npc.spawn.kind === 'tile') {
        expect(reach.has(`${npc.spawn.x},${npc.spawn.y}`)).toBe(true);
      }
    }
    const encounter = PALACIO_DO_CREDOR_STAGE.encounter;
    if (encounter?.source.kind === 'authored-waves') {
      for (const enemy of encounter.source.waves.flatMap(wave => wave.enemies)) {
        expect(reach.has(`${enemy.x},${enemy.y}`)).toBe(true);
      }
    }
  });

  it('changes only presentation between Decadência and Corrompido', () => {
    const decayed = load(PALACIO_DECAYED_VARIANT_ID);
    const corrupted = load(PALACIO_CORRUPTED_VARIANT_ID);
    expect(corrupted.level).toEqual(decayed.level);
    expect(corrupted.manifest).toEqual(decayed.manifest);
    expect(corrupted.encounter).toEqual(decayed.encounter);
    expect(corrupted.npcs).toEqual(decayed.npcs);
    expect(corrupted.dialogues).toEqual(decayed.dialogues);
    expect(corrupted.missions).toEqual(decayed.missions);
    expect(corrupted.events).toEqual(decayed.events);
    expect(corrupted.level.tileMap).toEqual(decayed.level.tileMap);

    expect(decayed.presentation?.themeId).toBe(PALACIO_THEME_ID);
    expect(corrupted.presentation?.themeId).toBe(PALACIO_CORRUPTED_THEME_ID);
    expect(corrupted.presentation?.tilesetId).not.toBe(decayed.presentation?.tilesetId);
    expect(corrupted.presentation?.environment?.fog?.opacity)
      .toBeGreaterThan(decayed.presentation?.environment?.fog?.opacity ?? 0);
    expect(corrupted.presentation?.audio?.id).not.toBe(decayed.presentation?.audio?.id);
    expect(corrupted.presentation?.decorationOverrides).toMatchObject({
      palacio_gate: 'palacio_gate_corrupted',
      palacio_tower: 'palacio_tower_corrupted',
      palacio_arcade: 'palacio_arcade_corrupted',
      palacio_throne: 'palacio_throne_corrupted',
      palacio_sigil: 'palacio_sigil_corrupted',
      palacio_rubble: 'palacio_root_mass',
    });
    expect(corrupted.presentation?.tiles.floor.textureKey)
      .not.toBe(decayed.presentation?.tiles.floor.textureKey);
  });

  it('uses a dedicated Credor spritesheet instead of the generic Fortitudo sprite', () => {
    for (const variant of [PALACIO_DECAYED_VARIANT_ID, PALACIO_CORRUPTED_VARIANT_ID]) {
      const loaded = load(variant);
      const boss = loaded.presentation?.enemySprites.boss;
      expect(boss?.textureKey).toBe(PALACIO_CREDOR_TEXTURE_KEY);
      expect(boss?.textureKey).not.toBe('boss_guardian_anim');
      expect(boss?.animations).toMatchObject({
        walk: 'palacio_credor_walk',
        attack: 'palacio_credor_attack',
        hurt: 'palacio_credor_hurt',
      });
    }
  });

  it('documents every generated asset with a matching hash and dimensions', () => {
    const directory = path.resolve(__dirname, '..', 'assets', 'palacio');
    expect(PALACIO_ASSETS).toHaveLength(22);
    for (const asset of PALACIO_ASSETS) {
      const file = path.join(directory, asset.fileName);
      expect(fs.existsSync(file)).toBe(true);
      const data = fs.readFileSync(file);
      expect(crypto.createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
      if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) {
        expect(asset.width % asset.frameWidth).toBe(0);
        expect(asset.height % asset.frameHeight).toBe(0);
        expect((asset.width / asset.frameWidth) * (asset.height / asset.frameHeight))
          .toBe(asset.frameCount);
      }
    }
    const credor = PALACIO_ASSETS.find(asset => asset.textureKey === PALACIO_CREDOR_TEXTURE_KEY);
    expect(credor).toMatchObject({ frameWidth: 128, frameHeight: 114, frameCount: 12 });
  });

  it('exposes both variants in the World Lab data service', () => {
    const service = new WorldLabDataService({ registry: registry(), focusStageId: PALACIO_DO_CREDOR_STAGE_ID });
    expect(service.stageOptions()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: PALACIO_DO_CREDOR_STAGE_ID,
        presentationVariantIds: [
          PALACIO_CORRUPTED_VARIANT_ID,
          PALACIO_DECAYED_VARIANT_ID,
        ],
      }),
    ]));
  });
});
