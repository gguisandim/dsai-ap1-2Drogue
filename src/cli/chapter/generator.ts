import path from 'node:path';
import {
  CAMPAIGN_CHAPTER_CATALOG,
  type CampaignChapterEntry,
} from '../../stages';
import {
  CHAPTER_TEMPLATE,
  CHAPTER_TEMPLATE_ENTRY,
  createChapterTemplate,
  type ChapterTemplate,
} from '../../examples/chapter-template';
import { ChapterCliError, usageError } from './errors';
import { entryFromModule, loadChapterModule } from './loader';
import {
  computeImportPrefix,
  resolveChapterDir,
  validateNamespace,
  validateSlug,
} from './names';
import { validateChapterEntry } from './validation';
import type {
  ChapterFileSystem,
  CreatedChapter,
  CreateChapterRequest,
} from './types';

const CODE_FILES = Object.freeze([
  'ids.ts',
  'level.ts',
  'presentation.ts',
  'encounter.ts',
  'narrative.ts',
  'stage.ts',
  'chapter.ts',
  'registration.ts',
  'template.ts',
  'index.ts',
]);
const TEMPLATE_README = 'README.md';

function readTemplateFile(
  fileSystem: ChapterFileSystem,
  templateDir: string,
  name: string,
): string {
  try {
    return fileSystem.readFile(path.join(templateDir, name));
  } catch (error) {
    throw new ChapterCliError(
      'template.incompatible',
      `Template file is missing or unreadable: ${name}. ${error instanceof Error ? error.message : ''}`.trim(),
    );
  }
}

const IMPORT_SPECIFIER = /\bfrom\s+['"]([^'"]+)['"]/g;

/** Rewrites only the public-contract imports that escape the template folder. */
export function rewriteExternalImports(source: string, importPrefix: string): string {
  const before = [...source.matchAll(IMPORT_SPECIFIER)].map(match => match[1]);
  if (before.some(specifier =>
    specifier.startsWith('../') && !specifier.startsWith('../../'))) {
    throw new ChapterCliError(
      'template.incompatible',
      'Template contains an unexpected external import depth.',
    );
  }
  const rewritten = source.replace(
    /(\bfrom\s+['"])\.\.\/\.\.\//g,
    `$1${importPrefix}/`,
  );
  const after = [...rewritten.matchAll(IMPORT_SPECIFIER)].map(match => match[1]);
  if (after.some(specifier =>
    specifier.startsWith('../') && !specifier.startsWith(`${importPrefix}/`))) {
    throw new ChapterCliError(
      'template.incompatible',
      'Template contains an external import that could not be rewritten.',
    );
  }
  return rewritten;
}

export interface TemplateInstanceOptions {
  readonly namespace: string;
  readonly revision: number;
  readonly title: string;
  readonly stageTitle: string;
  readonly summary: string;
}

export function replaceChapterTemplateLine(
  source: string,
  options: TemplateInstanceOptions,
): string {
  const anchor = /export const CHAPTER_TEMPLATE = createChapterTemplate\('example\.beacon'\);/;
  if (!anchor.test(source)) {
    throw new ChapterCliError(
      'template.incompatible',
      'Template index.ts no longer exposes the expected CHAPTER_TEMPLATE anchor.',
    );
  }
  const replacement = `export const CHAPTER_TEMPLATE = createChapterTemplate(${JSON.stringify(options.namespace)}, {
  revision: ${options.revision},
  title: ${JSON.stringify(options.title)},
  stageTitle: ${JSON.stringify(options.stageTitle)},
  summary: ${JSON.stringify(options.summary)},
});`;
  return source.replace(anchor, replacement);
}

function generateChapterReadme(
  template: ChapterTemplate,
  slug: string,
  relativeDir: string,
): string {
  const ids = template.ids;
  const rows: readonly (readonly [string, string])[] = Object.freeze([
    ['Chapter ID', ids.chapterId],
    ['Stage ID', ids.stageId],
    ['NPC ID', ids.npcId],
    ['Dialogue ID', ids.dialogueId],
    ['Mission ID', ids.missionId],
    ['Objective ID', ids.objectiveId],
    ['Encounter ID', ids.encounterId],
    ['Exit ID', ids.exitId],
    ['Region ID', ids.regionId],
    ['Reward operation', ids.rewardOperationId],
    ['Flag arrived', ids.flags.arrived],
    ['Flag accepted', ids.flags.accepted],
    ['Flag beacon lit', ids.flags.beaconLit],
    ['Event arrival', ids.events.arrival],
    ['Event warden', ids.events.warden],
    ['Event beacon lit', ids.events.beaconLit],
    ['Event depart', ids.events.depart],
    ['Visual theme', ids.visual.themeId],
    ['Visual tileset', ids.visual.tilesetId],
    ['NPC presentation', ids.visual.npcPresentationId],
    ['Audio profile', ids.visual.audioProfileId],
    ['Environment', ids.visual.environmentId],
  ]);
  return `# ${template.chapter.title}

Capítulo gerado a partir do template oficial da Etapa 9.7A.

- **Namespace:** \`${template.namespace}\`
- **Chapter ID:** \`${ids.chapterId}\`
- **Stage ID:** \`${ids.stageId}\`
- **Revisão:** ${template.chapter.revision}
- **Diretório:** \`${relativeDir}\`
- **Slug:** \`${slug}\`

## Identidades estáveis

| Campo | ID |
|---|---|
${rows.map(([label, value]) => `| ${label} | \`${value}\` |`).join('\n')}

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| \`ids.ts\` | constantes de identidade derivadas do namespace |
| \`level.ts\` | mapa autoral, spawn, item e decoração |
| \`presentation.ts\` | recursos visuais e de áudio |
| \`encounter.ts\` | encontro declarativo |
| \`narrative.ts\` | NPC, diálogo, missão, eventos e flags |
| \`stage.ts\` | \`StageModule\` completo |
| \`chapter.ts\` | \`ChapterManifest\` |
| \`registration.ts\` | entrada do catálogo e registry isolado |
| \`template.ts\` | factory local reutilizável |
| \`index.ts\` | exports e instância do capítulo |
| \`AUTHORING.md\` | guia de autoria copiado do template |

## Editar

1. Ajuste títulos e textos em \`narrative.ts\`, \`stage.ts\` e \`chapter.ts\`.
2. Ajuste o mapa em \`level.ts\`, mantendo borda fechada, spawn e saída alcançável.
3. Ajuste o encontro em \`encounter.ts\` usando arquétipos existentes.
4. Ajuste tema, tileset, sprites e áudio em \`presentation.ts\`.
5. Se alterar IDs, mantenha \`ids.ts\` e os arquivos de conteúdo coerentes.
6. Não edite o template original em \`src/examples/chapter-template/\`.

## Validar e inspecionar

\`\`\`sh
npm run chapter -- validate ${slug}
npm run chapter -- inspect ${slug}
npm run chapter -- inspect ${slug} --json
npm run chapter -- preview ${slug}
\`\`\`

## Registro

O capítulo **não** está no catálogo de produção. Para usá-lo em testes ou em um
bootstrap de desenvolvimento, use \`registration.ts\`:

\`\`\`ts
import { createChapterTemplateRegistry } from '.';
const registry = createChapterTemplateRegistry(CHAPTER_TEMPLATE.entry);
\`\`\`

O modo individual pode ser acionado com
\`new GameSessionService({ registry }).startIndividualStage('${ids.stageId}')\`.
O World Lab aceita o mesmo registry injetado.

\`preview\` é headless: valida, carrega no modo individual e projeta no World Lab,
mas não renderiza com Phaser.
`;
}

