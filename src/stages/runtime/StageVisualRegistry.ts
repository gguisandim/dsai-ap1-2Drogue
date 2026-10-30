import type { LevelDefinition } from '../../data/LevelData';
import type {
  ChapterManifest,
  ChapterVisualResources,
  NpcDefinition,
  ResolvedStageAudioProfile,
  ResolvedStageDecorationVisual,
  ResolvedStageEnvironment,
  ResolvedStagePresentation,
  ResolvedStageSound,
  ResolvedStageSprite,
  ResolvedStageTexture,
  ResolvedStageTileVisual,
  StageDiagnostic,
  StageAudioProfileDefinition,
  StageEnemyArchetype,
  StageEnvironmentDefinition,
  StageLogicalTileId,
  StageManifest,
  StageSoundDefinition,
  StageSpriteDefinition,
  StageTileVisualDefinition,
  StageTileVisualVariant,
  StageTilesetDefinition,
  StageVisualTextureDefinition,
  StageVisualThemeDefinition,
  StageDecorationVisualDefinition,
} from '../contracts';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const TEXTURE_KEY = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/;

export const STAGE_LOGICAL_TILE_IDS: readonly StageLogicalTileId[] = Object.freeze([
  'floor', 'wall', 'pillar', 'water', 'lava', 'exit', 'locked-door', 'chest', 'spawn', 'boss',
]);

export const STAGE_ENEMY_ARCHETYPES: readonly StageEnemyArchetype[] = Object.freeze([
  'affinity', 'applaud', 'fortitudo', 'ranged', 'boss', 'miniboss',
]);

const LEGACY_TEXTURES: readonly StageVisualTextureDefinition[] = Object.freeze([
  Object.freeze({ id: 'texture.legacy.floor', textureKey: 'tile_floor' }),
  Object.freeze({ id: 'texture.legacy.wall', textureKey: 'tile_wall' }),
  Object.freeze({ id: 'texture.legacy.pillar', textureKey: 'tile_pillar' }),
  Object.freeze({ id: 'texture.legacy.water', textureKey: 'tile_water' }),
  Object.freeze({ id: 'texture.legacy.lava', textureKey: 'tile_lava' }),
  Object.freeze({ id: 'texture.legacy.exit', textureKey: 'tile_stairs' }),
  Object.freeze({ id: 'texture.legacy.chest', textureKey: 'item_chest' }),
  Object.freeze({ id: 'texture.legacy.npc-marker', textureKey: 'poi_vestige' }),
  Object.freeze({ id: 'texture.legacy.enemy-melee', textureKey: 'enemy_melee_anim' }),
  Object.freeze({ id: 'texture.legacy.enemy-ranged', textureKey: 'enemy_ranged_anim' }),
  Object.freeze({ id: 'texture.legacy.enemy-boss', textureKey: 'boss_guardian_anim' }),
]);

const legacyEnemySprite = (
  id: string,
  textureId: string,
  animationPrefix: string,
  tint: number,
): StageSpriteDefinition => Object.freeze({
  id,
  textureId,
  animations: Object.freeze({
    walk: `${animationPrefix}_walk`,
    attack: `${animationPrefix}_attack`,
    hurt: `${animationPrefix}_hurt`,
  }),
  tint,
  scale: 1,
  depth: 5,
});

const LEGACY_SPRITES: readonly StageSpriteDefinition[] = Object.freeze([
  Object.freeze({
    id: 'sprite.legacy.npc-marker', textureId: 'texture.legacy.npc-marker',
    scale: 1, depth: 6,
  }),
  legacyEnemySprite('sprite.legacy.affinity', 'texture.legacy.enemy-melee', 'enemy_melee_anim', 0xf2cf68),
  legacyEnemySprite('sprite.legacy.applaud', 'texture.legacy.enemy-ranged', 'enemy_ranged_anim', 0x69c9ff),
  legacyEnemySprite('sprite.legacy.fortitudo', 'texture.legacy.enemy-boss', 'boss_guardian_anim', 0xff704d),
  legacyEnemySprite('sprite.legacy.miniboss', 'texture.legacy.enemy-boss', 'boss_guardian_anim', 0xc07cff),
]);

const legacyTile = (textureId: string): StageTileVisualDefinition => Object.freeze({ textureId });

