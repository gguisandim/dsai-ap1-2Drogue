import { NoiseField } from '../../procedural';

export type TemplateGeometryId = 'room' | 'horizontal' | 'branched';
export type TemplateGeometryRole = 'start' | 'exploration' | 'combat' | 'objective' | 'exit';

export const TEMPLATE_GEOMETRY_LIMITS = Object.freeze({
  width: Object.freeze({ minimum: 32, maximum: 160 }),
  height: Object.freeze({ minimum: 16, maximum: 48 }),
  regions: Object.freeze({ minimum: 3, maximum: 8 }),
  seed: Object.freeze({ minimum: 0, maximum: 2147483647 }),
});

export const TEMPLATE_MAP_WIDTH = 19;
export const TEMPLATE_MAP_HEIGHT = 11;
export const TEMPLATE_SPAWN = Object.freeze({ x: 3, y: 5 });
export const TEMPLATE_NPC_POSITION = Object.freeze({ x: 5, y: 5 });
export const TEMPLATE_EXIT_POSITION = Object.freeze({ x: 16, y: 5 });
export const TEMPLATE_DECORATION_POSITION = Object.freeze({ x: 4, y: 4 });
export const TEMPLATE_ITEM_POSITION = Object.freeze({ x: 8, y: 7 });
export const TEMPLATE_ENEMY_POSITIONS = Object.freeze([
  Object.freeze({ x: 10, y: 4 }),
  Object.freeze({ x: 13, y: 6 }),
]);

const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

export interface TemplateGeometryPoint {
  readonly x: number;
  readonly y: number;
}

export interface TemplateGeometryRegion {
  readonly key: string;
  readonly title: string;
  readonly role: TemplateGeometryRole;
  readonly anchor: TemplateGeometryPoint;
  readonly connections: readonly string[];
}

export interface TemplateGeometry {
  readonly template: TemplateGeometryId;
  readonly seed: number;
  readonly width: number;
  readonly height: number;
  readonly regionCount: number;
  readonly tileMap: number[][];
  readonly spawn: TemplateGeometryPoint;
  readonly exit: TemplateGeometryPoint;
  readonly npc: TemplateGeometryPoint;
  readonly item: TemplateGeometryPoint;
  readonly decoration: TemplateGeometryPoint;
  readonly enemies: readonly TemplateGeometryPoint[];
  readonly regions: readonly TemplateGeometryRegion[];
  /** Sampled walkable routes used by tests and future inspection tools. */
  readonly routes: Readonly<{
    main: readonly TemplateGeometryPoint[];
    branch?: readonly TemplateGeometryPoint[];
  }>;
}

export interface TemplateGeometryOptions {
  readonly template?: TemplateGeometryId;
  readonly seed?: number;
  readonly width?: number;
  readonly height?: number;
  readonly regionCount?: number;
}

const ROLE_TITLES: Readonly<Record<TemplateGeometryRole, string>> = Object.freeze({
  start: 'Margem inicial',
  exploration: 'Travessia',
  combat: 'Clareira de combate',
  objective: 'Vestígio',
  exit: 'Passagem final',
});

const MIDDLE_ROLES: readonly TemplateGeometryRole[] = Object.freeze([
  'exploration', 'combat', 'exploration', 'combat',
]);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function inside(width: number, height: number, x: number, y: number): boolean {
  return x > 0 && y > 0 && x < width - 1 && y < height - 1;
}

function noiseFor(
  template: TemplateGeometryId,
  options: Pick<Required<TemplateGeometryOptions>, 'seed' | 'width' | 'height' | 'regionCount'>,
): NoiseField {
  return new NoiseField(
    `${template}|${options.seed}|${options.width}|${options.height}|${options.regionCount}`,
  );
}

function stampCircle(
  map: number[][],
  point: TemplateGeometryPoint,
  radius: number,
  value = FLOOR,
): void {
  const height = map.length;
  const width = map[0].length;
  for (let y = point.y - radius; y <= point.y + radius; y += 1) {
    for (let x = point.x - radius; x <= point.x + radius; x += 1) {
      if (inside(width, height, x, y) &&
        (x - point.x) * (x - point.x) + (y - point.y) * (y - point.y) <= radius * radius) {
        map[y][x] = value;
      }
    }
  }
}

