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
} from '../stages';
import {
  MINAS_ABANDONED_ENVIRONMENT_ID,
  MINAS_ABANDONED_EFFECTS,
  MINAS_ABANDONED_THEME_ID,
  MINAS_ABANDONED_VARIANT_ID,
  MINAS_CORROMPIDAS_AQUIFER,
  MINAS_CORROMPIDAS_AQUIFER_ID,
  MINAS_CORROMPIDAS_BOSS,
  MINAS_CORROMPIDAS_CHAPTER_ID,
  MINAS_CORROMPIDAS_CORE_FLAG,
  MINAS_CORROMPIDAS_DISCOVERY_BEAT,
  MINAS_CORROMPIDAS_ENCOUNTER_ID,
  MINAS_CORROMPIDAS_EXIT,
  MINAS_CORROMPIDAS_EXIT_ID,
  MINAS_CORROMPIDAS_HEIGHT,
  MINAS_CORROMPIDAS_LEDGER,
  MINAS_CORROMPIDAS_LEDGER_ID,
  MINAS_CORROMPIDAS_MAIRA,
  MINAS_CORROMPIDAS_MAIRA_ID,
  MINAS_CORROMPIDAS_MISSION_ID,
  MINAS_CORROMPIDAS_NILO,
  MINAS_CORROMPIDAS_NILO_ID,
  MINAS_CORROMPIDAS_SPAWN,
  MINAS_CORROMPIDAS_STAGE,
  MINAS_CORROMPIDAS_STAGE_ID,
  MINAS_CORROMPIDAS_WIDTH,
  MINAS_CORRUPTED_AUDIO_ID,
  MINAS_CORRUPTED_EFFECTS,
  MINAS_CORRUPTED_ENVIRONMENT_ID,
  MINAS_CORRUPTED_THEME_ID,
  MINAS_CORRUPTED_VARIANT_ID,
  createMinasCorrompidasMap,
} from '../stages';
import { CAMPAIGN_CHAPTER_CATALOG } from '../stages/chapters/CampaignChapterCatalog';
import { MINAS_ASSETS } from '../presentation/assets/minasAssetCatalog';
import { PUNY_ANIMATIONS, PUNY_TEXTURE_ASSETS } from '../presentation/assets/punyAssetCatalog';
import { resolveStagePreview } from '../presentation/StageSelectionPresentation';
import { MINAS_VISUAL_RESOURCES } from '../stages/chapters/minas-corrompidas';
import { WorldLabDataService } from '../devtools/world-lab';
import {
  STAGE_PLAN_FILENAME,
  validateStagePlanFile,
} from '../cli/chapter';
import { nodeChapterFileSystem } from '../cli/chapter/fs';