export const LEGACY_STAGE_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: LEGACY_TEXTURES,
  tilesets: Object.freeze([Object.freeze({
    id: 'tileset.legacy.default',
    revision: 1,
    tileSize: 32 as const,
    tiles: Object.freeze({
      floor: legacyTile('texture.legacy.floor'),
      wall: legacyTile('texture.legacy.wall'),
      pillar: legacyTile('texture.legacy.pillar'),
      water: legacyTile('texture.legacy.water'),
      lava: legacyTile('texture.legacy.lava'),
      exit: legacyTile('texture.legacy.exit'),
      'locked-door': legacyTile('texture.legacy.wall'),
      chest: legacyTile('texture.legacy.chest'),
      spawn: legacyTile('texture.legacy.floor'),
      boss: legacyTile('texture.legacy.floor'),
    }),
  })]),
  themes: Object.freeze([Object.freeze({
    id: 'theme.legacy.default',
    revision: 1,
    tilesetId: 'tileset.legacy.default',
  })]),
  decorations: Object.freeze([]),
  sprites: LEGACY_SPRITES,
  sounds: Object.freeze([]),
  audioProfiles: Object.freeze([]),
  environments: Object.freeze([]),
});

const LEGACY_ENEMY_SPRITE_IDS: Readonly<Record<StageEnemyArchetype, string>> = Object.freeze({
  affinity: 'sprite.legacy.affinity',
  applaud: 'sprite.legacy.applaud',
  fortitudo: 'sprite.legacy.fortitudo',
  ranged: 'sprite.legacy.applaud',
  boss: 'sprite.legacy.fortitudo',
  miniboss: 'sprite.legacy.miniboss',
});

interface Registered<T> {
  readonly value: T;
  readonly path: readonly (string | number)[];
}

export type StageVisualResolution =
  | { readonly ok: true; readonly value: ResolvedStagePresentation; readonly diagnostics: readonly StageDiagnostic[] }
  | { readonly ok: false; readonly diagnostics: readonly StageDiagnostic[] };

function compareDiagnostics(left: StageDiagnostic, right: StageDiagnostic): number {
  const a = `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`;
  const b = `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`;
  return a < b ? -1 : a > b ? 1 : 0;
}

function finish(diagnostics: StageDiagnostic[]): readonly StageDiagnostic[] {
  return Object.freeze(diagnostics.sort(compareDiagnostics).map(item => Object.freeze({
    ...item,
    path: Object.freeze([...item.path]),
  })));
}

function validRevision(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function validTint(value: unknown): value is number | undefined {
  return value === undefined || (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffffff);
}

function validAlpha(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1);
}

export class StageVisualRegistry {
  private readonly textures = new Map<string, Registered<StageVisualTextureDefinition>>();
  private readonly tilesets = new Map<string, Registered<StageTilesetDefinition>>();
  private readonly themes = new Map<string, Registered<StageVisualThemeDefinition>>();
  private readonly decorations = new Map<string, Registered<StageDecorationVisualDefinition>>();
  private readonly sprites = new Map<string, Registered<StageSpriteDefinition>>();
  private readonly sounds = new Map<string, Registered<StageSoundDefinition>>();
  private readonly audioProfiles = new Map<string, Registered<StageAudioProfileDefinition>>();
  private readonly environments = new Map<string, Registered<StageEnvironmentDefinition>>();
  private readonly registrationDiagnostics: StageDiagnostic[] = [];

  public constructor() {
    this.registerResources(LEGACY_STAGE_VISUAL_RESOURCES, ['visualResources', 'legacy']);
  }

  public registerChapter(chapter: ChapterManifest): void {
    if (!chapter.visualResources) return;
    this.registerResources(chapter.visualResources, ['chapters', chapter.id, 'visualResources']);
  }

  public diagnostics(): readonly StageDiagnostic[] {
    const diagnostics = [...this.registrationDiagnostics];
    for (const registered of this.textures.values()) this.validateTexture(registered, diagnostics);
    for (const registered of this.tilesets.values()) this.validateTileset(registered, diagnostics);
    for (const registered of this.themes.values()) this.validateTheme(registered, diagnostics);
    for (const registered of this.decorations.values()) this.validateDecoration(registered, diagnostics);
    for (const registered of this.sprites.values()) this.validateSprite(registered, diagnostics);
    for (const registered of this.sounds.values()) this.validateSound(registered, diagnostics);
    for (const registered of this.audioProfiles.values()) this.validateAudioProfile(registered, diagnostics);
    for (const registered of this.environments.values()) this.validateEnvironment(registered, diagnostics);
    return finish(diagnostics);
  }

