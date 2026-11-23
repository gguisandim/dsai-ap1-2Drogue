export const PALACIO_CREDOR_TEXTURE_KEY = 'palacio_credor';

export const PALACIO_ASSET_ORIGIN = Object.freeze({
  id: 'origin.final.palacio.original',
  pack: 'Palácio do Credor — arte autoral vetorial',
  author: 'Autoria original do projeto',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/palacio/README.md',
});

export const PALACIO_GENERATED_ASSET_ORIGIN = Object.freeze({
  id: 'origin.final.palacio.generated',
  pack: 'Palácio do Credor — folha do Credor gerada deterministicamente',
  author: 'Autoria original do projeto (scripts/generate-palacio-assets.mjs)',
  license: 'asset original do projeto; sem licença de terceiro',
  sourceUrl: 'src/assets/palacio/README.md',
});

export interface PalacioAssetEntry {
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

export const PALACIO_ASSETS: readonly PalacioAssetEntry[] = Object.freeze([
  Object.freeze({ id: 'asset.final.palacio.floor-decayed', textureKey: 'palacio_floor_decayed', fileName: 'palacio-floor-decayed.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'c9097a9204b080569bee898e752305d9301cda65a30d5b7f70f57bd96dc64a67', usage: 'Quatro pisos de laje fria da Decadência.' }),
  Object.freeze({ id: 'asset.final.palacio.floor-corrupted', textureKey: 'palacio_floor_corrupted', fileName: 'palacio-floor-corrupted.svg', width: 128, height: 32, frameWidth: 32, frameHeight: 32, frameCount: 4, originId: PALACIO_ASSET_ORIGIN.id, sha256: '4e5df5fd248fbd395b975dfa7d1466b860f47eb8f4fdd9b00a23fb3963cdc567', usage: 'Quatro pisos rachados da variante Corrompida.' }),
  Object.freeze({ id: 'asset.final.palacio.gate', textureKey: 'palacio_gate', fileName: 'palacio-gate.svg', width: 320, height: 256, originId: PALACIO_ASSET_ORIGIN.id, sha256: '224831cc52f6f795c5a2661828f373f467edc80c374d70aa5c6004c1c44f8e37', usage: 'Portal monumental da entrada.' }),
  Object.freeze({ id: 'asset.final.palacio.gate-corrupted', textureKey: 'palacio_gate_corrupted', fileName: 'palacio-gate-corrupted.svg', width: 320, height: 256, originId: PALACIO_ASSET_ORIGIN.id, sha256: '9c260ebb215659ea1ec6ce0a63f5fcfb6e9ed1d3ce4c1f8ae375803cdec387f6', usage: 'Portal rompido por raízes na Corrupção.' }),
  Object.freeze({ id: 'asset.final.palacio.tower', textureKey: 'palacio_tower', fileName: 'palacio-tower.svg', width: 192, height: 288, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'f3b4339dd3ccfd969705f6ae4aa289729f11854ae10a363c33eebd99756bc8fc', usage: 'Torre de registro do Palácio.' }),
  Object.freeze({ id: 'asset.final.palacio.tower-corrupted', textureKey: 'palacio_tower_corrupted', fileName: 'palacio-tower-corrupted.svg', width: 192, height: 288, originId: PALACIO_ASSET_ORIGIN.id, sha256: '0a2263a2f9c8cf38d8352f2165b2c15dbfefff04477433bf8f4b8f3b2cd086aa', usage: 'Torre colapsada e tomada por raízes.' }),
  Object.freeze({ id: 'asset.final.palacio.arcade', textureKey: 'palacio_arcade', fileName: 'palacio-arcade.svg', width: 288, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: '4f98b3d19a0f4a8445c711aca585fb47feff0062590780e6dc033f92bd6b65e4', usage: 'Arcada das galerias externas.' }),
  Object.freeze({ id: 'asset.final.palacio.arcade-corrupted', textureKey: 'palacio_arcade_corrupted', fileName: 'palacio-arcade-corrupted.svg', width: 288, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'b94666fcd99f6c1e4ca11105eaf785101487b35c5b670ff815f7ac792b37a54a', usage: 'Arcada deformada da Corrupção.' }),
  Object.freeze({ id: 'asset.final.palacio.dais', textureKey: 'palacio_dais', fileName: 'palacio-dais.svg', width: 224, height: 160, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'a4ef55cef502eeec963727f49ccdb7b12beb854450dc974ba65263360003c2a2', usage: 'Estrado da arena.' }),
  Object.freeze({ id: 'asset.final.palacio.throne', textureKey: 'palacio_throne', fileName: 'palacio-throne.svg', width: 160, height: 224, originId: PALACIO_ASSET_ORIGIN.id, sha256: '3b18eb8459c59fc5ed5a52c8c1200f5b01211c9e31aac754429cf5899fdc53d5', usage: 'Trono do Credor.' }),
  Object.freeze({ id: 'asset.final.palacio.throne-corrupted', textureKey: 'palacio_throne_corrupted', fileName: 'palacio-throne-corrupted.svg', width: 160, height: 224, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'e12dbec78fb3f1fd91572daeca6b776a43cd0c0a267496d7ed83195afd595de0', usage: 'Trono de raízes da Corrupção.' }),
  Object.freeze({ id: 'asset.final.palacio.chain', textureKey: 'palacio_chain', fileName: 'palacio-chain.svg', width: 96, height: 256, originId: PALACIO_ASSET_ORIGIN.id, sha256: '6426c1d283be446aa7ba086b7a0f2a5331499eccef22ffa76a5598410b916f3f', usage: 'Correntes de penhora.' }),
  Object.freeze({ id: 'asset.final.palacio.sigil', textureKey: 'palacio_sigil', fileName: 'palacio-sigil.svg', width: 96, height: 96, originId: PALACIO_ASSET_ORIGIN.id, sha256: '1d7609008d12d67614cca733c1a374f2162e5db5788f0fc561bc99f5aee326cf', usage: 'Selo do Credor e do Eco.' }),
  Object.freeze({ id: 'asset.final.palacio.sigil-corrupted', textureKey: 'palacio_sigil_corrupted', fileName: 'palacio-sigil-corrupted.svg', width: 96, height: 96, originId: PALACIO_ASSET_ORIGIN.id, sha256: '348c2bd9871d5b288cac449f0b1732a9a41376ad08a673527dd5860873842cac', usage: 'Selo sangrento da Corrupção.' }),
  Object.freeze({ id: 'asset.final.palacio.ledger', textureKey: 'palacio_ledger', fileName: 'palacio-ledger.svg', width: 160, height: 112, originId: PALACIO_ASSET_ORIGIN.id, sha256: 'e244a90a7498dd04b0a671b24af5e5e192d35edcfc1273455468141ea5c80a12', usage: 'Livro-raiz de registros.' }),
  Object.freeze({ id: 'asset.final.palacio.statue', textureKey: 'palacio_statue', fileName: 'palacio-statue.svg', width: 96, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: '625888292d4e5f6587c5ebbc3131f6dc7808164914ac01f8ee0bea0639f8df45', usage: 'Estátua de devedor e Sentinela.' }),
  Object.freeze({ id: 'asset.final.palacio.banner', textureKey: 'palacio_banner', fileName: 'palacio-banner.svg', width: 96, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: '807a0fe22e0dfdc19fb64a4523506ab621153edd449e9adf0b1a906f50a4aa30', usage: 'Estandarte gasto do Palácio.' }),
  Object.freeze({ id: 'asset.final.palacio.canopy', textureKey: 'palacio_canopy', fileName: 'palacio-canopy.svg', width: 256, height: 160, originId: PALACIO_ASSET_ORIGIN.id, sha256: '882d40309387af225180111bfa3107f2c631114550c21bf096629cf80b036221', usage: 'Copa escura de fundo.' }),
  Object.freeze({ id: 'asset.final.palacio.glass', textureKey: 'palacio_glass', fileName: 'palacio-glass.svg', width: 128, height: 192, originId: PALACIO_ASSET_ORIGIN.id, sha256: '7ff023231105f41f3623b4683258187080c71e006607882823b883150a008a99', usage: 'Vitral da câmara de revelação.' }),
  Object.freeze({ id: 'asset.final.palacio.root-mass', textureKey: 'palacio_root_mass', fileName: 'palacio-root-mass.svg', width: 224, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: '12f0cfe4a40afe87bf9ce1dfc45cbd69f3d9b80bb55b60cd2c6c819524593cc7', usage: 'Massa de raízes agressivas.' }),
  Object.freeze({ id: 'asset.final.palacio.rubble', textureKey: 'palacio_rubble', fileName: 'palacio-rubble.svg', width: 224, height: 176, originId: PALACIO_ASSET_ORIGIN.id, sha256: '82594c44dabe21cb59a3c11522d87efac84b64700c04575b106321768a5937dd', usage: 'Escombros da Decadência.' }),
  Object.freeze({ id: 'asset.final.palacio.credor', textureKey: 'palacio_credor', fileName: 'credor-sheet.png', width: 512, height: 342, frameWidth: 128, frameHeight: 114, frameCount: 12, originId: PALACIO_GENERATED_ASSET_ORIGIN.id, sha256: '3eadc029ad0ad9d4e52669214a23e3e2695fd9894bb3cd3c101c005201388beb', usage: 'Folha 4x3 do Credor: caminhada, ataque e dano.' }),
]);

export function palacioAssetByTextureKey(textureKey: string): PalacioAssetEntry | undefined {
  return PALACIO_ASSETS.find(asset => asset.textureKey === textureKey);
}

export function palacioAssetOriginById(id: string) {
  if (id === PALACIO_ASSET_ORIGIN.id) return PALACIO_ASSET_ORIGIN;
  if (id === PALACIO_GENERATED_ASSET_ORIGIN.id) return PALACIO_GENERATED_ASSET_ORIGIN;
  return undefined;
}
