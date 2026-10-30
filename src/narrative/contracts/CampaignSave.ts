import type { StageResumeState } from '../../stages/contracts/StageLoad';
import type {
  ChapterId,
  NarrativeIdentityScope,
  NarrativeStateSnapshot,
  StageId,
} from './NarrativeRuntime';

export const CAMPAIGN_SAVE_STORAGE_KEY = 'umbra-trail-campaign-v1';
export const CAMPAIGN_SAVE_SCHEMA = 'umbra-trail-campaign-save';

export interface CampaignSaveIdentity extends NarrativeIdentityScope {
  readonly campaignId: string;
  readonly runSeed: string;
  readonly chapterId: ChapterId;
  /** Optional only for compatibility with campaign-save v1 bytes written before Etapa 9.5. */
  readonly chapterRevision?: number;
  readonly stageId: StageId;
}

export interface CampaignSaveMigration {
  readonly source: 'stage-resume';
  readonly sourceVersion: 0;
}

export interface CampaignSaveEnvelope {
  readonly schema: typeof CAMPAIGN_SAVE_SCHEMA;
  readonly version: 1;
  readonly identity: CampaignSaveIdentity;
  readonly narrative: NarrativeStateSnapshot;
  readonly migration?: CampaignSaveMigration;
}

export interface CampaignSaveDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}

export type CampaignSaveFailureCode =
  | 'storage-read-failed'
  | 'storage-write-failed'
  | 'storage-conflict'
  | 'invalid-json'
  | 'invalid-identity'
  | 'invalid-envelope'
  | 'unsupported-version'
  | 'identity-mismatch'
  | 'invalid-snapshot'
  | 'migration-failed';

export interface CampaignSaveFailure {
  readonly code: CampaignSaveFailureCode;
  readonly message: string;
  readonly diagnostics: readonly CampaignSaveDiagnostic[];
}

export type CampaignSaveResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CampaignSaveFailure };

export type CampaignLoadOutcome =
  | { readonly status: 'empty' }
  | { readonly status: 'loaded'; readonly envelope: CampaignSaveEnvelope }
  | { readonly status: 'migrated'; readonly envelope: CampaignSaveEnvelope };

export interface SaveStoragePort {
  read(key: string): string | undefined;
  write(key: string, value: string): void;
}

export interface StageResumeMigrationRequest {
  readonly identity: CampaignSaveIdentity;
  readonly resume: StageResumeState;
}