  public validateManifest(
    manifest: StageManifest,
    npcs: readonly NpcDefinition[] = [],
  ): readonly StageDiagnostic[] {
    if (!manifest.presentation) return Object.freeze([]);
    const diagnostics: StageDiagnostic[] = [];
    const theme = this.themes.get(manifest.presentation.themeId)?.value;
    if (!theme) diagnostics.push(this.diagnostic(
      'stage.visual.theme.unknown', `Visual theme is not registered: ${manifest.presentation.themeId}.`,
      ['manifest', 'presentation', 'themeId'], manifest.id, manifest.presentation.themeId,
    ));
    const tilesetId = manifest.presentation.tilesetId ?? theme?.tilesetId;
    if (tilesetId && !this.tilesets.has(tilesetId)) diagnostics.push(this.diagnostic(
      'stage.visual.tileset.unknown', `Visual tileset is not registered: ${tilesetId}.`,
      ['manifest', 'presentation', 'tilesetId'], manifest.id, tilesetId,
    ));
    Object.entries(manifest.presentation.npcSprites ?? {}).forEach(([presentationId, spriteId]) => {
      if (!STABLE_ID.test(presentationId) || !this.sprites.has(spriteId)) diagnostics.push(this.diagnostic(
        'stage.visual.sprite.unknown', `NPC sprite is not registered: ${spriteId}.`,
        ['manifest', 'presentation', 'npcSprites', presentationId], manifest.id, spriteId,
      ));
    });
    npcs.forEach((npc, index) => {
      if (!manifest.presentation?.npcSprites?.[npc.presentationId]) diagnostics.push(this.diagnostic(
        'stage.visual.npc-sprite.missing', `NPC presentation has no sprite mapping: ${npc.presentationId}.`,
        ['npcs', index, 'presentationId'], manifest.id, npc.presentationId,
      ));
    });
    Object.entries(manifest.presentation.enemySprites ?? {}).forEach(([archetype, spriteId]) => {
      if (!STAGE_ENEMY_ARCHETYPES.includes(archetype as StageEnemyArchetype) || !this.sprites.has(String(spriteId))) {
        diagnostics.push(this.diagnostic(
          'stage.visual.enemy-sprite.unknown', `Enemy sprite is not registered: ${String(spriteId)}.`,
          ['manifest', 'presentation', 'enemySprites', archetype], manifest.id, String(spriteId),
        ));
      }
      const sprite = this.sprites.get(String(spriteId))?.value;
      if (sprite && (['walk', 'attack', 'hurt'] as const).some(name => !sprite.animations?.[name])) {
        diagnostics.push(this.diagnostic(
          'stage.visual.enemy-animation.missing', `Enemy sprite lacks required animations: ${String(spriteId)}.`,
          ['manifest', 'presentation', 'enemySprites', archetype], manifest.id, String(spriteId),
        ));
      }
    });
    if (manifest.presentation.audioProfileId && !this.audioProfiles.has(manifest.presentation.audioProfileId)) {
      diagnostics.push(this.diagnostic(
        'stage.visual.audio-profile.unknown', `Audio profile is not registered: ${manifest.presentation.audioProfileId}.`,
        ['manifest', 'presentation', 'audioProfileId'], manifest.id, manifest.presentation.audioProfileId,
      ));
    }
    if (manifest.presentation.environmentId && !this.environments.has(manifest.presentation.environmentId)) {
      diagnostics.push(this.diagnostic(
        'stage.visual.environment.unknown', `Environment is not registered: ${manifest.presentation.environmentId}.`,
        ['manifest', 'presentation', 'environmentId'], manifest.id, manifest.presentation.environmentId,
      ));
    }
    return finish(diagnostics);
  }

  private validateTexture(
    registered: Registered<StageVisualTextureDefinition>,
    diagnostics: StageDiagnostic[],
  ): void {
    const { value, path } = registered;
    if (!TEXTURE_KEY.test(value.textureKey)) diagnostics.push(this.diagnostic(
      'stage.visual.texture.key-invalid', 'Texture key must be a stable renderer resource key.',
      [...path, 'textureKey'], undefined, value.id,
    ));
  }

