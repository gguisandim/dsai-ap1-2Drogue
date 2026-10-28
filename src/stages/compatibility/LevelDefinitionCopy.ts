import type { EnemyPlacement, LevelDefinition } from '../../data/LevelData';

function cloneEnemy(enemy: EnemyPlacement): EnemyPlacement {
  return {
    ...enemy,
    ...(enemy.patrol ? { patrol: enemy.patrol.map(point => ({ ...point })) } : {}),
    ...(enemy.dropTable ? { dropTable: enemy.dropTable.map(entry => ({ ...entry })) } : {}),
  };
}

export function cloneLevelDefinition(level: LevelDefinition): LevelDefinition {
  return {
    ...level,
    tileMap: level.tileMap.map(row => [...row]),
    enemies: level.enemies.map(cloneEnemy),
    items: level.items.map(item => ({ ...item })),
    decorations: level.decorations.map(decoration => ({ ...decoration })),
    ...(level.exits ? { exits: level.exits.map(exit => ({ ...exit })) } : {}),
    ...(level.ambush ? { ambush: level.ambush.map(cloneEnemy) } : {}),
    ...(level.waves ? {
      waves: level.waves.map(wave => ({
        ...wave,
        enemies: wave.enemies.map(cloneEnemy),
      })),
    } : {}),
  };
}
