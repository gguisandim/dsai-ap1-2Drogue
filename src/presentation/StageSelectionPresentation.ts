import type { StageCatalogEntry } from '../stages';
import { resolveStageSummaryAsset } from './assets/StageSummaryAssetCatalog';

export interface StagePreview {
  readonly textureKey: string;
}

export function resolveStagePreview(
  stageId: string,
  textureExists: (textureKey: string) => boolean,
  presentationVariantId?: string,
): StagePreview | undefined {
  const asset = resolveStageSummaryAsset(stageId, presentationVariantId);
  return asset && textureExists(asset.textureKey)
    ? Object.freeze({ textureKey: asset.textureKey })
    : undefined;
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