  public resolve(
    manifest: StageManifest,
    level: LevelDefinition,
    npcs: readonly NpcDefinition[] = [],
  ): StageVisualResolution {
    const diagnostics = [...this.diagnostics(), ...this.validateManifest(manifest, npcs)];
    const explicit = manifest.presentation !== undefined;
    const themeId = manifest.presentation?.themeId ?? 'theme.legacy.default';
    const theme = this.themes.get(themeId)?.value;
    if (!theme) diagnostics.push(this.diagnostic(
      'stage.visual.theme.unknown', `Visual theme is not registered: ${themeId}.`,
      ['manifest', 'presentation', 'themeId'], manifest.id, themeId,
    ));
    const tilesetId = manifest.presentation?.tilesetId ?? theme?.tilesetId ?? 'tileset.legacy.default';
    const tileset = this.tilesets.get(tilesetId)?.value;
    if (!tileset) diagnostics.push(this.diagnostic(
      'stage.visual.tileset.unknown', `Visual tileset is not registered: ${tilesetId}.`,
      ['manifest', 'presentation', 'tilesetId'], manifest.id, tilesetId,
    ));
    const resolvedTiles: Partial<Record<StageLogicalTileId, ResolvedStageTileVisual>> = {};
    if (tileset) {
      STAGE_LOGICAL_TILE_IDS.forEach(logicalId => {
        const tile = tileset.tiles[logicalId];
        if (!tile) return;
        const resolved = this.resolveTile(tile, manifest.id, ['visualResources', 'tilesets', tileset.id, 'tiles', logicalId], diagnostics);
        if (resolved) resolvedTiles[logicalId] = resolved;
      });
    }

    const resolvedDecorations: Record<string, ResolvedStageDecorationVisual> = {};
    if (explicit && theme) {
      const allowed = new Set(theme.decorationIds ?? []);
      level.decorations.forEach((placement, index) => {
        const placementPath = ['level', 'decorations', index] as const;
        if (placement.layer !== undefined && !['background', 'terrain', 'foreground'].includes(placement.layer)) {
          diagnostics.push(this.diagnostic(
            'stage.visual.decoration.layer-invalid', 'Decoration placement layer is invalid.',
            [...placementPath, 'layer'], manifest.id, placement.type,
          ));
        }
        if (placement.depth !== undefined && !Number.isFinite(placement.depth)) diagnostics.push(this.diagnostic(
          'stage.visual.decoration.depth-invalid', 'Decoration placement depth must be finite.',
          [...placementPath, 'depth'], manifest.id, placement.type,
        ));
        if (placement.scale !== undefined && (!Number.isFinite(placement.scale) || placement.scale <= 0)) {
          diagnostics.push(this.diagnostic(
            'stage.visual.decoration.scale-invalid', 'Decoration placement scale must be positive.',
            [...placementPath, 'scale'], manifest.id, placement.type,
          ));
        }
        if (placement.rotation !== undefined && !Number.isFinite(placement.rotation)) diagnostics.push(this.diagnostic(
          'stage.visual.decoration.rotation-invalid', 'Decoration placement rotation must be finite.',
          [...placementPath, 'rotation'], manifest.id, placement.type,
        ));
        if (!validTint(placement.tint)) diagnostics.push(this.diagnostic(
          'stage.visual.tint.invalid', 'Decoration placement tint must be an RGB integer.',
          [...placementPath, 'tint'], manifest.id, placement.type,
        ));
        if (placement.visible !== undefined && typeof placement.visible !== 'boolean') diagnostics.push(this.diagnostic(
          'stage.visual.decoration.visibility-invalid', 'Decoration placement visibility must be boolean.',
          [...placementPath, 'visible'], manifest.id, placement.type,
        ));
        const definition = this.decorations.get(placement.type)?.value;
        if (!definition || !allowed.has(placement.type)) {
          diagnostics.push(this.diagnostic(
            'stage.visual.decoration.unknown', `Decoration is not available in theme ${theme.id}: ${placement.type}.`,
            [...placementPath, 'type'], manifest.id, placement.type,
          ));
          return;
        }
        const texture = this.textures.get(definition.textureId)?.value;
        if (!texture) return;
        resolvedDecorations[definition.id] = Object.freeze({
          id: definition.id,
          textureId: definition.textureId,
          textureKey: texture.textureKey,
          layer: definition.layer,
          depth: definition.depth,
          defaultScale: definition.defaultScale ?? 1,
        });
      });
    }

    const resolvedNpcSprites: Record<string, ResolvedStageSprite> = {};
    npcs.forEach((npc, index) => {
      const spriteId = explicit
        ? manifest.presentation?.npcSprites?.[npc.presentationId]
        : 'sprite.legacy.npc-marker';
      if (!spriteId) {
        diagnostics.push(this.diagnostic(
          'stage.visual.npc-sprite.missing', `NPC presentation has no sprite mapping: ${npc.presentationId}.`,
          ['manifest', 'presentation', 'npcSprites', npc.presentationId], manifest.id, npc.presentationId,
        ));
        return;
      }
      const sprite = this.resolveSprite(spriteId, manifest.id, ['npcs', index, 'presentationId'], diagnostics);
      if (sprite) resolvedNpcSprites[npc.presentationId] = sprite;
    });

    const resolvedEnemySprites: Partial<Record<StageEnemyArchetype, ResolvedStageSprite>> = {};
    STAGE_ENEMY_ARCHETYPES.forEach(archetype => {
      const spriteId = manifest.presentation?.enemySprites?.[archetype] ?? LEGACY_ENEMY_SPRITE_IDS[archetype];
      const sprite = this.resolveSprite(
        spriteId, manifest.id, ['manifest', 'presentation', 'enemySprites', archetype], diagnostics,
      );
      if (!sprite) return;
      (['walk', 'attack', 'hurt'] as const).forEach(animation => {
        if (!sprite.animations[animation]) diagnostics.push(this.diagnostic(
          'stage.visual.enemy-animation.missing',
          `Enemy sprite ${sprite.id} is missing ${animation} animation.`,
          ['manifest', 'presentation', 'enemySprites', archetype, 'animations', animation],
          manifest.id, sprite.id,
        ));
      });
      resolvedEnemySprites[archetype] = sprite;
    });

    const audio = manifest.presentation?.audioProfileId
      ? this.resolveAudioProfile(manifest.presentation.audioProfileId, manifest.id, diagnostics)
      : undefined;
    const environment = manifest.presentation?.environmentId
      ? this.resolveEnvironment(manifest.presentation.environmentId, manifest.id, diagnostics)
      : undefined;

    const completed = finish(diagnostics);
    if (completed.some(item => item.severity === 'error') || !theme || !tileset ||
      STAGE_LOGICAL_TILE_IDS.some(id => !resolvedTiles[id]) ||
      STAGE_ENEMY_ARCHETYPES.some(id => !resolvedEnemySprites[id])) {
      return Object.freeze({ ok: false as const, diagnostics: completed });
    }
    return Object.freeze({
      ok: true as const,
      diagnostics: completed,
      value: Object.freeze({
        themeId: theme.id,
        themeRevision: theme.revision,
        tilesetId: tileset.id,
        tilesetRevision: tileset.revision,
        tileSize: 32 as const,
        tiles: Object.freeze(resolvedTiles as Record<StageLogicalTileId, ResolvedStageTileVisual>),
        decorations: Object.freeze(resolvedDecorations),
        npcSprites: Object.freeze(resolvedNpcSprites),
        enemySprites: Object.freeze(
          resolvedEnemySprites as Record<StageEnemyArchetype, ResolvedStageSprite>,
        ),
        ...(audio ? { audio } : {}),
        ...(environment ? { environment } : {}),
      }),
    });
  }

