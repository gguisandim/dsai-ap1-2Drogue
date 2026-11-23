import {
  describeStageAvailability,
  formatCatalogLabels,
  resolveStagePreview,
} from '../presentation/StageSelectionPresentation';
import type { StageCatalogEntry, ResolvedStagePresentation } from '../stages';

const presentation = {
  decorations: {
    later: { layer: 'background', depth: 2, textureKey: 'canopy', frame: 4 },
    earlier: { layer: 'background', depth: 1, textureKey: 'roots' },
    foreground: { layer: 'foreground', depth: 0, textureKey: 'leaves' },
  },
  tiles: {
    floor: {
      textureKey: 'floor',
      variants: [{ textureKey: 'alternate-floor', frame: 3 }],
    },
  },
} as unknown as ResolvedStagePresentation;

describe('stage selection presentation', () => {
  it('prefers the available background, otherwise uses an available floor tile', () => {
    expect(resolveStagePreview(presentation, key => key === 'canopy'))
      .toEqual({ textureKey: 'canopy', frame: 4, tiled: false });
    expect(resolveStagePreview(presentation, key => key === 'alternate-floor'))
      .toEqual({ textureKey: 'alternate-floor', frame: 3, tiled: true });
    expect(resolveStagePreview(presentation, () => false)).toBeUndefined();
  });

  it('ignores generic puny-world backgrounds and prefers the stage summary texture', () => {
    const withGenericBackground = {
      decorations: {
        generic: { layer: 'background', depth: 2.1, textureKey: 'puny_world' },
        summary: { layer: 'background', depth: 2.18, textureKey: 'flores_natural_canopy' },
      },
      tiles: {
        floor: { textureKey: 'flores_forest_floor', variants: [] },
      },
    } as unknown as ResolvedStagePresentation;

    expect(resolveStagePreview(withGenericBackground, () => true))
      .toEqual({ textureKey: 'flores_natural_canopy', tiled: false });
  });

  it('localizes catalog labels and keeps loadability distinct from experimental layout', () => {
    expect(formatCatalogLabels(['region.aguas.igapo', 'hub.floresta-das-raizes']))
      .toBe('Igapó · Floresta das Raízes');
    expect(formatCatalogLabels([])).toBe('não informada');
    const entry = {
      loadability: 'loadable',
      availability: 'available',
    } as StageCatalogEntry;
    expect(describeStageAvailability(entry)).toBe('Disponível para jogo individual');
  });
});
