import { spawnSync } from 'node:child_process';
import path from 'node:path';

interface ArchitectureReport {
  readonly ok: boolean;
  readonly violations: readonly { readonly rule: string; readonly message: string }[];
}

function runArchitectureGate(root: string): { status: number | null; report: ArchitectureReport } {
  const result = spawnSync(process.execPath, [
    path.resolve('scripts/check-architecture.mjs'),
    '--root', path.resolve(root),
    '--json',
  ], { encoding: 'utf8' });
  if (!result.stdout.trim()) throw new Error(result.stderr || 'architecture gate returned no report');
  return { status: result.status, report: JSON.parse(result.stdout) as ArchitectureReport };
}

describe('architecture gates', () => {
  it('accepts the repository architecture and its documented exceptions', () => {
    const result = runArchitectureGate('.');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ ok: true, violations: [] });
  });

  it('allows chapter content composed only from public contracts and local files', () => {
    const result = runArchitectureGate('test-fixtures/architecture-gates/valid');
    expect(result.status).toBe(0);
    expect(result.report.ok).toBe(true);
  });

  it('rejects a chapter importing an internal combat implementation', () => {
    const result = runArchitectureGate('test-fixtures/architecture-gates/invalid-direct');
    expect(result.status).toBe(1);
    expect(result.report.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'chapter-public-contracts-only' }),
      expect.objectContaining({ rule: 'headless-no-engine-internals' }),
      expect.objectContaining({ rule: 'dynamic-import-forbidden' }),
    ]));
  });

  it('reports a transitive path from chapter content to GameScene', () => {
    const result = runArchitectureGate('test-fixtures/architecture-gates/invalid-transitive');
    expect(result.status).toBe(1);
    expect(result.report.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rule: 'forbidden-transitive-runtime',
        message: expect.stringContaining('stage.ts -> src/stages/chapters/demo/helper.ts -> src/scenes/GameScene.ts'),
      }),
    ]));
  });
});