function generateAuthoringGuide(
  original: string,
  namespace: string,
): string {
  return `> Este guia foi copiado do template oficial. Neste capítulo, o namespace
> local é \`${namespace}\` e os arquivos locais são a fonte de verdade. Os
> exemplos abaixo usam o namespace do template original.

${original}`;
}

interface BuildFilesInput {
  readonly fileSystem: ChapterFileSystem;
  readonly templateDir: string;
  readonly template: ChapterTemplate;
  readonly slug: string;
  readonly namespace: string;
  readonly title: string;
  readonly stageTitle: string;
  readonly summary: string;
  readonly revision: number;
  readonly importPrefix: string;
  readonly relativeDir: string;
}

export function buildGeneratedFiles(input: BuildFilesInput): Map<string, string> {
  const files = new Map<string, string>();
  for (const name of CODE_FILES) {
    const source = readTemplateFile(input.fileSystem, input.templateDir, name);
    const rewritten = rewriteExternalImports(source, input.importPrefix);
    if (name === 'index.ts') {
      const instance = replaceChapterTemplateLine(rewritten, {
        namespace: input.namespace,
        revision: input.revision,
        title: input.title,
        stageTitle: input.stageTitle,
        summary: input.summary,
      });
      files.set(name, `// Generated by npm run chapter -- create ${input.slug}.\n// Edit the local content files; public contracts stay unchanged.\n\n${instance}`);
    } else {
      files.set(name, rewritten);
    }
  }
  const originalReadme = readTemplateFile(input.fileSystem, input.templateDir, TEMPLATE_README);
  files.set('AUTHORING.md', generateAuthoringGuide(originalReadme, input.namespace));
  files.set('README.md', generateChapterReadme(input.template, input.slug, input.relativeDir));
  return files;
}

