export const FLORES_ASSET_ORIGIN = Object.freeze({
  id: 'origin.floresta.flores-veladas-original',
  pack: 'Jardins das Flores Veladas — arte original',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/flores/README.md',
});

export const FLORES_GENERATED_ASSET_ORIGIN = Object.freeze({
  id: 'origin.floresta.flores-veladas-imagegen',
  pack: 'Jardins das Flores Veladas — composições pictóricas autorais',
  author: 'OpenAI ImageGen sob direção do projeto',
  license: 'asset gerado especificamente para o projeto; sem biblioteca de terceiro',
  sourceUrl: 'src/assets/flores/README.md',
});

export interface FloresAssetEntry {
  readonly id: string;
  readonly textureKey: string;
  readonly fileName: string;
  readonly width: number;
  readonly height: number;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
  readonly originId: string;
  readonly sha256: string;
  readonly usage: string;
}

export const FLORES_ASSETS: readonly FloresAssetEntry[] = Object.freeze([
  Object.freeze({ id: 'asset.floresta.flores.floor', textureKey: 'flores_forest_floor', fileName: 'flores-forest-floor.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, originId: FLORES_ASSET_ORIGIN.id, sha256: '790a0f5ff0a3fa0a7e9ff6a8220f4f184007e390291d9fdd74fcaa88901ae6b2', usage: 'Quatro pisos de folhiço e musgo.' }),
  Object.freeze({ id: 'asset.floresta.flores.tree', textureKey: 'flores_monumental_tree', fileName: 'flores-monumental-tree.svg', width: 192, height: 224, originId: FLORES_ASSET_ORIGIN.id, sha256: '66f28eccf0d52aaf4c7fc52e20d06b37155f59b5fcacf5de1341c9ba6cee1768', usage: 'Árvore das Mil Pétalas.' }),
  Object.freeze({ id: 'asset.floresta.flores.bromeliad', textureKey: 'flores_bromeliad_cluster', fileName: 'flores-bromeliad-cluster.svg', width: 96, height: 64, originId: FLORES_ASSET_ORIGIN.id, sha256: '63cd6a9c88c7faee6efa8c8a0d1e12dc2f98d528f2884a895e60b7998ff08577', usage: 'Bromélias e folhas largas.' }),
  Object.freeze({ id: 'asset.floresta.flores.heliconia', textureKey: 'flores_heliconia_arch', fileName: 'flores-heliconia-arch.svg', width: 160, height: 128, originId: FLORES_ASSET_ORIGIN.id, sha256: '827721cc09b9ecc235f657784c8377da2fb1f7804d7378071ae84e103204c8f4', usage: 'Arco natural de helicônias.' }),
  Object.freeze({ id: 'asset.floresta.flores.orchid', textureKey: 'flores_orchid_veil', fileName: 'flores-orchid-veil.svg', width: 128, height: 96, originId: FLORES_ASSET_ORIGIN.id, sha256: '134edf974615297be62ac88929fd3dd7371e36fe796341526102564a1b75035a', usage: 'Cortina de orquídeas.' }),
  Object.freeze({ id: 'asset.floresta.flores.nest', textureKey: 'flores_pollinator_nest', fileName: 'flores-pollinator-nest.svg', width: 128, height: 96, originId: FLORES_ASSET_ORIGIN.id, sha256: 'edea44a46cb40e2c8c14648a5e3adbb88134cc8b1550ad39d761b9df370d8fc3', usage: 'Ninho ritual dos polinizadores.' }),
  Object.freeze({ id: 'asset.floresta.flores.bough', textureKey: 'flores_canopy_bough', fileName: 'flores-canopy-bough.svg', width: 224, height: 80, originId: FLORES_ASSET_ORIGIN.id, sha256: '9ac0079646b4c3675c811f161e9d86a6c220d615969226f6b9786efc87482238', usage: 'Folhagem de primeiro plano.' }),
  Object.freeze({ id: 'asset.floresta.flores.light', textureKey: 'flores_light_shaft', fileName: 'flores-light-shaft.svg', width: 112, height: 224, originId: FLORES_ASSET_ORIGIN.id, sha256: 'c174dde2fde72e9fbb8af34260ac2738157b8c7847e5115cd0a1b4bea2434d71', usage: 'Feixe de luz filtrada.' }),
  Object.freeze({ id: 'asset.floresta.flores.natural-canopy', textureKey: 'flores_natural_canopy', fileName: 'flores-natural-canopy.png', width: 1024, height: 512, originId: FLORES_GENERATED_ASSET_ORIGIN.id, sha256: 'feb7b80b9f95d41733bd5182827d4c59e0f3a887d40845dc372dc491c7525dc6', usage: 'Composição pictórica da copa Natural.' }),
  Object.freeze({ id: 'asset.floresta.flores.natural-heart', textureKey: 'flores_natural_heart_bloom', fileName: 'flores-natural-heart-bloom.png', width: 768, height: 702, originId: FLORES_GENERATED_ASSET_ORIGIN.id, sha256: '78f591398e94e0423d16401036cda481c5400a638b5f9e5a4ebf91a1049bf386', usage: 'Clareira focal da variante Natural.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-canopy', textureKey: 'flores_corrupted_canopy', fileName: 'flores-corrupted-canopy.png', width: 1024, height: 512, originId: FLORES_GENERATED_ASSET_ORIGIN.id, sha256: '8b932699a97f1c97c59fa18e61ef2daf11daa9fd9a495753a6141b1f221b71ce', usage: 'Mutação pictórica da copa Corrompida.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-heart', textureKey: 'flores_corrupted_heart_core', fileName: 'flores-corrupted-heart-core.png', width: 768, height: 512, originId: FLORES_GENERATED_ASSET_ORIGIN.id, sha256: '3281fe8f3a237b83bd77bfee1b83aab2be394d738d9cf32da143bcbda0d4f91e', usage: 'Núcleo pictórico da variante Corrompida.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-tree', textureKey: 'flores_corrupted_tree', fileName: 'flores-corrupted-tree.svg', width: 192, height: 224, originId: FLORES_ASSET_ORIGIN.id, sha256: '90a44430c0bb4f694a6b2432d61520a07bde38086249d43ef2838c93f8143d01', usage: 'Árvore das Mil Pétalas contraída.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-bromeliad', textureKey: 'flores_corrupted_bromeliad', fileName: 'flores-corrupted-bromeliad.svg', width: 96, height: 64, originId: FLORES_ASSET_ORIGIN.id, sha256: '530066bba543860c630a8502f31a1bc870af90e57a83584c8fc029a15b156a26', usage: 'Bromélia fechada e mineralizada.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-arch', textureKey: 'flores_corrupted_thorn_arch', fileName: 'flores-corrupted-thorn-arch.svg', width: 160, height: 128, originId: FLORES_ASSET_ORIGIN.id, sha256: '370c9bdadd8be4d630082a970d7273d46ffd8010b4a62a630a7ed2b6ddab7f07', usage: 'Arco de espinhos mutado.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-orchid', textureKey: 'flores_corrupted_orchid_veil', fileName: 'flores-corrupted-orchid-veil.svg', width: 128, height: 96, originId: FLORES_ASSET_ORIGIN.id, sha256: '6fca2b5b6f1c747ea07dd29d82dfddedea97a1dd2b8d86a39431ba1ebd49e1f9', usage: 'Orquídeas invertidas e pétalas caídas.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-nest', textureKey: 'flores_corrupted_nest', fileName: 'flores-corrupted-nest.svg', width: 128, height: 96, originId: FLORES_ASSET_ORIGIN.id, sha256: 'f0eda15965c37f7225917bdf9826e9ecb32fd7df6e270e8eb3c76baef9a221f4', usage: 'Ninho mineralizado.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-bough', textureKey: 'flores_corrupted_bough', fileName: 'flores-corrupted-bough.svg', width: 224, height: 80, originId: FLORES_ASSET_ORIGIN.id, sha256: 'dca298ac58665a20c28c235b0bd00977529f2d7c986d8f6828d9b7649a15c386', usage: 'Copa contraída de primeiro plano.' }),
  Object.freeze({ id: 'asset.floresta.flores.corrupted-spores', textureKey: 'flores_corrupted_spore_column', fileName: 'flores-corrupted-spore-column.svg', width: 112, height: 224, originId: FLORES_ASSET_ORIGIN.id, sha256: '49d79941b1c0792c2bcaafe91680c03274350bf649d00ffd4ed5c95fc0bc726c', usage: 'Coluna de esporos contaminados.' }),
]);

export function floresAssetByTextureKey(textureKey: string): FloresAssetEntry | undefined {
  return FLORES_ASSETS.find(asset => asset.textureKey === textureKey);
}

export function floresAssetOriginById(id: string) {
  if (id === FLORES_ASSET_ORIGIN.id) return FLORES_ASSET_ORIGIN;
  if (id === FLORES_GENERATED_ASSET_ORIGIN.id) return FLORES_GENERATED_ASSET_ORIGIN;
  return undefined;
}
