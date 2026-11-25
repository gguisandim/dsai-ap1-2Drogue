import type { StageCatalogEntry, ResolvedStagePresentation } from '../stages';

export interface StagePreview {
  readonly textureKey: string;
  readonly frame?: number;
  readonly tiled: boolean;
}

export function resolveStagePreview(
  presentation: ResolvedStagePresentation | undefined,
  textureExists: (textureKey: string) => boolean,
): StagePreview | undefined {
  if (!presentation) return undefined;
  const minasSummaryByTheme: Readonly<Record<string, string>> = Object.freeze({
    'theme.corrupted.minas.abandoned': 'minas_panorama_abandoned',
    'theme.corrupted.minas.corrupted': 'minas_panorama_corrupted',
  });
  const minasSummary = minasSummaryByTheme[presentation.themeId];
  if (minasSummary && textureExists(minasSummary)) {
    return { textureKey: minasSummary, tiled: false };
  }
  const genericTextureKeys = new Set(['puny_world']);
  const summaryTexture = (textureKey: string): number =>
    /(?:panorama|canopy|trail|sanctuary|grove|entrance|passage)/i.test(textureKey) ? 0 : 1;
  const background = Object.values(presentation.decorations)
    .filter(item => item.layer === 'background' &&
      !genericTextureKeys.has(item.textureKey) &&
      textureExists(item.textureKey))
    .sort((left, right) =>
      summaryTexture(left.textureKey) - summaryTexture(right.textureKey) ||
      left.depth - right.depth);
  if (background.length > 0) return {
    textureKey: background[0].textureKey,
    ...(background[0].frame !== undefined ? { frame: background[0].frame } : {}),
    tiled: false,
  };

  const floor = presentation.tiles.floor;
  const floorTexture = [floor, ...floor.variants].find(item => textureExists(item.textureKey));
  return floorTexture ? {
    textureKey: floorTexture.textureKey,
    ...(floorTexture.frame !== undefined ? { frame: floorTexture.frame } : {}),
    tiled: true,
  } : undefined;
}

const DISPLAY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  crypt: 'Cripta',
  garden: 'Jardim',
  igapo: 'Igapó',
  raizes: 'Raízes',
});

export function formatCatalogLabels(ids: readonly string[]): string {
  if (ids.length === 0) return 'não informada';
  return ids.map(id => id.split('.').at(-1)!.split('-').map((part, index) => {
    const label = DISPLAY_LABELS[part] ??
      part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1);
    return index > 0 && ['da', 'das', 'de', 'do', 'dos', 'e'].includes(label.toLocaleLowerCase('pt-BR'))
      ? label.toLocaleLowerCase('pt-BR')
      : label;
  }).join(' ')).join(' · ');
}

export function describeStageAvailability(entry: StageCatalogEntry): string {
  if (entry.loadability === 'loadable') return 'Disponível para jogo individual';
  if (entry.loadability === 'planned' || entry.availability === 'planned') return 'Em planejamento';
  return 'Bloqueada · incompatibilidade de conteúdo';
}