function centerLine(width: number, height: number, noise: NoiseField): number[] {
  const centers: number[] = new Array(width).fill(Math.floor(height / 2));
  let current = height / 2;
  for (let x = 1; x < width - 1; x += 1) {
    const target = height / 2 +
      Math.sin((x / Math.max(8, width * 0.09)) * Math.PI * 2) * height * 0.06 +
      (noise.fractal(x * 0.8, 4.3, { frequency: 0.055, octaves: 3 }) - 0.5) * height * 0.26;
    current = clamp(current + clamp(target - current, -1, 1), 4, height - 5);
    centers[x] = Math.round(current);
  }
  centers[0] = centers[1];
  centers[width - 1] = centers[width - 2];
  return centers;
}

interface OrganicMap {
  readonly map: number[][];
  readonly centers: readonly number[];
  readonly mainRoute: readonly TemplateGeometryPoint[];
}

/**
 * Continuous organic land: a wide, wobbling walkable band, eroded coves and
 * sparse obstacles. It deliberately avoids room/corridor composition.
 */
function createOrganicMap(
  width: number,
  height: number,
  noise: NoiseField,
): OrganicMap {
  const map: number[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? WALL : WATER));
  const centers = centerLine(width, height, noise);
  const halves: number[] = new Array(width).fill(3);
  for (let x = 1; x < width - 1; x += 1) {
    halves[x] = Math.max(3, Math.round(
      height * 0.13 + (noise.fractal(x * 0.6, 17.1, { frequency: 0.09, octaves: 2 }) - 0.5) * 4,
    ));
    for (let y = centers[x] - halves[x]; y <= centers[x] + halves[x]; y += 1) {
      if (inside(width, height, x, y)) map[y][x] = FLOOR;
    }
  }
  // Wet coves erode the banks without touching the travel band itself.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (map[y][x] !== FLOOR) continue;
      const distance = Math.abs(y - centers[x]);
      if (distance > halves[x] - 2 &&
        noise.fractal(x * 2.1, y * 2.1, { frequency: 0.11, octaves: 3 }) > 0.6) {
        map[y][x] = WATER;
      }
    }
  }
  // Sparse pillars enrich the land without narrowing the authored route.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (map[y][x] !== FLOOR || Math.abs(y - centers[x]) < 3) continue;
      if (noise.value(x * 2.7 + 11, y * 3.1 + 7) > 0.955) map[y][x] = PILLAR;
    }
  }
  // Guarantee a three-tile walkable band across the whole panorama.
  for (let x = 1; x < width - 1; x += 1) {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const nextX = x + offsetX;
        const nextY = centers[x] + offsetY;
        if (inside(width, height, nextX, nextY)) map[nextY][nextX] = FLOOR;
      }
    }
  }
  const mainRoute = centers.slice(1, width - 1).map((y, index) => ({ x: index + 1, y }));
  return { map, centers, mainRoute };
}

function pickFloor(
  map: readonly (readonly number[])[],
  anchor: TemplateGeometryPoint,
  offsets: readonly TemplateGeometryPoint[],
  used: Set<string>,
): TemplateGeometryPoint {
  const height = map.length;
  const width = map[0].length;
  for (const offset of offsets) {
    const point = { x: anchor.x + offset.x, y: anchor.y + offset.y };
    const key = `${point.x},${point.y}`;
    if (inside(width, height, point.x, point.y) && map[point.y][point.x] === FLOOR && !used.has(key)) {
      used.add(key);
      return point;
    }
  }
  used.add(`${anchor.x},${anchor.y}`);
  return { x: anchor.x, y: anchor.y };
}