  private registerResources(resources: ChapterVisualResources, path: readonly (string | number)[]): void {
    this.registerCollection(resources.textures, this.textures, [...path, 'textures']);
    this.registerCollection(resources.tilesets, this.tilesets, [...path, 'tilesets']);
    this.registerCollection(resources.themes, this.themes, [...path, 'themes']);
    this.registerCollection(resources.decorations ?? [], this.decorations, [...path, 'decorations']);
    this.registerCollection(resources.sprites ?? [], this.sprites, [...path, 'sprites']);
    this.registerCollection(resources.sounds ?? [], this.sounds, [...path, 'sounds']);
    this.registerCollection(resources.audioProfiles ?? [], this.audioProfiles, [...path, 'audioProfiles']);
    this.registerCollection(resources.environments ?? [], this.environments, [...path, 'environments']);
  }

  private registerCollection<T extends { readonly id: string }>(
    values: readonly T[],
    target: Map<string, Registered<T>>,
    path: readonly (string | number)[],
  ): void {
    values.forEach((value, index) => {
      if (!STABLE_ID.test(value.id)) this.registrationDiagnostics.push(this.diagnostic(
        'stage.visual.id.invalid', 'Visual resource id must be stable.', [...path, index, 'id'], undefined, value.id,
      ));
      if (target.has(value.id)) this.registrationDiagnostics.push(this.diagnostic(
        'stage.visual.id.duplicate', `Visual resource id is duplicated: ${value.id}.`,
        [...path, index, 'id'], undefined, value.id,
      ));
      else target.set(value.id, { value, path: [...path, index] });
    });
  }

  private validateTileset(registered: Registered<StageTilesetDefinition>, diagnostics: StageDiagnostic[]): void {
    const { value, path } = registered;
    if (!validRevision(value.revision)) diagnostics.push(this.diagnostic(
      'stage.visual.tileset.revision-invalid', 'Tileset revision must be positive.', [...path, 'revision'], undefined, value.id,
    ));
    if (value.tileSize !== 32) diagnostics.push(this.diagnostic(
      'stage.visual.tileset.tile-size-unsupported', 'Current renderer requires 32px logical tiles.',
      [...path, 'tileSize'], undefined, value.id,
    ));
    STAGE_LOGICAL_TILE_IDS.forEach(logicalId => {
      const tile = value.tiles?.[logicalId];
      if (!tile) diagnostics.push(this.diagnostic(
        'stage.visual.tileset.slot-missing', `Tileset is missing logical tile ${logicalId}.`,
        [...path, 'tiles', logicalId], undefined, value.id,
      ));
      else this.validateTileReference(tile, diagnostics, [...path, 'tiles', logicalId]);
    });
  }

  private validateTileReference(
    tile: StageTileVisualDefinition,
    diagnostics: StageDiagnostic[],
    path: readonly (string | number)[],
  ): void {
    this.validateVariant(tile, diagnostics, path);
    tile.variants?.forEach((variant, index) => this.validateVariant(variant, diagnostics, [...path, 'variants', index]));
  }

