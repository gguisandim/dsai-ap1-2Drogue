import type {
  ChapterVisualResources,
  StagePresentationDefinition,
} from '../../../stages';
import type { ChapterTemplateIds } from './ids';

const TEXTURE_KEYS = Object.freeze({
  floor: 'tile_floor',
  wall: 'tile_wall',
  pillar: 'tile_pillar',
  water: 'tile_water',
  lava: 'tile_lava',
  exit: 'tile_stairs',
  chest: 'item_chest',
  npc: 'poi_vestige',
  affinity: 'enemy_melee_anim',
  ranged: 'enemy_ranged_anim',
});

function textureId(ids: ChapterTemplateIds, name: keyof typeof TEXTURE_KEYS): string {
  return `texture.${ids.namespace}.${name}`;
}

/**
 * Declarative visual and audio resources. Every textureKey is an existing
 * technical asset; the template only gives it a local, namespaced identity.
 */
export function createTemplateVisualResources(ids: ChapterTemplateIds): ChapterVisualResources {
  const textures = Object.entries(TEXTURE_KEYS).map(([name, textureKey]) => Object.freeze({
    id: textureId(ids, name as keyof typeof TEXTURE_KEYS),
    textureKey,
  }));

  return Object.freeze({
    textures: Object.freeze(textures),
    tilesets: Object.freeze([Object.freeze({
      id: ids.visual.tilesetId,
      revision: 1,
      tileSize: 32 as const,
      tiles: Object.freeze({
        floor: Object.freeze({ textureId: textureId(ids, 'floor'), tint: 0x334d5c }),
        wall: Object.freeze({ textureId: textureId(ids, 'wall'), tint: 0x1b2c3a }),
        pillar: Object.freeze({ textureId: textureId(ids, 'pillar'), tint: 0x4a5a68 }),
        water: Object.freeze({ textureId: textureId(ids, 'water'), tint: 0x1d4d5a }),
        lava: Object.freeze({ textureId: textureId(ids, 'lava'), tint: 0x7a5a3a }),
        exit: Object.freeze({ textureId: textureId(ids, 'exit'), tint: 0x8fd6ff }),
        'locked-door': Object.freeze({ textureId: textureId(ids, 'wall'), tint: 0x2a3b4a }),
        chest: Object.freeze({ textureId: textureId(ids, 'chest'), tint: 0x9fd6c8 }),
        spawn: Object.freeze({ textureId: textureId(ids, 'floor'), tint: 0x6a8fa3 }),
        boss: Object.freeze({ textureId: textureId(ids, 'floor'), tint: 0x3a5a6a }),
      }),
    })]),
    themes: Object.freeze([Object.freeze({
      id: ids.visual.themeId,
      revision: 1,
      tilesetId: ids.visual.tilesetId,
      decorationIds: Object.freeze([ids.visual.decorationId]),
    })]),
    decorations: Object.freeze([Object.freeze({
      id: ids.visual.decorationId,
      textureId: textureId(ids, 'exit'),
      layer: 'terrain' as const,
      depth: 2,
      defaultScale: 1,
    })]),
    sprites: Object.freeze([
      Object.freeze({
        id: ids.visual.npcSpriteId,
        textureId: textureId(ids, 'npc'),
        animations: Object.freeze({ idle: 'enemy_ranged_anim_walk' }),
        tint: 0x9fe0ff,
        scale: 0.5,
        depth: 6,
      }),
      Object.freeze({
        id: ids.visual.affinitySpriteId,
        textureId: textureId(ids, 'affinity'),
        animations: Object.freeze({
          walk: 'enemy_melee_anim_walk',
          attack: 'enemy_melee_anim_attack',
          hurt: 'enemy_melee_anim_hurt',
        }),
        tint: 0x7fd0a8,
        scale: 1,
        depth: 5,
      }),
      Object.freeze({
        id: ids.visual.rangedSpriteId,
        textureId: textureId(ids, 'ranged'),
        animations: Object.freeze({
          walk: 'enemy_ranged_anim_walk',
          attack: 'enemy_ranged_anim_attack',
          hurt: 'enemy_ranged_anim_hurt',
        }),
        tint: 0x7fb8e0,
        scale: 1,
        depth: 5,
      }),
    ]),
    sounds: Object.freeze([
      Object.freeze({
        id: `sound.${ids.namespace}.beacon`,
        kind: 'synth' as const,
        waveform: 'sine' as const,
        frequency: 110,
        volume: 0.06,
      }),
      Object.freeze({
        id: `sound.${ids.namespace}.hall`,
        kind: 'synth' as const,
        waveform: 'triangle' as const,
        frequency: 220,
        volume: 0.025,
      }),
      Object.freeze({
        id: `sound.${ids.namespace}.lit`,
        kind: 'synth' as const,
        waveform: 'sine' as const,
        frequency: 440,
        volume: 0.08,
      }),
    ]),
    audioProfiles: Object.freeze([Object.freeze({
      id: ids.visual.audioProfileId,
      musicSoundId: `sound.${ids.namespace}.beacon`,
      ambientSoundId: `sound.${ids.namespace}.hall`,
      eventSoundIds: Object.freeze({
        'stage.entered': `sound.${ids.namespace}.lit`,
        'npc.interacted': `sound.${ids.namespace}.lit`,
        'enemy.defeated': `sound.${ids.namespace}.lit`,
      }),
      masterVolume: 0.65,
    })]),
    environments: Object.freeze([Object.freeze({
      id: ids.visual.environmentId,
      ambientColor: 0x1d3440,
      lightIntensity: 0.75,
      fog: Object.freeze({ color: 0x0b1720, opacity: 0.18, depth: 4 }),
    })]),
  });
}

export function createTemplatePresentation(ids: ChapterTemplateIds): StagePresentationDefinition {
  return Object.freeze({
    themeId: ids.visual.themeId,
    tilesetId: ids.visual.tilesetId,
    npcSprites: Object.freeze({
      [ids.visual.npcPresentationId]: ids.visual.npcSpriteId,
    }),
    enemySprites: Object.freeze({
      affinity: ids.visual.affinitySpriteId,
      ranged: ids.visual.rangedSpriteId,
    }),
    audioProfileId: ids.visual.audioProfileId,
    environmentId: ids.visual.environmentId,
  });
}
