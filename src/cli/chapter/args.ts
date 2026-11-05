import {
  TEMPLATE_GEOMETRY_LIMITS,
  type TemplateGeometryId,
} from '../../examples/chapter-template';
import { usageError } from './errors';
import {
  PLAYTEST_MAXIMUM_SEEDS,
  type ChapterCliArguments,
  type ChapterCommandName,
} from './types';

const GEOMETRY_TEMPLATES = new Set<TemplateGeometryId>(['room', 'horizontal', 'branched']);

function parseInteger(
  raw: string,
  code: string,
  message: string,
  minimum: number,
  maximum: number,
): number {
  if (!/^[0-9]+$/.test(raw)) throw usageError(code, message);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw usageError(code, message);
  }
  return value;
}

const COMMANDS = new Set<ChapterCommandName>([
  'create', 'validate', 'inspect', 'preview', 'capabilities', 'plan', 'playtest',
]);

function parsePlanArguments(args: readonly string[]): ChapterCliArguments {
  const [action, ...rest] = args;
  if (action !== 'validate') {
    throw usageError(
      'usage.unknown-plan-command',
      `Unknown plan command: ${action ?? '(missing)'}. Expected: plan validate <slug>.`,
    );
  }
  let slug: string | undefined;
  let json = false;
  let chaptersDir: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument.startsWith('-')) {
      if (argument === '--json') {
        json = true;
        continue;
      }
      if (argument === '--chapters-dir') {
        chaptersDir = requireValue(rest, index, argument);
        index += 1;
        continue;
      }
      throw usageError('usage.unknown-option', `Unknown option for plan ${action}: ${argument}.`);
    }
    if (slug !== undefined) {
      throw usageError('usage.unexpected-argument', `Unexpected argument: ${argument}.`);
    }
    slug = argument;
  }
  if (slug === undefined) {
    throw usageError('usage.missing-chapter', `Command plan ${action} requires a chapter slug.`);
  }
  return Object.freeze({
    command: 'plan' as const,
    planAction: 'validate' as const,
    slug,
    json,
    visual: false,
    ...(chaptersDir !== undefined ? { chaptersDir } : {}),
  });
}

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
    return Object.freeze({ command: 'help' as const, json: false, visual: false });
  }
  const [rawCommand, ...rest] = argv;
  if (!COMMANDS.has(rawCommand as ChapterCommandName)) {
    throw usageError('usage.unknown-command', `Unknown chapter command: ${rawCommand}.`);
  }
  if (rawCommand === 'plan') return parsePlanArguments(rest);
  const command = rawCommand as Exclude<ChapterCommandName, 'help' | 'plan'>;
  let slug: string | undefined;
  let title: string | undefined;
  let namespace: string | undefined;
  let revision: number | undefined;
  let template: TemplateGeometryId | undefined;
  let seed: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let regionCount: number | undefined;
  let seeds: number | undefined;
  let json = false;
  let visual = false;
  let chaptersDir: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument.startsWith('-')) {
      if (argument === '--json') {
        if (command !== 'inspect' && command !== 'capabilities' && command !== 'playtest') {
          throw usageError(
            'usage.unsupported-option',
            '--json is only supported by inspect, capabilities and playtest.',
          );
        }
        json = true;
        continue;
      }
      if (argument === '--chapters-dir') {
        chaptersDir = requireValue(rest, index, argument);
        index += 1;
        continue;
      }
      if (command === 'preview' && argument === '--visual') {
        visual = true;
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
        revision = parseInteger(
          requireValue(rest, index, argument),
          'usage.invalid-revision',
          'Revision must be a positive integer.',
          1,
          Number.MAX_SAFE_INTEGER,
        );
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--template') {
        const value = requireValue(rest, index, argument);
        if (!GEOMETRY_TEMPLATES.has(value as TemplateGeometryId)) {
          throw usageError(
            'usage.invalid-template',
            'Template must be room, horizontal or branched.',
          );
        }
        template = value as TemplateGeometryId;
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--seed') {
        seed = parseInteger(
          requireValue(rest, index, argument),
          'usage.invalid-seed',
          'Seed must be a non-negative 32-bit integer.',
          TEMPLATE_GEOMETRY_LIMITS.seed.minimum,
          TEMPLATE_GEOMETRY_LIMITS.seed.maximum,
        );
        index += 1;
        continue;
      }
      if (command === 'create' && (argument === '--width' || argument === '--height')) {
        const raw = requireValue(rest, index, argument);
        const limits = argument === '--width'
          ? TEMPLATE_GEOMETRY_LIMITS.width
          : TEMPLATE_GEOMETRY_LIMITS.height;
        const value = parseInteger(
          raw,
          argument === '--width' ? 'usage.invalid-width' : 'usage.invalid-height',
          `${argument} is outside the supported geometry range.`,
          limits.minimum,
          limits.maximum,
        );
        if (argument === '--width') width = value;
        else height = value;
        index += 1;
        continue;
      }
      if (command === 'playtest' && argument === '--seed') {
        seed = parseInteger(
          requireValue(rest, index, argument),
          'usage.invalid-seed',
          'Seed must be a non-negative 32-bit integer.',
          TEMPLATE_GEOMETRY_LIMITS.seed.minimum,
          TEMPLATE_GEOMETRY_LIMITS.seed.maximum,
        );
        index += 1;
        continue;
      }
      if (command === 'playtest' && argument === '--seeds') {
        seeds = parseInteger(
          requireValue(rest, index, argument),
          'usage.invalid-seeds',
          `Seed count must be an integer from 1 to ${PLAYTEST_MAXIMUM_SEEDS}.`,
          1,
          PLAYTEST_MAXIMUM_SEEDS,
        );
        index += 1;
        continue;
      }
      if (command === 'create' && argument === '--regions') {
        regionCount = parseInteger(
          requireValue(rest, index, argument),
          'usage.invalid-regions',
          'Region count is outside the supported geometry range.',
          TEMPLATE_GEOMETRY_LIMITS.regions.minimum,
          TEMPLATE_GEOMETRY_LIMITS.regions.maximum,
        );
        if (template === 'branched' && regionCount < 5) {
          throw usageError('usage.invalid-regions', 'Branched templates require at least five regions.');
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

  if (command === 'capabilities') {
    if (slug !== undefined) {
      throw usageError(
        'usage.unexpected-argument',
        `Command capabilities does not accept a chapter slug: ${slug}.`,
      );
    }
    return Object.freeze({ command, json, visual: false, chaptersDir });
  }

  if (slug === undefined) {
    throw usageError('usage.missing-chapter', `Command ${command} requires a chapter slug.`);
  }
  if (template === 'branched' && regionCount !== undefined && regionCount < 5) {
    throw usageError('usage.invalid-regions', 'Branched templates require at least five regions.');
  }
  if (command === 'playtest' && seed !== undefined && seeds !== undefined) {
    throw usageError(
      'usage.invalid-seeds',
      'Use either --seed (one seed) or --seeds (a reproducible range), not both.',
    );
  }

  return Object.freeze({
    command,
    slug,
    ...(title !== undefined ? { title } : {}),
    ...(namespace !== undefined ? { namespace } : {}),
    ...(revision !== undefined ? { revision } : {}),
    ...(template !== undefined ? { template } : {}),
    ...(seed !== undefined ? { seed } : {}),
    ...(seeds !== undefined ? { seeds } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(regionCount !== undefined ? { regionCount } : {}),
    ...(chaptersDir !== undefined ? { chaptersDir } : {}),
    json,
    visual,
  });
}

export const CHAPTER_CLI_HELP = `Umbra Trail chapter authoring CLI

Usage:
  npm run chapter -- capabilities [--json]
  npm run chapter -- create <slug> [--title <text>] [--namespace <id>] [--revision <n>]
                                   [--template room|horizontal|branched] [--seed <n>]
                                   [--width <n>] [--height <n>] [--regions <n>]
  npm run chapter -- validate <slug>
  npm run chapter -- inspect <slug> [--json]
  npm run chapter -- preview <slug> [--visual]
  npm run chapter -- plan validate <slug> [--json]
  npm run chapter -- playtest <slug> [--json] [--seed <n> | --seeds <n>]

Options:
  --chapters-dir <path>  Authoring root inside src/ (default: src/examples/chapters)
  --json                 JSON output for inspect, capabilities, playtest and plan validate
  --visual               Prepare the Phaser browser preview URL (preview only)
  --seed <n>             Reproduce one geometry seed (playtest only)
  --seeds <n>            Evaluate n consecutive seeds from the authored seed (playtest only)
  --help, -h             Show this help

Exit codes:
  0  success
  1  validation or operation failure
  2  invalid usage

Generated chapters are never added to the production catalog automatically.
`;
