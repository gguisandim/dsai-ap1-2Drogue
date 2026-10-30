export type StageLogicalTileId =
  | 'floor'
  | 'wall'
  | 'pillar'
  | 'water'
  | 'lava'
  | 'exit'
  | 'locked-door'
  | 'chest'
  | 'spawn'
  | 'boss';

export type StageVisualLayer = 'background' | 'terrain' | 'foreground';

export interface StageVisualTextureDefinition {
  readonly id: string;
  readonly textureKey: string;
}

export interface StageTileVisualVariant {
  readonly textureId: string;
  readonly tint?: number;
  readonly alpha?: number;
}

export interface StageTileVisualDefinition extends StageTileVisualVariant {
  readonly variants?: readonly StageTileVisualVariant[];
}

export interface StageTilesetDefinition {
  readonly id: string;
  readonly revision: number;
  readonly tileSize: 32;
  readonly tiles: Readonly<Record<StageLogicalTileId, StageTileVisualDefinition>>;
}

export interface StageDecorationVisualDefinition {
  readonly id: string;
  readonly textureId: string;
  readonly layer: StageVisualLayer;
  readonly depth: number;
  readonly defaultScale?: number;
}

export interface StageVisualThemeDefinition {
  readonly id: string;
  readonly revision: number;
  readonly tilesetId: string;
  readonly decorationIds?: readonly string[];
}

export interface ChapterVisualResources {
  readonly textures: readonly StageVisualTextureDefinition[];
  readonly tilesets: readonly StageTilesetDefinition[];
  readonly themes: readonly StageVisualThemeDefinition[];
  readonly decorations?: readonly StageDecorationVisualDefinition[];
}

export interface StagePresentationDefinition {
  readonly themeId: string;
  readonly tilesetId?: string;
}

export interface ResolvedStageTexture {
  readonly textureId: string;
  readonly textureKey: string;
  readonly tint?: number;
  readonly alpha?: number;
}

export interface ResolvedStageTileVisual extends ResolvedStageTexture {
  readonly variants: readonly ResolvedStageTexture[];
}

export interface ResolvedStageDecorationVisual {
  readonly id: string;
  readonly textureId: string;
  readonly textureKey: string;
  readonly layer: StageVisualLayer;
  readonly depth: number;
  readonly defaultScale: number;
}

export interface ResolvedStagePresentation {
  readonly themeId: string;
  readonly themeRevision: number;
  readonly tilesetId: string;
  readonly tilesetRevision: number;
  readonly tileSize: 32;
  readonly tiles: Readonly<Record<StageLogicalTileId, ResolvedStageTileVisual>>;
  readonly decorations: Readonly<Record<string, ResolvedStageDecorationVisual>>;
}