  private validateVariant(
    variant: StageTileVisualVariant,
    diagnostics: StageDiagnostic[],
    path: readonly (string | number)[],
  ): void {
    if (!this.textures.has(variant.textureId)) diagnostics.push(this.diagnostic(
      'stage.visual.texture.unknown', `Texture is not registered: ${variant.textureId}.`,
      [...path, 'textureId'], undefined, variant.textureId,
    ));
    if (!validTint(variant.tint)) diagnostics.push(this.diagnostic(
      'stage.visual.tint.invalid', 'Tint must be an RGB integer.', [...path, 'tint'], undefined,
    ));
    if (!validAlpha(variant.alpha)) diagnostics.push(this.diagnostic(
      'stage.visual.alpha.invalid', 'Alpha must be between 0 and 1.', [...path, 'alpha'], undefined,
    ));
  }

  private validateTheme(registered: Registered<StageVisualThemeDefinition>, diagnostics: StageDiagnostic[]): void {
    const { value, path } = registered;
    if (!validRevision(value.revision)) diagnostics.push(this.diagnostic(
      'stage.visual.theme.revision-invalid', 'Theme revision must be positive.', [...path, 'revision'], undefined, value.id,
    ));
    if (!this.tilesets.has(value.tilesetId)) diagnostics.push(this.diagnostic(
      'stage.visual.theme.tileset-missing', `Theme tileset is not registered: ${value.tilesetId}.`,
      [...path, 'tilesetId'], undefined, value.tilesetId,
    ));
    value.decorationIds?.forEach((id, index) => {
      if (!this.decorations.has(id)) diagnostics.push(this.diagnostic(
        'stage.visual.theme.decoration-missing', `Theme decoration is not registered: ${id}.`,
        [...path, 'decorationIds', index], undefined, id,
      ));
    });
  }

  private validateDecoration(
    registered: Registered<StageDecorationVisualDefinition>,
    diagnostics: StageDiagnostic[],
  ): void {
    const { value, path } = registered;
    if (!this.textures.has(value.textureId)) diagnostics.push(this.diagnostic(
      'stage.visual.decoration.texture-missing', `Decoration texture is not registered: ${value.textureId}.`,
      [...path, 'textureId'], undefined, value.textureId,
    ));
    if (!['background', 'terrain', 'foreground'].includes(value.layer)) diagnostics.push(this.diagnostic(
      'stage.visual.decoration.layer-invalid', 'Decoration layer is invalid.', [...path, 'layer'], undefined, value.id,
    ));
    if (!Number.isFinite(value.depth)) diagnostics.push(this.diagnostic(
      'stage.visual.decoration.depth-invalid', 'Decoration depth must be finite.', [...path, 'depth'], undefined, value.id,
    ));
    if (value.defaultScale !== undefined && (!Number.isFinite(value.defaultScale) || value.defaultScale <= 0)) {
      diagnostics.push(this.diagnostic(
        'stage.visual.decoration.scale-invalid', 'Decoration defaultScale must be positive.',
        [...path, 'defaultScale'], undefined, value.id,
      ));
    }
  }

  private validateSprite(registered: Registered<StageSpriteDefinition>, diagnostics: StageDiagnostic[]): void {
    const { value, path } = registered;
    if (!this.textures.has(value.textureId)) diagnostics.push(this.diagnostic(
      'stage.visual.sprite.texture-missing', `Sprite texture is not registered: ${value.textureId}.`,
      [...path, 'textureId'], undefined, value.textureId,
    ));
    Object.entries(value.animations ?? {}).forEach(([name, animationKey]) => {
      if (!TEXTURE_KEY.test(animationKey)) diagnostics.push(this.diagnostic(
        'stage.visual.sprite.animation-invalid', `Sprite animation key is invalid: ${animationKey}.`,
        [...path, 'animations', name], undefined, animationKey,
      ));
    });
    if (!validTint(value.tint)) diagnostics.push(this.diagnostic(
      'stage.visual.tint.invalid', 'Sprite tint must be an RGB integer.', [...path, 'tint'], undefined, value.id,
    ));
    if (value.scale !== undefined && (!Number.isFinite(value.scale) || value.scale <= 0)) diagnostics.push(this.diagnostic(
      'stage.visual.sprite.scale-invalid', 'Sprite scale must be positive.', [...path, 'scale'], undefined, value.id,
    ));
    if (value.depth !== undefined && !Number.isFinite(value.depth)) diagnostics.push(this.diagnostic(
      'stage.visual.sprite.depth-invalid', 'Sprite depth must be finite.', [...path, 'depth'], undefined, value.id,
    ));
  }

