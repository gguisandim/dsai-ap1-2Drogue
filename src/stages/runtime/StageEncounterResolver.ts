import type { EnemyPlacement, LevelDefinition } from '../../data/LevelData';
import type {
  ResolvedStageEncounter,
  ResolvedStageEncounterWave,
  StageEncounterDefinition,
  StageEncounterEnemyPlacement,
  StageManifest,
} from '../contracts';

const LEGACY_WAVE_DELAY_MS = 1200;

function cloneEnemy(enemy: EnemyPlacement | StageEncounterEnemyPlacement): StageEncounterEnemyPlacement {
  return Object.freeze({
    ...enemy,
    ...(enemy.patrol ? { patrol: Object.freeze(enemy.patrol.map(point => Object.freeze({ ...point }))) } : {}),
    ...(enemy.dropTable ? {
      dropTable: Object.freeze(enemy.dropTable.map(entry => Object.freeze({ ...entry }))),
    } : {}),
  }) as StageEncounterEnemyPlacement;
}

function wave(
  id: string,
  delayBeforeMs: number,
  enemies: readonly (EnemyPlacement | StageEncounterEnemyPlacement)[],
): ResolvedStageEncounterWave {
  return Object.freeze({
    id,
    delayBeforeMs,
    enemies: Object.freeze(enemies.map(cloneEnemy)),
  });
}

function freezeEncounter(
  definition: StageEncounterDefinition,
  waves: readonly ResolvedStageEncounterWave[],
): ResolvedStageEncounter {
  return Object.freeze({
    id: definition.id,
    start: definition.start,
    completion: definition.completion,
    scaling: definition.scaling,
    source: 'declarative' as const,
    waves: Object.freeze([...waves]),
  });
}

function chunkResolvedEnemies(
  definition: StageEncounterDefinition,
  level: LevelDefinition,
): ResolvedStageEncounter {
  if (definition.source.kind !== 'resolved-level-enemies') {
    return freezeEncounter(definition, definition.source.waves.map(item => wave(
      item.id,
      item.delayBeforeMs,
      item.enemies,
    )));
  }
  const indexed = level.enemies.map((enemy, index) => ({ enemy, index }));
  indexed.sort((left, right) => left.enemy.level - right.enemy.level || left.index - right.index);
  const waves: ResolvedStageEncounterWave[] = [];
  for (let index = 0; index < indexed.length; index += definition.source.maximumEnemiesPerWave) {
    waves.push(wave(
      `wave.${waves.length + 1}`,
      waves.length === 0 ? 0 : definition.source.delayBeforeWaveMs,
      indexed.slice(index, index + definition.source.maximumEnemiesPerWave).map(item => ({
        ...item.enemy,
        type: definition.source.kind === 'resolved-level-enemies'
          ? definition.source.archetypeMapping?.[item.enemy.type] ?? item.enemy.type
          : item.enemy.type,
      })),
    ));
  }
  return freezeEncounter(definition, waves);
}

function legacyMiniboss(
  manifest: Pick<StageManifest, 'chapterId' | 'order'> | undefined,
  legacyLevelIndex?: number,
): EnemyPlacement {
  const index = legacyLevelIndex ?? (manifest?.chapterId === 'legacy.verse' ? manifest.order : -1);
  const spots = [{ x: 25, y: 8 }, { x: 30, y: 9 }, { x: 34, y: 9 }];
  const spot = spots[index] ?? { x: 20, y: 8 };
  return { type: 'miniboss', x: spot.x, y: spot.y, level: 9 };
}

/** Resolves encounter data only; wave execution remains owned by gameplay. */
export class StageEncounterResolver {
  public resolve(
    definition: StageEncounterDefinition | undefined,
    level: LevelDefinition,
    manifest: StageManifest,
  ): ResolvedStageEncounter {
    return definition
      ? chunkResolvedEnemies(definition, level)
      : this.resolveLegacy(level, manifest);
  }

  public resolveLegacy(
    level: LevelDefinition,
    manifest?: Pick<StageManifest, 'chapterId' | 'order'>,
    legacyLevelIndex?: number,
  ): ResolvedStageEncounter {
    const waves = level.waves?.length
      ? level.waves.map((entry, index) => wave(
          `wave.${index + 1}`,
          index === 0 ? 0 : LEGACY_WAVE_DELAY_MS,
          entry.enemies,
        ))
      : this.legacyChunkedWaves(level, manifest, legacyLevelIndex);
    return Object.freeze({
      id: `encounter.${level.id}`,
      start: 'stage-ready' as const,
      completion: 'all-waves-defeated' as const,
      scaling: 'stage-difficulty-floor' as const,
      source: 'legacy-fallback' as const,
      waves: Object.freeze(waves),
    });
  }

  private legacyChunkedWaves(
    level: LevelDefinition,
    manifest: Pick<StageManifest, 'chapterId' | 'order'> | undefined,
    legacyLevelIndex?: number,
  ): ResolvedStageEncounterWave[] {
    const indexed = level.enemies.map((enemy, index) => ({ enemy, index }));
    indexed.sort((left, right) => left.enemy.level - right.enemy.level || left.index - right.index);
    const waves: ResolvedStageEncounterWave[] = [];
    for (let index = 0; index < indexed.length; index += 8) {
      waves.push(wave(
        `wave.${waves.length + 1}`,
        waves.length === 0 ? 0 : LEGACY_WAVE_DELAY_MS,
        indexed.slice(index, index + 8).map(item => item.enemy),
      ));
    }
    waves.push(wave(
      `wave.${waves.length + 1}`,
      waves.length === 0 ? 0 : LEGACY_WAVE_DELAY_MS,
      [legacyMiniboss(manifest, legacyLevelIndex)],
    ));
    return waves;
  }
}
