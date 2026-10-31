/**
 * Pure metadata for the locally incorporated Puny assets. It contains no
 * Phaser, DOM or filesystem dependency so tests and the World Lab can inspect
 * provenance without loading textures.
 */
export interface PunyAssetOrigin {
  readonly id: string;
  readonly pack: string;
  readonly author: string;
  readonly license: 'CC0';
  readonly sourceUrl: string;
  readonly sourceArchiveUrl?: string;
  readonly accessedAt: string;
  readonly notes: readonly string[];
}

export interface PunySourceFile {
  readonly id: string;
  readonly originId: string;
  readonly path: string;
  readonly sha256: string;
  readonly width: number;
  readonly height: number;
}

export interface PunyTextureAsset {
  readonly id: string;
  readonly textureKey: string;
  readonly fileName: string;
  readonly kind: 'image' | 'spritesheet';
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount: number;
  readonly originId: string;
  readonly sourceFileId: string;
  readonly modifications: readonly string[];
}

export interface PunyAnimationDefinition {
  readonly key: string;
  readonly textureKey: string;
  readonly frames: readonly number[];
  readonly frameRate: number;
  readonly repeat: number;
}

export const PUNY_ASSET_ORIGINS: Readonly<Record<string, PunyAssetOrigin>> = Object.freeze({
  'origin.puny-world': Object.freeze({
    id: 'origin.puny-world',
    pack: 'Puny World (16x16)',
    author: 'Shade',
    license: 'CC0' as const,
    sourceUrl: 'https://opengameart.org/content/16x16-puny-world-tileset',
    sourceArchiveUrl: 'https://merchant-shade.itch.io/16x16-puny-world',
    accessedAt: '2026-10-31',
    notes: Object.freeze([
      'OpenGameArt lists Author: Shade and License: CC0.',
      'The overworld tileset PNG was downloaded from the OpenGameArt file endpoint.',
    ]),
  }),
  'origin.puny-characters': Object.freeze({
    id: 'origin.puny-characters',
    pack: 'Puny Characters (free edition)',
    author: 'Shade',
    license: 'CC0' as const,
    sourceUrl: 'https://opengameart.org/content/puny-characters',
    sourceArchiveUrl: 'https://merchant-shade.itch.io/16x16-puny-characters',
    accessedAt: '2026-10-31',
    notes: Object.freeze([
      'OpenGameArt lists Author: Shade and License: CC0.',
      'The free edition was used, not the paid Editor Edition.',
      'Characters use a 32x32 canvas arranged as 24 columns by 8 animation rows.',
      'Rows: idle, walk, sword attack, bow attack, stave attack, throw, hurt, death.',
      'Each row contains 8 directions with 3 frames per direction.',
    ]),
  }),
});

export const PUNY_SOURCE_FILES: readonly PunySourceFile[] = Object.freeze([
  Object.freeze({
    id: 'source.puny-world.tiles',
    originId: 'origin.puny-world',
    path: 'punyworld-overworld-tileset_0.png',
    sha256: '14d285bde8dee96cb0113947c8cce4922b86bf1d033b19123112145c7cef3a38',
    width: 432,
    height: 1040,
  }),
  Object.freeze({
    id: 'source.puny-characters.mage-cyan',
    originId: 'origin.puny-characters',
    path: 'Puny-Characters/Mage-Cyan.png',
    sha256: 'bd43df96cef751f76252723bfa5a6095d68e982cba59260aec7f4fbfedf7ec3f',
    width: 768,
    height: 256,
  }),
  Object.freeze({
    id: 'source.puny-characters.warrior-red',
    originId: 'origin.puny-characters',
    path: 'Puny-Characters/Warrior-Red.png',
    sha256: 'c60c80dcad811b3ef0e0e8e1fa5f0d62e011b3e604f2bb2a78261f2dcae6c712',
    width: 768,
    height: 256,
  }),
  Object.freeze({
    id: 'source.puny-characters.archer-purple',
    originId: 'origin.puny-characters',
    path: 'Puny-Characters/Archer-Purple.png',
    sha256: '788d53de100aceb025621ae4fc95a61a6cd08168205185871a6442ab7b131d26',
    width: 768,
    height: 256,
  }),
]);

