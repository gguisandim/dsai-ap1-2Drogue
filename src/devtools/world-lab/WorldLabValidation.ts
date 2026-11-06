import type {
  PlaytestRoutesView,
  StagePlaytestSeedReport,
} from '../../stages';
import type {
  WorldLabDiagnostic,
  WorldLabPlanSource,
  WorldLabRuntimeValidation,
  WorldLabStageValidation,
  WorldLabValidationCheck,
  WorldLabValidationRegion,
  WorldLabValidationStatus,
} from './contracts';

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStatus(value: unknown): value is WorldLabValidationStatus {
  return value === 'PASS' || value === 'FAIL' || value === 'UNKNOWN';
}

function regionIdFor(check: { readonly id: string; readonly referenceId?: string }): string | undefined {
  if (check.id.startsWith('region.')) return check.id.slice('region.'.length);
  if (check.referenceId?.startsWith('region.')) return check.referenceId;
  return undefined;
}

function summary(checks: readonly WorldLabValidationCheck[]): WorldLabStageValidation['summary'] {
  return Object.freeze({
    checks: checks.length,
    passed: checks.filter(check => check.status === 'PASS').length,
    failed: checks.filter(check => check.status === 'FAIL').length,
    unknown: checks.filter(check => check.status === 'UNKNOWN').length,
    requiredFailed: checks.filter(check => check.required && check.status === 'FAIL').length,
    requiredUnknown: checks.filter(check => check.required && check.status === 'UNKNOWN').length,
  });
}

export function toWorldLabStageValidation(
  report: StagePlaytestSeedReport,
  stageId: string,
  planSource: WorldLabPlanSource | undefined,
  routes: PlaytestRoutesView | undefined,
): WorldLabStageValidation {
  const checks: WorldLabValidationCheck[] = report.checks.map(check => Object.freeze({
    id: check.id,
    code: check.code,
    status: check.status,
    required: check.required,
    message: check.message,
    evidence: 'static-analysis' as const,
    ...(check.suggestion ? { suggestion: check.suggestion } : {}),
    ...(check.referenceId ? { referenceId: check.referenceId } : {}),
    ...(check.location ? { location: Object.freeze({ ...check.location }) } : {}),
    ...(regionIdFor(check) ? { regionId: regionIdFor(check) as string } : {}),
  })).sort((left, right) => compare(left.id, right.id));
  const regions: WorldLabValidationRegion[] = report.regions.map(region => Object.freeze({
    id: region.id,
    title: region.title ?? region.id,
    role: region.role,
    ...(region.anchor ? { anchor: Object.freeze({ ...region.anchor }) } : {}),
    status: region.status,
    required: region.required,
    code: region.code,
    message: region.message,
  })).sort((left, right) => compare(left.id, right.id));
  return Object.freeze({
    stageId,
    seed: report.seed,
    result: report.result,
    evidence: 'static-analysis' as const,
    checks: Object.freeze(checks),
    regions: Object.freeze(regions),
    summary: summary(checks),
    plan: planSource
      ? Object.freeze({ source: planSource.source, planId: planSource.plan.id })
      : Object.freeze({ source: 'none' as const, planId: null }),
    ...(routes ? { routes: Object.freeze({
      main: Object.freeze(routes.main.map(point => Object.freeze({ ...point }))),
      ...(routes.branch ? {
        branch: Object.freeze(routes.branch.map(point => Object.freeze({ ...point }))),
      } : {}),
    }) } : {}),
  });
}

export function validationDiagnostics(
  validation: WorldLabStageValidation,
  context: { readonly nodeId?: string; readonly stageId: string },
): readonly WorldLabDiagnostic[] {
  return Object.freeze(validation.checks
    .filter(check => check.status !== 'PASS')
    .map(check => Object.freeze({
      code: check.code,
      severity: check.status === 'FAIL' ? 'error' as const : 'warning' as const,
      origin: check.evidence === 'phaser-runtime' ? 'playtest-runtime' as const : 'playtest-static' as const,
      message: check.message,
      ...(context.nodeId ? { nodeId: context.nodeId } : {}),
      stageId: context.stageId,
      status: check.status,
      evidence: check.evidence,
      ...(check.location ? { location: Object.freeze({ ...check.location }) } : {}),
      ...(check.regionId ? { regionId: check.regionId } : {}),
      checkId: check.id,
      ...(check.suggestion ? { suggestion: check.suggestion } : {}),
      path: Object.freeze(['validation', check.id]),
    }))
    .sort((left, right) => compare(
      `${left.code}|${left.checkId ?? ''}`, `${right.code}|${right.checkId ?? ''}`,
    )));
}

