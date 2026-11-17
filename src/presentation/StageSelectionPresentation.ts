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
  const background = Object.values(presentation.decorations)
    .filter(item => item.layer === 'background')
    .sort((left, right) => left.depth - right.depth)
    .find(item => textureExists(item.textureKey));
  if (background) return {
    textureKey: background.textureKey,
    ...(background.frame !== undefined ? { frame: background.frame } : {}),
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
