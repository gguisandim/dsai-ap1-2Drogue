import path from 'node:path';
import { ChapterCliError, usageError } from './errors';

const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const NAMESPACE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 64;
const MAX_NAMESPACE_LENGTH = 96;

export function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function validateSlug(value: string): string {
  const slug = value.trim();
  if (slug.length === 0 || slug.length > MAX_SLUG_LENGTH || !SLUG.test(slug)) {
    throw usageError(
      'usage.invalid-slug',
      'Chapter slug must start with a letter and use lowercase letters, digits and single hyphens.',
    );
  }
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    throw usageError('usage.path-traversal', 'Chapter slug cannot contain path separators.');
  }
  return slug;
}

export function validateNamespace(value: string): string {
  const namespace = value.trim();
  if (namespace.length === 0 || namespace.length > MAX_NAMESPACE_LENGTH || !NAMESPACE.test(namespace)) {
    throw usageError(
      'usage.invalid-namespace',
      'Namespace must use lowercase letters, digits and single separators (. _ -).',
    );
  }
  return namespace;
}

export function deriveNamespace(slug: string): string {
  return validateNamespace(`authoring.${slug.replace(/-/g, '.')}`);
}

export function defaultTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function resolveChaptersRoot(repoRoot: string, chaptersDir?: string): string {
  const srcRoot = path.resolve(repoRoot, 'src');
  const root = chaptersDir
    ? path.resolve(repoRoot, chaptersDir)
    : path.join(srcRoot, 'examples', 'chapters');
  if (root === srcRoot || !isInside(srcRoot, root)) {
    throw usageError(
      'usage.chapters-dir-outside-src',
      'The chapters directory must be inside the repository src/ directory.',
    );
  }
  return root;
}

export function resolveChapterDir(chaptersRoot: string, rawSlug: string): string {
  const slug = validateSlug(rawSlug);
  const directory = path.resolve(chaptersRoot, slug);
  if (directory === chaptersRoot || !isInside(chaptersRoot, directory)) {
    throw usageError('usage.path-traversal', 'Chapter directory must stay inside the chapters root.');
  }
  const relative = path.relative(chaptersRoot, directory);
  if (relative.split(path.sep).some(part => part === '..' || part === '.')) {
    throw usageError('usage.path-traversal', 'Chapter directory contains a traversal segment.');
  }
  return directory;
}

/**
 * Relative specifier prefix from a generated chapter directory back to src/.
 * The generated files import public contracts through this prefix.
 */
export function computeImportPrefix(chapterDir: string, srcRoot: string): string {
  const relative = path.relative(chapterDir, srcRoot).split(path.sep).join('/');
  if (!relative || relative === '.' || relative.split('/').some(segment => segment !== '..')) {
    throw new ChapterCliError(
      'template.invalid-depth',
      'Generated chapters must live below src/ so public imports can be resolved.',
    );
  }
  return relative;
}