const DERIVED_MODIFICATIONS = Object.freeze([
  'Cropped the down-facing frames from the walk, attack and hurt rows.',
  'Repeated each 3-frame cycle as 0,1,2,1 to fill the existing 4-frame contract.',
  'Scaled each frame by its alpha bounding box to fit a 128x114 canvas.',
  'Preserved transparency and used nearest-neighbor scaling.',
]);

export const PUNY_TEXTURE_ASSETS: readonly PunyTextureAsset[] = Object.freeze([
  Object.freeze({
    id: 'asset.puny.world',
    textureKey: 'puny_world',
    fileName: 'puny-world-tiles.png',
    kind: 'spritesheet' as const,
    frameWidth: 16,
    frameHeight: 16,
    frameCount: 27 * 65,
    originId: 'origin.puny-world',
    sourceFileId: 'source.puny-world.tiles',
    modifications: Object.freeze(['Copied without pixel changes from the source PNG.']),
  }),
  Object.freeze({
    id: 'asset.puny.mage-cyan',
    textureKey: 'puny_mage',
    fileName: 'puny-mage-cyan.png',
    kind: 'spritesheet' as const,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 24 * 8,
    originId: 'origin.puny-characters',
    sourceFileId: 'source.puny-characters.mage-cyan',
    modifications: Object.freeze(['Copied without pixel changes from the source PNG.']),
  }),
  Object.freeze({
    id: 'asset.puny.warrior-red-128',
    textureKey: 'puny_warrior_128',
    fileName: 'puny-warrior-red-128.png',
    kind: 'spritesheet' as const,
    frameWidth: 128,
    frameHeight: 114,
    frameCount: 12,
    originId: 'origin.puny-characters',
    sourceFileId: 'source.puny-characters.warrior-red',
    modifications: DERIVED_MODIFICATIONS,
  }),
  Object.freeze({
    id: 'asset.puny.archer-purple-128',
    textureKey: 'puny_archer_128',
    fileName: 'puny-archer-purple-128.png',
    kind: 'spritesheet' as const,
    frameWidth: 128,
    frameHeight: 114,
    frameCount: 12,
    originId: 'origin.puny-characters',
    sourceFileId: 'source.puny-characters.archer-purple',
    modifications: DERIVED_MODIFICATIONS,
  }),
]);

export const PUNY_ANIMATIONS: readonly PunyAnimationDefinition[] = Object.freeze([
  Object.freeze({
    key: 'puny_mage_idle', textureKey: 'puny_mage', frames: Object.freeze([0, 1, 2]),
    frameRate: 6, repeat: -1,
  }),
  Object.freeze({
    key: 'puny_warrior_walk', textureKey: 'puny_warrior_128', frames: Object.freeze([0, 1, 2, 3]),
    frameRate: 8, repeat: -1,
  }),
  Object.freeze({
    key: 'puny_warrior_attack', textureKey: 'puny_warrior_128', frames: Object.freeze([4, 5, 6, 7]),
    frameRate: 11, repeat: 0,
  }),
  Object.freeze({
    key: 'puny_warrior_hurt', textureKey: 'puny_warrior_128', frames: Object.freeze([8, 9, 10, 11]),
    frameRate: 10, repeat: 0,
  }),
  Object.freeze({
    key: 'puny_archer_walk', textureKey: 'puny_archer_128', frames: Object.freeze([0, 1, 2, 3]),
    frameRate: 8, repeat: -1,
  }),
  Object.freeze({
    key: 'puny_archer_attack', textureKey: 'puny_archer_128', frames: Object.freeze([4, 5, 6, 7]),
    frameRate: 11, repeat: 0,
  }),
  Object.freeze({
    key: 'puny_archer_hurt', textureKey: 'puny_archer_128', frames: Object.freeze([8, 9, 10, 11]),
    frameRate: 10, repeat: 0,
  }),
]);

export function punyTextureByKey(textureKey: string): PunyTextureAsset | undefined {
  return PUNY_TEXTURE_ASSETS.find(asset => asset.textureKey === textureKey);
}
