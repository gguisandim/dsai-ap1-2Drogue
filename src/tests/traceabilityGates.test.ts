import { spawnSync } from 'node:child_process';
import path from 'node:path';

interface TraceabilityReport {
  readonly ok: boolean;
  readonly recordsChecked: number;
  readonly legacyFilesAccepted: number;
  readonly historicalAllowlist: readonly string[];
  readonly commitStatuses: readonly {
    readonly promptId: string;
    readonly status: 'pending' | 'derived' | 'unknown' | 'explicit';
  }[];
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
      legacyFilesAccepted: 8,
      violations: [],
    });
    expect(result.report.recordsChecked).toBeGreaterThanOrEqual(3);
  });

  it('accepts only the explicitly grandfathered identity alongside a v1 record', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/legacy');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ ok: true, recordsChecked: 1, legacyFilesAccepted: 1 });
    expect(result.report.historicalAllowlist).toContain('01-arquitetura-campanha-modular.md');
  });

  it('rejects a v1 record missing factual metadata and effective prompt text', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/invalid');
    expect(result.status).toBe(1);
    expect(result.report.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'required-field-missing' }),
      expect.objectContaining({ rule: 'field-duplicated' }),
      expect.objectContaining({ rule: 'effective-prompt-missing' }),
    ]));
  });

  it('rejects a new numbered prompt file without the v1 schema', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/unversioned');
    expect(result.status).toBe(1);
    expect(result.report.legacyFilesAccepted).toBe(0);
    expect(result.report.violations).toContainEqual(expect.objectContaining({
      rule: 'unversioned-prompt-record',
    }));
  });

  it('rejects duplicated Prompt-IDs across otherwise valid records', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/duplicate');
    expect(result.status).toBe(1);
    expect(result.report.violations).toContainEqual(expect.objectContaining({
      rule: 'prompt-id-duplicated',
    }));
  });

  it('accepts an uncommitted record and reports its commit as pending', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/pending');
    expect(result.status).toBe(0);
    expect(result.report.commitStatuses).toContainEqual(expect.objectContaining({
      promptId: 'fixture.pending',
      status: 'pending',
    }));
  });

  it('preserves Markdown headings inside the effective prompt block', () => {
    const result = runTraceabilityGate('test-fixtures/traceability-gates/markdown-headings');
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({ ok: true, recordsChecked: 1, violations: [] });
  });
});
