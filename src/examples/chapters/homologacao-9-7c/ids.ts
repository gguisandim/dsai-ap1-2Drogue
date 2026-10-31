/**
 * Every persistent identifier used by the template derives from one namespace.
 * A new chapter only needs a new namespace; nothing central has to change.
 */
const STABLE_NAMESPACE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export interface ChapterTemplateIds {
  readonly namespace: string;
  readonly chapterId: string;
  readonly stageId: string;
  readonly npcId: string;
  readonly dialogueId: string;
  readonly missionId: string;
  readonly objectiveId: string;
  readonly encounterId: string;
  readonly exitId: string;
  readonly regionId: string;
  readonly rewardOperationId: string;
  readonly flags: {
    readonly arrived: string;
    readonly accepted: string;
    readonly beaconLit: string;
  };
  readonly events: {
    readonly arrival: string;
    readonly warden: string;
    readonly beaconLit: string;
    readonly depart: string;
  };
  readonly visual: {
    readonly themeId: string;
    readonly tilesetId: string;
    readonly decorationId: string;
    readonly npcPresentationId: string;
    readonly npcSpriteId: string;
    readonly affinitySpriteId: string;
    readonly rangedSpriteId: string;
    readonly audioProfileId: string;
    readonly environmentId: string;
  };
}

export function assertChapterTemplateNamespace(namespace: string): string {
  if (typeof namespace !== 'string' || !STABLE_NAMESPACE.test(namespace)) {
    throw new Error(
      `Chapter template namespace must be a stable lowercase identifier: ${String(namespace)}.`,
    );
  }
  return namespace;
}

export function createChapterTemplateIds(namespace: string): ChapterTemplateIds {
  const ns = assertChapterTemplateNamespace(namespace);
  return Object.freeze({
    namespace: ns,
    chapterId: `chapter.${ns}`,
    stageId: `stage.${ns}.approach`,
    npcId: `npc.${ns}.warden`,
    dialogueId: `dialogue.${ns}.warden`,
    missionId: `mission.${ns}.relight`,
    objectiveId: `objective.${ns}.encounter`,
    encounterId: `encounter.${ns}.beacon`,
    exitId: `exit.${ns}.depart`,
    regionId: `region.${ns}`,
    rewardOperationId: `operation.${ns}.light`,
    flags: Object.freeze({
      arrived: `flag.${ns}.arrived`,
      accepted: `flag.${ns}.accepted`,
      beaconLit: `flag.${ns}.beacon-lit`,
    }),
    events: Object.freeze({
      arrival: `event.${ns}.arrival`,
      warden: `event.${ns}.warden`,
      beaconLit: `event.${ns}.beacon-lit`,
      depart: `event.${ns}.depart`,
    }),
    visual: Object.freeze({
      themeId: `theme.${ns}`,
      tilesetId: `tileset.${ns}`,
      decorationId: `decor.${ns}.rune`,
      npcPresentationId: `presentation.${ns}.warden`,
      npcSpriteId: `sprite.${ns}.warden`,
      affinitySpriteId: `sprite.${ns}.affinity`,
      rangedSpriteId: `sprite.${ns}.ranged`,
      audioProfileId: `audio-profile.${ns}`,
      environmentId: `environment.${ns}`,
    }),
  });
}
