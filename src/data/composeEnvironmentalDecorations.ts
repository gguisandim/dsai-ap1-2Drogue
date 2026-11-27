import type { DecorationPlacement } from './LevelData';

type Point = Pick<DecorationPlacement, 'x' | 'y'>;
type Prop = Omit<DecorationPlacement, 'x' | 'y'>;

export interface EnvironmentalRegion {
  readonly id: string;
  readonly bounds: readonly [left: number, top: number, right: number, bottom: number];
  readonly tiles: readonly number[];
  readonly props: readonly Prop[];
}

function rank(id: string, { x, y }: Point): number {
  let hash = 2166136261;
  for (const character of `${id}:${x}:${y}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Assigns each prop to one distinct eligible tile, in stable region priority. */
export function composeEnvironmentalDecorations(
  map: readonly (readonly number[])[],
  regions: readonly EnvironmentalRegion[],
  reserved: readonly Point[],
): DecorationPlacement[] {
  const key = ({ x, y }: Point) => `${x}:${y}`;
  const occupied = new Set(reserved.map(key));
  const regionIds = new Set<string>();
  const result: DecorationPlacement[] = [];

  for (const { id, bounds: [left, top, right, bottom], tiles, props } of regions) {
    if (regionIds.has(id)) throw new Error(`Duplicate environmental region: ${id}`);
    regionIds.add(id);
    if (![left, top, right, bottom].every(Number.isInteger) ||
        left < 0 || top < 0 || right < left || bottom < top ||
        bottom >= map.length || map.slice(top, bottom + 1).some(row => right >= row.length)) {
      throw new Error(`Invalid environmental region bounds: ${id}`);
    }

    const candidates: Array<{ point: Point; rank: number }> = [];
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const point = { x, y };
        if (tiles.includes(map[y][x]) && !occupied.has(key(point))) {
          candidates.push({ point, rank: rank(id, point) });
        }
      }
    }
    if (candidates.length < props.length) {
      throw new Error(`Insufficient eligible decoration tiles: ${id}`);
    }
    candidates.sort((a, b) => a.rank - b.rank || a.point.y - b.point.y || a.point.x - b.point.x);
    props.forEach((prop, index) => {
      const { point } = candidates[index];
      occupied.add(key(point));
      result.push({ ...prop, ...point });
    });
  }

  return result;
}
