import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LEVEL_08_PARADISO } from '../data/LevelData';
import { UMBRA_CAMPAIGN_SKELETON } from '../application/stages/UmbraCampaignSkeleton';
import { FLORES_ASSETS } from '../presentation/assets/floresAssetCatalog';
import {
  CAMPAIGN_CHAPTER_CATALOG,
  StageCatalogService,
  StageLoader,
  StagePlaytestValidator,
  StageRegistry,
  VEILED_GARDENS_CHAPTER_ID,
  VEILED_GARDENS_ENCOUNTER_ID,
  VEILED_GARDENS_EXIT,
  VEILED_GARDENS_HEIGHT,
  VEILED_GARDENS_IARAI,
  VEILED_GARDENS_MISSION_ID,
  VEILED_GARDENS_RESTORED_FLAG,
  VEILED_GARDENS_SPAWN,
  VEILED_GARDENS_STAGE,
  VEILED_GARDENS_STAGE_ID,
  VEILED_GARDENS_TUCUM,
  VEILED_GARDENS_WIDTH,
  applyCampaignRegionBindings,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';

function productionRegistry(): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  return registry;
}

function reachable(map: readonly (readonly number[])[]): Set<string> {
  const queue: Array<{ x: number; y: number }> = [{ ...VEILED_GARDENS_SPAWN }];
  const visited = new Set([`${VEILED_GARDENS_SPAWN.x},${VEILED_GARDENS_SPAWN.y}`]);
  while (queue.length > 0) {
    const point = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = point.x + dx;
      const y = point.y + dy;
      if (y < 0 || x < 0 || y >= map.length || x >= map[y].length || [1, 2, 3].includes(map[y][x])) continue;
      const key = `${x},${y}`;
      if (!visited.has(key)) { visited.add(key); queue.push({ x, y }); }
    }
  }
  return visited;
}

