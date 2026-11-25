import type Phaser from 'phaser';
import { listStageSummaryAssets } from './StageSummaryAssetCatalog';

const SUMMARY_IMAGE_URLS = import.meta.glob<string>(
  '../../assets/stage-summaries/*.png',
  { eager: true, import: 'default', query: '?url' },
);

export function preloadStageSummaryAssets(scene: Phaser.Scene): void {
  listStageSummaryAssets().forEach(({ asset }) => {
    const path = `../../assets/stage-summaries/${asset.fileName}`;
    const url = SUMMARY_IMAGE_URLS[path];
    if (!url) throw new Error(`Stage summary image is not bundled: ${asset.fileName}`);
    scene.load.image(asset.textureKey, url);
  });
}
