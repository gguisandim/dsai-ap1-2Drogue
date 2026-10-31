import path from 'node:path';
import { CHAPTER_CLI_HELP, parseChapterCliArguments } from './args';
import { ChapterCliError } from './errors';
import { nodeChapterFileSystem } from './fs';
import { createChapter } from './generator';
import { inspectChapterEntry } from './inspect';
import { entryFromModule, loadChapterModule } from './loader';
import {
  defaultTitle,
  deriveNamespace,
  resolveChapterDir,
  resolveChaptersRoot,
  validateNamespace,
  validateSlug,
} from './names';
import { previewChapterEntry } from './preview';
import {
  printCreateResult,
  printDiagnostics,
  printInspection,
  printPreview,
  printValidationReport,
} from './render';
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

    const repoRoot = path.resolve(options.repoRoot ?? repoRootFromFile());
    const chaptersRoot = resolveChaptersRoot(
      repoRoot,
      options.chaptersRoot ?? parsed.chaptersDir,
    );
    const fileSystem = options.fileSystem ?? nodeChapterFileSystem;

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
        fileSystem,
        ...(options.loadGenerated ? { loadGenerated: options.loadGenerated } : {}),
      });
      printCreateResult(created, slug, print);
      return 0;
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

    const preview = previewChapterEntry(entry);
    printPreview(preview, print);
    const ok = preview.report.errors.length === 0 &&
      preview.individual.every(item => item.ok) &&
      preview.worldLab.ok;
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