function roomGeometry(seed: number): TemplateGeometry {
  const map: number[][] = Array.from({ length: TEMPLATE_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: TEMPLATE_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === TEMPLATE_MAP_WIDTH - 1 || y === TEMPLATE_MAP_HEIGHT - 1
        ? WALL : FLOOR));
  map[3][7] = PILLAR;
  map[8][12] = PILLAR;
  map[TEMPLATE_ITEM_POSITION.y][TEMPLATE_ITEM_POSITION.x] = CHEST;
  map[TEMPLATE_SPAWN.y][TEMPLATE_SPAWN.x] = SPAWN;
  map[TEMPLATE_EXIT_POSITION.y][TEMPLATE_EXIT_POSITION.x] = EXIT;
  const regions: readonly TemplateGeometryRegion[] = Object.freeze([
    Object.freeze({
      key: 'entry', title: 'Entrada', role: 'start' as const,
      anchor: TEMPLATE_SPAWN, connections: Object.freeze(['objective']),
    }),
    Object.freeze({
      key: 'objective', title: 'Farol de Vidro', role: 'objective' as const,
      anchor: TEMPLATE_NPC_POSITION, connections: Object.freeze(['entry', 'exit']),
    }),
    Object.freeze({
      key: 'exit', title: 'Saída', role: 'exit' as const,
      anchor: TEMPLATE_EXIT_POSITION, connections: Object.freeze(['objective']),
    }),
  ]);
  return {
    template: 'room', seed, width: TEMPLATE_MAP_WIDTH, height: TEMPLATE_MAP_HEIGHT, regionCount: 3,
    tileMap: map,
    spawn: TEMPLATE_SPAWN,
    exit: TEMPLATE_EXIT_POSITION,
    npc: TEMPLATE_NPC_POSITION,
    item: TEMPLATE_ITEM_POSITION,
    decoration: TEMPLATE_DECORATION_POSITION,
    enemies: TEMPLATE_ENEMY_POSITIONS,
    regions,
    routes: Object.freeze({
      main: Object.freeze([TEMPLATE_SPAWN, TEMPLATE_NPC_POSITION, TEMPLATE_EXIT_POSITION]),
    }),
  };
}

function horizontalRegions(
  width: number,
  centers: readonly number[],
  regionCount: number,
): readonly TemplateGeometryRegion[] {
  const keys: string[] = ['start'];
  const roles: TemplateGeometryRole[] = ['start'];
  for (let index = 1; index < regionCount - 1; index += 1) {
    keys.push(`area-${index}`);
    roles.push(index === regionCount - 2 ? 'objective' : MIDDLE_ROLES[(index - 1) % MIDDLE_ROLES.length]);
  }
  keys.push('exit');
  roles.push('exit');
  return Object.freeze(keys.map((key, index) => {
    const x = index === 0 ? 3
      : index === keys.length - 1 ? width - 4
        : Math.round(3 + (width - 7) * (index / (keys.length - 1)));
    return Object.freeze({
      key,
      title: ROLE_TITLES[roles[index]],
      role: roles[index],
      anchor: Object.freeze({ x, y: centers[x] }),
      connections: Object.freeze([
        ...(index > 0 ? [keys[index - 1]] : []),
        ...(index < keys.length - 1 ? [keys[index + 1]] : []),
      ]),
    });
  }));
}

