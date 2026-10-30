import type { LevelDefinition } from '../../data/LevelData';
import type {
  ChapterManifest,
  ChapterVisualResources,
  ResolvedStageDecorationVisual,
  ResolvedStagePresentation,
  ResolvedStageTexture,
  ResolvedStageTileVisual,
  StageDiagnostic,
  StageLogicalTileId,
  StageManifest,
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

const LEGACY_TEXTURES: readonly StageVisualTextureDefinition[] = Object.freeze([
  Object.freeze({ id: 'texture.legacy.floor', textureKey: 'tile_floor' }),
  Object.freeze({ id: 'texture.legacy.wall', textureKey: 'tile_wall' }),
  Object.freeze({ id: 'texture.legacy.pillar', textureKey: 'tile_pillar' }),
  Object.freeze({ id: 'texture.legacy.water', textureKey: 'tile_water' }),
  Object.freeze({ id: 'texture.legacy.lava', textureKey: 'tile_lava' }),
  Object.freeze({ id: 'texture.legacy.exit', textureKey: 'tile_stairs' }),
  Object.freeze({ id: 'texture.legacy.chest', textureKey: 'item_chest' }),
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
    return finish(diagnostics);
  }

  public validateManifest(manifest: StageManifest): readonly StageDiagnostic[] {
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

  public resolve(manifest: StageManifest, level: LevelDefinition): StageVisualResolution {
    const diagnostics = [...this.diagnostics()];
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

    const completed = finish(diagnostics);
    if (completed.some(item => item.severity === 'error') || !theme || !tileset ||
      STAGE_LOGICAL_TILE_IDS.some(id => !resolvedTiles[id])) {
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
      }),
    });
  }

  private registerResources(resources: ChapterVisualResources, path: readonly (string | number)[]): void {
    this.registerCollection(resources.textures, this.textures, [...path, 'textures']);
    this.registerCollection(resources.tilesets, this.tilesets, [...path, 'tilesets']);
    this.registerCollection(resources.themes, this.themes, [...path, 'themes']);
    this.registerCollection(resources.decorations ?? [], this.decorations, [...path, 'decorations']);
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