  private validateSound(registered: Registered<StageSoundDefinition>, diagnostics: StageDiagnostic[]): void {
    const { value, path } = registered;
    if (value.kind !== 'synth' || !['sine', 'triangle', 'square', 'sawtooth'].includes(value.waveform)) {
      diagnostics.push(this.diagnostic(
        'stage.visual.sound.kind-invalid', 'Only local synth sound resources are supported.',
        [...path, 'kind'], undefined, value.id,
      ));
    }
    if (!Number.isFinite(value.frequency) || value.frequency < 20 || value.frequency > 20000) {
      diagnostics.push(this.diagnostic(
        'stage.visual.sound.frequency-invalid', 'Sound frequency must be between 20 and 20000 Hz.',
        [...path, 'frequency'], undefined, value.id,
      ));
    }
    if (!validAlpha(value.volume)) diagnostics.push(this.diagnostic(
      'stage.visual.sound.volume-invalid', 'Sound volume must be between 0 and 1.',
      [...path, 'volume'], undefined, value.id,
    ));
  }

  private validateAudioProfile(
    registered: Registered<StageAudioProfileDefinition>,
    diagnostics: StageDiagnostic[],
  ): void {
    const { value, path } = registered;
    if (!validAlpha(value.masterVolume)) diagnostics.push(this.diagnostic(
      'stage.visual.audio-profile.volume-invalid', 'Audio profile masterVolume must be between 0 and 1.',
      [...path, 'masterVolume'], undefined, value.id,
    ));
    const references: Array<[string, string | undefined]> = [
      ['musicSoundId', value.musicSoundId], ['ambientSoundId', value.ambientSoundId],
      ...Object.entries(value.eventSoundIds ?? {}).map(
        ([event, id]): [string, string | undefined] => [`eventSoundIds.${event}`, id],
      ),
    ];
    references.forEach(([field, soundId]) => {
      if (soundId && !this.sounds.has(soundId)) diagnostics.push(this.diagnostic(
        'stage.visual.audio-profile.sound-missing', `Audio sound is not registered: ${soundId}.`,
        [...path, ...field.split('.')], undefined, soundId,
      ));
    });
    Object.keys(value.eventSoundIds ?? {}).forEach(event => {
      if (!['stage.entered', 'npc.interacted', 'enemy.defeated'].includes(event)) diagnostics.push(this.diagnostic(
        'stage.visual.audio-profile.event-invalid', `Audio event is unsupported: ${event}.`,
        [...path, 'eventSoundIds', event], undefined, event,
      ));
    });
  }

  private validateEnvironment(
    registered: Registered<StageEnvironmentDefinition>,
    diagnostics: StageDiagnostic[],
  ): void {
    const { value, path } = registered;
    if (!validTint(value.ambientColor)) diagnostics.push(this.diagnostic(
      'stage.visual.environment.color-invalid', 'Ambient color must be an RGB integer.',
      [...path, 'ambientColor'], undefined, value.id,
    ));
    if (!validAlpha(value.lightIntensity)) diagnostics.push(this.diagnostic(
      'stage.visual.environment.intensity-invalid', 'Light intensity must be between 0 and 1.',
      [...path, 'lightIntensity'], undefined, value.id,
    ));
    if (value.fog) {
      if (!validTint(value.fog.color)) diagnostics.push(this.diagnostic(
        'stage.visual.environment.fog-color-invalid', 'Fog color must be an RGB integer.',
        [...path, 'fog', 'color'], undefined, value.id,
      ));
      if (!validAlpha(value.fog.opacity) || value.fog.opacity > 0.45) diagnostics.push(this.diagnostic(
        'stage.visual.environment.fog-opacity-invalid', 'Fog opacity must be between 0 and 0.45.',
        [...path, 'fog', 'opacity'], undefined, value.id,
      ));
      if (!Number.isFinite(value.fog.depth)) diagnostics.push(this.diagnostic(
        'stage.visual.environment.fog-depth-invalid', 'Fog depth must be finite.',
        [...path, 'fog', 'depth'], undefined, value.id,
      ));
    }
  }

  private resolveSprite(
    spriteId: string,
    stageId: string,
    path: readonly (string | number)[],
    diagnostics: StageDiagnostic[],
  ): ResolvedStageSprite | undefined {
    const sprite = this.sprites.get(spriteId)?.value;
    if (!sprite) {
      diagnostics.push(this.diagnostic(
        'stage.visual.sprite.unknown', `Sprite is not registered: ${spriteId}.`, path, stageId, spriteId,
      ));
      return undefined;
    }
    const texture = this.textures.get(sprite.textureId)?.value;
    if (!texture) return undefined;
    return Object.freeze({
      id: sprite.id,
      textureId: texture.id,
      textureKey: texture.textureKey,
      animations: Object.freeze({ ...(sprite.animations ?? {}) }),
      ...(sprite.tint !== undefined ? { tint: sprite.tint } : {}),
      scale: sprite.scale ?? 1,
      depth: sprite.depth ?? 5,
    });
  }

  private resolveSound(soundId: string | undefined): ResolvedStageSound | undefined {
    const sound = soundId ? this.sounds.get(soundId)?.value : undefined;
    return sound ? Object.freeze({ ...sound }) : undefined;
  }

