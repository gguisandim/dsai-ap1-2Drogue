// src/scenes/GameScene.ts
// Main gameplay scene: hand-crafted level rendering, combat, Witch Time FX,
// item pickups, Shop UI, Level Progression, and bullet projectile collisions.

import Phaser from 'phaser';
import { CombatProjectile, Player } from '../entities/Hero';
import { Summon, SummonConfig } from '../entities/Summon';
import { Enemy } from '../entities/Enemy';
import { BossEnemy } from '../entities/BossEnemy';
import { RangedEnemy } from '../entities/RangedEnemy';
import { Item } from '../entities/Item';
import { TextureGenerator } from '../utils/TextureGenerator';
import { LevelDefinition, EnemyPlacement } from '../data/LevelData';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import { ALL_LEVELS } from '../data/LevelData';
import { loadAppearance, loadSettings } from '../data/PlayerProfile';
import { getCharacterAnimationKey } from '../utils/CharacterTexture';
import { ShopUI } from '../ui/ShopUI';
import { SoundManager } from '../managers/SoundManager';
import { getPlayerClass } from '../data/ClassDatabase';
import { ComboManager } from '../managers/ComboManager';
import { GameSimulationBridge } from '../simulation';
import { PresetId, ProceduralLevelFactory } from '../procedural';
import { DamageType, GameCombatBridge } from '../combat';
import { NavigationService } from '../ai';
import { EnemyDefeatProgress, ProgressionService } from '../progression';
import { ENEMY_PRESENTATIONS } from '../data/EnemyPresentation';
import {
  BRANCHING_CAMPAIGN_DEFAULT_RUN_ID,
  BRANCHING_CAMPAIGN_DEFAULT_SEED,
  GameMacroCampaignAdapter,
  GameNarrativeSession,
  GameStageCompositionRoot,
  StageSignalAdapter,
  UMBRA_ROUTE_SLICE_RUN_ID,
  UMBRA_ROUTE_SLICE_SEED,
  campaignStageNarrativeSaveKey,
  createBrowserCampaignSaveStorage,
} from '../application/stages';
import type {
  CampaignNavigationView,
  GameCampaignNavigationPort,
  GameSceneStageResolution,
} from '../application/stages';
import type { LoadedStage } from '../stages';
import { DialogueOverlay } from '../ui/DialogueOverlay';
import {
  WorldInteractionPoint,
  poiInteractionPoints,
  resolveWorldInteraction,
} from '../application/interaction/WorldInteraction';
import { NarrativeRewardSettlementService } from '../application/rewards';

interface GameSceneInitData {
  skipControls?: boolean;
  proceduralSeed?: string | number;
  proceduralPresets?: PresetId[];
  levelIndex?: number;
  halos?: number;
  modularStageLoading?: boolean;
  modularRunId?: string;
  modularRunSeed?: string | number;
  branchingCampaign?: boolean;
  branchingRunId?: string;
  branchingRunSeed?: string | number;
  branchingRecoveryAttempt?: number;
  macroCampaign?: boolean;
  macroRunId?: string;
  macroRunSeed?: string | number;
  macroRecoveryAttempt?: number;
}

interface PendingExitTile {
  readonly x: number;
  readonly y: number;
  readonly physicalExitId?: string;
  readonly available?: boolean;
}