describe('Jardins das Flores Veladas', () => {
  it('preserves the legacy identity while replacing the old square boss garden', () => {
    expect(LEVEL_08_PARADISO.id).toBe('level_08_paradiso');
    expect(LEVEL_08_PARADISO.name).toBe('Jardins das Flores Veladas');
    expect(LEVEL_08_PARADISO.tileMap).toHaveLength(VEILED_GARDENS_HEIGHT);
    expect(LEVEL_08_PARADISO.tileMap.every(row => row.length === VEILED_GARDENS_WIDTH)).toBe(true);
    expect(LEVEL_08_PARADISO.bossId).toBeUndefined();
    expect(LEVEL_08_PARADISO.decorations.some(item => item.type === 'heavenly_fountain')).toBe(false);
    expect(VEILED_GARDENS_WIDTH / VEILED_GARDENS_HEIGHT).toBeGreaterThan(3);
  });

  it('registers exactly one canonical module and excludes the migrated legacy wrapper', () => {
    const registry = productionRegistry();
    expect(registry.listChapter('legacy.levels').map(item => item.id)).not.toContain(VEILED_GARDENS_STAGE_ID);
    expect(registry.listChapter(VEILED_GARDENS_CHAPTER_ID).map(item => item.id)).toEqual([VEILED_GARDENS_STAGE_ID]);
    expect(registry.listModules().filter(item => item.manifest.id === VEILED_GARDENS_STAGE_ID)).toHaveLength(1);
    expect(registry.validate()).toEqual([]);
  });

  it('loads with its authored presentation and remains available in Jogar Fase', () => {
    const registry = productionRegistry();
    const loaded = new StageLoader(registry).load({ stageId: VEILED_GARDENS_STAGE_ID, runId: 'run.flores.test', runSeed: 'seed.flores.test' });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value).toMatchObject({
      manifest: { id: VEILED_GARDENS_STAGE_ID, chapterId: VEILED_GARDENS_CHAPTER_ID },
      level: { id: VEILED_GARDENS_STAGE_ID, name: 'Jardins das Flores Veladas' },
      encounter: { id: VEILED_GARDENS_ENCOUNTER_ID },
      presentation: { themeId: 'theme.floresta.flores-veladas' },
    });
    const catalog = StageCatalogService.create(registry);
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    expect(catalog.value.get(VEILED_GARDENS_STAGE_ID)).toMatchObject({
      loadability: 'loadable', eligibility: 'narrative-reserved', participation: 'narrative-milestone',
      regionIds: ['region.floresta.flores'], completionMissionId: VEILED_GARDENS_MISSION_ID,
    });
  });

  it('binds the real stage to the planned forest flower region without completing the whole route', () => {
    const projected = applyCampaignRegionBindings(UMBRA_CAMPAIGN_SKELETON, CAMPAIGN_CHAPTER_CATALOG);
    const route = projected.routes.find(item => item.id === 'route.floresta')!;
    expect(route.regions.find(item => item.id === 'region.floresta.flores')?.content).toEqual({
      kind: 'stage', stageId: VEILED_GARDENS_STAGE_ID, minimumManifestRevision: 2,
    });
    expect(route.regions.filter(item => item.content.kind === 'planned').map(item => item.id)).toEqual([
      'region.floresta.fungos', 'region.floresta.copas',
    ]);
  });

  it('has one spawn, a physical exit and reachable NPCs, encounters and items', () => {
    const map = VEILED_GARDENS_STAGE.authoredLevel!.tileMap;
    expect(map.flat().filter(value => value === 8)).toHaveLength(1);
    expect(map[VEILED_GARDENS_SPAWN.y][VEILED_GARDENS_SPAWN.x]).toBe(8);
    expect(map[VEILED_GARDENS_EXIT.y][VEILED_GARDENS_EXIT.x]).toBe(5);
    expect(map[0].every(value => value === 1)).toBe(true);
    expect(map[map.length - 1].every(value => value === 1)).toBe(true);
    const cells = reachable(map);
    [VEILED_GARDENS_IARAI, VEILED_GARDENS_TUCUM, VEILED_GARDENS_EXIT].forEach(point =>
      expect(cells.has(`${point.x},${point.y}`)).toBe(true));
    VEILED_GARDENS_STAGE.authoredLevel!.items.forEach(item =>
      expect(cells.has(`${item.x},${item.y}`)).toBe(true));
    const source = VEILED_GARDENS_STAGE.encounter!.source;
    expect(source.kind).toBe('authored-waves');
    if (source.kind === 'authored-waves') source.waves.flatMap(wave => wave.enemies).forEach(enemy =>
      expect(cells.has(`${enemy.x},${enemy.y}`)).toBe(true));
    expect(new StagePlaytestValidator().validate({ stage: VEILED_GARDENS_STAGE }).result).toBe('PASS');
  });

  it('declares two NPC roles, three contextual objectives and a satisfiable completion', () => {
    expect(VEILED_GARDENS_STAGE.npcs?.map(item => [item.displayName, item.role])).toEqual([
      ['Iaraí, Cantora das Flores', 'quest'],
      ['Tucum, Observador de Asas', 'ambient'],
    ]);
    expect(VEILED_GARDENS_STAGE.missions?.[0].objectives.map(item => item.signal)).toEqual([
      'npc.interacted', 'npc.interacted', 'encounter.completed',
    ]);
    const completion = VEILED_GARDENS_STAGE.events?.find(item => item.id === 'event.floresta.flores-veladas.coro-restored');
    expect(completion?.commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'flag.set', flag: VEILED_GARDENS_RESTORED_FLAG, value: true }),
      expect.objectContaining({ type: 'exit.unlock', exitId: 'exit.floresta.flores-veladas.complete' }),
      expect.objectContaining({ type: 'stage.complete', exitId: 'exit.floresta.flores-veladas.complete' }),
    ]));
    const source = VEILED_GARDENS_STAGE.encounter!.source;
    expect(source.kind === 'authored-waves' ? source.waves.map(wave => wave.enemies.length) : []).toEqual([2, 3]);
  });

  it('keeps every authored SVG/PNG dimensioned, hashed and documented', () => {
    const readme = readFileSync(join(__dirname, '..', 'assets', 'flores', 'README.md'), 'utf8');
    FLORES_ASSETS.forEach(asset => {
      const source = readFileSync(join(__dirname, '..', 'assets', 'flores', asset.fileName));
      if (asset.fileName.endsWith('.svg')) {
        expect(source.toString('utf8')).toContain(`width="${asset.width}" height="${asset.height}"`);
      } else {
        expect(source.subarray(1, 4).toString('ascii')).toBe('PNG');
        expect(source.readUInt32BE(16)).toBe(asset.width);
        expect(source.readUInt32BE(20)).toBe(asset.height);
      }
      expect(createHash('sha256').update(source).digest('hex')).toBe(asset.sha256);
      expect(readme).toContain(asset.sha256);
    });
  });
});