function branchedRegions(
  width: number,
  centers: readonly number[],
  splitX: number,
  rejoinX: number,
  midX: number,
  branchY: number,
  regionCount: number,
): readonly TemplateGeometryRegion[] {
  const extras = regionCount - 5;
  const preCount = Math.ceil(extras / 2);
  const postCount = extras - preCount;
  const buildExtra = (key: string, x: number, role: TemplateGeometryRole): TemplateGeometryRegion =>
    Object.freeze({
      key, title: ROLE_TITLES[role], role,
      anchor: Object.freeze({ x, y: centers[x] }),
      connections: Object.freeze([]),
    });
  const pre = Array.from({ length: preCount }, (_, index) => {
    const x = Math.round(3 + (splitX - 3) * ((index + 1) / (preCount + 1)));
    return buildExtra(`main-${index + 1}`, x, index % 2 === 0 ? 'exploration' : 'combat');
  });
  const post = Array.from({ length: postCount }, (_, index) => {
    const x = Math.round(rejoinX + (width - 4 - rejoinX) * ((index + 1) / (postCount + 1)));
    return buildExtra(`after-${index + 1}`, x, index % 2 === 0 ? 'combat' : 'exploration');
  });
  const start: TemplateGeometryRegion = Object.freeze({
    key: 'start', title: ROLE_TITLES.start, role: 'start',
    anchor: Object.freeze({ x: 3, y: centers[3] }),
    connections: Object.freeze([pre[0]?.key ?? 'split']),
  });
  const split: TemplateGeometryRegion = Object.freeze({
    key: 'split', title: 'Bifurcação', role: 'exploration',
    anchor: Object.freeze({ x: splitX, y: centers[splitX] }),
    connections: Object.freeze([
      ...(pre.length > 0 ? [pre[pre.length - 1].key] : ['start']),
      'rejoin', 'branch',
    ]),
  });
  const branch: TemplateGeometryRegion = Object.freeze({
    key: 'branch', title: 'Caminho secundário', role: 'combat',
    anchor: Object.freeze({ x: midX, y: branchY }),
    connections: Object.freeze(['split', 'rejoin']),
  });
  const rejoin: TemplateGeometryRegion = Object.freeze({
    key: 'rejoin', title: 'Reencontro', role: 'objective',
    anchor: Object.freeze({ x: rejoinX, y: centers[rejoinX] }),
    connections: Object.freeze(['split', 'branch', ...(post[0] ? [post[0].key] : ['exit'])]),
  });
  const exit: TemplateGeometryRegion = Object.freeze({
    key: 'exit', title: ROLE_TITLES.exit, role: 'exit',
    anchor: Object.freeze({ x: width - 4, y: centers[width - 4] }),
    connections: Object.freeze([post.length > 0 ? post[post.length - 1].key : 'rejoin']),
  });
  const ordered = [start, ...pre, split, branch, rejoin, ...post, exit];
  // Chain the inserted exploration regions into the main route.
  const withChain = ordered.map(region => {
    if (!region.key.startsWith('main-') && !region.key.startsWith('after-')) return region;
    const index = ordered.findIndex(item => item.key === region.key);
    return Object.freeze({
      ...region,
      connections: Object.freeze([
        ...(index > 0 ? [ordered[index - 1].key] : []),
        ...(index < ordered.length - 1 ? [ordered[index + 1].key] : []),
      ]),
    });
  });
  return Object.freeze(withChain);
}

function branchedMap(
  width: number,
  height: number,
  centers: readonly number[],
  noise: NoiseField,
  map: number[][],
): { readonly splitX: number; readonly rejoinX: number; readonly midX: number;
  readonly branchY: number; readonly route: readonly TemplateGeometryPoint[] } {
  const splitX = Math.round(width * 0.38);
  const rejoinX = Math.round(width * 0.66);
  const midX = Math.round((splitX + rejoinX) / 2);
  const direction = noise.value(splitX * 0.7, 9.1) > 0.5 ? -1 : 1;
  const offset = 6 + Math.round(noise.fractal(midX * 0.4, 21.1, { frequency: 0.08 }) * 3);
  const route: TemplateGeometryPoint[] = [];
  for (let x = splitX; x <= rejoinX; x += 1) {
    const t = (x - splitX) / Math.max(1, rejoinX - splitX);
    const baseline = (1 - t) * centers[splitX] + t * centers[rejoinX];
    const y = clamp(
      Math.round(baseline + direction * offset * Math.sin(Math.PI * t)),
      4,
      height - 5,
    );
    route.push({ x, y });
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (inside(width, height, nextX, nextY)) map[nextY][nextX] = FLOOR;
      }
    }
  }
  const midpoint = route[Math.floor(route.length / 2)] ?? { x: midX, y: centers[midX] };
  return { splitX, rejoinX, midX, branchY: midpoint.y, route };
}

