import { usageError } from './errors';
import type { ChapterCliArguments, ChapterCommandName } from './types';

const COMMANDS = new Set<ChapterCommandName>(['create', 'validate', 'inspect', 'preview']);

function requireValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw usageError('usage.missing-value', `Option ${option} requires a value.`);
  }
  return value;
}

/**
 * Pure argument parsing. It never touches the filesystem and never validates
 * whether a chapter exists; those checks belong to the operation layer.
 */
export function parseChapterCliArguments(argv: readonly string[]): ChapterCliArguments {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return Object.freeze({ command: 'help' as const, json: false });
  }
  const [rawCommand, ...rest] = argv;
  if (!COMMANDS.has(rawCommand as ChapterCommandName)) {
    throw usageError('usage.unknown-command', `Unknown chapter command: ${rawCommand}.`);
  }
  const command = rawCommand as Exclude<ChapterCommandName, 'help'>;
  let slug: string | undefined;
  let title: string | undefined;
  let namespace: string | undefined;
  let revision: number | undefined;
  let json = false;
  let chaptersDir: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument.startsWith('-')) {
      if (argument === '--json') {
        if (command !== 'inspect') {
          throw usageError('usage.unsupported-option', '--json is only supported by inspect.');
        }
        json = true;
        continue;
      }
      if (argument === '--chapters-dir') {
        chaptersDir = requireValue(rest, index, argument);
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--title') {
        title = requireValue(rest, index, argument).trim();
        if (title.length === 0) throw usageError('usage.invalid-title', 'Title cannot be empty.');
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--namespace') {
        namespace = requireValue(rest, index, argument).trim();
        if (namespace.length === 0) throw usageError('usage.invalid-namespace', 'Namespace cannot be empty.');
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--revision') {
        const raw = requireValue(rest, index, argument);
        if (!/^[0-9]+$/.test(raw)) {
          throw usageError('usage.invalid-revision', 'Revision must be a positive integer.');
        }
        revision = Number(raw);
        if (!Number.isSafeInteger(revision) || revision < 1) {
          throw usageError('usage.invalid-revision', 'Revision must be a positive integer.');
        }
        index += 1;
        continue;
      }
      throw usageError('usage.unknown-option', `Unknown option for ${command}: ${argument}.`);
    }
    if (slug !== undefined) {
      throw usageError('usage.unexpected-argument', `Unexpected argument: ${argument}.`);
    }
    slug = argument;
  }

  if (slug === undefined) {
    throw usageError('usage.missing-chapter', `Command ${command} requires a chapter slug.`);
  }

  return Object.freeze({
    command,
    slug,
    ...(title !== undefined ? { title } : {}),
    ...(namespace !== undefined ? { namespace } : {}),
    ...(revision !== undefined ? { revision } : {}),
    ...(chaptersDir !== undefined ? { chaptersDir } : {}),
    json,
  });
}

export const CHAPTER_CLI_HELP = `Umbra Trail chapter authoring CLI

Usage:
  npm run chapter -- create <slug> [--title <text>] [--namespace <id>] [--revision <n>]
  npm run chapter -- validate <slug>
  npm run chapter -- inspect <slug> [--json]
  npm run chapter -- preview <slug>

Options:
  --chapters-dir <path>  Authoring root inside src/ (default: src/examples/chapters)
  --json                 JSON output for inspect
  --help, -h             Show this help

Exit codes:
  0  success
  1  validation or operation failure
  2  invalid usage

Generated chapters are never added to the production catalog automatically.
`;
