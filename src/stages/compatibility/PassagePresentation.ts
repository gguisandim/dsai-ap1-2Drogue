import type {
  ChapterVisualResources,
  StageDecorationVisualDefinition,
  StagePresentationDefinition,
  StageSpriteDefinition,
} from '../contracts';

const atlas = 'texture.passage.masonry';
const tileset = 'tileset.passage.masonry';
const theme = 'theme.passage.crypt';
const environment = 'environment.passage.crypt';

function tile(frame: number, alternate: number) {
  return { textureId: atlas, frame, variants: [{ textureId: atlas, frame: alternate }] };
}

const decorations: readonly StageDecorationVisualDefinition[] = [
  { id: 'passage.moss', textureId: atlas, frame: 6, layer: 'terrain', depth: 2.1, scaleClass: 'prop' },
  { id: 'passage.plinth', textureId: atlas, frame: 7, layer: 'terrain', depth: 3.1, scaleClass: 'prop' },
  { id: 'passage.brazier', textureId: atlas, frame: 8, layer: 'foreground', depth: 4.1, scaleClass: 'prop' },
];

function enemy(role: string, model: 'warrior' | 'archer', tint: number): StageSpriteDefinition {
  const animation = `puny_${model}`;
  return {
    id: `sprite.passage.${role}`,
    textureId: `texture.passage.${model}`,
    tint,
    scaleClass: 'character',
    animations: {
      walk: `${animation}_walk`,
      attack: `${animation}_attack`,
      hurt: `${animation}_hurt`,
      death: `passage_${model}_death`,
    },
  };
}

const guard = enemy('guard', 'warrior', 0xbad0be);
const watcher = enemy('watcher', 'archer', 0xd9ae9c);

export const PASSAGE_VISUAL_RESOURCES: ChapterVisualResources = {
  textures: [
    { id: atlas, textureKey: 'passage_masonry', frameWidth: 32, frameHeight: 32, frameCount: 9, sourceWidth: 96, sourceHeight: 96, pixelArt: true },
    { id: 'texture.passage.warrior', textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12 },
    { id: 'texture.passage.archer', textureKey: 'puny_archer_128', frameWidth: 128, frameHeight: 114, frameCount: 12 },
  ],
  tilesets: [{
    id: tileset,
    revision: 1,
    tileSize: 32,
    tiles: {
      floor: tile(0, 1),
      wall: tile(2, 3),
      pillar: tile(4, 5),
      water: { textureId: 'texture.legacy.water' },
      lava: { textureId: 'texture.legacy.lava' },
      exit: { textureId: 'texture.legacy.exit', tint: 0xe1d8ad },
      'locked-door': tile(4, 5),
      chest: { textureId: 'texture.legacy.chest' },
      spawn: tile(0, 1),
      boss: tile(0, 1),
    },
  }],
  themes: [{ id: theme, revision: 1, tilesetId: tileset, decorationIds: decorations.map(prop => prop.id) }],
  decorations,
  sprites: [guard, watcher],
  environments: [{ id: environment, ambientColor: 0x202539, lightIntensity: 0.8 }],
};

export const PASSAGE_PRESENTATION: StagePresentationDefinition = {
  themeId: theme,
  environmentId: environment,
  enemySprites: { affinity: guard.id, applaud: watcher.id, ranged: watcher.id, miniboss: guard.id },
  effects: [
    { id: 'effect.passage.threshold-light', kind: 'local-light', x: 12, y: 6, radius: 52, color: 0xe8a34f, alpha: 0.25, depth: 3.7, durationMs: 2100 },
    { id: 'effect.passage.gallery-light', kind: 'local-light', x: 23, y: 16, radius: 54, color: 0xe8a34f, alpha: 0.22, depth: 3.7, durationMs: 2500 },
    { id: 'effect.passage.exit-light', kind: 'pulse', x: 37, y: 19, radius: 55, color: 0x79c0b0, alpha: 0.23, depth: 3.7, durationMs: 2900 },
    { id: 'effect.passage.crypt-motes', kind: 'spirits', x: 19, y: 5, width: 8, height: 6, count: 6, color: 0xa1c4a1, alpha: 0.24, depth: 4, durationMs: 4600 },
  ],
};
