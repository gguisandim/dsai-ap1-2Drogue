import type {
  PlaytestRoutesView,
  StagePlaytestSeedReport,
} from '../../stages';
import type {
  WorldLabCampaignRuntimeValidation,
  WorldLabCampaignTransitionView,
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

export type CampaignValidationParseResult =
  | { readonly ok: true; readonly value: WorldLabCampaignRuntimeValidation }
  | { readonly ok: false; readonly diagnostics: readonly WorldLabDiagnostic[] };

function campaignFailure(message: string): CampaignValidationParseResult {
  return Object.freeze({
    ok: false as const,
    diagnostics: Object.freeze([Object.freeze({
      code: 'world-lab.campaign-report.invalid',
      severity: 'error' as const,
      origin: 'playtest-runtime' as const,
      message,
      path: Object.freeze(['campaign-report']),
    })]),
  });
}

function transitionView(value: unknown): WorldLabCampaignTransitionView | undefined {
  if (!isRecord(value) || typeof value.role !== 'string') return undefined;
  const stringOrNull = (field: string): string | null =>
    typeof value[field] === 'string' ? value[field] as string : null;
  const recordOrNull = (field: string): Readonly<Record<string, unknown>> | null =>
    isRecord(value[field]) ? Object.freeze({ ...value[field] as Record<string, unknown> }) : null;
  return Object.freeze({
    role: value.role,
    originStageId: stringOrNull('originStageId'),
    physicalExitId: stringOrNull('physicalExitId'),
    stageExitId: stringOrNull('stageExitId'),
    edgeId: stringOrNull('edgeId'),
    targetNodeId: stringOrNull('targetNodeId'),
    destinationStageId: stringOrNull('destinationStageId'),
    expectedDestination: stringOrNull('expectedDestination'),
    available: value.available === true,
    loadedDestinationStageId: stringOrNull('loadedDestinationStageId'),
    loaded: value.loaded === true,
    reason: stringOrNull('reason'),
    stateBefore: recordOrNull('stateBefore'),
    stateAfter: recordOrNull('stateAfter'),
    events: Object.freeze(Array.isArray(value.events)
      ? value.events.filter((item): item is string => typeof item === 'string') : []),
  });
}

/** Parses the complementary campaign report produced by the browser homologation. */
export function parseCampaignValidation(serialized: string): CampaignValidationParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return campaignFailure('O relatório de campanha não é JSON válido.');
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 ||
    parsed.kind !== 'umbra.campaign-homologation.report') {
    return campaignFailure('O relatório de campanha não usa umbra.campaign-homologation.report v1.');
  }
  if (typeof parsed.originStageId !== 'string' || typeof parsed.destinationStageId !== 'string' ||
    !isStatus(parsed.result) || !Array.isArray(parsed.checks) || !Array.isArray(parsed.transitions)) {
    return campaignFailure('O relatório de campanha não contém origem, destino, resultado, checks ou transições válidos.');
  }
  const checks = parsed.checks.map(parseCheck);
  if (checks.some(check => check === undefined)) {
    return campaignFailure('O relatório de campanha contém um check inválido.');
  }
  const transitions = parsed.transitions.map(transitionView);
  if (transitions.some(transition => transition === undefined)) {
    return campaignFailure('O relatório de campanha contém uma transição inválida.');
  }
  const validChecks = checks.filter((check): check is WorldLabValidationCheck => check !== undefined)
    .sort((left, right) => compare(left.id, right.id));
  const validTransitions = transitions
    .filter((transition): transition is WorldLabCampaignTransitionView => transition !== undefined);
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
      kind: 'umbra.campaign-homologation.report' as const,
      campaignId: typeof parsed.campaignId === 'string' ? parsed.campaignId : null,
      runId: typeof parsed.runId === 'string' ? parsed.runId : null,
      runSeed: typeof parsed.runSeed === 'string' || typeof parsed.runSeed === 'number'
        ? parsed.runSeed : null,
      originStageId: parsed.originStageId,
      destinationStageId: parsed.destinationStageId,
      result: parsed.result,
      checks: Object.freeze(validChecks),
      transitions: Object.freeze(validTransitions),
      ...(typeof parsed.variantId === 'string' ? { variantId: parsed.variantId } : {}),
      ...(typeof parsed.manifestRevision === 'number'
        ? { manifestRevision: parsed.manifestRevision } : {}),
      ...(typeof parsed.destinationManifestRevision === 'number'
        ? { destinationManifestRevision: parsed.destinationManifestRevision } : {}),
      ...(Array.isArray(parsed.stages) ? { stages: Object.freeze([...parsed.stages]) } : {}),
      ...(isRecord(parsed.persistence) ? { persistence: Object.freeze({ ...parsed.persistence }) } : {}),
      ...(Array.isArray(parsed.observations) ? { observations: Object.freeze([...parsed.observations]) } : {}),
      ...(typeof parsed.generatedAt === 'string' ? { generatedAt: parsed.generatedAt } : {}),
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

export function campaignValidationDiagnostics(
  report: WorldLabCampaignRuntimeValidation,
): readonly WorldLabDiagnostic[] {
  return Object.freeze(report.checks
    .filter(check => check.status !== 'PASS')
    .map(check => {
      const destinationCheck = check.id.startsWith('campaign.destination') ||
        check.id === 'campaign.state.isolated' || check.id === 'campaign.state.preserved';
      const stageId = destinationCheck ? report.destinationStageId : report.originStageId;
      return Object.freeze({
        code: check.code,
        severity: check.status === 'FAIL' ? 'error' as const : 'warning' as const,
        origin: 'playtest-runtime' as const,
        message: check.message,
        stageId,
        status: check.status,
        evidence: 'phaser-runtime' as const,
        ...(check.location ? { location: Object.freeze({ ...check.location }) } : {}),
        ...(check.regionId ? { regionId: check.regionId } : {}),
        checkId: check.id,
        ...(check.suggestion ? { suggestion: check.suggestion } : {}),
        path: Object.freeze(['campaign-validation', check.id]),
      });
    })
    .sort((left, right) => compare(
      `${left.code}|${left.checkId ?? ''}`, `${right.code}|${right.checkId ?? ''}`,
    )));
}

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
      ...(typeof parsed.manifestRevision === 'number' ? { manifestRevision: parsed.manifestRevision } : {}),
      ...(typeof parsed.generatedAt === 'string' ? { generatedAt: parsed.generatedAt } : {}),
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
