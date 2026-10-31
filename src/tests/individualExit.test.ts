import { CHAPTER_TEMPLATE } from '../examples/chapter-template';
import { IGAPO_DAS_MEMORIAS_STAGE } from '../stages';
import { resolveIndividualExitId } from '../scenes/stageExitSelection';

describe('individual stage exit selection', () => {
  it('uses the authored manifest exit in individual mode', () => {
    expect(resolveIndividualExitId(true, IGAPO_DAS_MEMORIAS_STAGE.manifest))
      .toBe(IGAPO_DAS_MEMORIAS_STAGE.manifest.exits[0].id);
    expect(resolveIndividualExitId(true, CHAPTER_TEMPLATE.stage.manifest))
      .toBe(CHAPTER_TEMPLATE.stage.manifest.exits[0].id);
  });

  it('keeps legacy.next for legacy and manifest-less contexts', () => {
    expect(resolveIndividualExitId(false, IGAPO_DAS_MEMORIAS_STAGE.manifest)).toBe('legacy.next');
    expect(resolveIndividualExitId(true, undefined)).toBe('legacy.next');
    expect(resolveIndividualExitId(true, { ...IGAPO_DAS_MEMORIAS_STAGE.manifest, exits: [] }))
      .toBe('legacy.next');
  });
});
