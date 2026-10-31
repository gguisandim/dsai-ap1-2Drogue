import type {
  ChapterManifest,
  ChapterVisualResources,
  StageCapabilityRequirement,
} from '../../../stages';
import type { ChapterTemplateIds } from './ids';

const capability = (
  id: string,
  category: StageCapabilityRequirement['category'],
): StageCapabilityRequirement => Object.freeze({
  id,
  category,
  minimumVersion: 1,
  requirement: 'required' as const,
});

/**
 * Capabilities shared by the whole chapter. Every id exists in the real
 * runtime profile; a future chapter can extend this list without editing the
 * engine.
 */
const CHAPTER_CAPABILITIES: readonly StageCapabilityRequirement[] = Object.freeze([
  capability('navigation.authored-map', 'navigation'),
  capability('interaction.npc-dialogue', 'interaction'),
  capability('narrative.dialogue', 'narrative'),
  capability('narrative.mission', 'narrative'),
  capability('narrative.event', 'narrative'),
  capability('narrative.condition', 'narrative'),
]);

export interface TemplateChapterOptions {
  readonly revision: number;
  readonly title: string;
  readonly visualResources: ChapterVisualResources;
}

export function createTemplateChapter(
  ids: ChapterTemplateIds,
  options: TemplateChapterOptions,
): ChapterManifest {
  return Object.freeze({
    schemaVersion: 1 as const,
    id: ids.chapterId,
    revision: options.revision,
    title: options.title,
    stageIds: Object.freeze([ids.stageId]),
    entryStageId: ids.stageId,
    capabilities: CHAPTER_CAPABILITIES,
    visualResources: options.visualResources,
    tags: Object.freeze(['example', 'template', 'authored', 'isolated']),
  });
}
