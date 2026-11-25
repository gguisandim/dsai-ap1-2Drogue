import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameSessionService } from '../application/stages';
import {
  describeStageAvailability,
  formatCatalogLabels,
  resolveStagePreview,
} from '../presentation/StageSelectionPresentation';
import {
  listStageSummaryAssets,
  resolveStageSummaryAsset,
  STAGE_SUMMARY_CATALOG,
} from '../presentation/assets/StageSummaryAssetCatalog';
import type { StageCatalogEntry } from '../stages';

describe('stage selection presentation', () => {
  it('resolves only the captured image for the selected stage and variant', () => {
    const stageId = 'stage.corrupted.minas';
    const defaultAsset = resolveStageSummaryAsset(stageId);
    const corruptedAsset = resolveStageSummaryAsset(
      stageId,
      'variant.corrupted.minas.corrupted',
    );
    expect(defaultAsset).toBeDefined();
    expect(corruptedAsset).toBeDefined();
    expect(corruptedAsset?.textureKey).not.toBe(defaultAsset?.textureKey);
    expect(resolveStagePreview(stageId, key => key === defaultAsset?.textureKey))
      .toEqual({ textureKey: defaultAsset?.textureKey });
    expect(resolveStagePreview(
      stageId,
      key => key === corruptedAsset?.textureKey,
      'variant.corrupted.minas.corrupted',
    )).toEqual({ textureKey: corruptedAsset?.textureKey });
    expect(resolveStagePreview(
      stageId,
      key => key === defaultAsset?.textureKey,
      'variant.corrupted.minas.corrupted',
    )).toBeUndefined();
    expect(resolveStagePreview(stageId, () => false)).toBeUndefined();
    expect(resolveStagePreview('unknown.stage', () => true)).toBeUndefined();
  });

  it('maps every loadable catalog stage and declared presentation variant', () => {
    const service = new GameSessionService();
    const entries = service.catalog?.list().filter(entry => entry.loadability === 'loadable') ?? [];
    expect(Object.keys(STAGE_SUMMARY_CATALOG).sort())
      .toEqual(entries.map(entry => entry.stageId).sort());

    entries.forEach(entry => {
      const module = service.registry.get(entry.stageId);
      expect(module).toBeDefined();
      const declaredVariants = Object.keys(module?.manifest.presentationVariants ?? {}).sort();
      expect([...STAGE_SUMMARY_CATALOG[entry.stageId]].sort()).toEqual(declaredVariants);
      expect(resolveStageSummaryAsset(entry.stageId)).toBeDefined();
      declaredVariants.forEach(variantId => {
        expect(resolveStageSummaryAsset(entry.stageId, variantId)).toBeDefined();
      });
    });
  });

  it('stores a valid 460 by 250 PNG capture for every mapped presentation', () => {
    const assets = listStageSummaryAssets();
    const fileNames = assets.map(item => item.asset.fileName);
    expect(new Set(fileNames).size).toBe(fileNames.length);
    const defaultHashes = assets
      .filter(item => item.presentationVariantId === undefined)
      .map(({ asset }) => createHash('sha256').update(readFileSync(resolve(
        __dirname,
        '../assets/stage-summaries',
        asset.fileName,
      ))).digest('hex'));
    expect(new Set(defaultHashes).size).toBe(defaultHashes.length);
    assets.forEach(({ asset }) => {
      const image = readFileSync(resolve(
        __dirname,
        '../assets/stage-summaries',
        asset.fileName,
      ));
      expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(image.readUInt32BE(16)).toBe(460);
      expect(image.readUInt32BE(20)).toBe(250);
      expect(image.length).toBeGreaterThan(1_000);
    });
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
