import type { StageManifest } from '../stages';

/**
 * Individual authored stages declare their own stable exit. Legacy levels keep
 * the synthetic id they used before modular stages existed.
 */
export function resolveIndividualExitId(
  individualMode: boolean,
  manifest: StageManifest | undefined,
  legacyExitId = 'legacy.next',
): string {
  if (!individualMode) return legacyExitId;
  return manifest?.exits[0]?.id ?? legacyExitId;
}
