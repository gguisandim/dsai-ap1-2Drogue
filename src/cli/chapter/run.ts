import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createStageAuthoringCapabilities, type StageModule } from '../../stages';
import { printCapabilities } from './capabilities';
import { CHAPTER_CLI_HELP, parseChapterCliArguments } from './args';
import { ChapterCliError, usageError } from './errors';
import { nodeChapterFileSystem } from './fs';
import { createChapter } from './generator';
import { inspectChapterEntry } from './inspect';
import { entryFromModule, loadChapterModule } from './loader';
import { STAGE_PLAN_FILENAME, validateStagePlanFile } from './plan';
import {
  defaultTitle,
  deriveNamespace,
  resolveChapterDir,
  resolveChaptersRoot,
  validateNamespace,
  validateSlug,
} from './names';
import { createVisualPreview, previewChapterEntry } from './preview';
import {
  printCreateResult,
  printDiagnostics,
  printInspection,
  printPlanValidationReport,
  printPlaytestReport,
  printPreview,
  printValidationReport,
} from './render';
import { playtestChapter, playtestExitCode } from './playtest';
import { validateChapterEntry } from './validation';
import type { ChapterCliOptions } from './types';

function repoRootFromFile(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

/**
 * Synchronous command entry. Returns the process exit code.
 */
export function runChapterCli(
  argv: readonly string[],
  options: ChapterCliOptions = {},
): number {
  const print = options.print ?? ((line: string) => console.log(line));
  const printError = options.printError ?? ((line: string) => console.error(line));
  try {
    const parsed = parseChapterCliArguments(argv);
    if (parsed.command === 'help') {
      print(CHAPTER_CLI_HELP);
      return 0;
    }

    if (parsed.command === 'capabilities') {
      printCapabilities(createStageAuthoringCapabilities(), parsed.json, print);
      return 0;
    }

    const repoRoot = path.resolve(options.repoRoot ?? repoRootFromFile());
    const chaptersRoot = resolveChaptersRoot(
      repoRoot,
      options.chaptersRoot ?? parsed.chaptersDir,
    );
    const fileSystem = options.fileSystem ?? nodeChapterFileSystem;

    if (parsed.command === 'plan') {
      const chapterDir = resolveChapterDir(chaptersRoot, parsed.slug as string);
      const planFile = path.join(chapterDir, STAGE_PLAN_FILENAME);
      const displayPath = path.relative(repoRoot, planFile).split(path.sep).join('/');
      let stage: StageModule | undefined;
      if (fileSystem.exists(path.join(chapterDir, 'index.ts'))) {
        try {
          stage = entryFromModule(loadChapterModule(chapterDir)).stages[0];
        } catch {
          stage = undefined;
        }
      }
      const report = validateStagePlanFile(planFile, fileSystem, displayPath, stage);
      printPlanValidationReport(report, parsed.json, print);
      return report.ok ? 0 : 1;
    }

    if (parsed.command === 'create') {
      const slug = validateSlug(parsed.slug as string);
      const namespace = parsed.namespace
        ? validateNamespace(parsed.namespace)
        : deriveNamespace(slug);
      const title = parsed.title?.trim() || defaultTitle(slug);
      const created = createChapter({
        repoRoot,
        chaptersRoot,
        templateDir: path.join(repoRoot, 'src', 'examples', 'chapter-template'),
        slug,
        namespace,
        title,
        stageTitle: `${title} — Aproximação`,
        summary: `Capítulo ${title} gerado a partir do template oficial.`,
        revision: parsed.revision ?? 1,
        ...(parsed.template !== undefined ? { template: parsed.template } : {}),
        ...(parsed.seed !== undefined ? { seed: parsed.seed } : {}),
        ...(parsed.width !== undefined ? { width: parsed.width } : {}),
        ...(parsed.height !== undefined ? { height: parsed.height } : {}),
        ...(parsed.regionCount !== undefined ? { regionCount: parsed.regionCount } : {}),
        fileSystem,
        ...(options.loadGenerated ? { loadGenerated: options.loadGenerated } : {}),
      });
      printCreateResult(created, slug, print);
      return 0;
    }

    if (parsed.command === 'homologate') {
      const canonicalRoot = path.resolve(repoRoot, 'src', 'examples', 'chapters');
      if (path.resolve(chaptersRoot) !== canonicalRoot) {
        throw usageError(
          'usage.homologate-canonical-root',
          'Browser homologation requires the canonical authoring root src/examples/chapters.',
        );
      }
      const script = path.join(repoRoot, 'scripts', 'homologate-chapter.mjs');
      const scriptArgs = [script];
      if (parsed.slug !== undefined) scriptArgs.push(parsed.slug);
      else scriptArgs.push('--stage', parsed.stageId as string);
      if (parsed.variantId !== undefined) scriptArgs.push('--variant', parsed.variantId);
      if (parsed.json) scriptArgs.push('--json');
      try {
        const output = execFileSync(process.execPath, scriptArgs, {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 600_000,
          maxBuffer: 16 * 1024 * 1024,
        });
        if (output.trim().length > 0) print(output.trimEnd());
        return 0;
      } catch (error) {
        const failure = error as { readonly stdout?: string; readonly stderr?: string };
        if (failure.stdout?.trim()) print(failure.stdout.trimEnd());
        if (failure.stderr?.trim()) printError(failure.stderr.trimEnd());
        return 1;
      }
    }

    if (parsed.command === 'playtest') {
      const chapterDir = resolveChapterDir(chaptersRoot, parsed.slug as string);
      const planPath = path.join(chapterDir, STAGE_PLAN_FILENAME);
      const planDisplayPath = path.relative(repoRoot, planPath).split(path.sep).join('/');
      const report = playtestChapter({
        module: loadChapterModule(chapterDir),
        chapterDir,
        planDisplayPath,
        fileSystem,
        ...(parsed.seed !== undefined ? { seed: parsed.seed } : {}),
        ...(parsed.seeds !== undefined ? { seeds: parsed.seeds } : {}),
      });
      printPlaytestReport(report, parsed.json, print);
      return playtestExitCode(report);
    }

    const chapterDir = resolveChapterDir(chaptersRoot, parsed.slug as string);
    const entry = entryFromModule(loadChapterModule(chapterDir));

    if (parsed.command === 'validate') {
      const report = validateChapterEntry(entry);
      printValidationReport(report, print);
      return report.errors.length > 0 ? 1 : 0;
    }

    if (parsed.command === 'inspect') {
      const inspection = inspectChapterEntry(entry);
      if (parsed.json) {
        print(JSON.stringify(inspection, null, 2));
      } else {
        printInspection(inspection, print);
      }
      return 0;
    }

    const headlessPreview = previewChapterEntry(entry);
    const ok = headlessPreview.report.errors.length === 0 &&
      headlessPreview.individual.every(item => item.ok) &&
      headlessPreview.worldLab.ok;
    const preview = parsed.visual && ok
      ? Object.freeze({
          ...headlessPreview,
          rendering: 'prepared' as const,
          visual: createVisualPreview(parsed.slug as string, repoRoot, chaptersRoot),
        })
      : headlessPreview;
    printPreview(preview, print);
    return ok ? 0 : 1;
  } catch (error) {
    if (error instanceof ChapterCliError) {
      printError(`error: ${error.code}: ${error.message}`);
      if (error.diagnostics.length > 0) printDiagnostics(error.diagnostics, printError);
      if (error.exitCode === 2) printError(CHAPTER_CLI_HELP);
      return error.exitCode;
    }
    printError(`error: unexpected: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
