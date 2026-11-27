export interface StageSummaryAsset {
  readonly textureKey: string;
  readonly fileName: string;
}

export const STAGE_SUMMARY_CATALOG: Readonly<Record<string, readonly string[]>> = Object.freeze({
  level_01_forgotten_passage: Object.freeze([]),
  level_01_vestibule: Object.freeze([]),
  level_02_nave: Object.freeze([]),
  level_03_vigrid_streets: Object.freeze([]),
  level_04_colosseum: Object.freeze([]),
  level_05_clocktower: Object.freeze([]),
  level_06_inferno: Object.freeze([]),
  level_07_witches_crypt: Object.freeze([]),
  level_08_paradiso: Object.freeze([
    'variant.floresta.flores-veladas.natural',
    'variant.floresta.flores-veladas.corrupted',
  ]),
  level_09_limbo: Object.freeze([]),
  level_10_ithavoll: Object.freeze([]),
  'stage.aguas.coracao-corrompido': Object.freeze([]),
  'stage.aguas.igapo-das-memorias': Object.freeze([
    'variant.aguas.igapo-ribeirinho',
    'variant.aguas.igapo-sombrio',
  ]),
  'stage.corrupted.minas': Object.freeze([
    'variant.corrupted.minas.abandoned',
    'variant.corrupted.minas.corrupted',
  ]),
  'stage.final.palacio-do-credor': Object.freeze([
    'variant.final.palacio.decadencia',
    'variant.final.palacio.corrompido',
  ]),
  'stage.raiz-do-mundo.santuario': Object.freeze([]),
  verse_01_atrium: Object.freeze([]),
  verse_02_galeria: Object.freeze([]),
  verse_03_santuario: Object.freeze([]),
});

export function stageSummaryAssetSlug(value: string): string {
  return value.toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveStageSummaryAsset(
  stageId: string,
  presentationVariantId?: string,
): StageSummaryAsset | undefined {
  const variants = STAGE_SUMMARY_CATALOG[stageId];
  if (!variants || (presentationVariantId && !variants.includes(presentationVariantId))) {
    return undefined;
  }
  const variant = presentationVariantId ?? 'default';
  const base = stageSummaryAssetSlug(stageId);
  const suffix = stageSummaryAssetSlug(variant);
  return Object.freeze({
    textureKey: `stage-summary-${base}-${suffix}`,
    fileName: `${base}--${suffix}.png`,
  });
}

function requiredAsset(stageId: string, presentationVariantId?: string): StageSummaryAsset {
  const asset = resolveStageSummaryAsset(stageId, presentationVariantId);
  if (!asset) {
    throw new Error(`Stage summary is not mapped: ${stageId}/${presentationVariantId ?? 'default'}.`);
  }
  return asset;
}

export function listStageSummaryAssets(): readonly {
  readonly stageId: string;
  readonly presentationVariantId?: string;
  readonly asset: StageSummaryAsset;
}[] {
  return Object.freeze(Object.entries(STAGE_SUMMARY_CATALOG).flatMap(([stageId, variants]) => [
    Object.freeze({
      stageId,
      asset: requiredAsset(stageId),
    }),
    ...variants.map(presentationVariantId => Object.freeze({
      stageId,
      presentationVariantId,
      asset: requiredAsset(stageId, presentationVariantId),
    })),
  ]));
}
