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

export type StageVisualPerspective = 'top-down' | 'neutral' | 'side-view' | 'isometric';
export type StageVisualScaleClass = 'tile' | 'character' | 'prop' | 'oversized';

export interface StageVisualBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StageVisualAnchor {
  /** Normalized horizontal origin: 0 is left and 1 is right. */
  readonly x: number;
  /** Normalized vertical origin: 0 is top and 1 is bottom. */
  readonly y: number;
}

/** Inspection-only metadata. It never configures a Phaser physics body. */
export interface StageVisualCollisionMetadata {
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export type StageEnemyArchetype =
  | 'affinity'
  | 'applaud'
  | 'fortitudo'
  | 'ranged'
  | 'boss'
  | 'miniboss';

export type StageAudioEvent = 'stage.entered' | 'npc.interacted' | 'enemy.defeated';

export type StageSoundWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

export type StageEffectKind =
  | 'fireflies'
  | 'mist'
  | 'pulse'
  | 'spirits'
  | 'local-light'
  | 'water-shimmer'
  | 'foliage-sway';

/**
 * Declarative, visual-only effect. Coordinates and extents use logical tiles;
 * effects never create physics bodies or mutate the resolved level.
 */
export interface StageEffectDefinition {
  readonly id: string;
  readonly kind: StageEffectKind;
  readonly color: number;
  readonly alpha: number;
  readonly depth: number;
  readonly durationMs: number;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly count?: number;
  readonly radius?: number;
  readonly amplitude?: number;
}

export interface StageVisualTextureDefinition {
  readonly id: string;
  readonly textureKey: string;
  /** Optional spritesheet metadata used for validation and inspection. */
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
  /** Dimensions of the source image, distinct from an individual frame. */
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  /** Alpha-visible region inside one frame when it is known. */
  readonly visibleBounds?: StageVisualBounds;
  readonly pixelArt?: boolean;
  readonly perspective?: StageVisualPerspective;
  readonly originId?: string;
}

export interface StageTileVisualVariant {
  readonly textureId: string;
  readonly tint?: number;
  readonly alpha?: number;
  readonly frame?: number;
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
  readonly frame?: number;
  /** Theme-level tint applied before an optional placement tint. */
  readonly tint?: number;
  readonly anchor?: StageVisualAnchor;
  readonly scaleClass?: StageVisualScaleClass;
}

export interface StageVisualThemeDefinition {
  readonly id: string;
  readonly revision: number;
  readonly tilesetId: string;
  readonly decorationIds?: readonly string[];
  /** Maps a stable placement type to another registered decoration resource. */
  readonly decorationOverrides?: Readonly<Record<string, string>>;
}

export interface StageSpriteAnimations {
  readonly idle?: string;
  readonly walk?: string;
  readonly attack?: string;
  readonly hurt?: string;
}

export interface StageSpriteDefinition {
  readonly id: string;
  readonly textureId: string;
  readonly animations?: StageSpriteAnimations;
  readonly tint?: number;
  readonly scale?: number;
  readonly depth?: number;
  readonly frame?: number;
  readonly anchor?: StageVisualAnchor;
  readonly scaleClass?: StageVisualScaleClass;
  readonly collision?: StageVisualCollisionMetadata;
}

export interface StageSoundDefinition {
  readonly id: string;
  readonly kind: 'synth';
  readonly waveform: StageSoundWaveform;
  readonly frequency: number;
  readonly volume: number;
}

export interface StageAudioProfileDefinition {
  readonly id: string;
  readonly musicSoundId?: string;
  readonly ambientSoundId?: string;
  readonly eventSoundIds?: Readonly<Partial<Record<StageAudioEvent, string>>>;
  readonly masterVolume: number;
}

export interface StageFogDefinition {
  readonly color: number;
  readonly opacity: number;
  readonly depth: number;
}

export interface StageEnvironmentDefinition {
  readonly id: string;
  readonly ambientColor: number;
  readonly lightIntensity: number;
  readonly fog?: StageFogDefinition;
}

export interface ChapterVisualResources {
  readonly textures: readonly StageVisualTextureDefinition[];
  readonly tilesets: readonly StageTilesetDefinition[];
  readonly themes: readonly StageVisualThemeDefinition[];
  readonly decorations?: readonly StageDecorationVisualDefinition[];
  readonly sprites?: readonly StageSpriteDefinition[];
  readonly sounds?: readonly StageSoundDefinition[];
  readonly audioProfiles?: readonly StageAudioProfileDefinition[];
  readonly environments?: readonly StageEnvironmentDefinition[];
}

export interface StagePresentationDefinition {
  readonly themeId: string;
  readonly tilesetId?: string;
  readonly npcSprites?: Readonly<Record<string, string>>;
  readonly enemySprites?: Readonly<Partial<Record<StageEnemyArchetype, string>>>;
  readonly audioProfileId?: string;
  readonly environmentId?: string;
  readonly effects?: readonly StageEffectDefinition[];
}

export interface ResolvedStageTexture {
  readonly textureId: string;
  readonly textureKey: string;
  readonly tint?: number;
  readonly alpha?: number;
  readonly frame?: number;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly visibleBounds?: StageVisualBounds;
  readonly pixelArt?: boolean;
  readonly perspective?: StageVisualPerspective;
  readonly originId?: string;
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
  readonly tint?: number;
  readonly frame?: number;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly visibleBounds?: StageVisualBounds;
  readonly pixelArt?: boolean;
  readonly perspective?: StageVisualPerspective;
  readonly originId?: string;
  readonly anchor?: StageVisualAnchor;
  readonly scaleClass?: StageVisualScaleClass;
}

export interface ResolvedStageSprite {
  readonly id: string;
  readonly textureId: string;
  readonly textureKey: string;
  readonly animations: StageSpriteAnimations;
  readonly tint?: number;
  readonly scale: number;
  readonly depth: number;
  readonly frame?: number;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly visibleBounds?: StageVisualBounds;
  readonly pixelArt?: boolean;
  readonly perspective?: StageVisualPerspective;
  readonly originId?: string;
  readonly anchor?: StageVisualAnchor;
  readonly scaleClass?: StageVisualScaleClass;
  readonly collision?: StageVisualCollisionMetadata;
}

export interface ResolvedStageSound {
  readonly id: string;
  readonly kind: 'synth';
  readonly waveform: StageSoundWaveform;
  readonly frequency: number;
  readonly volume: number;
}

export interface ResolvedStageAudioProfile {
  readonly id: string;
  readonly music?: ResolvedStageSound;
  readonly ambient?: ResolvedStageSound;
  readonly eventSounds: Readonly<Partial<Record<StageAudioEvent, ResolvedStageSound>>>;
  readonly masterVolume: number;
}

export interface ResolvedStageEnvironment {
  readonly id: string;
  readonly ambientColor: number;
  readonly lightIntensity: number;
  readonly fog?: StageFogDefinition;
}

export interface ResolvedStageEffect extends StageEffectDefinition {}

export interface ResolvedStagePresentation {
  readonly themeId: string;
  readonly themeRevision: number;
  readonly tilesetId: string;
  readonly tilesetRevision: number;
  readonly tileSize: 32;
  readonly tiles: Readonly<Record<StageLogicalTileId, ResolvedStageTileVisual>>;
  readonly decorations: Readonly<Record<string, ResolvedStageDecorationVisual>>;
  readonly decorationOverrides?: Readonly<Record<string, string>>;
  readonly npcSprites: Readonly<Record<string, ResolvedStageSprite>>;
  readonly enemySprites: Readonly<Record<StageEnemyArchetype, ResolvedStageSprite>>;
  readonly audio?: ResolvedStageAudioProfile;
  readonly environment?: ResolvedStageEnvironment;
  readonly effects: readonly ResolvedStageEffect[];
}
