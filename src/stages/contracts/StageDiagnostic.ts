import type { StageId } from './StageManifest';

export interface StageDiagnostic {
  readonly code: string;
  readonly severity: 'warning' | 'error';
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly stageId?: StageId;
  readonly referenceId?: string;
}
