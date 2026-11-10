/**
 * Original Igapó das Memórias illustrations. Every file is authored in the
 * repository as pixel-art SVG, has no third-party source and is loaded by the
 * existing local Vite asset pipeline through `preloadIgapoAssets`.
 */
export const IGAPO_ORIGINAL_ASSET_ORIGIN = Object.freeze({
  id: 'origin.aguas.igapo-original',
  pack: 'Igapó das Memórias — arte original',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/aguas/README.md',
});

export interface IgapoAssetEntry {
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

export const IGAPO_ASSETS: Readonly<Record<string, IgapoAssetEntry>> = Object.freeze({
  forestFloor: Object.freeze({
    id: 'asset.aguas.igapo-forest-floor',
    textureKey: 'igapo_forest_floor_art',
    fileName: 'igapo-forest-floor.svg',
    width: 64,
    height: 32,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 2,
    sha256: 'ca61b09f7130cd362a2efff7687dda339dccc73f180ddf68fb6a32bb42d927ed',
    usage: 'Dois pisos contínuos: musgo úmido e chão alagado.',
  }),
  emergentTree: Object.freeze({
    id: 'asset.aguas.igapo-emergent-tree',
    textureKey: 'igapo_emergent_tree_art',
    fileName: 'igapo-emergent-tree.svg',
    width: 96,
    height: 128,
    sha256: '27021d1383881d9b35337a3a0c2e68112379033e9e8fe1d892becd4e76c1c160',
    usage: 'Árvore emersa com raízes tabulares, copa e fungos de memória.',
  }),
  palmCluster: Object.freeze({
    id: 'asset.aguas.igapo-palm-cluster',
    textureKey: 'igapo_palm_cluster_art',
    fileName: 'igapo-palm-cluster.svg',
    width: 96,
    height: 112,
    sha256: 'bc23308c4502370796fb7e094e47933eaf4795bda3a7fb56a3dc8fb48ae7e4cd',
    usage: 'Moita de palmeiras de igapó em ilhas e margens.',
  }),
  rootTangle: Object.freeze({
    id: 'asset.aguas.igapo-root-tangle',
    textureKey: 'igapo_root_tangle_art',
    fileName: 'igapo-root-tangle.svg',
    width: 96,
    height: 64,
    sha256: 'd465b2b8727dc0b437b672d14172f4de52734d916786438a087afd12ad956460',
    usage: 'Massa de raízes expostas sobre terra e margem.',
  }),
  submergedTrunk: Object.freeze({
    id: 'asset.aguas.igapo-submerged-trunk',
    textureKey: 'igapo_submerged_trunk_art',
    fileName: 'igapo-submerged-trunk.svg',
    width: 128,
    height: 64,
    sha256: '128ab5cf7397bcd87433c2b1d60e33f20ff6791e94c073427f6cdd21471df14e',
    usage: 'Tronco caído meio submerso, com linha d’água e espuma.',
  }),
  waterLily: Object.freeze({
    id: 'asset.aguas.igapo-water-lily',
    textureKey: 'igapo_water_lily_art',
    fileName: 'igapo-water-lily.svg',
    width: 128,
    height: 32,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    sha256: 'a37be4413b85779fe1219253b17ebbb6b6e8cda1a4b4de0424a159b996d17e8c',
    usage: 'Quatro variantes de vitórias-régias para a superfície da água.',
  }),
  shoreFringe: Object.freeze({
    id: 'asset.aguas.igapo-shore-fringe',
    textureKey: 'igapo_shore_fringe_art',
    fileName: 'igapo-shore-fringe.svg',
    width: 128,
    height: 32,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    sha256: 'ca5894c454e965a65c78fe87164ca6c679e77abb032238f0c68a52172d84af21',
    usage: 'Quatro franjas de margem que dissolvem a emenda ortogonal terra/água.',
  }),
  groundMoss: Object.freeze({
    id: 'asset.aguas.igapo-ground-moss',
    textureKey: 'igapo_ground_moss_art',
    fileName: 'igapo-ground-moss.svg',
    width: 128,
    height: 32,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    sha256: 'a2248997d92ff49a5abfcc559685cf8eec30b6a901fdb01704bb564fcfff7331',
    usage: 'Quatro manchas de musgo, folhiço e limo para o piso do igapó.',
  }),
  stiltHut: Object.freeze({
    id: 'asset.aguas.igapo-stilt-hut',
    textureKey: 'igapo_stilt_hut_art',
    fileName: 'igapo-stilt-hut.svg',
    width: 96,
    height: 80,
    sha256: '606f18b4105d3c7a48637db0f611a9fbfc6d33b5b76c0660a39fbbf4c0f79f49',
    usage: 'Palafita ribeirinha em ruínas, com lanterna de memória.',
  }),
  memoryStela: Object.freeze({
    id: 'asset.aguas.igapo-memory-stela',
    textureKey: 'igapo_memory_stela_art',
    fileName: 'igapo-memory-stela.svg',
    width: 48,
    height: 80,
    sha256: '09b3ab3c42ef093a353845668692ee92f314a537cb0d16fa7e30d5a8003b151b',
    usage: 'Estela ritual com glifos ciano e raízes na base.',
  }),
  canopyBough: Object.freeze({
    id: 'asset.aguas.igapo-canopy-bough',
    textureKey: 'igapo_canopy_bough_art',
    fileName: 'igapo-canopy-bough.svg',
    width: 192,
    height: 64,
    sha256: 'f362566b45a040e6dd9fa475231835cc715454fc0ed01000cee805fbb5e90f83',
    usage: 'Galho suspenso de primeiro plano para as bordas do mapa.',
  }),
  lightShaft: Object.freeze({
    id: 'asset.aguas.igapo-light-shaft',
    textureKey: 'igapo_light_shaft_art',
    fileName: 'igapo-light-shaft.svg',
    width: 96,
    height: 192,
    sha256: 'afa44e08b7129d25220a7ec42f3cd5e99239b446bea1630935fdb2fb9d5046d5',
    usage: 'Feixe de luz filtrada pelas copas.',
  }),
  canopyShadow: Object.freeze({
    id: 'asset.aguas.igapo-canopy-shadow',
    textureKey: 'igapo_canopy_shadow_art',
    fileName: 'igapo-canopy-shadow.svg',
    width: 96,
    height: 48,
    sha256: '187b9d2f7f0c8f093e16fbdf645ca4955bbe2f83379957a8f579053c26c8f7ec',
    usage: 'Sombra suave de copa projetada no terreno.',
  }),
});

export const IGAPO_ASSET_LIST: readonly IgapoAssetEntry[] = Object.freeze(
  Object.values(IGAPO_ASSETS),
);