const WALKABLE = new Set([0, 5, 6, 7, 8, 9]);
const CHAPTER_DIR = path.resolve(__dirname, '..', 'stages', 'chapters', 'minas-corrompidas');
const ASSET_DIR = path.resolve(__dirname, '..', 'assets', 'minas-corrompidas');

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function load(variantId?: string) {
  const result = new StageLoader(registry()).load({
    stageId: MINAS_CORROMPIDAS_STAGE_ID,
    runId: 'run.minas.tests',
    runSeed: 'seed.minas.tests',
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

function authoredWaves() {
  const encounter = MINAS_CORROMPIDAS_STAGE.encounter;
  if (encounter?.source.kind !== 'authored-waves') throw new Error('Encounter is not authored.');
  return encounter.source.waves;
}

describe('Minas Corrompidas', () => {
  it('registers the chapter once and exposes an individual-only stage', () => {
    const entries = CAMPAIGN_CHAPTER_CATALOG.filter(entry =>
      entry.chapter.id === MINAS_CORROMPIDAS_CHAPTER_ID);
    expect(entries).toHaveLength(1);
    expect(entries[0].chapter.stageIds).toEqual([MINAS_CORROMPIDAS_STAGE_ID]);
    expect(entries[0].regions).toEqual([]);

    const catalog = StageCatalogService.create(registry());
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    const entry = catalog.value.get(MINAS_CORROMPIDAS_STAGE_ID);
    expect(entry).toMatchObject({
      chapterId: MINAS_CORROMPIDAS_CHAPTER_ID,
      loadability: 'loadable',
      eligibility: 'individual-only',
    });
    expect(entry?.regionIds).toEqual(['region.corrupted.minas']);

    const loaded = load();
    expect(loaded.manifest.id).toBe(MINAS_CORROMPIDAS_STAGE_ID);
    expect(loaded.level.theme).toBe('witches_crypt');
    expect(loaded.npcs).toHaveLength(4);
  });

  it('validates manifest, IDs, exits, NPCs and narrative through the real validator', () => {
    const diagnostics = new StageValidator().validateModule(MINAS_CORROMPIDAS_STAGE);
    expect(diagnostics.filter(item => item.severity === 'error')).toEqual([]);
    expect(MINAS_CORROMPIDAS_STAGE.manifest.exits).toEqual([expect.objectContaining({
      id: MINAS_CORROMPIDAS_EXIT_ID,
      anchor: { kind: 'tile', x: MINAS_CORROMPIDAS_EXIT.x, y: MINAS_CORROMPIDAS_EXIT.y },
      targetStageId: 'campaign.complete',
      condition: { type: 'flag.equals', flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true },
    })]);
    expect(MINAS_CORROMPIDAS_STAGE.manifest.completionMissionId).toBe(MINAS_CORROMPIDAS_MISSION_ID);
    expect(MINAS_CORROMPIDAS_STAGE.manifest.entryDialogueId).toBeTruthy();

    const catalog = MINAS_CORROMPIDAS_STAGE.manifest.campaignCatalog;
    expect(catalog).toMatchObject({
      availability: 'available',
      participation: 'individual-only',
      biomeIds: ['crypt'],
    });
    expect(catalog?.providesBeatIds).toEqual([MINAS_CORROMPIDAS_DISCOVERY_BEAT]);
    expect(JSON.stringify(MINAS_CORROMPIDAS_STAGE.events))
      .not.toContain('milestone.corrupted.primary');
  });

  it('has a closed dialogue graph with valid speakers', () => {
    const stage = MINAS_CORROMPIDAS_STAGE;
    const npcIds = new Set((stage.npcs ?? []).map(npc => npc.id));
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
        }
      }
    }
    for (const npc of stage.npcs ?? []) {
      expect(stage.dialogues?.some(dialogue => dialogue.id === npc.interactionDialogueId)).toBe(true);
    }
  });

  it('gates completion on investigation, encounter and the exit flag', () => {
    const mission = MINAS_CORROMPIDAS_STAGE.missions?.find(item =>
      item.id === MINAS_CORROMPIDAS_MISSION_ID);
    expect(mission?.start).toBe('stage-enter');
    expect(mission?.objectives).toEqual(expect.arrayContaining([
      expect.objectContaining({
        signal: 'npc.interacted',
        filter: { field: 'npcId', equals: MINAS_CORROMPIDAS_MAIRA_ID },
      }),
      expect.objectContaining({
        signal: 'npc.interacted',
        filter: { field: 'npcId', equals: MINAS_CORROMPIDAS_NILO_ID },
      }),
      expect.objectContaining({
        signal: 'npc.interacted',
        filter: { field: 'npcId', equals: MINAS_CORROMPIDAS_AQUIFER_ID },
      }),
      expect.objectContaining({
        signal: 'encounter.completed',
        filter: { field: 'encounterId', equals: MINAS_CORROMPIDAS_ENCOUNTER_ID },
      }),
      expect.objectContaining({
        signal: 'npc.interacted',
        filter: { field: 'npcId', equals: MINAS_CORROMPIDAS_LEDGER_ID },
      }),
    ]));
    expect(mission?.rewards).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'stage.flag', flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }),
    ]));
    const required = (mission?.objectives ?? []).filter(objective => objective.optional !== true);
    expect(required.map(objective => objective.id)).toEqual([
      'objective.corrupted.minas.hear-maira',
      'objective.corrupted.minas.still-core',
    ]);
    const optional = (mission?.objectives ?? []).filter(objective => objective.optional === true);
    expect(optional.map(objective => objective.id)).toEqual([
      'objective.corrupted.minas.find-nilo',
      'objective.corrupted.minas.read-aquifer',
      'objective.corrupted.minas.read-ledger',
    ]);
    // A single-NPC runtime driver must pick the mandatory witness first.
    expect((mission?.objectives ?? []).find(objective =>
      objective.signal === 'npc.interacted')?.id)
      .toBe('objective.corrupted.minas.hear-maira');

    const completion = (MINAS_CORROMPIDAS_STAGE.events ?? []).find(event =>
      event.when === 'mission.completed' &&
      event.filter?.field === 'missionId' &&
      event.filter.equals === MINAS_CORROMPIDAS_MISSION_ID);
    expect(completion?.commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'flag.set', flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }),
      expect.objectContaining({ type: 'exit.unlock', exitId: MINAS_CORROMPIDAS_EXIT_ID }),
      expect.objectContaining({
        type: 'reward.grant',
        reward: { type: 'progression.unlock', contentId: MINAS_CORROMPIDAS_DISCOVERY_BEAT },
      }),
    ]));

    const exitEvent = (MINAS_CORROMPIDAS_STAGE.events ?? []).find(event =>
      event.when === 'stage.exit.requested' &&
      event.filter?.field === 'exitId' &&
      event.filter.equals === MINAS_CORROMPIDAS_EXIT_ID);
    expect(exitEvent?.condition).toEqual({
      type: 'flag.equals', flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true,
    });
    expect(exitEvent?.commands).toEqual([
      expect.objectContaining({ type: 'stage.complete', exitId: MINAS_CORROMPIDAS_EXIT_ID }),
    ]);
  });

  it('anchors the exit plan region on the exit tile and validates the plan', () => {
    const planPath = path.join(CHAPTER_DIR, STAGE_PLAN_FILENAME);
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as {
      progression: string;
      regions: readonly { id: string; anchor?: { x: number; y: number } }[];
    };
    expect(plan.progression).toBe('linear');
    const exitRegion = plan.regions.find(region => region.id === 'region.corrupted.minas.revelacao');
    expect(exitRegion?.anchor).toEqual({ x: MINAS_CORROMPIDAS_EXIT.x, y: MINAS_CORROMPIDAS_EXIT.y });
    const report = validateStagePlanFile(
      planPath,
      nodeChapterFileSystem,
      path.relative(process.cwd(), planPath).split(path.sep).join('/'),
      MINAS_CORROMPIDAS_STAGE,
    );
    expect(report.ok).toBe(true);
    expect(report.diagnostics.filter(item => item.severity === 'error')).toEqual([]);
  });

  it('gates the boss behind sequential waves with authored hp', () => {
    const waves = authoredWaves();
    expect(waves).toHaveLength(4);
    expect(waves[0].delayBeforeMs).toBe(0);
    expect(waves.slice(0, -1).flatMap(wave => wave.enemies)
      .some(enemy => enemy.type === 'boss')).toBe(false);
    expect(waves[waves.length - 1].enemies.some(enemy => enemy.type === 'boss')).toBe(true);

    const guardian = waves.flatMap(wave => wave.enemies).find(enemy => enemy.type === 'miniboss');
    const boss = waves[waves.length - 1].enemies.find(enemy => enemy.type === 'boss');
    expect(guardian?.hp).toBe(340);
    expect(boss?.hp).toBe(680);

    const map = createMinasCorrompidasMap();
    for (const enemy of waves.flatMap(wave => wave.enemies)) {
      expect(WALKABLE.has(map[enemy.y]?.[enemy.x])).toBe(true);
      expect(enemy.level).toBeGreaterThanOrEqual(1);
      expect(enemy.level).toBeLessThanOrEqual(10);
    }
  });

  it('produces a deterministic, closed map with reachable npcs, enemies and exit', () => {
    const first = createMinasCorrompidasMap();
    const second = createMinasCorrompidasMap();
    expect(second).toEqual(first);
    expect(first).toHaveLength(MINAS_CORROMPIDAS_HEIGHT);
    first.forEach(row => expect(row).toHaveLength(MINAS_CORROMPIDAS_WIDTH));
    for (let x = 0; x < MINAS_CORROMPIDAS_WIDTH; x += 1) {
      expect(first[0][x]).toBe(1);
      expect(first[MINAS_CORROMPIDAS_HEIGHT - 1][x]).toBe(1);
    }
    for (let y = 0; y < MINAS_CORROMPIDAS_HEIGHT; y += 1) {
      expect(first[y][0]).toBe(1);
      expect(first[y][MINAS_CORROMPIDAS_WIDTH - 1]).toBe(1);
    }
    expect(first[MINAS_CORROMPIDAS_SPAWN.y][MINAS_CORROMPIDAS_SPAWN.x]).toBe(8);
    expect(first[MINAS_CORROMPIDAS_EXIT.y][MINAS_CORROMPIDAS_EXIT.x]).toBe(5);
    expect(first[MINAS_CORROMPIDAS_BOSS.y][MINAS_CORROMPIDAS_BOSS.x]).toBe(9);

    const reach = reachable(first, MINAS_CORROMPIDAS_SPAWN);
    expect(reach.has(`${MINAS_CORROMPIDAS_EXIT.x},${MINAS_CORROMPIDAS_EXIT.y}`)).toBe(true);
    for (const point of [
      MINAS_CORROMPIDAS_MAIRA,
      MINAS_CORROMPIDAS_NILO,
      MINAS_CORROMPIDAS_AQUIFER,
      MINAS_CORROMPIDAS_LEDGER,
      MINAS_CORROMPIDAS_BOSS,
    ]) {
      expect(reach.has(`${point.x},${point.y}`)).toBe(true);
    }
    for (const enemy of authoredWaves().flatMap(wave => wave.enemies)) {
      expect(reach.has(`${enemy.x},${enemy.y}`)).toBe(true);
    }
  });

  it('uses no illustrative panorama as a runtime map decoration', () => {
    const decorations = MINAS_CORROMPIDAS_STAGE.authoredLevel?.decorations ?? [];
    expect(decorations.some(decoration =>
      decoration.type.includes('panorama'))).toBe(false);
    expect(decorations).toHaveLength(19);
  });

  it('keeps the panorama summaries only in the stage selector presentation', () => {
    const abandoned = load(MINAS_ABANDONED_VARIANT_ID);
    const corrupted = load(MINAS_CORRUPTED_VARIANT_ID);
    expect(resolveStagePreview(abandoned.presentation, () => true)?.textureKey)
      .toBe('minas_panorama_abandoned');
    expect(resolveStagePreview(corrupted.presentation, () => true)?.textureKey)
      .toBe('minas_panorama_corrupted');
  });

  it('resolves pixel-art rock atlases for walls and pillars', () => {
    const abandoned = load(MINAS_ABANDONED_VARIANT_ID);
    const corrupted = load(MINAS_CORRUPTED_VARIANT_ID);
    expect(abandoned.presentation?.tiles.wall.textureKey).toBe('minas_rock_abandoned');
    expect(abandoned.presentation?.tiles.pillar.textureKey).toBe('minas_rock_abandoned');
    expect(corrupted.presentation?.tiles.wall.textureKey).toBe('minas_rock_corrupted');
    expect(corrupted.presentation?.tiles.pillar.textureKey).toBe('minas_rock_corrupted');
    expect(abandoned.presentation?.tiles.wall.frameWidth).toBe(32);
    expect(corrupted.presentation?.tiles.wall.frameHeight).toBe(32);
  });

  it('changes only presentation between Abandonada and Corrompida', () => {
    const abandoned = load(MINAS_ABANDONED_VARIANT_ID);
    const corrupted = load(MINAS_CORRUPTED_VARIANT_ID);
    expect(corrupted.level).toEqual(abandoned.level);
    expect(corrupted.manifest).toEqual(abandoned.manifest);
    expect(corrupted.encounter).toEqual(abandoned.encounter);
    expect(corrupted.npcs).toEqual(abandoned.npcs);
    expect(corrupted.dialogues).toEqual(abandoned.dialogues);
    expect(corrupted.missions).toEqual(abandoned.missions);
    expect(corrupted.events).toEqual(abandoned.events);
    expect(corrupted.level.tileMap).toEqual(abandoned.level.tileMap);

    expect(abandoned.presentationVariantId).toBe(MINAS_ABANDONED_VARIANT_ID);
    expect(corrupted.presentationVariantId).toBe(MINAS_CORRUPTED_VARIANT_ID);
    expect(abandoned.presentation?.themeId).toBe(MINAS_ABANDONED_THEME_ID);
    expect(corrupted.presentation?.themeId).toBe(MINAS_CORRUPTED_THEME_ID);
    expect(corrupted.presentation?.tilesetId).not.toBe(abandoned.presentation?.tilesetId);
    expect(corrupted.presentation?.tiles.floor.textureKey)
      .not.toBe(abandoned.presentation?.tiles.floor.textureKey);
    expect(corrupted.presentation?.environment?.id).not.toBe(abandoned.presentation?.environment?.id);
    expect(corrupted.presentation?.environment?.id).toBe(MINAS_CORRUPTED_ENVIRONMENT_ID);
    expect(abandoned.presentation?.environment?.id).toBe(MINAS_ABANDONED_ENVIRONMENT_ID);
    expect(corrupted.presentation?.audio?.id).toBe(MINAS_CORRUPTED_AUDIO_ID);
    expect(corrupted.presentation?.environment?.fog?.opacity)
      .toBeGreaterThan(abandoned.presentation?.environment?.fog?.opacity ?? 0);
    expect(corrupted.presentation?.effects.map(effect => effect.id))
      .toEqual(MINAS_CORRUPTED_EFFECTS.map(effect => effect.id));
    expect(abandoned.presentation?.effects.map(effect => effect.id))
      .toEqual(MINAS_ABANDONED_EFFECTS.map(effect => effect.id));
    expect(corrupted.presentation?.decorationOverrides).toMatchObject({
      mina_timber: 'mina_timber_corrupted',
      mina_roots: 'mina_roots_corrupted',
      mina_crystals: 'mina_crystals_corrupted',
      mina_fungi: 'mina_fungi_corrupted',
      mina_machinery: 'mina_machinery_corrupted',
      mina_seal: 'mina_seal_corrupted',
    });
  });

  it('uses the animated pixel-art spritesheets from earlier stages for every enemy', () => {
    const punyAnimations = new Set(PUNY_ANIMATIONS.map(animation => animation.key));
    const punySpritesheets = new Map(PUNY_TEXTURE_ASSETS
      .filter(asset => asset.kind === 'spritesheet')
      .map(asset => [asset.textureKey, asset] as const));
    for (const variantId of [MINAS_ABANDONED_VARIANT_ID, MINAS_CORRUPTED_VARIANT_ID]) {
      const loaded = load(variantId);
      for (const sprite of Object.values(loaded.presentation?.enemySprites ?? {})) {
        expect(sprite.animations).toMatchObject({
          walk: expect.stringMatching(/^puny_(warrior|archer)_walk$/),
          attack: expect.stringMatching(/^puny_(warrior|archer)_attack$/),
          hurt: expect.stringMatching(/^puny_(warrior|archer)_hurt$/),
        });
        expect(punySpritesheets.has(sprite.textureKey)).toBe(true);
        expect(sprite.frameWidth).toBe(128);
        expect(sprite.frameHeight).toBe(114);
        expect(punyAnimations.has(sprite.animations.walk!)).toBe(true);
        expect(punyAnimations.has(sprite.animations.attack!)).toBe(true);
        expect(punyAnimations.has(sprite.animations.hurt!)).toBe(true);
      }
    }
  });

  it('documents every authored asset with a matching hash and real dimensions', () => {
    expect(MINAS_ASSETS).toHaveLength(25);
    for (const asset of MINAS_ASSETS) {
      const file = path.join(ASSET_DIR, asset.fileName);
      expect(fs.existsSync(file)).toBe(true);
      const data = fs.readFileSync(file);
      expect(crypto.createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
      if (asset.fileName.endsWith('.png')) {
        expect(data.readUInt32BE(16)).toBe(asset.width);
        expect(data.readUInt32BE(20)).toBe(asset.height);
      }
      if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) {
        expect(asset.width % asset.frameWidth).toBe(0);
        expect(asset.height % asset.frameHeight).toBe(0);
        expect((asset.width / asset.frameWidth) * (asset.height / asset.frameHeight))
          .toBe(asset.frameCount);
      }
    }
    const panorama = MINAS_ASSETS.find(asset => asset.fileName === 'mina-abandoned-panorama.png');
    expect(panorama).toMatchObject({ width: 2172, height: 724 });
    const texture = MINAS_VISUAL_RESOURCES.textures
      .find(item => item.textureKey === 'minas_panorama_abandoned');
    expect(texture).toMatchObject({ sourceWidth: 2172, sourceHeight: 724 });
  });

  it('exposes both variants in the World Lab data service', () => {
    const service = new WorldLabDataService({
      registry: registry(),
      focusStageId: MINAS_CORROMPIDAS_STAGE_ID,
    });
    expect(service.stageOptions()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: MINAS_CORROMPIDAS_STAGE_ID,
        presentationVariantIds: [
          MINAS_ABANDONED_VARIANT_ID,
          MINAS_CORRUPTED_VARIANT_ID,
        ],
      }),
    ]));
  });
});