function panoramicGeometry(
  template: 'horizontal' | 'branched',
  seed: number,
  width: number,
  height: number,
  regionCount: number,
): TemplateGeometry {
  const options = { seed, width, height, regionCount };
  const noise = noiseFor(template, options);
  const organic = createOrganicMap(width, height, noise);
  const map = organic.map;
  const centers = organic.centers;
  let regions: readonly TemplateGeometryRegion[];
  let branch: ReturnType<typeof branchedMap> | undefined;
  if (template === 'branched') {
    branch = branchedMap(width, height, centers, noise, map);
    regions = branchedRegions(width, centers, branch.splitX, branch.rejoinX, branch.midX, branch.branchY, regionCount);
  } else {
    regions = horizontalRegions(width, centers, regionCount);
  }
  regions.forEach(region => stampCircle(
    map,
    region.anchor,
    region.role === 'combat' || region.role === 'objective' ? 4 : 3,
  ));
  const spawn = regions.find(region => region.role === 'start')!.anchor;
  const exit = regions.find(region => region.role === 'exit')!.anchor;
  const objective = regions.find(region => region.role === 'objective') ?? regions[regions.length - 2];
  const exploration = regions.find(region => region.role === 'exploration') ?? objective;
  const used = new Set<string>([`${spawn.x},${spawn.y}`, `${exit.x},${exit.y}`]);
  const npc = pickFloor(map, objective.anchor, [
    { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 },
  ], used);
  const item = pickFloor(map, exploration.anchor, [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  ], used);
  const decoration = pickFloor(map, exploration.anchor, [
    { x: 0, y: -2 }, { x: 0, y: 2 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 },
  ], used);
  const combat = regions.find(region => region.role === 'combat') ?? objective;
  const enemies = [
    pickFloor(map, combat.anchor, [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }], used),
    pickFloor(map, combat.anchor, [{ x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: -1 }], used),
  ];
  map[spawn.y][spawn.x] = SPAWN;
  map[exit.y][exit.x] = EXIT;
  map[item.y][item.x] = CHEST;
  return {
    template, seed, width, height, regionCount,
    tileMap: map,
    spawn, exit, npc, item, decoration, enemies,
    regions,
    routes: Object.freeze({
      main: organic.mainRoute,
      ...(branch ? { branch: Object.freeze(branch.route) } : {}),
    }),
  };
}

function resolveOptions(options: TemplateGeometryOptions): Required<TemplateGeometryOptions> {
  const template = options.template ?? 'room';
  if (template !== 'room' && template !== 'horizontal' && template !== 'branched') {
    throw new RangeError(`Unknown geometry template: ${String(template)}.`);
  }
  const defaults = template === 'horizontal'
    ? { width: 96, height: 30, regionCount: 5 }
    : template === 'branched'
      ? { width: 100, height: 34, regionCount: 5 }
      : { width: TEMPLATE_MAP_WIDTH, height: TEMPLATE_MAP_HEIGHT, regionCount: 3 };
  const seed = options.seed ?? 1;
  const width = options.width ?? defaults.width;
  const height = options.height ?? defaults.height;
  const regionCount = options.regionCount ?? defaults.regionCount;
  if (!Number.isInteger(seed) ||
    seed < TEMPLATE_GEOMETRY_LIMITS.seed.minimum || seed > TEMPLATE_GEOMETRY_LIMITS.seed.maximum) {
    throw new RangeError('Geometry seed must be a non-negative 32-bit integer.');
  }
  if (template !== 'room') {
    if (!Number.isInteger(width) || width < TEMPLATE_GEOMETRY_LIMITS.width.minimum ||
      width > TEMPLATE_GEOMETRY_LIMITS.width.maximum) {
      throw new RangeError('Geometry width is outside the supported range.');
    }
    if (!Number.isInteger(height) || height < TEMPLATE_GEOMETRY_LIMITS.height.minimum ||
      height > TEMPLATE_GEOMETRY_LIMITS.height.maximum) {
      throw new RangeError('Geometry height is outside the supported range.');
    }
    if (!Number.isInteger(regionCount) || regionCount < TEMPLATE_GEOMETRY_LIMITS.regions.minimum ||
      regionCount > TEMPLATE_GEOMETRY_LIMITS.regions.maximum) {
      throw new RangeError('Geometry regionCount is outside the supported range.');
    }
    if (template === 'branched' && regionCount < 5) {
      throw new RangeError('Branched geometry requires at least five regions.');
    }
  }
  return { template, seed, width, height, regionCount };
}

/**
 * Deterministic authoring geometry. The same options always produce the same
 * tile map, anchors, routes and logical regions.
 */
export function createTemplateGeometry(options: TemplateGeometryOptions = {}): TemplateGeometry {
  const resolved = resolveOptions(options);
  if (resolved.template === 'room') return roomGeometry(resolved.seed);
  return panoramicGeometry(
    resolved.template,
    resolved.seed,
    resolved.width,
    resolved.height,
    resolved.regionCount,
  );
}
