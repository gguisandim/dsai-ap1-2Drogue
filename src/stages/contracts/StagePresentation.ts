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

export type StageEnemyArchetype =
  | 'affinity'
  | 'applaud'
  | 'fortitudo'
  | 'ranged'
  | 'boss'
  | 'miniboss';

export type StageAudioEvent = 'stage.entered' | 'npc.interacted' | 'enemy.defeated';

export type StageSoundWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

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

export interface ResolvedStageSprite {
  readonly id: string;
  readonly textureId: string;
  readonly textureKey: string;
  readonly animations: StageSpriteAnimations;
  readonly tint?: number;
  readonly scale: number;
  readonly depth: number;
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

export interface ResolvedStagePresentation {
  readonly themeId: string;
  readonly themeRevision: number;
  readonly tilesetId: string;
  readonly tilesetRevision: number;
  readonly tileSize: 32;
  readonly tiles: Readonly<Record<StageLogicalTileId, ResolvedStageTileVisual>>;
  readonly decorations: Readonly<Record<string, ResolvedStageDecorationVisual>>;
  readonly npcSprites: Readonly<Record<string, ResolvedStageSprite>>;
  readonly enemySprites: Readonly<Record<StageEnemyArchetype, ResolvedStageSprite>>;
  readonly audio?: ResolvedStageAudioProfile;
  readonly environment?: ResolvedStageEnvironment;
}
