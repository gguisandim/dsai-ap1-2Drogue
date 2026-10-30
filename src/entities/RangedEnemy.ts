// src/entities/RangedEnemy.ts
// Flying Archer angel enemy (Applaud) that shoots divine light arrows.

import { Enemy } from './Enemy';
import Phaser from 'phaser';

export class RangedEnemy extends Enemy {
  private shootCooldown: number = 0;
  private projectileGroup?: Phaser.Physics.Arcade.Group;
  private windupTimer = 0;
  private shotCount = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    projectileGroup?: Phaser.Physics.Arcade.Group,
    textureKey = 'enemy_ranged_anim',
    animationKeys?: Readonly<{ walk?: string; attack?: string; hurt?: string }>,
  ) {
    super(scene, x, y, textureKey, animationKeys);
    this.projectileGroup = projectileGroup;
    this.enemyRole = 'ranged';
    this.enemyType = 'applaud';
    this.speed = 90;
    this.hp = 130;
    this.maxHp = 130;
    this.attackDamage = 10;
    this.setDisplaySize(78, 69);
    this.setSize(42, 56).setOffset(43, 46);
  }

  public override updateEnemy(playerX: number, playerY: number, delta: number, speedMultiplier: number = 1): void {
    if (!this.active || !this.body) return;
    this.syncHealthBar();

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const decision = this.think(playerX, playerY, delta);

    // Keep distance and shoot
    if (dist < 1) {
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
    } else if (decision.wantsRetreat || (decision.targetVisible && dist < 180)) {
      // Back away
      if (this.windupTimer > 0) {
        this.windupTimer = 0;
        this.restoreAppearanceTint();
      }
      this.moveUsingNavigation(this.retreatTarget(playerX, playerY, 175), delta, this.speed * 1.15 * speedMultiplier);
    } else if (decision.wantsAttack && decision.targetVisible) {
      // Hold position and shoot
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
      this.shootCooldown -= delta;
      if (this.shootCooldown <= 0 && this.windupTimer <= 0) {
        // Telegraphed windup so the arrow shot is dodgeable
        this.windupTimer = 380;
        this.setTint(0xffee66);
        this.playEnemyAction('attack');
      }
      if (this.windupTimer > 0) {
        this.windupTimer -= delta;
        if (this.windupTimer <= 0) {
          this.restoreAppearanceTint();
          this.shotCount++;
          // Every 3rd shot is a spread of 3 arrows to control space
          if (this.shotCount % 3 === 0) {
            this.shootSpread(playerX, playerY);
          } else {
            this.shootArrow(playerX, playerY);
          }
          this.shootCooldown = 2000; // 2 sec cooldown
        }
      }
    } else if (decision.moveTarget) {
      // Reposition through the navigation graph until the target is visible
      // and inside the ranged attack band.
      if (this.windupTimer > 0) {
        this.windupTimer = 0;
        this.restoreAppearanceTint();
      }
      this.moveUsingNavigation(decision.moveTarget, delta, this.speed * speedMultiplier);
    } else {
      this.setVelocity(0, 0);
      this.updateMovementAnimation(false);
    }
  }

  private spawnArrow(angle: number): void {
    const arrow = this.scene.physics.add.sprite(this.x, this.y, 'proj_divine_arrow') as Phaser.Physics.Arcade.Sprite & { bulletDamage: number; baseVelX: number; baseVelY: number };
    arrow.bulletDamage = this.attackDamage;
    this.projectileGroup?.add(arrow);
    arrow.setRotation(angle);
    arrow.baseVelX = Math.cos(angle) * 250;
    arrow.baseVelY = Math.sin(angle) * 250;
    arrow.setVelocity(arrow.baseVelX, arrow.baseVelY);
    this.scene.time.delayedCall(3000, () => {
      if (arrow.active) arrow.destroy();
    });
  }

  private shootSpread(targetX: number, targetY: number): void {
    const base = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.spawnArrow(base - 0.28);
    this.spawnArrow(base);
    this.spawnArrow(base + 0.28);
  }

  private shootArrow(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.spawnArrow(angle);
  }
}