function parseCheck(value: unknown): WorldLabValidationCheck | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.code !== 'string' ||
    !isStatus(value.status) || typeof value.required !== 'boolean' ||
    typeof value.message !== 'string') return undefined;
  const location = isRecord(value.location) &&
    Number.isInteger(value.location.x) && Number.isInteger(value.location.y)
    ? Object.freeze({ x: value.location.x as number, y: value.location.y as number })
    : undefined;
  return Object.freeze({
    id: value.id,
    code: value.code,
    status: value.status,
    required: value.required,
    message: value.message,
    evidence: 'phaser-runtime' as const,
    ...(typeof value.suggestion === 'string' ? { suggestion: value.suggestion } : {}),
    ...(typeof value.referenceId === 'string' ? { referenceId: value.referenceId } : {}),
    ...(typeof value.regionId === 'string' ? { regionId: value.regionId } : {}),
    ...(location ? { location } : {}),
  });
}

export function runtimeValidationDiagnostics(
  runtime: WorldLabRuntimeValidation,
): readonly WorldLabDiagnostic[] {
  return Object.freeze(runtime.checks
    .filter(check => check.status !== 'PASS')
    .map(check => Object.freeze({
      code: check.code,
      severity: check.status === 'FAIL' ? 'error' as const : 'warning' as const,
      origin: 'playtest-runtime' as const,
      message: check.message,
      stageId: runtime.stageId,
      status: check.status,
      evidence: 'phaser-runtime' as const,
      ...(check.location ? { location: Object.freeze({ ...check.location }) } : {}),
      ...(check.regionId ? { regionId: check.regionId } : {}),
      checkId: check.id,
      ...(check.suggestion ? { suggestion: check.suggestion } : {}),
      path: Object.freeze(['runtime-validation', check.id]),
    }))
    .sort((left, right) => compare(
      `${left.code}|${left.checkId ?? ''}`, `${right.code}|${right.checkId ?? ''}`,
    )));
}

export type RuntimeValidationParseResult =
  | { readonly ok: true; readonly value: WorldLabRuntimeValidation }
  | { readonly ok: false; readonly diagnostics: readonly WorldLabDiagnostic[] };

function runtimeFailure(message: string): RuntimeValidationParseResult {
  return Object.freeze({
    ok: false as const,
    diagnostics: Object.freeze([Object.freeze({
      code: 'world-lab.runtime-report.invalid',
      severity: 'error' as const,
      origin: 'playtest-runtime' as const,
      message,
      path: Object.freeze(['runtime-report']),
    })]),
  });
}

/** Parses the complementary runtime report produced by the browser homologation. */
export function parseRuntimeValidation(serialized: string): RuntimeValidationParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return runtimeFailure('O relatório de homologação não é JSON válido.');
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 ||
    parsed.kind !== 'umbra.stage-homologation.report') {
    return runtimeFailure('O relatório de homologação não usa umbra.stage-homologation.report v1.');
  }
  if (typeof parsed.stageId !== 'string' || !isStatus(parsed.result) ||
    !Array.isArray(parsed.checks)) {
    return runtimeFailure('O relatório de homologação não contém stageId, result ou checks válidos.');
  }
  const checks = parsed.checks.map(parseCheck);
  if (checks.some(check => check === undefined)) {
    return runtimeFailure('O relatório de homologação contém um check inválido.');
  }
  const validChecks = checks.filter((check): check is WorldLabValidationCheck => check !== undefined)
    .sort((left, right) => compare(left.id, right.id));
  const screenshots = isRecord(parsed.evidence) && Array.isArray(parsed.evidence.screenshots)
    ? parsed.evidence.screenshots.filter((item): item is string => typeof item === 'string')
    : undefined;
  const browser = isRecord(parsed.evidence) && typeof parsed.evidence.browser === 'string'
    ? parsed.evidence.browser : undefined;
  const durationMs = isRecord(parsed.evidence) && typeof parsed.evidence.durationMs === 'number'
    ? parsed.evidence.durationMs : undefined;
  return Object.freeze({
    ok: true as const,
    value: Object.freeze({
      schemaVersion: 1 as const,
      kind: 'umbra.stage-homologation.report' as const,
      stageId: parsed.stageId,
      result: parsed.result,
      checks: Object.freeze(validChecks),
      ...(typeof parsed.chapterId === 'string' ? { chapterId: parsed.chapterId } : {}),
      ...(typeof parsed.title === 'string' ? { title: parsed.title } : {}),
      ...(typeof parsed.variantId === 'string' ? { variantId: parsed.variantId } : {}),
      ...(typeof parsed.scenario === 'string' ? { scenario: parsed.scenario } : {}),
      ...(typeof parsed.seed === 'number' || parsed.seed === null ? { seed: parsed.seed } : {}),
      ...(Array.isArray(parsed.observations) ? { observations: Object.freeze([...parsed.observations]) } : {}),
      ...(screenshots || browser || durationMs !== undefined ? {
        evidence: Object.freeze({
          ...(screenshots ? { screenshots: Object.freeze(screenshots) } : {}),
          ...(browser ? { browser } : {}),
          ...(durationMs !== undefined ? { durationMs } : {}),
        }),
      } : {}),
    }),
  });
}
