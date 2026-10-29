import { AGUAS_CHAPTER_MANIFEST, AGUAS_CHAPTER_STAGES } from './aguas';
import { StageRegistry } from '../runtime/StageRegistry';

export function registerCampaignChapters(registry: StageRegistry): void {
  registry.registerChapter(AGUAS_CHAPTER_MANIFEST, AGUAS_CHAPTER_STAGES);
}