  private resolveAudioProfile(
    profileId: string,
    stageId: string,
    diagnostics: StageDiagnostic[],
  ): ResolvedStageAudioProfile | undefined {
    const profile = this.audioProfiles.get(profileId)?.value;
    if (!profile) {
      diagnostics.push(this.diagnostic(
        'stage.visual.audio-profile.unknown', `Audio profile is not registered: ${profileId}.`,
        ['manifest', 'presentation', 'audioProfileId'], stageId, profileId,
      ));
      return undefined;
    }
    const eventSounds = Object.fromEntries(Object.entries(profile.eventSoundIds ?? {}).map(([event, soundId]) => [
      event, this.resolveSound(soundId),
    ]).filter((entry): entry is [string, ResolvedStageSound] => entry[1] !== undefined));
    return Object.freeze({
      id: profile.id,
      ...(this.resolveSound(profile.musicSoundId) ? { music: this.resolveSound(profile.musicSoundId) } : {}),
      ...(this.resolveSound(profile.ambientSoundId) ? { ambient: this.resolveSound(profile.ambientSoundId) } : {}),
      eventSounds: Object.freeze(eventSounds),
      masterVolume: profile.masterVolume,
    });
  }

  private resolveEnvironment(
    environmentId: string,
    stageId: string,
    diagnostics: StageDiagnostic[],
  ): ResolvedStageEnvironment | undefined {
    const environment = this.environments.get(environmentId)?.value;
    if (!environment) {
      diagnostics.push(this.diagnostic(
        'stage.visual.environment.unknown', `Environment is not registered: ${environmentId}.`,
        ['manifest', 'presentation', 'environmentId'], stageId, environmentId,
      ));
      return undefined;
    }
    return Object.freeze({
      ...environment,
      ...(environment.fog ? { fog: Object.freeze({ ...environment.fog }) } : {}),
    });
  }

  private resolveTile(
    tile: StageTileVisualDefinition,
    stageId: string,
    path: readonly (string | number)[],
    diagnostics: StageDiagnostic[],
  ): ResolvedStageTileVisual | undefined {
    const base = this.resolveTexture(tile, stageId, path, diagnostics);
    if (!base) return undefined;
    const variants = (tile.variants ?? []).map((variant, index) =>
      this.resolveTexture(variant, stageId, [...path, 'variants', index], diagnostics)).filter(
      (value): value is ResolvedStageTexture => value !== undefined,
    );
    return Object.freeze({ ...base, variants: Object.freeze(variants) });
  }

  private resolveTexture(
    reference: StageTileVisualVariant,
    stageId: string,
    path: readonly (string | number)[],
    diagnostics: StageDiagnostic[],
  ): ResolvedStageTexture | undefined {
    const texture = this.textures.get(reference.textureId)?.value;
    if (!texture) {
      diagnostics.push(this.diagnostic(
        'stage.visual.texture.unknown', `Texture is not registered: ${reference.textureId}.`,
        [...path, 'textureId'], stageId, reference.textureId,
      ));
      return undefined;
    }
    return Object.freeze({
      textureId: texture.id,
      textureKey: texture.textureKey,
      ...(reference.tint !== undefined ? { tint: reference.tint } : {}),
      ...(reference.alpha !== undefined ? { alpha: reference.alpha } : {}),
    });
  }

  private diagnostic(
    code: string,
    message: string,
    path: readonly (string | number)[],
    stageId?: string,
    referenceId?: string,
  ): StageDiagnostic {
    return {
      code,
      severity: 'error',
      message,
      path,
      ...(stageId ? { stageId } : {}),
      ...(referenceId ? { referenceId } : {}),
    };
  }
}

const legacyRegistry = new StageVisualRegistry();
const legacyResolution = legacyRegistry.resolve(
  { id: 'stage.legacy.visual-fallback', presentation: { themeId: 'theme.legacy.default' } } as StageManifest,
  { decorations: [] } as unknown as LevelDefinition,
);
if (!legacyResolution.ok) throw new Error('Built-in legacy visual presentation is invalid.');
export const LEGACY_RESOLVED_STAGE_PRESENTATION = legacyResolution.value;
const legacyNpcResolution = legacyRegistry.resolve(
  { id: 'stage.legacy.npc-fallback' } as StageManifest,
  { decorations: [] } as unknown as LevelDefinition,
  [{ id: 'npc.legacy.fallback', presentationId: 'presentation.legacy.fallback' } as NpcDefinition],
);
if (!legacyNpcResolution.ok) throw new Error('Built-in legacy NPC presentation is invalid.');
export const LEGACY_RESOLVED_NPC_SPRITE =
  legacyNpcResolution.value.npcSprites['presentation.legacy.fallback'];