const DEFAULT_PROCEDURAL_RUN: readonly PresetId[] = [
  'cathedral-intro',
  'crypt-crawl',
  'ruined-city',
  'inferno-caverns',
  'clockwork-maze',
  'garden-labyrinth',
  'celestial-bridges',
  'colosseum-gauntlet',
  'void-fracture',
];

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private wallTiles!: Phaser.Physics.Arcade.StaticGroup;
  private stairTiles!: Phaser.Physics.Arcade.StaticGroup;
  private pendingExitTiles: PendingExitTile[] = [];
  private exitsRevealed = false;

  // Floor tile images (so we can destroy them on level transition)
  private floorImages: Phaser.GameObjects.Image[] = [];

  private allLevels: LevelDefinition[] = [...VERSE_SECTIONS, ...ALL_LEVELS];
  private currentLevelIndex: number = 0;
  private currentLevel: LevelDefinition = VERSE_SECTIONS[0];
  private foundKeys = new Set<string>();
  private isTransitioning: boolean = false;

  private shopUI!: ShopUI;
  private summons: Summon[] = [];
  private waves: { enemies: EnemyPlacement[] }[] = [];
  private currentWaveIndex = 0;
  private waveDelayTimer = 0;
  private waveTransition = false;
  private doorSealNotice = 0;
  private keyShop?: Phaser.Input.Keyboard.Key;
  private keyMenu?: Phaser.Input.Keyboard.Key;
  private keyInteract?: Phaser.Input.Keyboard.Key;
  private keyChoiceUp?: Phaser.Input.Keyboard.Key;
  private keyChoiceDown?: Phaser.Input.Keyboard.Key;

  // HUD & UI Elements
  private hpHudText!: Phaser.GameObjects.Text;
  private magicHudText!: Phaser.GameObjects.Text;
  private haloHudText!: Phaser.GameObjects.Text;
  private progressionHudText!: Phaser.GameObjects.Text;
  private weaponHudText!: Phaser.GameObjects.Text;
  private comboHudText!: Phaser.GameObjects.Text;
  private comboManager!: ComboManager;
  private levelTitleText!: Phaser.GameObjects.Text;
  private levelBannerText!: Phaser.GameObjects.Text;
  private witchTimeOverlay!: Phaser.GameObjects.Rectangle;
  private aimReticle!: Phaser.GameObjects.Arc;
  private arrowChargeBar!: Phaser.GameObjects.Graphics;
  private objectiveText!: Phaser.GameObjects.Text;

  private levelClearedBannerShowing: boolean = false;
  private controlsGuideOpen: boolean = false;
  private skipControlsGuide: boolean = false;

  // Damage cooldown to prevent instant-kill overlap spam
  private playerDamageCooldown: number = 0;
  private lastHandledMeleeAttack: number = 0;
  private lastHandledDodgeAttack: number = 0;
  private dodgeHitTargets = new Set<Enemy>();
  private simulationBridge!: GameSimulationBridge;
  private combatBridge!: GameCombatBridge;
  private navigation!: NavigationService;
  private progression!: ProgressionService;
  private proceduralSeed?: string | number;
  private proceduralPresets?: PresetId[];
  private startingHalos = 5000;
  private modularStageLoading = false;
  private modularRunId = 'legacy.verse.default-run';
  private modularRunSeed: string | number = 'legacy.verse.default-seed';
  private modularPersistenceEnabled = false;
  private modularStageSource: GameSceneStageResolution['source'] = 'legacy';
  private modularComposition?: GameStageCompositionRoot;
  private modularLoadedStage?: LoadedStage;
  private modularNarrativeSession?: GameNarrativeSession;
  private stageSignalAdapter?: StageSignalAdapter;
  private narrativeRewardSettlement?: NarrativeRewardSettlementService;
  private branchingCampaign = false;
  private branchingRunId = BRANCHING_CAMPAIGN_DEFAULT_RUN_ID;
  private branchingRunSeed: string | number = BRANCHING_CAMPAIGN_DEFAULT_SEED;
  private branchingStageSource: 'legacy' | 'campaign' | 'rollback' = 'legacy';
  private macroCampaign = false;
  private macroRunId = UMBRA_ROUTE_SLICE_RUN_ID;
  private macroRunSeed: string | number = UMBRA_ROUTE_SLICE_SEED;
  private macroStageSource: 'legacy' | 'campaign' | 'rollback' = 'legacy';
  private macroCampaignAdapter?: GameMacroCampaignAdapter;
  private campaignRouter?: GameCampaignNavigationPort;
  private campaignNavigation?: CampaignNavigationView;
  private campaignPersistenceUncertain = false;
  private campaignRecoveryAttempt = 0;
  private macroLoadedStage?: LoadedStage;
  private stageNarrativeStage?: LoadedStage;
  private interactionPoints: WorldInteractionPoint[] = [];
  private poiMarkers: Phaser.GameObjects.Image[] = [];
  private dialogueOverlay?: DialogueOverlay;
  private dialogueOpen = false;
  private narrativeReady = false;
  private interactionPromptText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  public init(data?: GameSceneInitData): void {
    // Phaser keeps the Scene instance on restart, so explicitly reset every
    // run-scoped guard that could otherwise leave update() permanently locked.
    this.configureLevelRun(data);
    this.currentLevelIndex = Phaser.Math.Clamp(data?.levelIndex ?? 0, 0, this.allLevels.length - 1);
    this.currentLevel = this.allLevels[this.currentLevelIndex];
    this.modularStageLoading = data?.modularStageLoading === true;
    this.modularRunId = data?.modularRunId?.trim() || 'legacy.verse.default-run';
    this.modularRunSeed = data?.modularRunSeed ?? 'legacy.verse.default-seed';
    this.modularPersistenceEnabled = Boolean(data?.modularRunId?.trim());
    const query = typeof window === 'undefined' ? undefined : new URLSearchParams(window.location.search);
    this.macroCampaign = data?.macroCampaign === true || query?.get('macroCampaign') === '1';
    this.macroRunId = data?.macroRunId?.trim() ||
      query?.get('macroRun')?.trim() || UMBRA_ROUTE_SLICE_RUN_ID;
    this.macroRunSeed = data?.macroRunSeed ?? query?.get('macroSeed') ?? UMBRA_ROUTE_SLICE_SEED;
    this.branchingCampaign = !this.macroCampaign &&
      (data?.branchingCampaign === true || query?.get('branchingCampaign') === '1');
    this.branchingRunId = data?.branchingRunId?.trim() ||
      query?.get('branchingRun')?.trim() || BRANCHING_CAMPAIGN_DEFAULT_RUN_ID;
    this.branchingRunSeed = data?.branchingRunSeed ??
      query?.get('branchingSeed') ?? BRANCHING_CAMPAIGN_DEFAULT_SEED;
    this.campaignRecoveryAttempt = Math.max(0, Math.floor(
      this.macroCampaign ? data?.macroRecoveryAttempt ?? 0 : data?.branchingRecoveryAttempt ?? 0,
    ));
    this.modularStageSource = 'legacy';
    this.modularComposition = undefined;
    this.modularLoadedStage = undefined;
    this.modularNarrativeSession = undefined;
    this.stageSignalAdapter = undefined;
    this.macroCampaignAdapter = undefined;
    this.macroLoadedStage = undefined;
    if (this.macroCampaign) this.configureMacroCampaign();
    else this.configureBranchingCampaign();
    if (!this.macroCampaign && !this.branchingCampaign) this.configureModularStage();
    this.startingHalos = Math.max(0, Math.floor(data?.halos ?? 5000));
    this.isTransitioning = false;
    this.levelClearedBannerShowing = false;
    this.controlsGuideOpen = false;
    this.playerDamageCooldown = 0;
    this.lastHandledMeleeAttack = 0;
    this.lastHandledDodgeAttack = 0;
    this.dodgeHitTargets.clear();
    this.floorImages = [];
    this.pendingExitTiles = [];
    this.exitsRevealed = false;
    this.skipControlsGuide = data?.skipControls ?? false;
    this.stageNarrativeStage = undefined;
    this.interactionPoints = [];
    this.poiMarkers = [];
    this.dialogueOverlay = undefined;
    this.dialogueOpen = false;
    this.narrativeReady = false;
  }

  private configureMacroCampaign(): void {
    this.macroStageSource = 'legacy';
    this.branchingStageSource = 'legacy';
    this.campaignRouter = undefined;
    this.campaignNavigation = undefined;
    this.campaignPersistenceUncertain = false;
    if (!this.macroCampaign || this.proceduralSeed !== undefined) return;

    const composition = new GameStageCompositionRoot({
      campaignStorage: createBrowserCampaignSaveStorage(),
    });
    const created = composition.createMacroCampaign({
      runId: this.macroRunId,
      runSeed: this.macroRunSeed,
    });
    if (!created.ok) {
      this.macroStageSource = 'rollback';
      return;
    }
    const inspected = created.value.adapter.inspect();
    if (!inspected.ok) {
      this.macroStageSource = 'rollback';
      return;
    }
    const stageId = inspected.value.currentNode.stageId;
    this.allLevels = [...this.allLevels];
    let levelIndex = this.allLevels.findIndex(level => level.id === stageId);
    if (levelIndex < 0) {
      levelIndex = this.allLevels.length;
      this.allLevels.push(inspected.value.loadedStage.level);
    }
    this.currentLevelIndex = levelIndex;
    this.allLevels[levelIndex] = inspected.value.loadedStage.level;
    this.currentLevel = inspected.value.loadedStage.level;
    this.macroCampaignAdapter = created.value.adapter;
    this.campaignRouter = created.value.adapter;
    this.campaignNavigation = inspected.value;
    this.macroLoadedStage = inspected.value.loadedStage;
    this.modularComposition = composition;
    this.macroStageSource = 'campaign';
  }

  private configureBranchingCampaign(): void {
    this.branchingStageSource = 'legacy';
    this.campaignRouter = undefined;
    this.campaignNavigation = undefined;
    this.macroCampaignAdapter = undefined;
    this.campaignPersistenceUncertain = false;
    if (!this.branchingCampaign || this.proceduralSeed !== undefined) return;

    const composition = new GameStageCompositionRoot({
      campaignStorage: createBrowserCampaignSaveStorage(),
    });
    const created = composition.createBranchingCampaign({
      runId: this.branchingRunId,
      runSeed: this.branchingRunSeed,
    });
    if (!created.ok) {
      this.branchingStageSource = 'rollback';
      return;
    }
    const stageId = created.value.initialNavigation.currentNode.stageId;
    const levelIndex = this.allLevels.findIndex(level => level.id === stageId);
    if (levelIndex < 0) {
      this.branchingStageSource = 'rollback';
      return;
    }
    this.allLevels = [...this.allLevels];
    this.currentLevelIndex = levelIndex;
    this.allLevels[levelIndex] = created.value.initialNavigation.loadedStage.level;
    this.currentLevel = created.value.initialNavigation.loadedStage.level;
    this.campaignRouter = created.value.router;
    this.campaignNavigation = created.value.initialNavigation;
    this.branchingStageSource = 'campaign';
  }

  private configureLevelRun(data?: GameSceneInitData): void {
    const query = typeof window === 'undefined' ? undefined : new URLSearchParams(window.location.search);
    const querySeed = query?.get('procedural');
    const requestedSeed = data?.proceduralSeed ?? (querySeed && querySeed !== '0' ? querySeed : undefined);
    if (requestedSeed === undefined) {
      this.proceduralSeed = undefined;
      this.proceduralPresets = undefined;
      this.allLevels = VERSE_SECTIONS;
      return;
    }
    const presets = data?.proceduralPresets?.length ? data.proceduralPresets : [...DEFAULT_PROCEDURAL_RUN];
    this.proceduralSeed = requestedSeed;
    this.proceduralPresets = [...presets];
    this.allLevels = new ProceduralLevelFactory().createRun(requestedSeed, presets);
  }

  private configureModularStage(): void {
    this.modularStageSource = 'legacy';
    this.modularComposition = undefined;
    this.modularLoadedStage = undefined;
    this.modularNarrativeSession = undefined;
    this.stageSignalAdapter = undefined;
    if (!this.modularStageLoading || this.proceduralSeed !== undefined ||
      this.currentLevel.id !== 'verse_01_atrium') return;

    const campaignStorage = this.modularPersistenceEnabled
      ? createBrowserCampaignSaveStorage()
      : undefined;
    const composition = new GameStageCompositionRoot({ campaignStorage });
    const resolution = composition.resolveStage({
      enabled: true,
      legacyLevel: this.currentLevel,
      runId: this.modularRunId,
      runSeed: this.modularRunSeed,
    });
    this.modularStageSource = resolution.source;
    if (resolution.source !== 'modular') return;

    this.allLevels = [...this.allLevels];
    this.allLevels[this.currentLevelIndex] = resolution.level;
    this.currentLevel = resolution.level;
    this.modularComposition = composition;
    this.modularLoadedStage = resolution.loadedStage;
  }

  public create(): void {
    this.physics.world.resume();
    // 1. Generate all vector textures
    TextureGenerator.generateAllTextures(this);

    // 2. Create physics groups
    this.wallTiles = this.physics.add.staticGroup();
    this.stairTiles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.items = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    // 3. Build level map
    this.currentLevel = this.allLevels[this.currentLevelIndex];
    this.buildMapFromDefinition(this.currentLevel);
    this.queueCampaignExitTiles();
    this.navigation = new NavigationService(this.currentLevel.tileMap, { tileSize: 32 });
    this.progression = new ProgressionService();
    this.narrativeReady = true;
    this.initializeModularNarrative();

    // 4. Create Player
    const spawn = this.findSpawnPoint(this.currentLevel);
    const appearance = loadAppearance();
    const heroClass = getPlayerClass(appearance.classId);
    this.player = new Player(this, spawn.x, spawn.y, getCharacterAnimationKey(appearance), heroClass);
    this.player.halos = this.startingHalos;
    this.player.bulletGroup = this.bullets;
    this.simulationBridge = new GameSimulationBridge({
      classId: appearance.classId,
      section: this.currentLevel.name,
    });
    this.combatBridge = new GameCombatBridge({
      classDefinition: heroClass,
      seed: `${this.currentLevel.id}:${appearance.classId}`,
    });
    this.simulationBridge.synchronizePlayer({
      x: this.player.x,
      y: this.player.y,
      health: this.player.hp,
      maximumHealth: this.player.maxHp,
      mana: this.player.magic,
      maximumMana: this.player.maxMagic,
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.simulationBridge.dispose();
      this.combatBridge.dispose();
    });
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    const worldWidth = this.currentLevel.tileMap[0].length * 32;
    const worldHeight = this.currentLevel.tileMap.length * 32;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // 5. Spawn enemies and items. The macro hub is a safe navigation space.
    this.prepareCurrentStageEncounter();

    // 6. Setup all colliders
    this.setupColliders();

    // 7. Witch Time FX Overlay
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.witchTimeOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x110033, 0.4);
    this.witchTimeOverlay.setScrollFactor(0);
    this.witchTimeOverlay.setDepth(900);
    this.witchTimeOverlay.setVisible(false);

    // 8. Key bindings
    this.shopUI = new ShopUI(this, this.player);
    if (this.input && this.input.keyboard) {
      this.keyShop = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.keyMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyInteract = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyChoiceUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keyChoiceDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    }

    // 9. HUD & Chapter Title
    this.createHUD();
    this.setupStageInteractions();
    this.settleNarrativeRewards();
    this.recoverPendingCampaignRewards();
    this.comboManager = new ComboManager(this, this.comboHudText, () => this.player.extendComboWindow());
    this.startCurrentStageEncounter();
    this.events.off('enemyDropHalo');
    this.events.on('enemyDropHalo', (x: number, y: number, occurrenceId?: string) => {
      const halo = new Item(this, x, y, 'item_halo', 'item_halo');
      if (occurrenceId) halo.setData('narrativeItemId', occurrenceId);
      this.items.add(halo);
    });
    this.events.off('enemyDropHeart');
    this.events.on('enemyDropHeart', (x: number, y: number, occurrenceId?: string) => {
      const heart = new Item(this, x, y, 'item_potion', 'item_heart');
      if (occurrenceId) heart.setData('narrativeItemId', occurrenceId);
      heart.setDepth(9);
      this.items.add(heart);
      this.tweens.add({
        targets: heart,
        y: y - 6,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
    this.events.off('enemyDefeated');
    this.events.on('enemyDefeated', (defeat: EnemyDefeatProgress & {
      enemyId?: string;
      archetype?: string;
    }) => this.handleEnemyDefeated(defeat));
    this.events.off('enemyMeleeStrike');
    this.events.off('playerSummon');
    this.events.off('enemyShockwave');
    this.events.off('summonNova');
    this.events.on('summonNova', (x: number, y: number, dmg: number, radius: number) => {
      this.enemies.getChildren().forEach(e => {
        const enemy = e as Enemy;
        if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < radius) {
          enemy.takeDamage(this.calculatePlayerDamage(dmg));
          this.comboManager.registerHit();
        }
      });
    });
    this.events.on('enemyMeleeStrike', (dmg: number) => {
      if (this.playerDamageCooldown <= 0 || this.player.isDodging) this.damagePlayer(dmg);
    });
    this.events.on('playerSummon', (x: number, y: number, classId: string, variant?: string) => this.spawnSummon(x, y, classId, variant));
    this.events.on('enemyShockwave', (x: number, y: number, dmg: number) => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 95) {
        this.damagePlayer(dmg);
      }
    });
    this.showChapterTitle(this.currentRegionName());
    this.reportNarrativeSignal(this.modularNarrativeSession?.enterStage());
    this.createAimReticle();
    this.arrowChargeBar = this.add.graphics().setDepth(30).setVisible(false);
    if (loadSettings().showControls && !this.skipControlsGuide) this.showControlsGuide();
  }

  private initializeModularNarrative(): void {
    this.modularNarrativeSession = undefined;
    this.stageSignalAdapter = undefined;
    this.narrativeRewardSettlement = undefined;
    this.dialogueOverlay?.destroy();
    this.dialogueOverlay = undefined;
    this.stageNarrativeStage = undefined;
    const loaded = this.modularLoadedStage ?? this.macroLoadedStage;
    if (!this.modularComposition || !loaded) return;
    const isMacro = !this.modularLoadedStage && this.macroLoadedStage !== undefined;
    const progression = this.progression.snapshot();
    const storageKey = isMacro
      ? campaignStageNarrativeSaveKey(String(this.macroRunId), loaded.manifest.chapterId, loaded.manifest.id)
      : undefined;
    const created = this.modularComposition.createNarrativeSession(
      loaded,
      isMacro
        ? {
            campaignId: this.macroCampaignAdapter?.campaignId() ?? 'campaign.umbra-trail.independent-routes',
            runId: this.macroRunId,
            runSeed: this.macroRunSeed,
            stageInstanceId: this.campaignNavigation?.currentNode.id,
          }
        : {
            campaignId: 'legacy.verse',
            runId: this.modularRunId,
            runSeed: this.modularRunSeed,
          },
      {
        level: progression.level,
        unlockedContent: progression.unlockedContent,
      },
      storageKey,
    );
    this.stageNarrativeStage = loaded;
    if (!created.ok) return;
    this.modularNarrativeSession = created.session;
    this.stageSignalAdapter = new StageSignalAdapter(created.session);
    this.narrativeRewardSettlement = new NarrativeRewardSettlementService(
      created.session,
      this.progression,
    );
    const names = new Map(loaded.npcs.map(npc => [npc.id, npc.displayName]));
    this.dialogueOverlay = new DialogueOverlay(
      this,
      created.session,
      speakerId => speakerId === 'player'
        ? 'Você'
        : speakerId === 'narrator'
          ? 'Narrador'
          : names.get(speakerId) ?? speakerId,
      {
        onOpen: () => {
          this.dialogueOpen = true;
          this.player?.setVelocity?.(0, 0);
          if (this.player) this.player.combatInputEnabled = false;
          this.physics.world.pause();
          this.simulationBridge?.setPaused?.(true);
        },
        onClose: () => {
          this.dialogueOpen = false;
          if (this.player) this.player.combatInputEnabled = true;
          this.physics.world.resume();
          this.simulationBridge?.setPaused?.(false);
        },
        onNarrativeCommitted: () => this.settleNarrativeRewards(),
      },
    );
  }

  /** Rebuilds POI markers and the interaction points for the current stage. */
  private setupStageInteractions(): void {
    this.poiMarkers.forEach(marker => marker.destroy());
    this.poiMarkers = [];
    this.interactionPoints = [];
    const loaded = this.stageNarrativeStage;
    if (!this.modularNarrativeSession || !loaded) return;
    if (!this.textures.exists('poi_vestige')) {
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0x0b2a24, 1);
      graphics.fillCircle(12, 12, 11);
      graphics.lineStyle(2, 0x8fe0c8, 1);
      graphics.strokeCircle(12, 12, 10);
      graphics.fillStyle(0x8fe0c8, 1);
      graphics.fillCircle(12, 12, 4);
      graphics.generateTexture('poi_vestige', 24, 24);
      graphics.destroy();
    }
    const points = poiInteractionPoints(loaded.npcs);
    this.interactionPoints.push(...points);
    for (const point of points) {
      const marker = this.add.image(point.x, point.y - 10, 'poi_vestige').setDepth(6).setAlpha(0.95);
      this.tweens.add({
        targets: marker,
        y: point.y - 16,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.poiMarkers.push(marker);
    }
    this.pendingExitTiles.forEach(tile => {
      if (!tile.physicalExitId) return;
      this.interactionPoints.push(Object.freeze({
        kind: 'exit' as const,
        id: tile.physicalExitId,
        x: tile.x,
        y: tile.y,
        label: 'Saída',
        physicalExitId: tile.physicalExitId,
        available: tile.available !== false,
      }));
    });
  }

  /** Shows the prompt for the nearest interaction and handles POI `E` presses. */
  private updateWorldInteraction(): void {
    if (!this.interactionPromptText) return;
    if (!this.modularNarrativeSession || this.interactionPoints.length === 0) {
      this.interactionPromptText.setVisible(false);
      return;
    }
    const resolution = resolveWorldInteraction(
      this.interactionPoints,
      { x: this.player.x, y: this.player.y },
    );
    const poi = resolution && resolution.action === 'dialogue' ? resolution : undefined;
    this.interactionPromptText.setVisible(Boolean(poi));
    if (poi) this.interactionPromptText.setText(`E — ${poi.point.label}`);
    if (!poi || !poi.dialogueId) return;
    if (this.keyInteract && Phaser.Input.Keyboard.JustDown(this.keyInteract)) {
      this.modularNarrativeSession.interactNpc(poi.point.id);
      this.dialogueOverlay?.openDialogue(poi.dialogueId);
    }
  }

  private handleEnemyDefeated(defeat: EnemyDefeatProgress & {
    enemyId?: string;
    archetype?: string;
  }): void {
    const update = this.progression.recordEnemyDefeat(defeat);
    this.player.addHalos(update.currencyAwarded);
    if (update.levelsGained > 0) {
      this.levelBannerText.setText('NÍVEL ' + update.currentLevel + '!  +' + update.skillPointsAwarded + ' PONTO DE HABILIDADE');
      this.levelBannerText.setVisible(true);
      this.time.delayedCall(1500, () => {
        if (!this.levelClearedBannerShowing) this.levelBannerText.setVisible(false);
      });
    }
    if (defeat.enemyId && defeat.archetype) {
      this.reportNarrativeSignal(this.stageSignalAdapter?.dispatch({
        type: 'enemy.defeated',
        occurrenceId: defeat.enemyId,
        enemyId: defeat.enemyId,
        archetype: defeat.archetype,
      }));
    }
  }

  private collectItem(itm: Item): void {
    if (!itm.active) return;
    const occurrenceId = (itm.getData('narrativeItemId') as string | undefined) ??
      `${this.narrativeOccurrenceScope()}.item.runtime.${itm.itemType}.${Math.floor(itm.x / 32)}-${Math.floor(itm.y / 32)}`;
    this.simulationBridge.recordItem(itm.itemType);
    this.progression.recordItemCollected(itm.itemType);
    if (itm.itemType === 'item_halo') {
      this.player.addHalos(100);
    } else if (itm.itemType === 'item_potion') {
      this.player.heal(20);
    } else if (itm.itemType === 'item_magic') {
      this.player.addMagic(25);
    } else if (itm.itemType === 'item_key') {
      const keyId = `${this.itemIdentityScope()}:${Math.floor(itm.x / 32)},${Math.floor(itm.y / 32)}`;
      this.foundKeys.add(keyId);
      this.levelBannerText.setText('EMBOSCADA! Defenda-se!');
      this.levelBannerText.setVisible(true);
      this.time.delayedCall(1200, () => this.levelBannerText.setVisible(false));
      (this.currentLevel.ambush ?? []).forEach((enemy, index) => this.spawnSingleEnemy(
        enemy,
        `${occurrenceId}.ambush.enemy.${index}`,
      ));
    }
    itm.destroy();
    this.reportNarrativeSignal(this.stageSignalAdapter?.dispatch({
      type: 'item.collected',
      occurrenceId,
      itemId: occurrenceId,
      itemType: itm.itemType,
    }));
  }

  private reportNarrativeSignal(
    result: ReturnType<StageSignalAdapter['dispatch']> |
      ReturnType<GameNarrativeSession['enterStage']> | undefined,
  ): boolean {
    if (!result) return true;
    if (result.ok) return this.settleNarrativeRewards();
    this.showCampaignTransitionFailure(`PROGRESSO NARRATIVO NÃO SALVO: ${result.error.code}`);
    return false;
  }

  private settleNarrativeRewards(): boolean {
    const settlement = this.narrativeRewardSettlement?.settlePending();
    if (!settlement) return true;
    if (!settlement.ok) {
      this.showCampaignTransitionFailure(
        `RECOMPENSA NARRATIVA PENDENTE: ${settlement.error.code}`,
      );
      return false;
    }
    if (settlement.settlements.length === 0 || !this.levelBannerText) return true;
    const currency = settlement.settlements.reduce((total, item) =>
      total + (item.reward.type === 'progression.currency' ? item.reward.amount : 0), 0);
    const unlocks = settlement.settlements.filter(item =>
      item.reward.type === 'progression.unlock').length;
    const details = [
      currency > 0 ? `+${currency} MOEDA` : '',
      unlocks > 0 ? `${unlocks} DESBLOQUEIO${unlocks > 1 ? 'S' : ''}` : '',
    ].filter(Boolean).join('  •  ');
    this.levelBannerText.setText(`RECOMPENSA CONFIRMADA${details ? `\n${details}` : ''}`);
    this.levelBannerText.setVisible(true);
    this.time.delayedCall(1600, () => {
      if (!this.levelClearedBannerShowing) this.levelBannerText.setVisible(false);
    });
    return true;
  }

  private requestNarrativeExit(exitId: string, occurrenceId: string): boolean {
    const result = this.stageSignalAdapter
      ? this.stageSignalAdapter.dispatch({
          type: 'stage.exit.requested',
          occurrenceId,
          exitId,
        })
      : this.modularNarrativeSession?.requestExit(exitId);
    return this.reportNarrativeSignal(result);
  }

  private setupColliders(): void {
    // Player vs Walls
    this.physics.add.collider(this.player, this.wallTiles);
    // Enemies vs Walls
    this.physics.add.collider(this.enemies, this.wallTiles);

    // Player vs Enemy: dodging through an enemy damages it (Witch Arts).
    // Contact itself deals NO damage — players are only hurt by telegraphed
    // attacks (lunge, shockwave, bullets), so camping inside an enemy is safe.
    this.physics.add.overlap(this.player, this.enemies, (_playerObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (this.player.isDodging) {
        if (this.player.dodgeAttackId !== this.lastHandledDodgeAttack) {
          this.lastHandledDodgeAttack = this.player.dodgeAttackId;
          this.dodgeHitTargets.clear();
        }
        if (!this.dodgeHitTargets.has(enemy)) {
          this.dodgeHitTargets.add(enemy);
          enemy.takeDamage(this.calculatePlayerDamage(this.player.getDodgeDamage(), 'shadow'));
          this.comboManager.registerHit();
        }
        return;
      }
      // No contact damage — enemies can overlap the player freely without hurting them.
    });

    // Player vs Item Pickups
    this.physics.add.overlap(this.player, this.items, (_playerObj, itemObj) => {
      this.collectItem(itemObj as Item);
    });

    // Player vs Section Doors → travel between sections
    this.physics.add.overlap(this.player, this.stairTiles, (_playerObj, doorObj) => {
      if (this.isTransitioning) return;
      // Doors are sealed while a wave is active — finish the fight first
      if (this.enemies.countActive(true) > 0 || this.waveTransition) {
        if (!this.doorSealNotice || this.time.now - this.doorSealNotice > 2000) {
          this.doorSealNotice = this.time.now;
          this.levelBannerText.setText('PORTAS SELADAS! Termine o combate.');
          this.levelBannerText.setVisible(true);
          this.time.delayedCall(1200, () => this.levelBannerText.setVisible(false));
        }
        return;
      }
      // Stairs/doors act as the level portal — only open once the section is cleared
      const wavesCleared = this.currentWaveIndex >= this.waves.length - 1 && this.enemies.countActive(true) === 0 && !this.waveTransition;
      if (!wavesCleared) {
        if (!this.doorSealNotice || this.time.now - this.doorSealNotice > 2000) {
          this.doorSealNotice = this.time.now;
          this.levelBannerText.setText('PORTAL BLOQUEADO! Elimine a horda.');
          this.levelBannerText.setVisible(true);
          this.time.delayedCall(1200, () => this.levelBannerText.setVisible(false));
        }
        return;
      }
      if (this.campaignRouter) {
        const door = doorObj as Phaser.Physics.Arcade.Sprite;
        const physicalExitId = door.getData('physicalExitId') as string | undefined;
        this.handleCampaignExitProximity(
          physicalExitId,
          door.getData('available') !== false,
          Boolean(this.keyInteract && Phaser.Input.Keyboard.JustDown(this.keyInteract)),
        );
        return;
      }
      this.advanceToNextLevel();
    });

    // Bullets vs Enemies → ranged damage
    this.physics.add.overlap(this.bullets, this.enemies, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      const combatBullet = bullet as CombatProjectile;
      if (combatBullet.hitTargets?.has(enemy)) return;
      combatBullet.hitTargets?.add(enemy);
      const dmg = this.calculatePlayerDamage(combatBullet.bulletDamage || 15);
      enemy.takeDamage(dmg);
      this.comboManager.registerHit();
      if (combatBullet.piercingHits && combatBullet.piercingHits > 1) {
        combatBullet.piercingHits--;
      } else {
        bullet.destroy();
      }
    });

    // Bullets vs Walls → destroy on impact
    this.physics.add.collider(this.bullets, this.wallTiles, (bulletObj) => {
      (bulletObj as Phaser.Physics.Arcade.Sprite).destroy();
    });

    this.physics.add.overlap(this.player, this.enemyBullets, (_playerObj, bulletObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite & { bulletDamage?: number };
      if (this.playerDamageCooldown <= 0) {
        this.damagePlayer(bullet.bulletDamage ?? 10);
      }
      bullet.destroy();
    });

    this.physics.add.collider(this.enemyBullets, this.wallTiles, (bulletObj) => {
      (bulletObj as Phaser.Physics.Arcade.Sprite).destroy();
    });
  }

  private spawnSummon(x: number, y: number, classId: string, variant?: string): void {
    const configs: Record<string, SummonConfig> = {
      // One single big extending sword wave per summon — re-do PPK for another
      knight: { tint: 0xf5cf5b, damage: 40, attackCooldown: 900, duration: 1100, projectileTexture: 'proj_sword_wave', volleySize: 1, spread: 0, projectileScale: 2.4, piercing: 4 },
      // Single nova per summon, like the knight's sword wave
      mage: { tint: 0x62e1ff, damage: 24, attackCooldown: 900, duration: 700, projectileTexture: 'proj_magic_bolt', volleySize: 0, spread: 0, aoeRadius: 95, aoeDamage: 24 },
      // Volley of many arrows in a wide fan
      ranger: { tint: 0xc8e66b, damage: 12, attackCooldown: 650, duration: 6500, projectileTexture: 'proj_ranger_arrow', volleySize: 5, spread: 0.13, projectileScale: 0.85, piercing: 2 },
      // Shadow clone: short-lived, strikes twice with fast daggers
      rogue: { tint: 0xe84f75, damage: 16, attackCooldown: 420, duration: 700, projectileTexture: 'proj_rogue_dagger', volleySize: 2, spread: 0.2, projectileScale: 1.1 },
    };
    const config = { ...(configs[classId] ?? configs.knight) };
    // 'empowered' (PPPP) makes a stronger, bigger, longer summon
    if (variant === 'empowered') {
      config.damage = Math.round(config.damage * 1.7);
      config.aoeDamage = config.aoeDamage ? Math.round(config.aoeDamage * 1.7) : undefined;
      config.projectileScale = (config.projectileScale ?? 1) * 1.3;
      config.duration = Math.round(config.duration * 1.5);
      config.tint = 0xffffff;
    }
    // Only one summon at a time — a new finisher replaces the old one
    this.summons.forEach(s => s.destroy());
    this.summons = [];
    this.summons.push(new Summon(this, x, y, config, this.bullets));
  }

  private damagePlayer(amount: number): void {
    const healthBeforeDamage = this.player.hp;
    this.player.takeDamage(amount);
    const appliedDamage = Math.max(0, healthBeforeDamage - this.player.hp);
    if (appliedDamage > 0) {
      this.simulationBridge.recordDamage(appliedDamage);
      this.progression.recordDamageTaken(appliedDamage);
    }
    this.playerDamageCooldown = 500;
    if (this.player.hp <= 0 && !this.isTransitioning) {
      this.isTransitioning = true;
      this.player.setVelocity(0, 0);
      this.player.setActive(false);
      this.levelBannerText.setText('GAME OVER');
      this.levelBannerText.setVisible(true);
      this.modularNarrativeSession?.save();
      this.time.delayedCall(1500, () => this.scene.restart({
        skipControls: true,
        levelIndex: this.currentLevelIndex,
        halos: this.player.halos,
        proceduralSeed: this.proceduralSeed,
        proceduralPresets: this.proceduralPresets,
        ...(this.modularStageLoading ? {
          modularStageLoading: true,
          modularRunSeed: this.modularRunSeed,
          ...(this.modularPersistenceEnabled ? { modularRunId: this.modularRunId } : {}),
        } : {}),
        ...(this.branchingCampaign ? {
          branchingCampaign: true,
          branchingRunId: this.branchingRunId,
          branchingRunSeed: this.branchingRunSeed,
        } : {}),
        ...(this.macroCampaign && this.macroStageSource === 'campaign' ? {
          macroCampaign: true,
          macroRunId: this.macroRunId,
          macroRunSeed: this.macroRunSeed,
        } : {}),
      }));
    }
  }

  private calculatePlayerDamage(baseAmount: number, forcedType?: DamageType): number {
    const classId = this.player.heroClass.id;
    const damageType: DamageType = forcedType ?? (
      classId === 'mage' ? 'arcane' : classId === 'rogue' ? 'shadow' : 'physical'
    );
    const progressionMultiplier = this.progression.snapshot().modifiers.damageMultiplier;
    const damage = this.combatBridge.calculatePlayerDamage(
      baseAmount * progressionMultiplier,
      damageType,
      this.comboManager.getDamageMultiplier(),
    );
    this.progression.recordDamageDealt(damage);
    return damage;
  }

  /** Find tile value 8 (spawn point) in the level map */
  private findSpawnPoint(level: LevelDefinition): { x: number; y: number } {
    const map = level.tileMap;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        if (map[r][c] === 8) {
          return { x: c * 32 + 16, y: r * 32 + 16 };
        }
      }
    }
    return { x: 120, y: 120 }; // fallback
  }

  private buildMapFromDefinition(level: LevelDefinition): void {
    const map = level.tileMap;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const tileVal = map[r][c];
        const posX = c * 32 + 16;
        const posY = r * 32 + 16;

        // Base Floor
        const floorImg = this.add.image(posX, posY, 'tile_floor');
        this.floorImages.push(floorImg);

        if (tileVal === 1) {
          this.wallTiles.create(posX, posY, 'tile_wall');
        } else if (tileVal === 2) {
          this.wallTiles.create(posX, posY, 'tile_pillar');
        } else if (tileVal === 3) {
          // Water/pits already use non-walkable navigation semantics. Reuse the
          // existing water tile in the collision group so authored wetlands
          // have the same physical boundary for players and enemies.
          this.wallTiles.create(posX, posY, 'tile_water');
        } else if (tileVal === 4) {
          const lava = this.add.image(posX, posY, 'tile_lava');
          this.floorImages.push(lava);
        } else if (tileVal === 5 && !this.campaignRouter) {
          // The tunnel is intentionally absent until the final enemy dies.
          // Store its position without creating a visible/interactive sprite.
          this.pendingExitTiles.push({ x: posX, y: posY });
        }
      }
    }
  }

  private spawnSingleEnemy(e: EnemyPlacement, occurrenceId: string): void {
    const px = e.x * 32 + 16;
    const py = e.y * 32 + 16;
    let enemy: Enemy;
    if (e.type === 'ranged' || e.type === 'applaud') {
      enemy = new RangedEnemy(this, px, py, this.enemyBullets);
      enemy.configureAppearance(ENEMY_PRESENTATIONS.applaud.tint);
    } else if (e.type === 'boss' || e.type === 'fortitudo') {
      enemy = new BossEnemy(this, px, py, 'Fortitudo');
      enemy.configureAppearance(ENEMY_PRESENTATIONS.fortitudo.tint);
    } else if (e.type === 'miniboss') {
      enemy = new BossEnemy(this, px, py, 'Sevido', 'boss_guardian_anim', 700, 0.6);
      enemy.configureAppearance(0xc07cff);
    } else {
      enemy = new Enemy(this, px, py, 'enemy_melee_anim');
      enemy.configureAppearance(ENEMY_PRESENTATIONS.affinity.tint);
    }
    const patrol = (e.patrol ?? []).map((point) => ({ x: point.x * 32 + 16, y: point.y * 32 + 16 }));
    enemy.configureAI(this.navigation, patrol);
    enemy.configureProgression(Math.max(e.level, this.currentLevel.difficulty));
    enemy.setData('narrativeEnemyId', occurrenceId);
    enemy.setData('narrativeArchetype', e.type);
    this.enemies.add(enemy);
  }

  private spawnWave(index: number): void {
    const wave = this.waves[index];
    if (!wave) return;
    wave.enemies.forEach((enemy, enemyIndex) => this.spawnSingleEnemy(
      enemy,
      `${this.narrativeOccurrenceScope()}.wave.${index}.enemy.${enemyIndex}`,
    ));
    this.simulationBridge.recordWaveStarted(this.currentLevel.name, index + 1, wave.enemies.length);
    if (this.levelBannerText) {
      this.levelBannerText.setText(`ONDA ${index + 1} / ${this.waves.length}`);
      this.levelBannerText.setVisible(true);
      this.time.delayedCall(1400, () => {
        if (!this.levelClearedBannerShowing && this.enemies.countActive(true) > 0) {
          this.levelBannerText.setVisible(false);
        }
      });
    }
  }

  private spawnEnemiesAndItems(level: LevelDefinition): void {
    // Build wave schedule: hand-authored waves if present, otherwise chunk by level
    if (level.waves && level.waves.length > 0) {
      this.waves = level.waves.map(w => ({ enemies: w.enemies }));
    } else {
      const sorted = [...level.enemies].sort((a, b) => a.level - b.level);
      this.waves = [];
      for (let i = 0; i < sorted.length; i += 8) {
        this.waves.push({ enemies: sorted.slice(i, i + 8) });
      }
      const minibossSpots = [{ x: 25, y: 8 }, { x: 30, y: 9 }, { x: 34, y: 9 }];
      const mb = minibossSpots[this.currentLevelIndex] ?? { x: 20, y: 8 };
      this.waves.push({ enemies: [{ type: 'miniboss', x: mb.x, y: mb.y, level: 9 }] });
    }
    this.currentWaveIndex = 0;
    this.waveDelayTimer = 0;
    this.waveTransition = false;
    // Wave 0 is spawned in create() once the HUD (banner text) exists.

    level.items.forEach((itm, itemIndex) => {
      // Keys already collected stay collected across revisits
      if (itm.type === 'key') {
        const keyId = `${this.itemIdentityScope()}:${itm.x},${itm.y}`;
        if (this.foundKeys.has(keyId)) return;
      }
      const px = itm.x * 32 + 16;
      const py = itm.y * 32 + 16;
      const isHealth = itm.type === 'potion' || itm.type === 'health_herb';
      const isMagic = itm.type === 'mana_shard';
      const isKey = itm.type === 'key';
      const itemType = isHealth ? 'item_potion' : isMagic ? 'item_magic' : isKey ? 'item_key' : 'item_halo';
      const textureKey = isHealth ? 'item_heart' : isMagic ? 'item_potion' : itemType;
      const itemEntity = new Item(this, px, py, itemType, textureKey);
      itemEntity.setData(
        'narrativeItemId',
        `${this.narrativeOccurrenceScope()}.item.authored.${itemIndex}`,
      );
      this.items.add(itemEntity);
    });
  }

  private prepareCurrentStageEncounter(): void {
    if (this.isMacroHub()) {
      this.waves = [];
      this.currentWaveIndex = 0;
      this.waveDelayTimer = 0;
      this.waveTransition = false;
      return;
    }
    this.spawnEnemiesAndItems(this.currentLevel);
  }

  private startCurrentStageEncounter(): void {
    if (this.isMacroHub()) {
      this.levelClearedBannerShowing = true;
      this.revealExits();
      return;
    }
    this.spawnWave(0);
  }

  private createHUD(): void {
    const hudBg = this.add.rectangle(640, 34, 1280, 68, 0x05020a, 0.85);
    hudBg.setScrollFactor(0);
    hudBg.setDepth(950);

    this.hpHudText = this.add.text(20, 9, '♥♥♥♥♥', {
      fontFamily: 'Courier, monospace',
      fontSize: '28px',
      color: '#ff5a6f',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(960);

    this.magicHudText = this.add.text(200, 15, "MAGIC: 0%", {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#bb00ff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(960);

    this.haloHudText = this.add.text(420, 15, "HALOS: 5000 ⏣", {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(960);

    this.progressionHudText = this.add.text(20, 50, 'NÍVEL 1  XP 0/0', {
      fontFamily: 'Courier, monospace',
      fontSize: '13px',
      color: '#66ffd8',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(960);

    this.weaponHudText = this.add.text(650, 15, "CLASSE: CAVALEIRO", {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(960);

    this.comboHudText = this.add.text(910, 15, "ESPECIAL: -", {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(960);

    const shopBtn = this.add.text(1165, 15, "[ LOJA (B) ]", {
      fontSize: '14px',
      color: '#ffd700',
      backgroundColor: '#331144',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(960).setInteractive({ useHandCursor: true });
    shopBtn.on('pointerdown', () => this.shopUI.toggle());

    // Level Title Card
    this.levelTitleText = this.add.text(640, 200, "", {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(970).setAlpha(0);

    // Level Cleared Banner
    this.levelBannerText = this.add.text(640, 300, "", {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#00ffcc',
      fontStyle: 'bold',
      backgroundColor: '#110522',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(970).setVisible(false);

    // Objective tracker (what to do next)
    this.objectiveText = this.add.text(640, 62, '', {
      fontFamily: 'Courier, monospace',
      fontSize: '16px',
      color: '#f6d77a',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(960);

    // Interaction prompt for the nearest POI (generic; no per-stage text).
    this.interactionPromptText = this.add.text(640, 700, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: '#9fe8d2',
      fontStyle: 'bold',
      backgroundColor: '#06120f',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(960).setVisible(false);
  }

  private showChapterTitle(title: string): void {
    this.levelTitleText.setText(`CHAPTER ${this.currentLevelIndex + 1}\n${title.toUpperCase()}`);
    this.levelTitleText.setAlpha(1);

    this.tweens.add({
      targets: this.levelTitleText,
      alpha: 0,
      duration: 3500,
      ease: 'Power2'
    });
  }

  private transitionToSection(exit: { to: number; spawnX: number; spawnY: number }): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.flash(500, 255, 215, 0);
    SoundManager.playWitchTimeActivate();

    this.time.delayedCall(400, () => {
      const previousSection = this.currentLevel.name;
      this.currentLevelIndex = exit.to;
      this.currentLevel = this.allLevels[this.currentLevelIndex];
      this.simulationBridge.recordRoomEntered(this.currentLevel.name, previousSection);

      this.floorImages.forEach(img => img.destroy());
      this.floorImages = [];
      this.enemies.clear(true, true);
      this.items.clear(true, true);
      this.bullets.clear(true, true);
      this.enemyBullets.clear(true, true);
      this.wallTiles.clear(true, true);
      this.stairTiles.clear(true, true);
      this.pendingExitTiles = [];
      this.exitsRevealed = false;
      this.summons.forEach(s => s.destroy());
      this.summons = [];

      this.buildMapFromDefinition(this.currentLevel);
      this.navigation = new NavigationService(this.currentLevel.tileMap, { tileSize: 32 });
      this.spawnEnemiesAndItems(this.currentLevel);
      this.spawnWave(0);

      this.player.setPosition(exit.spawnX * 32 + 16, exit.spawnY * 32 + 16);
      this.player.setVelocity(0, 0);
      this.player.setActive(true);
      this.player.setVisible(true);
      this.player.setAlpha(1);
      this.player.resetResourcesForNextStage();

      // Rebuild camera/world bounds for the new section
      const worldWidth = this.currentLevel.tileMap[0].length * 32;
      const worldHeight = this.currentLevel.tileMap.length * 32;
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

      this.levelClearedBannerShowing = false;
      this.currentWaveIndex = 0;
      this.waveTransition = false;
      this.showChapterTitle(this.currentLevel.name);
      this.isTransitioning = false;
    });
  }

  private queueCampaignExitTiles(): void {
    if (!this.campaignRouter || !this.campaignNavigation) return;
    this.pendingExitTiles = this.campaignNavigation.snapshot.destinations.map(destination => ({
      x: destination.tile.x * 32 + 16,
      y: destination.tile.y * 32 + 16,
      physicalExitId: destination.physicalExitId,
      available: destination.available,
    }));
  }

  private handleCampaignExitProximity(
    physicalExitId: string | undefined,
    available: boolean,
    commandPressed: boolean,
  ): void {
    if (!physicalExitId) return;
    if (!available) {
      this.objectiveText.setText('SAÍDA BLOQUEADA');
      return;
    }
    if (!commandPressed) {
      this.objectiveText.setText('PRESSIONE E PARA ATRAVESSAR');
      return;
    }
    this.navigateCampaignExit(physicalExitId);
  }

  private navigateCampaignExit(physicalExitId: string): void {
    if (!this.campaignRouter || this.isTransitioning || this.campaignPersistenceUncertain) return;
    const prepared = this.campaignRouter.prepare(physicalExitId);
    if (!prepared.ok) {
      this.showCampaignTransitionFailure(`SAÍDA INDISPONÍVEL: ${prepared.error.code}`);
      return;
    }
    if (!this.requestNarrativeExit(
      prepared.value.stageExitId,
      `${this.narrativeOccurrenceScope()}.exit.${prepared.value.stageExitId}`,
    )) {
      if (!this.campaignRouter.cancel(prepared.value.preparationId)) {
        this.campaignPersistenceUncertain = true;
        this.showCampaignTransitionFailure('CANCELAMENTO DA TRANSIÇÃO INCERTO. REINICIE PARA RECONCILIAR.');
      }
      return;
    }
    this.isTransitioning = true;
    this.levelBannerText.setText('TRAVESSIA EM ANDAMENTO...');
    this.levelBannerText.setVisible(true);
    const confirmed = this.campaignRouter.confirm(prepared.value.preparationId);
    if (!confirmed.ok) {
      this.isTransitioning = false;
      this.campaignPersistenceUncertain = confirmed.error.recovery === 'storage-state-unknown';
      this.showCampaignTransitionFailure(
        this.campaignPersistenceUncertain
          ? 'SAVE DA RUN INCERTO. REINICIE PARA RECONCILIAR.'
          : `TRANSIÇÃO CANCELADA: ${confirmed.error.code}`,
      );
      return;
    }

    this.settleCampaignReward(prepared.value.transitionId);

    if (prepared.value.targetNodeId === 'campaign.complete' || !prepared.value.destinationStage) {
      this.levelBannerText.setText('CAMPANHA PILOTO CONCLUÍDA!');
      this.levelBannerText.setVisible(true);
      this.cameras.main.flash(700, 246, 215, 122);
      this.time.delayedCall(1800, () => this.scene.start('MenuScene'));
      return;
    }

    const inspected = this.campaignRouter.inspect();
    if (!inspected.ok) {
      this.recoverConfirmedCampaignTransition(
        `TRANSIÇÃO CONFIRMADA; DESTINO INDISPONÍVEL: ${inspected.error.code}`,
      );
      return;
    }
    this.campaignNavigation = inspected.value;
    this.macroLoadedStage = inspected.value.loadedStage;
    const nextLevel = prepared.value.destinationStage.level;
    this.cameras.main.flash(600, 255, 215, 0);
    this.time.delayedCall(400, () => {
      try {
        const previousSection = this.currentLevel.name;
        let levelIndex = this.allLevels.findIndex(level => level.id === nextLevel.id);
        this.allLevels = [...this.allLevels];
        if (levelIndex < 0) {
          levelIndex = this.allLevels.length;
          this.allLevels.push(nextLevel);
        } else this.allLevels[levelIndex] = nextLevel;
        this.currentLevelIndex = levelIndex;
        this.currentLevel = nextLevel;
        this.simulationBridge.recordRoomEntered(this.currentLevel.name, previousSection);
        this.rebuildCurrentStage();
        this.isTransitioning = false;
      } catch {
        this.recoverConfirmedCampaignTransition(
          'TRANSIÇÃO CONFIRMADA; FALHA AO RECONSTRUIR O DESTINO.',
        );
      }
    });
  }

  private settleCampaignReward(transitionId: string): void {
    if (!this.campaignRouter) return;
    const reward = this.campaignRouter.reward(transitionId);
    if (!reward) return;
    const claimed = this.campaignRouter.claimReward(transitionId);
    if (!claimed.ok) {
      if (claimed.error.code === 'reward-already-applied') return;
      if (claimed.error.code !== 'reward-already-claimed') {
        this.campaignPersistenceUncertain ||= claimed.error.recovery === 'storage-state-unknown';
        this.showCampaignTransitionFailure(
          this.campaignPersistenceUncertain
            ? 'RECOMPENSA PENDENTE: SAVE DA RUN INCERTO.'
            : `RECOMPENSA ADIADA: ${claimed.error.code}`,
        );
        return;
      }
      // Already claimed: retry the durable consumer; its ledger deduplicates
      // an operation that was applied before a crash.
    }
    let applied: ReturnType<ProgressionService['recordStageCompletedIdempotent']>;
    try {
      applied = this.progression.recordStageCompletedIdempotent({
        stageId: reward.stageId,
        difficulty: reward.difficulty,
        parSeconds: reward.parSeconds,
        operationId: transitionId,
      });
    } catch {
      this.showCampaignTransitionFailure('RECOMPENSA NÃO CONFIRMADA; TENTE NOVAMENTE NO RESTART.');
      return;
    }
    if (!applied.ok) {
      this.showCampaignTransitionFailure(
        applied.error.code === 'persistence-failed'
          ? 'RECOMPENSA NÃO REGISTRADA; TENTE NOVAMENTE NO RESTART.'
          : `RECOMPENSA INVÁLIDA: ${applied.error.code}`,
      );
      return;
    }
    if (applied.value.status === 'applied') {
      this.player.addHalos(applied.value.update.currencyAwarded);
    }
    const acknowledged = this.campaignRouter.acknowledgeReward(transitionId);
    if (!acknowledged.ok) {
      this.campaignPersistenceUncertain ||= acknowledged.error.recovery === 'storage-state-unknown';
      this.showCampaignTransitionFailure('RECOMPENSA APLICADA; REGISTRO PENDENTE.');
    }
  }

  private recoverPendingCampaignRewards(): void {
    const unsettled = this.campaignRouter?.unsettledRewards() ?? [];
    for (const reward of unsettled) {
      this.settleCampaignReward(reward.transitionId);
      if (this.campaignPersistenceUncertain) break;
    }
  }

  private recoverConfirmedCampaignTransition(message: string): void {
    this.showCampaignTransitionFailure(message);
    if (this.campaignRecoveryAttempt >= 1) {
      this.time.delayedCall(1800, () => this.scene.start('MenuScene'));
      return;
    }
    const data = {
      ...(this.macroCampaign && this.macroStageSource === 'campaign'
        ? {
            macroCampaign: true,
            macroRunId: this.macroRunId,
            macroRunSeed: this.macroRunSeed,
            macroRecoveryAttempt: this.campaignRecoveryAttempt + 1,
          }
        : {
            branchingCampaign: true,
            branchingRunId: this.branchingRunId,
            branchingRunSeed: this.branchingRunSeed,
            branchingRecoveryAttempt: this.campaignRecoveryAttempt + 1,
          }),
      halos: this.player?.halos,
      skipControls: true,
    };
    if (this.scene && typeof this.scene.restart === 'function') {
      this.time.delayedCall(600, () => this.scene.restart(data));
      return;
    }
    this.isTransitioning = false;
  }

  private rebuildCurrentStage(): void {
    this.floorImages.forEach(image => image.destroy());
    this.floorImages = [];
    this.enemies.clear(true, true);
    this.items.clear(true, true);
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.summons.forEach(summon => summon.destroy());
    this.summons = [];
    this.wallTiles.clear(true, true);
    this.stairTiles.clear(true, true);
    this.pendingExitTiles = [];
    this.exitsRevealed = false;
    this.levelClearedBannerShowing = false;
    this.currentWaveIndex = 0;
    this.waveTransition = false;

    this.buildMapFromDefinition(this.currentLevel);
    this.queueCampaignExitTiles();
    if (this.narrativeReady) {
      this.initializeModularNarrative();
      this.setupStageInteractions();
      this.reportNarrativeSignal(this.modularNarrativeSession?.enterStage());
    }
    this.navigation = new NavigationService(this.currentLevel.tileMap, { tileSize: 32 });
    this.prepareCurrentStageEncounter();
    this.startCurrentStageEncounter();

    const spawn = this.findSpawnPoint(this.currentLevel);
    this.player.setPosition(spawn.x, spawn.y);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true);
    this.player.setActive(true);
    this.player.setAlpha(1);
    this.player.resetResourcesForNextStage();

    const worldWidth = this.currentLevel.tileMap[0].length * 32;
    const worldHeight = this.currentLevel.tileMap.length * 32;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.levelBannerText.setVisible(false);
    SoundManager.playWitchTimeActivate();
    this.showChapterTitle(this.currentRegionName());
  }

  private showCampaignTransitionFailure(message: string): void {
    if (!this.levelBannerText) return;
    this.levelBannerText.setText(message);
    this.levelBannerText.setVisible(true);
    this.time.delayedCall(1800, () => {
      if (!this.levelClearedBannerShowing) this.levelBannerText.setVisible(false);
    });
  }

  private itemIdentityScope(): string {
    return this.campaignRouter?.state().currentNodeId ?? String(this.currentLevelIndex);
  }

  private narrativeOccurrenceScope(): string {
    const campaign = this.campaignRouter && typeof this.campaignRouter.state === 'function'
      ? this.campaignRouter.state()
      : undefined;
    if (!campaign) return `stage.${this.currentLevel.id}.visit.1`;
    const visit = campaign.revisitCounts[campaign.currentNodeId] ?? 1;
    return `${campaign.currentNodeId}.visit.${visit}`;
  }

  private notifyEncounterCompleted(encounterId: string, occurrenceSuffix: string): boolean {
    return this.reportNarrativeSignal(this.stageSignalAdapter?.dispatch({
      type: 'encounter.completed',
      occurrenceId: `${this.narrativeOccurrenceScope()}.${occurrenceSuffix}`,
      encounterId,
    }));
  }

  private isMacroHub(): boolean {
    return this.macroStageSource === 'campaign' &&
      this.macroCampaignAdapter?.location().isHub === true;
  }

  private currentRegionName(): string {
    return this.macroStageSource === 'campaign'
      ? this.macroCampaignAdapter?.location().regionName ?? this.currentLevel.name
      : this.currentLevel.name;
  }

  private macroLocationLabel(): string | undefined {
    if (this.macroStageSource !== 'campaign' || !this.macroCampaignAdapter) return undefined;
    const location = this.macroCampaignAdapter.location();
    return location.routeName
      ? `ROTA: ${location.routeName}  •  REGIÃO: ${location.regionName}`
      : `REGIÃO: ${location.regionName}`;
  }

  public advanceToNextLevel(): void {
    if (this.isTransitioning) return;
    const exitId = 'legacy.next';
    if (!this.requestNarrativeExit(
      exitId,
      `${this.narrativeOccurrenceScope()}.exit.${exitId}`,
    )) return;
    this.isTransitioning = true;
    const stageReward = this.progression.recordStageCompleted({
      stageId: this.currentLevel.id,
      difficulty: this.currentLevel.difficulty,
      parSeconds: this.currentLevel.parTime,
    });
    this.player.addHalos(stageReward.currencyAwarded);

    if (this.currentLevelIndex === this.allLevels.length - 1) {
      this.levelBannerText.setText('PASSAGEM CONCLUÍDA!');
      this.levelBannerText.setVisible(true);
      this.cameras.main.flash(700, 246, 215, 122);
      this.time.delayedCall(1800, () => this.scene.start('MenuScene'));
      return;
    }

    // Flash transition
    this.cameras.main.flash(600, 255, 215, 0);

    this.time.delayedCall(400, () => {
      this.currentLevelIndex = (this.currentLevelIndex + 1) % this.allLevels.length;
      this.currentLevel = this.allLevels[this.currentLevelIndex];
      this.modularNarrativeSession = undefined;
      this.stageSignalAdapter = undefined;
      this.modularLoadedStage = undefined;
      this.modularComposition = undefined;
      this.modularStageSource = 'legacy';

      this.rebuildCurrentStage();
      this.isTransitioning = false;
    });
  }

  public override update(time: number, delta: number): void {
    // Early returns for menus, death and transitions must also hide the charge UI.
    this.arrowChargeBar.setVisible(false);
    this.comboManager.update();
    // Damage cooldown tick
    if (this.playerDamageCooldown > 0) {
      this.playerDamageCooldown -= delta;
    }

    // Dialogue is modal: it owns E/ESC and pauses the world (set on open).
    if (this.dialogueOverlay?.isOpen()) {
      this.interactionPromptText?.setVisible(false);
      if (this.keyMenu && Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
        this.dialogueOverlay.close();
        return;
      }
      if (this.keyChoiceUp && Phaser.Input.Keyboard.JustDown(this.keyChoiceUp)) {
        this.dialogueOverlay.moveSelection(-1);
        return;
      }
      if (this.keyChoiceDown && Phaser.Input.Keyboard.JustDown(this.keyChoiceDown)) {
        this.dialogueOverlay.moveSelection(1);
        return;
      }
      if (this.keyInteract && Phaser.Input.Keyboard.JustDown(this.keyInteract)) {
        this.dialogueOverlay.confirm();
      }
      return;
    }

    if (this.keyMenu && Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
      this.physics.world.resume();
      this.scene.start('MenuScene');
      return;
    }

    if (this.controlsGuideOpen) return;

    // Shop Key
    if (this.keyShop && Phaser.Input.Keyboard.JustDown(this.keyShop)) {
      this.shopUI.toggle();
    }

    this.player.combatInputEnabled = !this.shopUI.getIsVisible();
    this.simulationBridge.setPaused(this.shopUI.getIsVisible() || this.isTransitioning);
    if (this.shopUI.getIsVisible()) return;
    if (this.isTransitioning) return;

    // POI interaction must resolve before the portal consumes E in the
    // physics overlap pass. A resolved POI consumes the key for this frame.
    this.updateWorldInteraction();

    this.simulationBridge.advance(delta);
    this.combatBridge.advance(delta);

    // Update Player
    this.player.updatePlayer(time, delta);
    this.simulationBridge.synchronizePlayer({
      x: this.player.x,
      y: this.player.y,
      health: this.player.hp,
      maximumHealth: this.player.maxHp,
      mana: this.player.magic,
      maximumMana: this.player.maxMagic,
    });
    this.combatBridge.synchronizePlayer(
      this.player.hp,
      this.player.maxHp,
      this.player.magic,
      this.player.maxMagic,
    );

    // Witch Time slow-down
    const witchMultiplier = this.player.isWitchTimeActive ? 0.2 : 1.0;
    this.witchTimeOverlay.setVisible(this.player.isWitchTimeActive);

    const activeEnemies = this.enemies.getChildren().filter(e => e.active);
    activeEnemies.forEach((entry, index) => {
      const enemy = entry as Enemy;
      const neighbors = activeEnemies
        .filter((_, candidateIndex) => candidateIndex !== index)
        .map(candidate => ({ x: (candidate as Enemy).x, y: (candidate as Enemy).y }));
      enemy.setCrowdNeighbors(neighbors);
      enemy.updateEnemy(this.player.x, this.player.y, delta * witchMultiplier, witchMultiplier);
    });

    // Witch Time also slows enemy projectiles
    this.enemyBullets.getChildren().forEach(b => {
      const bullet = b as Phaser.Physics.Arcade.Sprite & { baseVelX?: number; baseVelY?: number };
      if (bullet.baseVelX !== undefined && bullet.baseVelY !== undefined) {
        bullet.setVelocity(bullet.baseVelX * witchMultiplier, bullet.baseVelY * witchMultiplier);
      }
    });

    // Update active summons
    this.summons = this.summons.filter(s => s.updateSummon(delta, this.player.x, this.player.y, activeEnemies));

    // Wave progression: when a wave is cleared, delay then spawn the next one
    if (activeEnemies.length === 0 && !this.waveTransition) {
      if (this.currentWaveIndex < this.waves.length - 1) {
        this.simulationBridge.recordWaveCompleted(this.currentLevel.name, this.currentWaveIndex + 1);
        this.notifyEncounterCompleted(
          `wave.${this.currentWaveIndex + 1}`,
          `wave.${this.currentWaveIndex}.completed`,
        );
        this.waveTransition = true;
        this.waveDelayTimer = 1200;
      } else if (!this.levelClearedBannerShowing) {
        this.levelClearedBannerShowing = true;
        this.simulationBridge.recordWaveCompleted(this.currentLevel.name, this.currentWaveIndex + 1);
        const waveNarrativeSaved = this.notifyEncounterCompleted(
          `wave.${this.currentWaveIndex + 1}`,
          `wave.${this.currentWaveIndex}.completed`,
        );
        const encounterNarrativeSaved = this.notifyEncounterCompleted(
          `encounter.${this.currentLevel.id}`,
          'encounter.completed',
        );
        this.revealExits();
        this.levelBannerText.setText('CAMINHO LIBERADO!\nEncontre o portal dourado');
        this.levelBannerText.setVisible(true);
        if (!waveNarrativeSaved || !encounterNarrativeSaved) {
          this.showCampaignTransitionFailure('PROGRESSO NARRATIVO NÃO SALVO. A SAÍDA TENTARÁ PERSISTIR NOVAMENTE.');
        }
      }
    }
    if (this.waveTransition) {
      this.waveDelayTimer -= delta;
      if (this.waveDelayTimer <= 0) {
        this.currentWaveIndex++;
        this.spawnWave(this.currentWaveIndex);
        this.waveTransition = false;
      }
    }

    // Melee attack collisions (when player recently tapped J/K)
    if (this.player.meleeAttackId !== this.lastHandledMeleeAttack) {
      this.lastHandledMeleeAttack = this.player.meleeAttackId;
      activeEnemies.forEach(e => {
        const enemy = e as Enemy;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.player.getMeleeRange()) {
          // Check if enemy is roughly in facing direction (dot product)
          const dot = (dx * this.player.facingX + dy * this.player.facingY);
          if (dot > -20) { // generous: hits in facing hemisphere
            enemy.takeDamage(this.calculatePlayerDamage(this.player.getMeleeDamage()));
            this.comboManager.registerHit();
          }
        }
      });
    }

    // Update HUD
    this.hpHudText.setText('♥'.repeat(this.player.hp) + '♡'.repeat(this.player.maxHp - this.player.hp));
    this.magicHudText.setText(`MAGIA: ${Math.round(this.player.magic)}/${this.player.maxMagic}`);
    this.haloHudText.setText(`HALOS: ${this.player.halos} ⏣`);
    const levelProgress = this.progression.levelProgress();
    const progressionSnapshot = this.progression.snapshot();
    this.progressionHudText.setText(
      `NÍVEL ${levelProgress.level}  XP ${levelProgress.current}/${levelProgress.required}  SP ${progressionSnapshot.skillPoints}`,
    );
    this.weaponHudText.setText(`${this.player.heroClass.name}: ${this.player.heroClass.weaponName}`);
    if (this.player.shieldCharges > 0) {
      this.weaponHudText.setText(`${this.player.heroClass.name}: ${this.player.heroClass.weaponName}  ESCUDO x${this.player.shieldCharges}`);
    }
    const charge = this.player.getChargeRatio();
    this.aimReticle.setScale(1 + charge * 0.9);
    this.aimReticle.setStrokeStyle(2 + charge * 3, charge >= 1 ? 0xffffff : this.player.heroClass.accentColor, 0.9);
    this.aimReticle.setPosition(this.input.activePointer.x, this.input.activePointer.y);
    this.updateArrowChargeBar();
    this.updateObjective();
  }

  private updateObjective(): void {
    // Escaped state — controls guide is covering the screen
    if (this.controlsGuideOpen || this.shopUI.getIsVisible()) return;
    const aliveEnemies = this.enemies.countActive(true);
    let objective = '';
    if (aliveEnemies > 0 || this.waveTransition) {
      objective = `OBJETIVO: Derrube os inimigos (Onda ${this.currentWaveIndex + 1}/${this.waves.length}, ${aliveEnemies} restantes)`;
    } else if (this.currentWaveIndex < this.waves.length - 1) {
      objective = 'OBJETIVO: Prepare-se para a próxima onda...';
    } else {
      objective = this.campaignRouter
        ? 'OBJETIVO: Seção limpa! Aproxime-se de uma saída e pressione E.'
        : 'OBJETIVO: Seção limpa! Procure uma chave ou use uma porta.';
    }
    const location = this.macroLocationLabel();
    this.objectiveText.setText(location ? `${location}\n${objective}` : objective);
  }

  private revealExits(): void {
    if (this.exitsRevealed) return;
    this.exitsRevealed = true;
    this.pendingExitTiles.forEach(({ x, y, physicalExitId, available = true }, index) => {
      const tunnel = this.stairTiles.create(x, y, 'tile_stairs') as Phaser.Physics.Arcade.Sprite;
      if (physicalExitId) {
        tunnel.setData('physicalExitId', physicalExitId);
        tunnel.setData('available', available);
        if (!available) tunnel.setTint(0x665c73);
      }
      tunnel.setDepth(6).setAlpha(0).setScale(0.15);
      tunnel.refreshBody();
      this.tweens.add({
        targets: tunnel,
        alpha: available ? 1 : 0.35,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        delay: index * 70,
        ease: 'Back.Out',
        onUpdate: () => tunnel.refreshBody(),
      });
    });
  }

  private updateArrowChargeBar(): void {
    if (this.player.heroClass.primaryStyle !== 'arrow' || !this.player.isChargingAttack()) return;
    const charge = this.player.getChargeRatio();
    const width = 48;
    const height = 6;
    // World coordinates keep the meter attached to the archer as the camera moves.
    this.arrowChargeBar.clear()
      .setPosition(this.player.x, this.player.y - this.player.displayHeight / 2 - 12)
      .setVisible(true);
    this.arrowChargeBar.fillStyle(0x100b18, 0.95);
    this.arrowChargeBar.fillRect(-width / 2 - 2, -2, width + 4, height + 4);
    this.arrowChargeBar.fillStyle(0x3a3344, 1);
    this.arrowChargeBar.fillRect(-width / 2, 0, width, height);
    this.arrowChargeBar.fillStyle(charge >= 1 ? 0xf6d77a : 0x8bdc75, 1);
    this.arrowChargeBar.fillRect(-width / 2, 0, width * charge, height);
  }

  private createAimReticle(): void {
    this.aimReticle = this.add.circle(0, 0, 10, 0x000000, 0)
      .setStrokeStyle(2, 0xf6d77a, 0.9)
      .setScrollFactor(0)
      .setDepth(980);
  }

  private showControlsGuide(): void {
    this.controlsGuideOpen = true;
    this.player.combatInputEnabled = false;
    this.physics.world.pause();
    this.simulationBridge.setPaused(true);
    const panel = this.add.container(640, 390).setScrollFactor(0).setDepth(990);
    const bg = this.add.rectangle(0, 0, 680, 330, 0x100b18, 0.96).setStrokeStyle(4, this.player.heroClass.accentColor);
    const title = this.add.text(0, -135, `${this.player.heroClass.name} — ${this.player.heroClass.title}`, {
      fontFamily: 'Courier New, monospace', fontSize: '28px', color: '#f6d77a', fontStyle: 'bold',
    }).setOrigin(0.5);
    const classInfo = this.add.text(0, -92,
      `${this.player.heroClass.weaponName}\nDIREITO: ${this.player.heroClass.specialName} - ${this.player.heroClass.specialDescription}`, {
      fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#cbb8d4', align: 'center',
      wordWrap: { width: 610 },
    }).setOrigin(0.5);
    const commands = this.add.text(0, 15,
      'WASD / SETAS   MOVER\nMOUSE           MIRAR\nBOTÃO ESQUERDO  ATACAR / SEGURAR\nBOTÃO DIREITO   ULTIMATE\nJ               ATACAR   •   K ULTIMATE\nESPAÇO          ESQUIVAR E ATRAVESSAR INIMIGOS\nMAGA            SEGURE PARA DISPARAR ATÉ A MANA ACABAR\nLADINO          SEGURE PARA AUMENTAR O ALCANCE DA FACA\nB               LOJA   •   ESC MENU', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#ffffff', lineSpacing: 8, align: 'left',
    }).setOrigin(0.5);
    const hint = this.add.text(0, 140, 'CLIQUE PARA COMEÇAR', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#a990b6',
    }).setOrigin(0.5);
    panel.add([bg, title, classInfo, commands, hint]);
    bg.setInteractive({ useHandCursor: true }).once('pointerdown', () => {
      panel.destroy(true);
      this.controlsGuideOpen = false;
      this.player.combatInputEnabled = true;
      this.physics.world.resume();
      this.simulationBridge.setPaused(false);
    });
  }
}
