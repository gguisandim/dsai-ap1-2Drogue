import { CORRIDOR_LEVEL } from '../data/CorridorLevelData';
import { composeEnvironmentalDecorations } from '../data/composeEnvironmentalDecorations';
import { GameSessionService } from '../application/stages/GameSessionService';

describe('Passagem Esquecida environmental composition', () => {
  it('places props deterministically on free eligible tiles across overlapping regions', () => {
    const map = [[0, 1, 0], [0, 0, 1]];
    const regions = [
      { id: 'west', bounds: [0, 0, 1, 1] as const, tiles: [0], props: [{ type: 'moss' }] },
      { id: 'east', bounds: [0, 0, 2, 1] as const, tiles: [0], props: [{ type: 'lamp' }] },
    ];
    const reserved = [{ x: 0, y: 0 }];
    const output = composeEnvironmentalDecorations(map, regions, reserved);
    expect(output).toEqual(composeEnvironmentalDecorations(map, regions, reserved));
    expect(new Set(output.map(({ x, y }) => `${x}:${y}`)).size).toBe(2);
    for (const { x, y } of output) {
      expect(map[y][x]).toBe(0);
      expect({ x, y }).not.toEqual(reserved[0]);
    }
    expect(() => composeEnvironmentalDecorations(map, [regions[0]], [
      ...reserved, { x: 0, y: 1 }, { x: 1, y: 1 },
    ])).toThrow('Insufficient eligible decoration tiles');
    expect(() => composeEnvironmentalDecorations(map, [
      { ...regions[0], bounds: [0, 0, 3, 1] },
    ], [])).toThrow('Invalid environmental region bounds');
  });

  it('keeps placements clear of actors and resolves the bespoke atlas, effects and enemies', () => {
    const service = new GameSessionService();
    const started = service.startIndividualStage(CORRIDOR_LEVEL.id);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const { level, presentation } = started.value.loadedStage;
    expect(level.tileMap).toEqual(CORRIDOR_LEVEL.tileMap);
    expect(level.enemies).toEqual(CORRIDOR_LEVEL.enemies);
    expect(presentation).toBeDefined();
    expect(presentation?.themeId).toBe('theme.passage.crypt');
    expect(presentation?.effects).toHaveLength(4);
    expect(presentation?.enemySprites.affinity.animations.attack).toBe('puny_warrior_attack');
    expect(presentation?.enemySprites.applaud.animations.walk).toBe('puny_archer_walk');
    expect(presentation?.enemySprites.applaud.animations.death).toBe('passage_archer_death');
    expect(service.registry.get('level_01_vestibule')?.manifest.presentation).toBeUndefined();
    expect(CORRIDOR_LEVEL.decorations).toHaveLength(12);
    for (const { type, x, y } of CORRIDOR_LEVEL.decorations) {
      expect(presentation?.decorations[type].textureKey).toBe('passage_masonry');
      expect([...CORRIDOR_LEVEL.enemies, ...CORRIDOR_LEVEL.items].some(point =>
        point.x === x && point.y === y)).toBe(false);
    }
  });
});
