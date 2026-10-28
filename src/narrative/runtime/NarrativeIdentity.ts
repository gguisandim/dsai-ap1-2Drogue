import type { NarrativeIdentityScope } from '../contracts';

export type NarrativeScopedIdKind = 'event' | 'rule' | 'operation';

export function narrativeScopePrefix(identity: NarrativeIdentityScope): string {
  const stageScope = `run.${identity.runId}.chapter.${identity.chapterId}.stage.${identity.stageId}.revision.${identity.manifestRevision}`;
  return identity.stageInstanceId
    ? `${stageScope}.instance.${identity.stageInstanceId}`
    : stageScope;
}

export function scopeNarrativeId(
  identity: NarrativeIdentityScope | undefined,
  kind: NarrativeScopedIdKind,
  localId: string,
): string {
  return identity ? `${narrativeScopePrefix(identity)}.${kind}.${localId}` : localId;
}
