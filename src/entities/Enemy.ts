// src/entities/Enemy.ts
// Base class for all angelic enemies in Vigrid.

import Phaser from 'phaser';
import {
  AwarenessState,
  BrainDecision,
  EnemyBrain,
  EnemyPerception,
  EnemyRole,
  NavPoint,
  NavigationAgent,
  NavigationService,
  TacticalPositioning,
  behaviorProfile,
  blendVelocity,
  separation,
} from '../ai';
import { GeneratedTacticalDecision, GeneratedTacticalDirector } from '../ai/generated';
import { shouldDropHeart } from '../utils/LootRules';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private static nextAIId = 1;
  protected hp: number;
  protected maxHp: number;
  protected speed: number;
  protected attackDamage: number;
  protected enemyType: string;
  protected enemyRole: EnemyRole = 'melee';
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private readonly animationPrefix: string;
  private animationLocked = false;
  private animationToken = 0;
  private attackAnimationCooldown = 0;
  private dying = false;

  // Telegraphed lunge strike (dodgeable "attack" instead of pure contact damage)
  private strikeState: 'none' | 'telegraph' | 'lunge' | 'recover' = 'none';
  private strikeTimer = 0;
  private strikeCooldown = 0;
  private strikeDirX = 0;
  private strikeDirY = 0;
  private strikeHitDone = false;
  private shockwaveCooldown = 0;
  private navigation?: NavigationService;
  private navigationAgent?: NavigationAgent;
  private brain?: EnemyBrain;
  private perception?: EnemyPerception;
  private tacticalPositioning?: TacticalPositioning;
  private facing: NavPoint = { x: 1, y: 0 };
  private crowdNeighbors: NavPoint[] = [];
  private lastPlayerPosition?: NavPoint;
  private readonly aiId = Enemy.nextAIId++;
  private readonly generatedTactics = new GeneratedTacticalDirector();
  private generatedDecision?: GeneratedTacticalDecision;
  private tacticalElapsed = 0;
  private aiHome: NavPoint;
  private progressionDifficulty = 1;
  private appearanceTint?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'enemy_affinity') {
    super(scene, x, y, textureKey);
    this.animationPrefix = textureKey;
    this.aiHome = { x, y };
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = 160;
    this.maxHp = 160;
    this.speed = 80;
    this.attackDamage = 15;
    this.enemyType = 'affinity';

    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.setDisplaySize(72, 64);
    this.setSize(44, 58).setOffset(42, 48);
    this.healthBarBg = scene.add.rectangle(x, y - 26, 32, 5, 0x160d18).setDepth(20);
    this.healthBarFill = scene.add.rectangle(x - 15, y - 26, 30, 3, 0xf05a67).setOrigin(0, 0.5).setDepth(21);
  }

  public takeDamage(amount: number): void {
    if (this.dying) return;
    this.hp -= amount;
    this.brain?.notifyDamaged(this.lastPlayerPosition);
    this.healthBarFill.setScale(Math.max(0, this.hp / this.maxHp), 1);
    this.playEnemyAction('hurt');
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      this.restoreAppearanceTint();
    });

    if (this.hp <= 0) {
      this.dying = true;
      this.setVelocity(0, 0);
      if (this.body) this.body.enable = false;
      this.scene.time.delayedCall(360, () => this.die());
    }
  }

  public die(): void {
    const narrativeEnemyId = this.getData('narrativeEnemyId') as string | undefined;
    const narrativeArchetype = this.getData('narrativeArchetype') as string | undefined;
    this.scene.events.emit('enemyDefeated', {
      role: this.enemyRole,
      enemyType: this.enemyType,
      maximumHealth: this.maxHp,
      difficulty: this.progressionDifficulty,
      ...(narrativeEnemyId ? { enemyId: narrativeEnemyId } : {}),
      ...(narrativeArchetype ? { archetype: narrativeArchetype } : {}),
    });
    // Drop halos as currency on death
    const drops = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < drops; i++) {
      const ox = (Math.random() - 0.5) * 24;
      const oy = (Math.random() - 0.5) * 24;
      this.scene.events.emit(
        'enemyDropHalo',
        this.x + ox,
        this.y + oy,
        narrativeEnemyId ? `${narrativeEnemyId}.drop.halo.${i}` : undefined,
      );
    }
    if (shouldDropHeart(Math.random())) {
      this.scene.events.emit(
        'enemyDropHeart',
        this.x,
        this.y,
        narrativeEnemyId ? `${narrativeEnemyId}.drop.heart` : undefined,
      );
    }
    this.destroy();
  }

  public override destroy(fromScene?: boolean): void {
    this.healthBarBg?.destroy();
    this.healthBarFill?.destroy();
    super.destroy(fromScene);
  }

  /** Connects this enemy to the current level navigation map. */
  public configureAI(navigation: NavigationService, patrol: readonly NavPoint[] = []): this {
    this.navigation = navigation;
    this.aiHome = { x: this.x, y: this.y };
    this.navigationAgent = new NavigationAgent(navigation, {
      repathInterval: this.enemyRole === 'boss' ? 180 : 280,
      waypointTolerance: this.enemyRole === 'boss' ? 18 : 11,
      stuckTimeout: this.enemyRole === 'boss' ? 900 : 650,
    });
    const profile = behaviorProfile(this.enemyRole);
    this.brain = new EnemyBrain(this.enemyRole, { x: this.x, y: this.y }, patrol);
    this.perception = new EnemyPerception(profile);
    this.tacticalPositioning = new TacticalPositioning(navigation);
    return this;
  }

  public configureProgression(difficulty: number): this {
    this.progressionDifficulty = Math.max(1, Math.floor(difficulty));
    return this;
  }

  public configureAppearance(tint: number): this {
    this.appearanceTint = tint;
    this.setTint(tint);
    return this;
  }

  protected restoreAppearanceTint(): void {
    if (this.appearanceTint === undefined) this.clearTint();
    else this.setTint(this.appearanceTint);
  }

  /** Nearby positions are supplied once per frame for inexpensive separation. */
  public setCrowdNeighbors(neighbors: readonly NavPoint[]): void {
    this.crowdNeighbors = neighbors.map((point) => ({ ...point }));
  }

  public getAwarenessState(): AwarenessState {
    return this.brain?.snapshot().state ?? 'chase';
  }

  public updateEnemy(playerX: number, playerY: number, _delta: number, speedMultiplier: number = 1): void {
    if (!this.active || !this.body || this.dying) return;
    this.syncHealthBar();
    this.attackAnimationCooldown = Math.max(0, this.attackAnimationCooldown - _delta);
    this.strikeCooldown = Math.max(0, this.strikeCooldown - _delta);
    this.shockwaveCooldown = Math.max(0, this.shockwaveCooldown - _delta);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const decision = this.think(playerX, playerY, _delta);

    // Telegraph: flash red and pause before the lunge so the player can dodge
    if (this.strikeState === 'telegraph') {
      this.strikeTimer -= _delta;
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
      if (this.strikeTimer <= 0) {
        this.strikeState = 'lunge';
        this.strikeTimer = 300;
        this.strikeHitDone = false;
        if (dist > 1) {
          this.strikeDirX = dx / dist;
          this.strikeDirY = dy / dist;
        }
        this.restoreAppearanceTint();
        this.playEnemyAction('attack');
      }
      return;
    }

    // Lunge: fast, committed burst — dodging through it triggers Witch Time
    if (this.strikeState === 'lunge') {
      this.strikeTimer -= _delta;
      this.setVelocity(this.strikeDirX * 430 * speedMultiplier, this.strikeDirY * 430 * speedMultiplier);
      if (!this.strikeHitDone && dist < 38) {
        this.strikeHitDone = true;
        this.scene.events.emit('enemyMeleeStrike', this.attackDamage);
      }
      if (this.strikeTimer <= 0) {
        this.strikeState = 'recover';
        this.strikeTimer = 420;
        this.setVelocity(0, 0);
      }
      return;
    }

    if (this.strikeState === 'recover') {
      this.strikeTimer -= _delta;
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
      if (this.strikeTimer <= 0) {
        this.strikeState = 'none';
        this.strikeCooldown = 1400;
      }
      return;
    }

    if (decision.state !== 'idle' && decision.state !== 'patrol' && decision.targetVisible) {
      // Second move: radial shockwave when the player presses in close
      if (dist < 80 && this.shockwaveCooldown <= 0 && this.strikeState === 'none') {
        this.shockwaveCooldown = 3200;
        this.setVelocity(0, 0);
        this.playEnemyAction('attack');
        const ring = this.scene.add.circle(this.x, this.y, 24, 0xff8800, 0.25)
          .setStrokeStyle(5, 0xff5500, 0.9)
          .setDepth(15);
        this.scene.tweens.add({ targets: ring, alpha: 0, scaleX: 4, scaleY: 4, duration: 420, onComplete: () => ring.destroy() });
        this.scene.events.emit('enemyShockwave', this.x, this.y, this.attackDamage);
        return;
      }
      // Start a telegraphed strike when in range
      if (decision.wantsAttack && dist < 150 && dist > 40 && this.strikeCooldown <= 0) {
        this.strikeState = 'telegraph';
        this.strikeTimer = 550;
        this.setTint(0xff3333);
        this.setVelocity(0, 0);
        this.updateMovementAnimation(false);
        return;
      }
    }

    if (decision.moveTarget) {
      this.moveUsingNavigation(decision.moveTarget, _delta, this.speed * speedMultiplier);
    } else {
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
      if (decision.wantsAttack && dist <= 40 && this.attackAnimationCooldown <= 0) {
        this.playEnemyAction('attack');
        this.attackAnimationCooldown = 850;
      }
    }
  }

  public getHp(): number {
    return this.hp;
  }

  public getAttackDamage(): number {
    return this.attackDamage;
  }

  protected think(playerX: number, playerY: number, delta: number): BrainDecision {
    const self = { x: this.x, y: this.y };
    const target = { x: playerX, y: playerY };
    this.lastPlayerPosition = target;
    this.tacticalElapsed += Math.max(0, Math.min(delta, 250));
    const targetDistance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    if (!this.brain || !this.perception) {
      return {
        state: targetDistance < 400 ? 'chase' : 'idle',
        moveTarget: targetDistance > 20 && targetDistance < 400 ? target : undefined,
        lookTarget: target,
        lastKnownTarget: target,
        targetVisible: targetDistance < 400,
        wantsAttack: targetDistance >= 36 && targetDistance <= 155,
        wantsRetreat: false,
        urgency: targetDistance < 400 ? 1 : 0,
      };
    }
    const lineOfSight = this.navigation?.hasLineOfSight(self, target) ?? true;
    const sensed = this.perception.sense({
      observer: self,
      target,
      facing: this.facing,
      lineOfSight,
      targetNoise: 1,
    });
    const decision = this.brain.update({
      self,
      target,
      delta,
      targetVisible: sensed.visible,
      targetAudible: sensed.audible,
      distanceToTarget: sensed.distance,
    });
    this.generatedDecision = this.generatedTactics.decide({
      actorId: this.aiId,
      role: this.enemyRole,
      state: decision.state,
      self,
      target: decision.lastKnownTarget ?? target,
      home: this.aiHome,
      healthRatio: Math.max(0, this.hp / this.maxHp),
      targetVisible: sensed.visible,
      nearbyAllies: this.crowdNeighbors.length,
      nearbyEnemies: 1,
      routeCost: sensed.distance,
      hazard: this.navigation?.grid.tileAt(this.navigation.grid.worldToCell(self)) === 4 ? 1 : 0,
      elapsed: this.tacticalElapsed,
    });
    if (decision.state === 'chase' && sensed.visible && !this.generatedDecision.holdPosition) {
      decision.moveTarget = this.generatedDecision.destination;
    }
    if (decision.state === 'chase' && this.generatedDecision.holdPosition) {
      decision.moveTarget = undefined;
    }
    return decision;
  }

  protected moveUsingNavigation(target: NavPoint, delta: number, maximumSpeed: number): void {
    let velocity: NavPoint;
    const tacticalSpeed = this.generatedDecision?.speedScale ?? 1;
    maximumSpeed *= tacticalSpeed;
    if (this.navigationAgent) {
      velocity = this.navigationAgent.step({ x: this.x, y: this.y }, target, maximumSpeed, delta).velocity;
    } else {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const length = Math.hypot(dx, dy);
      velocity = length > 0 ? { x: dx / length * maximumSpeed, y: dy / length * maximumSpeed } : { x: 0, y: 0 };
    }
    const avoidance = separation({ x: this.x, y: this.y }, this.crowdNeighbors, 46, 1);
    const separationScale = this.generatedDecision?.separationScale ?? 1;
    const avoidanceWeight = (this.enemyRole === 'boss' ? 0.15 : 0.42) * separationScale;
    velocity = blendVelocity(velocity, avoidance, avoidanceWeight);
    this.setVelocity(velocity.x, velocity.y);
    if (Math.hypot(velocity.x, velocity.y) > 1) {
      this.facing = { x: velocity.x, y: velocity.y };
      this.updateMovementAnimation(true);
    } else {
      this.updateMovementAnimation(false);
    }
  }

  protected retreatTarget(playerX: number, playerY: number, distanceToCreate = 150): NavPoint {
    if (this.tacticalPositioning) {
      return this.tacticalPositioning.retreatFrom(
        { x: this.x, y: this.y },
        { x: playerX, y: playerY },
        distanceToCreate,
      );
    }
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const length = Math.hypot(dx, dy) || 1;
    return { x: this.x + dx / length * distanceToCreate, y: this.y + dy / length * distanceToCreate };
  }

  protected syncHealthBar(): void {
    this.healthBarBg.setPosition(this.x, this.y - this.displayHeight / 2 - 7);
    this.healthBarFill.setPosition(this.x - 15, this.y - this.displayHeight / 2 - 7);
  }

  protected updateMovementAnimation(moving: boolean): void {
    if (this.animationLocked) return;
    if (moving) {
      this.play(`${this.animationPrefix}_walk`, true);
    } else {
      this.stop();
      this.setFrame(0);
    }
  }

  protected playEnemyAction(action: 'attack' | 'hurt'): void {
    const token = ++this.animationToken;
    this.animationLocked = true;
    this.play(`${this.animationPrefix}_${action}`, true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (token !== this.animationToken || this.dying) return;
      this.animationLocked = false;
      this.stop();
      this.setFrame(0);
    });
  }
}
