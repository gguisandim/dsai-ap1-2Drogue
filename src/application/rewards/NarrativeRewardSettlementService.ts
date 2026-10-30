import type {
  ProgressionOperationResult,
  ProgressionRewardOperation,
} from '../../progression';
import type { StageCommand } from '../../narrative';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export interface NarrativeRewardSessionPort {
  pendingRewardCommands(): readonly StageCommand[];
  confirmOperation(operationId: string):
    | { readonly ok: true; readonly persistence: 'saved' | 'skipped' }
    | { readonly ok: false; readonly error: { readonly code: string; readonly message?: string } };
}

export interface NarrativeRewardProgressionPort {
  grantRewardIdempotent(input: ProgressionRewardOperation): ProgressionOperationResult;
}

export type NarrativeRewardSettlementFailureCode =
  | 'invalid-command'
  | 'invalid-operation-id'
  | 'invalid-reward'
  | 'unsupported-reward'
  | 'progression-failed'
  | 'narrative-confirmation-failed';

export interface NarrativeRewardSettlementFailure {
  readonly code: NarrativeRewardSettlementFailureCode;
  readonly message: string;
  readonly operationId?: string;
  readonly causeCode?: string;
  readonly progressionStatus?: 'applied' | 'deduplicated';
}

export interface NarrativeRewardSettlement {
  readonly operationId: string;
  readonly status: 'applied' | 'reconciled';
  readonly reward: Extract<StageCommand, { readonly type: 'reward.grant' }>['reward'];
}

export type NarrativeRewardSettlementResult =
  | { readonly ok: true; readonly value: NarrativeRewardSettlement }
  | { readonly ok: false; readonly error: NarrativeRewardSettlementFailure };

export type NarrativeRewardSettlementBatchResult =
  | { readonly ok: true; readonly settlements: readonly NarrativeRewardSettlement[] }
  | {
      readonly ok: false;
      readonly settlements: readonly NarrativeRewardSettlement[];
      readonly error: NarrativeRewardSettlementFailure;
    };

/**
 * Coordinates the two durable authorities without pretending they form one
 * transaction: progression is committed first, narrative confirmation second.
 */
export class NarrativeRewardSettlementService {
  public constructor(
    private readonly narrative: NarrativeRewardSessionPort,
    private readonly progression: NarrativeRewardProgressionPort,
  ) {}

  public settlePending(): NarrativeRewardSettlementBatchResult {
    const settlements: NarrativeRewardSettlement[] = [];
    for (const command of this.narrative.pendingRewardCommands()) {
      const settled = this.settle(command);
      if (!settled.ok) {
        return Object.freeze({
          ok: false as const,
          settlements: Object.freeze([...settlements]),
          error: settled.error,
        });
      }
      settlements.push(settled.value);
    }
    return Object.freeze({
      ok: true as const,
      settlements: Object.freeze([...settlements]),
    });
  }

  public settle(command: StageCommand): NarrativeRewardSettlementResult {
    if (!command || typeof command !== 'object' ||
      (command as { type?: unknown }).type !== 'reward.grant') {
      return this.failure('invalid-command', 'Pending command must be reward.grant.');
    }
    const rewardCommand = command as Extract<StageCommand, { readonly type: 'reward.grant' }>;
    const operationId = rewardCommand.operationId;
    if (typeof operationId !== 'string' || !STABLE_ID.test(operationId)) {
      return this.failure(
        'invalid-operation-id',
        'Reward operationId must be a stable identifier.',
        typeof operationId === 'string' ? operationId : undefined,
      );
    }
    const mapped = this.mapReward(rewardCommand.reward, operationId);
    if (!mapped.ok) return mapped;

    const granted = this.progression.grantRewardIdempotent({
      operationId,
      reward: mapped.reward,
    });
    if (!granted.ok) {
      return this.failure(
        'progression-failed',
        'Progression did not durably grant the narrative reward.',
        operationId,
        granted.error.code,
      );
    }

    const confirmed = this.narrative.confirmOperation(operationId);
    if (!confirmed.ok) {
      return this.failure(
        'narrative-confirmation-failed',
        'Progression granted the reward, but narrative confirmation did not persist.',
        operationId,
        confirmed.error.code,
        granted.value.status,
      );
    }
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        operationId,
        status: granted.value.status === 'applied' ? 'applied' as const : 'reconciled' as const,
        reward: rewardCommand.reward,
      }),
    });
  }

  private mapReward(
    reward: Extract<StageCommand, { readonly type: 'reward.grant' }>['reward'],
    operationId: string,
  ):
    | { readonly ok: true; readonly reward: ProgressionRewardOperation['reward'] }
    | { readonly ok: false; readonly error: NarrativeRewardSettlementFailure } {
    if (!reward || typeof reward !== 'object' || typeof (reward as { type?: unknown }).type !== 'string') {
      return this.failure('invalid-reward', 'Reward must be a discriminated object.', operationId);
    }
    if (reward.type === 'progression.currency') {
      if (!Number.isSafeInteger(reward.amount) || reward.amount <= 0) {
        return this.failure(
          'invalid-reward',
          'Currency reward must be a positive safe integer.',
          operationId,
        );
      }
      return { ok: true, reward: { currency: reward.amount } };
    }
    if (reward.type === 'progression.unlock') {
      if (typeof reward.contentId !== 'string' || !STABLE_ID.test(reward.contentId)) {
        return this.failure(
          'invalid-reward',
          'Unlock reward requires a stable contentId.',
          operationId,
        );
      }
      return { ok: true, reward: { unlocks: [reward.contentId] } };
    }
    return this.failure(
      'unsupported-reward',
      `Reward type is not an external progression reward: ${(reward as { type: string }).type}.`,
      operationId,
    );
  }

  private failure(
    code: NarrativeRewardSettlementFailureCode,
    message: string,
    operationId?: string,
    causeCode?: string,
    progressionStatus?: 'applied' | 'deduplicated',
  ): { readonly ok: false; readonly error: NarrativeRewardSettlementFailure } {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code,
        message,
        ...(operationId ? { operationId } : {}),
        ...(causeCode ? { causeCode } : {}),
        ...(progressionStatus ? { progressionStatus } : {}),
      }),
    });
  }
}
