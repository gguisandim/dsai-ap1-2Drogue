export const WORLD_ROOT_ASSET_ORIGIN = Object.freeze({
  id: 'origin.world-root.original',
  pack: 'Raiz do Mundo — arte original',
  author: 'OpenAI ImageGen, sob direção do projeto',
  license: 'asset original; sem licença de terceiro',
  sourceUrl: 'src/assets/world-root/README.md',
});

export const WORLD_ROOT_GROUND_ORIGIN = Object.freeze({
  id: 'origin.world-root.ground-original',
  pack: 'Raiz do Mundo — chão pixel-art original',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/world-root/README.md',
});

export const WORLD_ROOT_TEXTURE_ASSET = Object.freeze({
  id: 'asset.world-root.sanctuary',
  textureKey: 'world_root_sanctuary',
  fileName: 'world-root-sanctuary.png',
  width: 1254,
  height: 1254,
  sha256: 'ae7be11f376d1e2060e7437765b6db029726572ab470840f4b42e49f69fba502',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_GROUND_ASSET = Object.freeze({
  id: 'asset.world-root.ground-pixel-art',
  textureKey: 'world_root_ground',
  fileName: 'world-root-ground.svg',
  width: 128,
  height: 32,
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 4,
  sha256: 'f15470a79c865fa05e659c177053f70d4af2046c28f76b9bde35cfa18f00c66e',
  originId: WORLD_ROOT_GROUND_ORIGIN.id,
  modifications: Object.freeze([]),
});

export const WORLD_ROOT_STONE_ASSET = Object.freeze({
  id: 'asset.world-root.stone-pixel-art',
  textureKey: 'world_root_stone',
  fileName: 'world-root-stone.svg',
  width: 32,
  height: 32,
  sha256: '1dcf6d61dd1f275d16cc0bfaff82b2c9d6a35c9705daf44ea0699bd957c5f03e',
  originId: WORLD_ROOT_GROUND_ORIGIN.id,
  modifications: Object.freeze([]),
});

export const WORLD_ROOT_CANOPY_ASSET = Object.freeze({
  id: 'asset.world-root.canopy-pixel-art',
  textureKey: 'world_root_canopy',
  fileName: 'world-root-canopy.svg',
  width: 32,
  height: 32,
  sha256: '43b2518536715ce1f0c9e90e04299df69ad7b57ee0810f594960d4d03eefefec',
  originId: WORLD_ROOT_GROUND_ORIGIN.id,
  modifications: Object.freeze([]),
});

export const WORLD_ROOT_TRAIL_ASSET = Object.freeze({
  id: 'asset.world-root.trail-composition',
  textureKey: 'world_root_trail_composition',
  fileName: 'world-root-trail-composition.png',
  width: 1536,
  height: 1024,
  sha256: '39c429d8bb2c4195a26caeddd38cfc7b8b8bd03ed4d2d338d8b7611edd8d35c0',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_APPROACH_ASSET = Object.freeze({
  id: 'asset.world-root.sanctuary-approach',
  textureKey: 'world_root_sanctuary_approach',
  fileName: 'world-root-sanctuary-approach.png',
  width: 1536,
  height: 1024,
  sha256: '35860466c62082d808cd287df04d452404fe0c823295418de2fad433c89a305f',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_STREAM_ASSET = Object.freeze({
  id: 'asset.world-root.stream',
  textureKey: 'world_root_stream',
  fileName: 'world-root-stream.png',
  width: 1536,
  height: 1024,
  sha256: '9889691844ebec90a3e7f3ac8035b77526cf2c9f2717cdf27eb35091253edf6e',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_GROVE_ASSET = Object.freeze({
  id: 'asset.world-root.grove',
  textureKey: 'world_root_grove',
  fileName: 'world-root-grove.png',
  width: 1536,
  height: 1024,
  sha256: '4a4775ab7bce8f8b9ffe77d7402f5df071b1e26af6135da2365a21f6b79593e0',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_ENTRANCE_ASSET = Object.freeze({
  id: 'asset.world-root.entrance-composition',
  textureKey: 'world_root_entrance',
  fileName: 'world-root-entrance.png',
  width: 1536,
  height: 1024,
  sha256: 'c469761839827f4d59b81e31f8afd311c8ed80584b65301444143be32fba9ac3',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_PASSAGE_ASSET = Object.freeze({
  id: 'asset.world-root.passage-composition',
  textureKey: 'world_root_passage',
  fileName: 'world-root-passage.png',
  width: 1536,
  height: 1024,
  sha256: '2d5f54880b26c1ea6e9bbbfe981825fe3862354c484b4606e81c428c8bcd63a6',
  originId: WORLD_ROOT_ASSET_ORIGIN.id,
  modifications: Object.freeze(['Copiado sem alterações de pixels para o pipeline local do Vite.']),
});

export const WORLD_ROOT_COMPOSITION_ASSETS = Object.freeze([
  WORLD_ROOT_TRAIL_ASSET,
  WORLD_ROOT_APPROACH_ASSET,
  WORLD_ROOT_STREAM_ASSET,
  WORLD_ROOT_GROVE_ASSET,
  WORLD_ROOT_ENTRANCE_ASSET,
  WORLD_ROOT_PASSAGE_ASSET,
]);

export function worldRootTextureByKey(textureKey: string) {
  if (textureKey === WORLD_ROOT_TEXTURE_ASSET.textureKey) return WORLD_ROOT_TEXTURE_ASSET;
  if (textureKey === WORLD_ROOT_GROUND_ASSET.textureKey) return WORLD_ROOT_GROUND_ASSET;
  if (textureKey === WORLD_ROOT_STONE_ASSET.textureKey) return WORLD_ROOT_STONE_ASSET;
  if (textureKey === WORLD_ROOT_CANOPY_ASSET.textureKey) return WORLD_ROOT_CANOPY_ASSET;
  const composition = WORLD_ROOT_COMPOSITION_ASSETS.find(asset => asset.textureKey === textureKey);
  if (composition) return composition;
  return undefined;
}

export function worldRootAssetOriginById(originId: string) {
  if (originId === WORLD_ROOT_ASSET_ORIGIN.id) return WORLD_ROOT_ASSET_ORIGIN;
  if (originId === WORLD_ROOT_GROUND_ORIGIN.id) return WORLD_ROOT_GROUND_ORIGIN;
  return undefined;
}
