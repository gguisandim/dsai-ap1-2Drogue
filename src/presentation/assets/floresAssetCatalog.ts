export const FLORES_ASSET_ORIGIN = Object.freeze({
  id: 'origin.floresta.flores-veladas-original',
  pack: 'Jardins das Flores Veladas — arte original',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
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
  readonly sha256: string;
  readonly usage: string;
}

export const FLORES_ASSETS: readonly FloresAssetEntry[] = Object.freeze([
  Object.freeze({ id: 'asset.floresta.flores.floor', textureKey: 'flores_forest_floor', fileName: 'flores-forest-floor.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, sha256: '790a0f5ff0a3fa0a7e9ff6a8220f4f184007e390291d9fdd74fcaa88901ae6b2', usage: 'Quatro pisos de folhiço e musgo.' }),
  Object.freeze({ id: 'asset.floresta.flores.tree', textureKey: 'flores_monumental_tree', fileName: 'flores-monumental-tree.svg', width: 192, height: 224, sha256: '66f28eccf0d52aaf4c7fc52e20d06b37155f59b5fcacf5de1341c9ba6cee1768', usage: 'Árvore das Mil Pétalas.' }),
  Object.freeze({ id: 'asset.floresta.flores.bromeliad', textureKey: 'flores_bromeliad_cluster', fileName: 'flores-bromeliad-cluster.svg', width: 96, height: 64, sha256: '63cd6a9c88c7faee6efa8c8a0d1e12dc2f98d528f2884a895e60b7998ff08577', usage: 'Bromélias e folhas largas.' }),
  Object.freeze({ id: 'asset.floresta.flores.heliconia', textureKey: 'flores_heliconia_arch', fileName: 'flores-heliconia-arch.svg', width: 160, height: 128, sha256: '827721cc09b9ecc235f657784c8377da2fb1f7804d7378071ae84e103204c8f4', usage: 'Arco natural de helicônias.' }),
  Object.freeze({ id: 'asset.floresta.flores.orchid', textureKey: 'flores_orchid_veil', fileName: 'flores-orchid-veil.svg', width: 128, height: 96, sha256: '134edf974615297be62ac88929fd3dd7371e36fe796341526102564a1b75035a', usage: 'Cortina de orquídeas.' }),
  Object.freeze({ id: 'asset.floresta.flores.nest', textureKey: 'flores_pollinator_nest', fileName: 'flores-pollinator-nest.svg', width: 128, height: 96, sha256: 'edea44a46cb40e2c8c14648a5e3adbb88134cc8b1550ad39d761b9df370d8fc3', usage: 'Ninho ritual dos polinizadores.' }),
  Object.freeze({ id: 'asset.floresta.flores.bough', textureKey: 'flores_canopy_bough', fileName: 'flores-canopy-bough.svg', width: 224, height: 80, sha256: '9ac0079646b4c3675c811f161e9d86a6c220d615969226f6b9786efc87482238', usage: 'Folhagem de primeiro plano.' }),
  Object.freeze({ id: 'asset.floresta.flores.light', textureKey: 'flores_light_shaft', fileName: 'flores-light-shaft.svg', width: 112, height: 224, sha256: 'c174dde2fde72e9fbb8af34260ac2738157b8c7847e5115cd0a1b4bea2434d71', usage: 'Feixe de luz filtrada.' }),
]);
