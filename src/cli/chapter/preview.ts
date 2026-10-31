import path from 'node:path';
import {
  CampaignGraphGenerator,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
  type CampaignChapterEntry,
} from '../../stages';
import { usageError } from './errors';
import type { ChapterVisualPreview } from './types';
import { GameSessionService } from '../../application/stages';
import { WorldLabDataService } from '../../devtools/world-lab/WorldLabDataService';
import { WORLD_LAB_FIXTURE_CATALOG } from '../../devtools/world-lab/fixtures/fixtureCatalog';
import { validateChapterEntry } from './validation';
import type {
  ChapterPreview,
  CliDiagnostic,
  IndividualPreview,
  WorldLabPreview,
} from './types';

function worldLabDiagnostics(
  document: Awaited<ReturnType<WorldLabDataService['generateGraph']>>,
  nodeId: string,
): readonly CliDiagnostic[] {
  if (!document.ok) return Object.freeze([]);
  return Object.freeze(document.value.diagnostics
    .filter(item => item.nodeId === nodeId || item.severity === 'error')
    .map(item => Object.freeze({
      code: item.code,
      severity: item.severity,
      message: item.message,
      path: Object.freeze([...(item.path ?? [])]),
      origin: 'runtime' as const,
      component: 'devtools/world-lab',
      ...(item.nodeId ? { referenceId: item.nodeId } : {}),
    })));
}

function individualPreview(entry: CampaignChapterEntry): readonly IndividualPreview[] {
  const registry = new StageRegistry();
  registerCampaignChapters(registry, [entry]);
  const service = new GameSessionService({ registry });
  return Object.freeze(entry.stages.map(stage => {
    const started = service.startIndividualStage(stage.manifest.id);
    if (!started.ok) {
      return Object.freeze({
        stageId: stage.manifest.id,
        ok: false as const,
        error: `${started.error.code}: ${started.error.message}`,
      });
    }
    return Object.freeze({
      stageId: stage.manifest.id,
      ok: true as const,
      levelId: started.value.loadedStage.level.id,
      encounterWaves: started.value.loadedStage.encounter?.waves.length ?? 0,
      themeId: started.value.loadedStage.presentation?.themeId,
    });
  }));
}

function worldLabPreview(entry: CampaignChapterEntry): WorldLabPreview {
  const stageId = entry.stages[0]?.manifest.id;
  if (!stageId) {
    return Object.freeze({
      ok: false,
      projected: false,
      diagnostics: Object.freeze([]),
      error: 'chapter-has-no-stage',
    });
  }
  const generated = new CampaignGraphGenerator().generate({
    campaignId: 'chapter-cli.preview',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'chapter-cli.preview.run',
    runSeed: 'chapter-cli.preview.seed',
    templates: WORLD_LAB_FIXTURE_CATALOG,
    context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
  });
  if (!generated.ok) {
    return Object.freeze({
      ok: false,
      projected: false,
      diagnostics: Object.freeze([]),
      error: `graph-generation-failed: ${generated.error.code}`,
    });
  }
  const target = generated.value.nodes.find(node => node.depth === 8) ?? generated.value.nodes[0];
  const graph = {
    ...generated.value,
    nodes: generated.value.nodes.map(node => node.id === target.id
      ? { ...node, stageId }
      : node),
  };
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry, [entry]);
  const document = new WorldLabDataService({ registry })
    .generateGraph('chapter-cli.preview.seed', graph);
  if (!document.ok) {
    return Object.freeze({
      ok: false,
      projected: false,
      diagnostics: Object.freeze([]),
      error: 'world-lab-projection-failed',
    });
  }
  const node = document.value.nodes.find(item => item.id === target.id);
  const diagnostics = worldLabDiagnostics(document, target.id);
  return Object.freeze({
    ok: node !== undefined && node.stageId === stageId,
    projected: node !== undefined && node.stageId === stageId,
    nodeId: target.id,
    ...(node ? { stageId: node.stageId } : {}),
    diagnostics,
  });
}

/**
 * Headless preview: real individual-mode load and real World Lab projection.
 * Rendering is explicitly not executed.
 */
/**
 * The Vite bootstrap only discovers the canonical authoring directory. A
 * custom --chapters-dir is valid for headless commands but cannot be previewed
 * visually without weakening that restriction.
 */
export function createVisualPreview(
  slug: string,
  repoRoot: string,
  chaptersRoot: string,
  port = 5173,
): ChapterVisualPreview {
  const canonicalRoot = path.resolve(repoRoot, 'src', 'examples', 'chapters');
  if (path.resolve(chaptersRoot) !== canonicalRoot) {
    throw usageError(
      'preview.visual-canonical-root',
      'Visual preview requires the canonical authoring root src/examples/chapters.',
    );
  }
  return Object.freeze({
    url: `http://localhost:${port}/?chapterPreview=${encodeURIComponent(slug)}`,
    authoringRoot: 'src/examples/chapters',
    bootstrap: 'chapterPreview' as const,
    note: 'Run npm run dev and open the URL. The Vite bootstrap validates the chapter, '
      + 'creates an isolated StageRegistry and starts an individual GameScene session.',
  });
}

export function previewChapterEntry(entry: CampaignChapterEntry): ChapterPreview {
  const report = validateChapterEntry(entry);
  if (report.errors.length > 0) {
    return Object.freeze({
      report,
      individual: Object.freeze([]),
      worldLab: Object.freeze({
        ok: false,
        projected: false,
        diagnostics: Object.freeze([]),
        error: 'validation-failed',
      }),
      rendering: 'not-executed' as const,
    });
  }
  return Object.freeze({
    report,
    individual: individualPreview(entry),
    worldLab: worldLabPreview(entry),
    rendering: 'not-executed' as const,
  });
}
