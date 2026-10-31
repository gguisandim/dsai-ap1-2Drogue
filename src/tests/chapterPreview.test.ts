import {
  CAMPAIGN_CHAPTER_CATALOG,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_SOMBRIO_THEME_ID,
  IGAPO_SOMBRIO_VARIANT_ID,
  IGAPO_VISUAL_THEME_ID,
  type CampaignChapterEntry,
} from '../stages';
import {
  CHAPTER_TEMPLATE,
  CHAPTER_TEMPLATE_STAGE_ID,
} from '../examples/chapter-template';
import {
  createAuthoringChapterRegistry,
  entryFromPreviewModule,
  startAuthoringChapterPreview,
  startProductionStagePreview,
} from '../devtools/chapter-preview/ChapterPreviewService';

describe('development chapter preview registration', () => {
  it('registers a generated chapter in an isolated registry and starts an individual session', () => {
    const registry = createAuthoringChapterRegistry(CHAPTER_TEMPLATE.entry);
    const started = startAuthoringChapterPreview(CHAPTER_TEMPLATE.entry);

    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.session.stageId).toBe(CHAPTER_TEMPLATE_STAGE_ID);
    expect(started.session.loadedStage.manifest.id).toBe(CHAPTER_TEMPLATE_STAGE_ID);
    expect(started.session.loadedStage.level.tileMap.length).toBeGreaterThan(0);
    expect(registry.get(CHAPTER_TEMPLATE_STAGE_ID)).toBeDefined();
    expect(registry.get(IGAPO_DAS_MEMORIAS_STAGE_ID)).toBeDefined();
  });

  it('never mutates the production catalog or promotes the generated chapter', () => {
    const before = CAMPAIGN_CHAPTER_CATALOG.map(entry => entry.chapter.id).sort();
    createAuthoringChapterRegistry(CHAPTER_TEMPLATE.entry);
    const after = CAMPAIGN_CHAPTER_CATALOG.map(entry => entry.chapter.id).sort();
    expect(after).toEqual(before);
    expect(CAMPAIGN_CHAPTER_CATALOG.some(entry =>
      entry.stages.some(stage => stage.manifest.id === CHAPTER_TEMPLATE_STAGE_ID))).toBe(false);
  });

  it('rejects a generated entry that collides with a production chapter', () => {
    const collision: CampaignChapterEntry = {
      ...CHAPTER_TEMPLATE.entry,
      chapter: {
        ...CHAPTER_TEMPLATE.entry.chapter,
        id: CAMPAIGN_CHAPTER_CATALOG[0].chapter.id,
      },
    };
    expect(() => createAuthoringChapterRegistry(collision)).toThrow();
  });

  it('extracts an entry from the generated index module shape', () => {
    expect(entryFromPreviewModule({ CHAPTER_TEMPLATE })).toBe(CHAPTER_TEMPLATE.entry);
    expect(entryFromPreviewModule({ CHAPTER_TEMPLATE_ENTRY: CHAPTER_TEMPLATE.entry }))
      .toBe(CHAPTER_TEMPLATE.entry);
    expect(entryFromPreviewModule({})).toBeUndefined();
  });

  it('selects the Igapó default and sombrio presentations without changing the stage identity', () => {
    const ribeirinho = startProductionStagePreview(IGAPO_DAS_MEMORIAS_STAGE_ID);
    const sombrio = startProductionStagePreview(
      IGAPO_DAS_MEMORIAS_STAGE_ID,
      IGAPO_SOMBRIO_VARIANT_ID,
    );
    expect(ribeirinho).toBeDefined();
    expect(sombrio).toBeDefined();
    if (!ribeirinho || !sombrio) return;
    expect(ribeirinho.session.loadedStage.presentation?.themeId).toBe(IGAPO_VISUAL_THEME_ID);
    expect(sombrio.session.loadedStage.presentation?.themeId).toBe(IGAPO_SOMBRIO_THEME_ID);
    expect(sombrio.session.loadedStage.presentationVariantId).toBe(IGAPO_SOMBRIO_VARIANT_ID);
    expect(sombrio.session.loadedStage.manifest.id).toBe(ribeirinho.session.loadedStage.manifest.id);
    expect(sombrio.session.loadedStage.level.tileMap)
      .toEqual(ribeirinho.session.loadedStage.level.tileMap);
    expect(sombrio.session.loadedStage.encounter)
      .toEqual(ribeirinho.session.loadedStage.encounter);
  });

  it('fails closed for an unknown presentation variant', () => {
    expect(startProductionStagePreview(IGAPO_DAS_MEMORIAS_STAGE_ID, 'variant.missing'))
      .toBeUndefined();
  });
});