function scanChapterNamespaces(
  fileSystem: ChapterFileSystem,
  chaptersRoot: string,
): ReadonlyMap<string, string> {
  const namespaces = new Map<string, string>();
  for (const directory of fileSystem.listDirectories(chaptersRoot)) {
    if (directory.startsWith('.tmp-')) continue;
    const indexPath = path.join(chaptersRoot, directory, 'index.ts');
    if (!fileSystem.exists(indexPath)) continue;
    try {
      const source = fileSystem.readFile(indexPath);
      const match = /createChapterTemplate\(\s*['"]([^'"]+)['"]/.exec(source);
      if (match) namespaces.set(match[1], directory);
    } catch {
      // An unreadable existing chapter is not silently treated as a collision.
    }
  }
  return namespaces;
}

function assertNoIdentityCollision(input: {
  readonly fileSystem: ChapterFileSystem;
  readonly chaptersRoot: string;
  readonly namespace: string;
  readonly chapterId: string;
  readonly stageId: string;
}): void {
  if (input.namespace === CHAPTER_TEMPLATE.namespace) {
    throw new ChapterCliError(
      'identity-collision',
      `Namespace ${input.namespace} is reserved by the template.`,
    );
  }
  const reserved = new Set<string>();
  reserved.add(CHAPTER_TEMPLATE_ENTRY.chapter.id);
  CHAPTER_TEMPLATE_ENTRY.chapter.stageIds.forEach(id => reserved.add(id));
  CHAPTER_TEMPLATE_ENTRY.stages.forEach(stage => reserved.add(stage.manifest.id));
  for (const entry of CAMPAIGN_CHAPTER_CATALOG) {
    reserved.add(entry.chapter.id);
    entry.chapter.stageIds.forEach(id => reserved.add(id));
    entry.stages.forEach(stage => reserved.add(stage.manifest.id));
  }
  if (reserved.has(input.chapterId)) {
    throw new ChapterCliError(
      'identity-collision',
      `Chapter ID is already used by the template or the production catalog: ${input.chapterId}.`,
    );
  }
  if (reserved.has(input.stageId)) {
    throw new ChapterCliError(
      'identity-collision',
      `Stage ID is already used by the template or the production catalog: ${input.stageId}.`,
    );
  }
  const existing = scanChapterNamespaces(input.fileSystem, input.chaptersRoot);
  const directory = existing.get(input.namespace);
  if (directory) {
    throw new ChapterCliError(
      'identity-collision',
      `Namespace ${input.namespace} is already used by ${directory}.`,
    );
  }
}

export function createChapter(request: CreateChapterRequest): CreatedChapter {
  const slug = validateSlug(request.slug);
  const namespace = validateNamespace(request.namespace);
  if (!Number.isSafeInteger(request.revision) || request.revision < 1) {
    throw usageError('usage.invalid-revision', 'Revision must be a positive integer.');
  }
  if (request.title.trim().length === 0 || request.stageTitle.trim().length === 0 ||
    request.summary.trim().length === 0) {
    throw usageError('usage.invalid-title', 'Title, stage title and summary cannot be empty.');
  }
  const fileSystem = request.fileSystem;
  const targetDir = resolveChapterDir(request.chaptersRoot, slug);
  if (fileSystem.exists(targetDir)) {
    throw new ChapterCliError('chapter-exists', `Chapter directory already exists: ${targetDir}.`);
  }

  const template = createChapterTemplate(namespace, {
    revision: request.revision,
    title: request.title,
    stageTitle: request.stageTitle,
    summary: request.summary,
  });
  const preReport = validateChapterEntry(template.entry);
  if (preReport.errors.length > 0) {
    throw new ChapterCliError(
      'generated-chapter-invalid',
      'Generated chapter failed pre-write validation.',
      1,
      preReport.diagnostics,
    );
  }

  assertNoIdentityCollision({
    fileSystem,
    chaptersRoot: request.chaptersRoot,
    namespace,
    chapterId: template.ids.chapterId,
    stageId: template.ids.stageId,
  });

  const srcRoot = path.join(request.repoRoot, 'src');
  const importPrefix = computeImportPrefix(targetDir, srcRoot);
  const relativeDir = path.relative(request.repoRoot, targetDir).split(path.sep).join('/');
  const files = buildGeneratedFiles({
    fileSystem,
    templateDir: request.templateDir,
    template,
    slug,
    namespace,
    title: request.title,
    stageTitle: request.stageTitle,
    summary: request.summary,
    revision: request.revision,
    importPrefix,
    relativeDir,
  });

  fileSystem.mkdirp(request.chaptersRoot);
  const tempDir = fileSystem.makeTempDir(request.chaptersRoot, `.tmp-${slug}-`);
  let renamed = false;
  try {
    for (const [name, content] of files) {
      fileSystem.writeFile(path.join(tempDir, name), content);
    }
    const loaded = (request.loadGenerated ?? loadChapterModule)(tempDir);
    const entry: CampaignChapterEntry = entryFromModule(loaded);
    const sourceReport = validateChapterEntry(entry);
    if (sourceReport.errors.length > 0) {
      throw new ChapterCliError(
        'generated-chapter-invalid',
        'Generated chapter failed post-write validation.',
        1,
        sourceReport.diagnostics,
      );
    }
    if (fileSystem.exists(targetDir)) {
      throw new ChapterCliError('chapter-exists', `Chapter directory already exists: ${targetDir}.`);
    }
    fileSystem.rename(tempDir, targetDir);
    renamed = true;
    return Object.freeze({
      targetDir,
      relativeDir,
      template,
      files: Object.freeze([...files.keys()].sort()),
      report: sourceReport,
    });
  } catch (error) {
    if (!renamed) {
      try {
        if (fileSystem.exists(tempDir)) fileSystem.removeTree(tempDir);
      } catch {
        // Preserve the original failure.
      }
    }
    throw error;
  }
}
