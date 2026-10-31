import fs from 'node:fs';
import path from 'node:path';
import {
  ChapterCliError,
  createVisualPreview,
  parseChapterCliArguments,
  runChapterCli,
} from '../cli/chapter';

const repoRoot = process.cwd();
const canonicalRoot = path.join(repoRoot, 'src', 'examples', 'chapters');
const slug = 'visual-preview-test';
const namespace = 'authoring.visual.preview.test';
const target = path.join(canonicalRoot, slug);

function run(argv: readonly string[]): { code: number; output: string; errors: string } {
  const output: string[] = [];
  const errors: string[] = [];
  const code = runChapterCli(argv, {
    repoRoot,
    print: line => output.push(line),
    printError: line => errors.push(line),
  });
  return { code, output: output.join('\n'), errors: errors.join('\n') };
}

describe('chapter visual preview', () => {
  beforeAll(() => {
    fs.rmSync(target, { recursive: true, force: true });
  });
  afterEach(() => {
    fs.rmSync(target, { recursive: true, force: true });
  });

  it('parses --visual only for preview', () => {
    expect(parseChapterCliArguments(['preview', 'demo', '--visual']).visual).toBe(true);
    expect(parseChapterCliArguments(['preview', 'demo']).visual).toBe(false);
    expect(() => parseChapterCliArguments(['inspect', 'demo', '--visual']))
      .toThrow(expect.objectContaining({ exitCode: 2 }));
  });

  it('builds a URL only for the statically discovered canonical root', () => {
    expect(createVisualPreview('demo', repoRoot, canonicalRoot)).toMatchObject({
      url: 'http://localhost:5173/?chapterPreview=demo',
      authoringRoot: 'src/examples/chapters',
      bootstrap: 'chapterPreview',
    });
    expect(() => createVisualPreview('demo', repoRoot, path.join(repoRoot, 'src', 'examples')))
      .toThrow(ChapterCliError);
  });

  it('creates, validates and prepares a real generated chapter for visual preview', () => {
    const created = run(['create', slug, '--namespace', namespace, '--title', 'Visual Preview']);
    expect(created.code).toBe(0);
    const preview = run(['preview', slug, '--visual']);
    expect(preview.code).toBe(0);
    expect(preview.output).toContain(`http://localhost:5173/?chapterPreview=${slug}`);
    expect(preview.output).toContain('Phaser rendering: prepared, not executed by the CLI.');
    expect(preview.errors).toBe('');
  });

  it('refuses --visual for a custom authoring root without weakening discovery', () => {
    const tempRoot = fs.mkdtempSync(path.join(canonicalRoot, '.tmp-visual-test-'));
    try {
      const chaptersArg = path.relative(repoRoot, tempRoot);
      const created = run(['create', 'custom-root-demo', '--namespace', 'authoring.custom.root.demo',
        '--chapters-dir', chaptersArg]);
      expect(created.code).toBe(0);
      const preview = run(['preview', 'custom-root-demo', '--visual', '--chapters-dir', chaptersArg]);
      expect(preview.code).toBe(2);
      expect(preview.errors).toContain('preview.visual-canonical-root');
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
