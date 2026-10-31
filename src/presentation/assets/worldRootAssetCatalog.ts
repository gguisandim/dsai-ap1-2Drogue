export const WORLD_ROOT_ASSET_ORIGIN = Object.freeze({
  id: 'origin.world-root.original',
  pack: 'Raiz do Mundo — arte original',
  author: 'OpenAI ImageGen, sob direção do projeto',
  license: 'asset original; sem licença de terceiro',
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

export function worldRootTextureByKey(textureKey: string) {
  return textureKey === WORLD_ROOT_TEXTURE_ASSET.textureKey
    ? WORLD_ROOT_TEXTURE_ASSET
    : undefined;
}

