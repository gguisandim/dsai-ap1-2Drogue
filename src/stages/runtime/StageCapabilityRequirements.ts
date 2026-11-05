import type {
  StageCapabilityCategory,
  StageCapabilityRequirement,
  StageDiagnostic,
  StageRuntimeCapability,
} from '../contracts';
import { STAGE_CAPABILITY_CATEGORIES } from './StageAuthoringVocabulary';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function isPositiveRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

/**
 * Shared capability requirement validation used by stage manifests and
 * authoring plans. Keeping one implementation prevents the two surfaces from
 * drifting.
 */
export function validateStageCapabilityRequirements(
  requirements: readonly StageCapabilityRequirement[] | undefined,
  runtimeCapabilities: ReadonlyMap<string, StageRuntimeCapability>,
  path: readonly (string | number)[] = [],
  stageId?: string,
): readonly StageDiagnostic[] {
  if (requirements === undefined) return Object.freeze([]);
  if (!Array.isArray(requirements)) {
    return Object.freeze([{
      code: 'capability.requirements.invalid',
      severity: 'error' as const,
      message: 'Capabilities must be an array.',
      path,
      ...(stageId ? { stageId } : {}),
    }]);
  }
  const diagnostics: StageDiagnostic[] = [];
  const seen = new Set<string>();
  requirements.forEach((requirement, index) => {
    const itemPath = [...path, index];
    if (!requirement || typeof requirement !== 'object') {
      diagnostics.push({
        code: 'capability.requirement.invalid',
        severity: 'error',
        message: 'Capability requirement must be an object.',
        path: itemPath,
        ...(stageId ? { stageId } : {}),
      });
      return;
    }
    const id = (requirement as { id?: unknown }).id;
    const category = (requirement as { category?: unknown }).category;
    const minimumVersion = (requirement as { minimumVersion?: unknown }).minimumVersion;
    const kind = (requirement as { requirement?: unknown }).requirement;
    if (!isStableId(id)) diagnostics.push({
      code: 'capability.id.invalid',
      severity: 'error',
      message: 'Capability id must be stable.',
      path: [...itemPath, 'id'],
      ...(stageId ? { stageId } : {}),
    });
    if (!STAGE_CAPABILITY_CATEGORIES.includes(category as StageCapabilityCategory)) diagnostics.push({
      code: 'capability.category.unknown',
      severity: 'error',
      message: 'Capability category is unknown.',
      path: [...itemPath, 'category'],
      ...(stageId ? { stageId } : {}),
      referenceId: String(category),
    });
    if (!isPositiveRevision(minimumVersion)) diagnostics.push({
      code: 'capability.version.invalid',
      severity: 'error',
      message: 'Capability minimumVersion must be positive.',
      path: [...itemPath, 'minimumVersion'],
      ...(stageId ? { stageId } : {}),
    });
    if (kind !== 'required' && kind !== 'optional') diagnostics.push({
      code: 'capability.requirement-kind.invalid',
      severity: 'error',
      message: 'Capability requirement must be required or optional.',
      path: [...itemPath, 'requirement'],
      ...(stageId ? { stageId } : {}),
    });
    if (!isStableId(id)) return;
    if (seen.has(id)) diagnostics.push({
      code: 'capability.id.duplicate',
      severity: 'error',
      message: `Capability is declared twice: ${id}.`,
      path: [...itemPath, 'id'],
      ...(stageId ? { stageId } : {}),
      referenceId: id,
    });
    seen.add(id);
    const runtime = runtimeCapabilities.get(id);
    if (!runtime) {
      diagnostics.push({
        code: 'capability.unknown',
        severity: 'error',
        message: `Runtime does not recognize capability ${id}.`,
        path: itemPath,
        ...(stageId ? { stageId } : {}),
        referenceId: id,
      });
      return;
    }
    if (runtime.category !== category) diagnostics.push({
      code: 'capability.category.mismatch',
      severity: 'error',
      message: `Capability ${id} belongs to ${runtime.category}, not ${String(category)}.`,
      path: [...itemPath, 'category'],
      ...(stageId ? { stageId } : {}),
      referenceId: id,
    });
    if (!isPositiveRevision(minimumVersion) || (kind !== 'required' && kind !== 'optional')) return;
    if (runtime.status !== 'supported') diagnostics.push({
      code: 'capability.unavailable',
      severity: kind === 'optional' ? 'warning' : 'error',
      message: `Capability ${id} is planned but not implemented.`,
      path: itemPath,
      ...(stageId ? { stageId } : {}),
      referenceId: id,
    });
    else if (runtime.version < minimumVersion) diagnostics.push({
      code: 'capability.version.unsupported',
      severity: kind === 'optional' ? 'warning' : 'error',
      message: `Capability ${id} supports version ${runtime.version}, below ${minimumVersion}.`,
      path: [...itemPath, 'minimumVersion'],
      ...(stageId ? { stageId } : {}),
      referenceId: id,
    });
  });
  return Object.freeze(diagnostics);
}
