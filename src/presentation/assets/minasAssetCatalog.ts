export const MINAS_ASSET_ORIGIN = Object.freeze({
  id: 'origin.corrupted.minas.original',
  pack: 'Minas Corrompidas — pixel art e SVG autoral',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/minas-corrompidas/README.md',
});

export const MINAS_IMAGEGEN_ORIGIN = Object.freeze({
  id: 'origin.corrupted.minas.imagegen',
  pack: 'Minas Corrompidas — panoramas pictóricos',
  author: 'OpenAI ImageGen sob direção do projeto',
  license: 'asset gerado para o projeto; sem material de terceiro declarado',
  sourceUrl: 'src/assets/minas-corrompidas/README.md',
});

export interface MinasAssetEntry {
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

const original = MINAS_ASSET_ORIGIN.id;
const imagegen = MINAS_IMAGEGEN_ORIGIN.id;

export const MINAS_ASSETS: readonly MinasAssetEntry[] = Object.freeze([
  Object.freeze({ id: 'asset.corrupted.minas.panorama-abandoned', textureKey: 'minas_panorama_abandoned', fileName: 'mina-abandoned-panorama.png', width: 2172, height: 724, originId: imagegen, sha256: 'ba80430e9896768643c013416b98a8ec1c43691e43d2a43c93892e05741d0df5', usage: 'Fundo pictórico da mina Abandonada.' }),
  Object.freeze({ id: 'asset.corrupted.minas.panorama-corrupted', textureKey: 'minas_panorama_corrupted', fileName: 'mina-corrupted-panorama.png', width: 2172, height: 724, originId: imagegen, sha256: 'a4aaac6e2f1bdf5d5ddd1348b448fd9f59ef4880e4b8919acffc351597a652a0', usage: 'Fundo pictórico do núcleo Corrompido.' }),
  Object.freeze({ id: 'asset.corrupted.minas.floor-abandoned', textureKey: 'minas_floor_abandoned', fileName: 'mine-floor-abandoned.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, originId: original, sha256: '4cca0b0e184ddc02b720d8536d984f312688bab40656de9a6b3b1cd0a49d330b', usage: 'Quatro pisos pixelados da variante Abandonada.' }),
  Object.freeze({ id: 'asset.corrupted.minas.floor-corrupted', textureKey: 'minas_floor_corrupted', fileName: 'mine-floor-corrupted.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, originId: original, sha256: '1162532bd68ba54d60bdfd83cf79e90e34ddcc2d74ca9f434be71e4a50d2378f', usage: 'Quatro pisos mineralizados da variante Corrompida.' }),
  Object.freeze({ id: 'asset.corrupted.minas.timber', textureKey: 'minas_timber', fileName: 'mine-timber.svg', width: 224, height: 176, originId: original, sha256: 'a900bb39bf8fa28faf44ccad49ff387d2b041677949247b805f5218fe9d6581e', usage: 'Vigas apodrecidas.' }),
  Object.freeze({ id: 'asset.corrupted.minas.timber-corrupted', textureKey: 'minas_timber_corrupted', fileName: 'mine-timber-corrupted.svg', width: 224, height: 176, originId: original, sha256: 'a65201dd535f474abb8305ea358ae60bdc3e089ee8e0dc805d1afa8a15dcf3cb', usage: 'Vigas incorporadas por raízes minerais.' }),
  Object.freeze({ id: 'asset.corrupted.minas.rails', textureKey: 'minas_rails', fileName: 'mine-rails.svg', width: 256, height: 96, originId: original, sha256: '1750b611fe907f57e62b0c023b5d6459e87b68d72fd1bf6c98b5b4afe4e81eeb', usage: 'Trilhos e dormentes.' }),
  Object.freeze({ id: 'asset.corrupted.minas.roots', textureKey: 'minas_roots', fileName: 'mine-roots.svg', width: 256, height: 192, originId: original, sha256: 'cd105a3023de0e4beff5ebc323d5a2fefebd7b4c8963553f403198b312424fd6', usage: 'Raízes amazônicas recuperando galerias.' }),
  Object.freeze({ id: 'asset.corrupted.minas.roots-corrupted', textureKey: 'minas_roots_corrupted', fileName: 'mine-roots-corrupted.svg', width: 256, height: 192, originId: original, sha256: 'b09458b28505178f4c569a447e0a71be345f5338bebb3fb1f04642bc8fbf8a11', usage: 'Raízes mineralizadas e deformadas.' }),
  Object.freeze({ id: 'asset.corrupted.minas.crystals', textureKey: 'minas_crystals', fileName: 'mine-crystals.svg', width: 160, height: 144, originId: original, sha256: '1df3cf809ac51d7a61a2b9862b308be0457ac058b674036aeedad711a7bb0201', usage: 'Veios estáveis de arumã.' }),
  Object.freeze({ id: 'asset.corrupted.minas.crystals-corrupted', textureKey: 'minas_crystals_corrupted', fileName: 'mine-crystals-corrupted.svg', width: 192, height: 176, originId: original, sha256: '972b13dacfa5a4bb3fdf92685115b98805312c44e0c524ee99d3695b08278557', usage: 'Arumã deformado e luminoso.' }),
  Object.freeze({ id: 'asset.corrupted.minas.fungi', textureKey: 'minas_fungi', fileName: 'mine-fungi.svg', width: 192, height: 144, originId: original, sha256: '5c621c92ecb526bf2b447d0b5fda3c3b113b7094c974d043841b302853e172a5', usage: 'Fungos subterrâneos anômalos.' }),
  Object.freeze({ id: 'asset.corrupted.minas.machinery', textureKey: 'minas_machinery', fileName: 'mine-machinery.svg', width: 288, height: 224, originId: original, sha256: 'ba25d365fe06eef5a0fd0343641302992e0350b7e4ab7690854bc919f4638e0d', usage: 'Guincho e máquina de extração.' }),
  Object.freeze({ id: 'asset.corrupted.minas.core', textureKey: 'minas_core', fileName: 'mine-core.svg', width: 320, height: 256, originId: original, sha256: '428bb10103f30b56399c761da13de5020b9c43f874779a75d6b349e6ac82875f', usage: 'Maquinário orgânico-mineral do núcleo.' }),
  Object.freeze({ id: 'asset.corrupted.minas.seal', textureKey: 'minas_seal', fileName: 'mine-seal.svg', width: 128, height: 128, originId: original, sha256: '33bb02cb440b8a2ec0c57062b3816ce8edfbc841ac95468fae1e245903ac83be', usage: 'Selo rompido do Credor.' }),
  Object.freeze({ id: 'asset.corrupted.minas.maira', textureKey: 'minas_maira', fileName: 'mine-maira.svg', width: 64, height: 80, originId: original, sha256: 'ad1c3e6e91f0b2e0e3d722411b6c260193305ff0c4710539c972ae16ac348528', usage: 'Sprite pixelado de Maíra.' }),
  Object.freeze({ id: 'asset.corrupted.minas.nilo', textureKey: 'minas_nilo', fileName: 'mine-nilo.svg', width: 64, height: 80, originId: original, sha256: 'cc9ad37e86e4f35340bf4707350da0e3d2f8d4ff548910d8c0c92380ace30e63', usage: 'Sprite pixelado do vestígio de Nilo.' }),
  Object.freeze({ id: 'asset.corrupted.minas.evidence', textureKey: 'minas_evidence', fileName: 'mine-evidence.svg', width: 80, height: 80, originId: original, sha256: '5807930683469bce9cd936725eb9f46c66106ba4898af829833baf140479c884', usage: 'Memória ambiental do aquífero.' }),
  Object.freeze({ id: 'asset.corrupted.minas.ledger', textureKey: 'minas_ledger', fileName: 'mine-ledger.svg', width: 96, height: 72, originId: original, sha256: 'd256736b9ed97113469b36f72f0264f06945122f2b39c87020800d17c50a2d99', usage: 'Lâmina do livro-caixa.' }),
  Object.freeze({ id: 'asset.corrupted.minas.mole', textureKey: 'minas_mole', fileName: 'mine-mole.svg', width: 80, height: 64, originId: original, sha256: 'f72c5a18dfdadc3a0a727f797b059dfa9aae9267ab5aa7333b7daec02b3cb36d', usage: 'Criatura subterrânea territorial.' }),
  Object.freeze({ id: 'asset.corrupted.minas.rootling', textureKey: 'minas_rootling', fileName: 'mine-rootling.svg', width: 80, height: 80, originId: original, sha256: '999a8cce5b7cb8a7005acc5e3d6a90badae84f9fb3410fdea1a8761098d5f47e', usage: 'Organismo vegetal mineralizado.' }),
  Object.freeze({ id: 'asset.corrupted.minas.guardian', textureKey: 'minas_guardian', fileName: 'mine-guardian.svg', width: 96, height: 96, originId: original, sha256: 'e570b0075d3b62109bd27d1a2745dd9d3bdc47df56f7dd6c50350c67a77026bb', usage: 'Guardião corrompido das galerias.' }),
  Object.freeze({ id: 'asset.corrupted.minas.heart', textureKey: 'minas_heart', fileName: 'mine-heart.svg', width: 128, height: 128, originId: original, sha256: 'f19b09c595e4082c794f6800355afb828eb5650e8ca91ea13e16e97b9c2224fd', usage: 'Entidade Coração de Lastro.' }),
]);

export function minasAssetByTextureKey(textureKey: string): MinasAssetEntry | undefined {
  return MINAS_ASSETS.find(asset => asset.textureKey === textureKey);
}

export function minasAssetOriginById(id: string) {
  if (id === MINAS_ASSET_ORIGIN.id) return MINAS_ASSET_ORIGIN;
  if (id === MINAS_IMAGEGEN_ORIGIN.id) return MINAS_IMAGEGEN_ORIGIN;
  return undefined;
}

