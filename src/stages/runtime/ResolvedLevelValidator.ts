import type { EnemyPlacement, LevelDefinition } from '../../data/LevelData';
import { isWalkableTile, TileKind } from '../../procedural';
import type { StageDiagnostic, StageManifest } from '../contracts';

interface Point {
  readonly x: number;
  readonly y: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareDiagnostics(left: StageDiagnostic, right: StageDiagnostic): number {
  const leftKey = `${left.path.map(String).join('.')}|${left.code}|${left.referenceId ?? ''}`;
  const rightKey = `${right.path.map(String).join('.')}|${right.code}|${right.referenceId ?? ''}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function isSolid(tile: number): boolean {
  return tile === TileKind.Wall || tile === TileKind.Pillar;
}

function isHazard(tile: number): boolean {
  return tile === TileKind.Pit || tile === TileKind.Lava;
}

export class ResolvedLevelValidator {
  public validate(level: LevelDefinition, manifest: StageManifest): readonly StageDiagnostic[] {
    const diagnostics: StageDiagnostic[] = [];
    const stageId = manifest.id;
    const add = (
      code: string,
      severity: StageDiagnostic['severity'],
      message: string,
      path: readonly (string | number)[],
      referenceId?: string,
    ): void => {
      diagnostics.push({ code, severity, message, path, stageId, ...(referenceId ? { referenceId } : {}) });
    };

    if (!isRecord(level as unknown)) {
      add('level.structure.invalid', 'error', 'Resolved level must be an object.', ['level']);
      return this.finish(diagnostics);
    }

    let collectionsValid = true;
    const requireArray = (value: unknown, path: readonly (string | number)[], label: string): boolean => {
      if (Array.isArray(value)) return true;
      collectionsValid = false;
      add('level.collection.invalid', 'error', `${label} must be an array.`, path);
      return false;
    };
    requireArray(level.enemies, ['level', 'enemies'], 'Level enemies');
    requireArray(level.items, ['level', 'items'], 'Level items');
    requireArray(level.decorations, ['level', 'decorations'], 'Level decorations');
    if (level.exits !== undefined) requireArray(level.exits, ['level', 'exits'], 'Level exits');
    if (level.ambush !== undefined) requireArray(level.ambush, ['level', 'ambush'], 'Level ambush');
    if (level.waves !== undefined && requireArray(level.waves, ['level', 'waves'], 'Level waves')) {
      level.waves.forEach((wave, index) => {
        if (!isRecord(wave as unknown) || !Array.isArray(wave.enemies)) {
          collectionsValid = false;
          add('level.wave.invalid', 'error', 'Level wave must contain an enemies array.', ['level', 'waves', index]);
        }
      });
    }

    if (!collectionsValid) return this.finish(diagnostics);

    if (typeof level.id !== 'string' || level.id.trim().length === 0) {
      add('level.id.required', 'error', 'Resolved level id is required.', ['level', 'id']);
    }
    if (manifest.layout.kind === 'legacy' && level.id !== manifest.layout.levelId) {
      add(
        'level.id.legacy-mismatch',
        'error',
        `Resolved legacy level id ${level.id} does not match ${manifest.layout.levelId}.`,
        ['level', 'id'],
        manifest.layout.levelId,
      );
    }
    if (manifest.layout.kind === 'procedural' && level.id !== manifest.id) {
      add(
        'level.id.procedural-mismatch',
        'error',
        `Resolved procedural level id ${level.id} does not match ${manifest.id}.`,
        ['level', 'id'],
        manifest.id,
      );
    }
    if (!Number.isInteger(level.difficulty) || level.difficulty < 1 || level.difficulty > 10) {
      add('level.difficulty.invalid', 'error', 'Level difficulty must be an integer from 1 to 10.', ['level', 'difficulty']);
    }
    if (!Number.isFinite(level.parTime) || level.parTime <= 0) {
      add('level.par-time.invalid', 'error', 'Level parTime must be positive.', ['level', 'parTime']);
    }

    if (!Array.isArray(level.tileMap) || level.tileMap.length === 0) {
      add('level.map.empty', 'error', 'Level tileMap must contain at least one row.', ['level', 'tileMap']);
      return this.finish(diagnostics);
    }
    const width = level.tileMap[0]?.length ?? 0;
    if (width === 0) {
      add('level.map.empty-row', 'error', 'Level tileMap rows cannot be empty.', ['level', 'tileMap', 0]);
      return this.finish(diagnostics);
    }

    let matrixValid = true;
    level.tileMap.forEach((row, y) => {
      if (!Array.isArray(row) || row.length !== width) {
        matrixValid = false;
        add(
          'level.map.row-width',
          'error',
          `Level row ${y} has width ${row.length}; expected ${width}.`,
          ['level', 'tileMap', y],
        );
      }
      if (!Array.isArray(row)) return;
      row.forEach((tile, x) => {
        if (!Number.isInteger(tile) || tile < TileKind.Floor || tile > TileKind.Boss) {
          matrixValid = false;
          add(
            'level.tile.invalid',
            'error',
            `Unsupported tile value at ${x},${y}: ${tile}.`,
            ['level', 'tileMap', y, x],
          );
        }
      });
    });
    if (!matrixValid) return this.finish(diagnostics);

    const height = level.tileMap.length;
    const inBounds = (point: Point): boolean => Number.isInteger(point.x) && Number.isInteger(point.y) &&
      point.x >= 0 && point.y >= 0 && point.x < width && point.y < height;
    const tileAt = (point: Point): number => level.tileMap[point.y][point.x];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) &&
          level.tileMap[y][x] !== TileKind.Wall) {
          add(
            'level.map.open-border',
            'error',
            `Level border is open at ${x},${y}.`,
            ['level', 'tileMap', y, x],
          );
        }
      }
    }

    const spawns = this.findTiles(level.tileMap, TileKind.Spawn);
    const exits = this.findTiles(level.tileMap, TileKind.Exit);
    const bosses = this.findTiles(level.tileMap, TileKind.Boss);
    if (spawns.length === 0) {
      add('level.spawn.missing', 'error', 'Level requires a spawn tile.', ['level', 'tileMap']);
    } else if (spawns.length > 1) {
      add('level.spawn.multiple', 'warning', 'Level contains multiple spawn tiles; the first is authoritative.', ['level', 'tileMap']);
    }
    const destinations = exits.length > 0 ? exits : bosses;
    if (destinations.length === 0) {
      add('level.exit.missing', 'error', 'Level requires an exit tile or boss tile.', ['level', 'tileMap']);
    }

    const reachableFromSpawn = spawns.length > 0
      ? this.reachable(level.tileMap, spawns[0])
      : undefined;
    if (reachableFromSpawn && destinations.length > 0) {
      destinations.forEach(point => {
        if (!reachableFromSpawn.has(`${point.x},${point.y}`)) {
          add(
            'level.connectivity.unreachable-destination',
            'error',
            `Destination at ${point.x},${point.y} is unreachable from spawn.`,
            ['level', 'tileMap', point.y, point.x],
          );
        }
      });
    }

    const validatePosition = (
      point: unknown,
      path: readonly (string | number)[],
      label: string,
      gameplay: boolean,
    ): void => {
      if (!isRecord(point)) {
        add('level.position.invalid', 'error', `${label} position must be an object.`, path);
        return;
      }
      if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) {
        add('level.position.invalid', 'error', `${label} position must use integer tile coordinates.`, path);
        return;
      }
      const positioned = point as unknown as Point;
      if (!inBounds(positioned)) {
        add('level.position.out-of-bounds', 'error', `${label} position is outside the map.`, path);
        return;
      }
      if (!gameplay) return;
      const tile = tileAt(positioned);
      if (isSolid(tile)) {
        add(
          'level.position.on-solid',
          manifest.layout.kind === 'legacy' ? 'warning' : 'error',
          `${label} is placed on solid tile ${tile}.`,
          path,
        );
      } else if (isHazard(tile)) {
        add('level.position.on-hazard', 'warning', `${label} is placed on hazard tile ${tile}.`, path);
      }
    };

    const validateEnemy = (enemy: EnemyPlacement, path: readonly (string | number)[], label: string): void => {
      validatePosition(enemy, path, label, true);
      if (!isRecord(enemy as unknown)) return;
      if (enemy.patrol !== undefined && !Array.isArray(enemy.patrol)) {
        add('level.collection.invalid', 'error', `${label} patrol must be an array.`, [...path, 'patrol']);
        return;
      }
      if (enemy.dropTable !== undefined && !Array.isArray(enemy.dropTable)) {
        add('level.collection.invalid', 'error', `${label} dropTable must be an array.`, [...path, 'dropTable']);
      }
      enemy.patrol?.forEach((point, index) => validatePosition(
        point,
        [...path, 'patrol', index],
        `${label} patrol point`,
        true,
      ));
    };

    level.enemies.forEach((enemy, index) => validateEnemy(enemy, ['level', 'enemies', index], 'Enemy'));
    level.items.forEach((item, index) => validatePosition(item, ['level', 'items', index], 'Item', true));
    level.decorations.forEach((decoration, index) => validatePosition(
      decoration,
      ['level', 'decorations', index],
      'Decoration',
      false,
    ));
    level.ambush?.forEach((enemy, index) => validateEnemy(enemy, ['level', 'ambush', index], 'Ambush enemy'));
    level.waves?.forEach((wave, waveIndex) => wave.enemies.forEach((enemy, enemyIndex) => validateEnemy(
      enemy,
      ['level', 'waves', waveIndex, 'enemies', enemyIndex],
      'Wave enemy',
    )));
    level.exits?.forEach((exit, index) => {
      validatePosition(exit, ['level', 'exits', index], 'Legacy exit', false);
      if (!isRecord(exit as unknown)) return;
      validatePosition(
        { x: exit.spawnX, y: exit.spawnY },
        ['level', 'exits', index, 'spawn'],
        'Legacy exit spawn',
        true,
      );
      if (!Number.isInteger(exit.to) || exit.to < 0) {
        add('level.legacy-exit.target-invalid', 'error', 'Legacy section exit target must be a non-negative integer.', ['level', 'exits', index, 'to']);
      }
    });

    manifest.exits.forEach((exit, index) => {
      if (exit.anchor.kind === 'tile') {
        const point = { x: exit.anchor.x, y: exit.anchor.y };
        if (!inBounds(point)) {
          add(
            'stage.exit.anchor-out-of-bounds',
            'error',
            `Stage exit anchor is outside the resolved map: ${exit.id}.`,
            ['manifest', 'exits', index, 'anchor'],
            exit.id,
          );
        } else if (!isWalkableTile(tileAt(point))) {
          add(
            'stage.exit.anchor-not-walkable',
            'error',
            `Stage exit anchor is not walkable: ${exit.id}.`,
            ['manifest', 'exits', index, 'anchor'],
            exit.id,
          );
        } else if (reachableFromSpawn && !reachableFromSpawn.has(`${point.x},${point.y}`)) {
          add(
            'stage.exit.anchor-unreachable',
            'error',
            `Stage exit anchor is unreachable from spawn: ${exit.id}.`,
            ['manifest', 'exits', index, 'anchor'],
            exit.id,
          );
        }
      } else if (exit.anchor.kind === 'map-exit' && exits.length === 0 && bosses.length === 0) {
        add(
          'stage.exit.map-anchor-missing',
          'error',
          `Stage exit ${exit.id} requires an exit or boss tile.`,
          ['manifest', 'exits', index, 'anchor'],
          exit.id,
        );
      }
    });

    return this.finish(diagnostics);
  }

  private findTiles(tileMap: readonly (readonly number[])[], tile: TileKind): Point[] {
    const result: Point[] = [];
    tileMap.forEach((row, y) => row.forEach((value, x) => {
      if (value === tile) result.push({ x, y });
    }));
    return result;
  }

  private reachable(tileMap: readonly (readonly number[])[], start: Point): ReadonlySet<string> {
    const visited = new Set<string>([`${start.x},${start.y}`]);
    const queue: Point[] = [start];
    const height = tileMap.length;
    const width = tileMap[0].length;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const point = queue[cursor];
      const neighbors = [
        { x: point.x, y: point.y - 1 },
        { x: point.x + 1, y: point.y },
        { x: point.x, y: point.y + 1 },
        { x: point.x - 1, y: point.y },
      ];
      neighbors.forEach(next => {
        const key = `${next.x},${next.y}`;
        if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height || visited.has(key)) return;
        if (!isWalkableTile(tileMap[next.y][next.x])) return;
        visited.add(key);
        queue.push(next);
      });
    }
    return visited;
  }

  private finish(diagnostics: StageDiagnostic[]): readonly StageDiagnostic[] {
    diagnostics.sort(compareDiagnostics);
    return Object.freeze(diagnostics.map(diagnostic => Object.freeze({
      ...diagnostic,
      path: Object.freeze([...diagnostic.path]),
    })));
  }
}
