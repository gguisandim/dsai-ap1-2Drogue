import type { ChapterManifest } from '../../contracts';
import {
  IGAPO_DAS_MEMORIAS_CHAPTER_ID,
  IGAPO_DAS_MEMORIAS_STAGE,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
} from './igapoDasMemorias';

export * from './igapoDasMemorias';

export const AGUAS_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: IGAPO_DAS_MEMORIAS_CHAPTER_ID,
  revision: 1,
  title: 'Rota das Águas',
  stageIds: Object.freeze([IGAPO_DAS_MEMORIAS_STAGE_ID]),
  entryStageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
  tags: Object.freeze(['campaign', 'aguas', 'amazon']),
});

export const AGUAS_CHAPTER_STAGES = Object.freeze([IGAPO_DAS_MEMORIAS_STAGE]);

