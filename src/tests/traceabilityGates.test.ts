import { spawnSync } from 'node:child_process';
import path from 'node:path';

interface TraceabilityReport {
  readonly ok: boolean;
  readonly recordsChecked: number;
  readonly legacyFilesAccepted: number;
  readonly violations: readonly { readonly rule: string }[];
}

function runTraceabilityGate(root: string): { status: number | null; report: TraceabilityReport } {
  const result = spawnSync(process.execPath, [
    path.resolve('scripts/check-traceability.mjs'),
    '--root', path.resolve(root),
    '--json',
  ], { encoding: 'utf8' });
  if (!result.stdout.trim()) throw new Error(result.stderr || 'traceability gate returned no report');
  return { status: result.status, report: JSON.parse(result.stdout) as TraceabilityReport };
}

describe('traceability gates', () => {
  it('validates the effective prompt record without rewriting legacy files', () => {
    const result = runTraceabilityGate('.');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({
      ok: true,
      recordsChecked: 1,
      legacyFilesAccepted: 8,
      violations: [],
    });
  });

  it('accepts a repository containing only grandfathered prompt history', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/legacy');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ ok: true, recordsChecked: 0, legacyFilesAccepted: 1 });
  });

  it('rejects a v1 record missing factual metadata and effective prompt text', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/invalid');
    expect(result.status).toBe(1);
    expect(result.report.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'required-field-missing' }),
      expect.objectContaining({ rule: 'effective-prompt-missing' }),
    ]));
  });
});
