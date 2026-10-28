import type { NarrativeIdentityScope } from '../contracts';

export type NarrativeScopedIdKind = 'event' | 'rule' | 'operation';

export function narrativeScopePrefix(identity: NarrativeIdentityScope): string {
  return `run.${identity.runId}.chapter.${identity.chapterId}.stage.${identity.stageId}.revision.${identity.manifestRevision}`;
}

export function scopeNarrativeId(
  identity: NarrativeIdentityScope | undefined,
  kind: NarrativeScopedIdKind,
  localId: string,
): string {
  return identity ? `${narrativeScopePrefix(identity)}.${kind}.${localId}` : localId;
}
