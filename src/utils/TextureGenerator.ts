// src/utils/TextureGenerator.ts
// Programmatically generates rich 2D vector textures for all game entities, map tiles,
// items, weapons, visual effects, and UI elements. 
// Uses Phaser's Canvas & Graphics pipelines so everything renders natively without missing textures.

import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAllTextures(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Player (Bayonetta)
    if (!tm.exists('player_bayo')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Witch Suit / Silhouette
      g.fillStyle(0x1a0f2b, 1);
      g.fillCircle(16, 16, 14);
      // Long hair ribbon / tail
      g.fillStyle(0x110820, 1);
      g.fillRect(14, 24, 4, 12);
      // Scarborough Fair Gold accents
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(10, 14, 3);
      g.fillCircle(22, 14, 3);
      // Crimson Rose/Glasses highlight
      g.fillStyle(0xff0044, 1);
      g.fillRect(13, 10, 6, 2);
      g.generateTexture('player_bayo', 32, 36);
      g.destroy();
    }

    // 2. Enemy — Affinity (Standard Angel)
    if (!tm.exists('enemy_affinity')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(20, 37, 30, 7);
      g.fillStyle(0x641f32, 1);
      g.fillRoundedRect(5, 13, 30, 25, 7);
      g.fillTriangle(5, 17, 20, 2, 35, 17);
      g.fillStyle(0xe5c49b, 1);
      g.fillRect(12, 15, 16, 12);
      g.fillStyle(0xffd35a, 1);
      g.fillRect(14, 19, 4, 4);
      g.fillRect(23, 19, 4, 4);
      g.fillStyle(0x2a1520, 1);
      g.fillRect(10, 30, 8, 9);
      g.fillRect(23, 30, 8, 9);
      g.generateTexture('enemy_affinity', 40, 42);
      g.destroy();
    }

    // 3. Enemy — Applaud (Flying Archer Angel)
    if (!tm.exists('enemy_applaud')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(22, 39, 32, 7);
      g.fillStyle(0x28735b, 1);
      g.fillEllipse(22, 24, 34, 26);
      g.fillTriangle(7, 21, 2, 8, 15, 16);
      g.fillTriangle(37, 21, 42, 8, 29, 16);
      g.fillStyle(0xa9d18e, 1);
      g.fillCircle(22, 18, 11);
      g.fillStyle(0x421d4d, 1);
      g.fillRect(14, 12, 16, 7);
      g.fillStyle(0xffef8a, 1);
      g.fillRect(17, 15, 4, 3);
      g.fillRect(25, 15, 4, 3);
      g.generateTexture('enemy_applaud', 44, 44);
      g.destroy();
    }

    // 4. Boss — Fortitudo (Auditia of Courage - Dragon Boss)
    if (!tm.exists('boss_fortitudo')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Golden Fiery Dragon Head & Body
      g.fillStyle(0xcc3300, 1);
      g.fillCircle(40, 40, 36);
      // Golden Divine Mask
      g.fillStyle(0xffd700, 1);
      g.fillTriangle(40, 10, 15, 60, 65, 60);
      // Two Angel Heads on Shoulders
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 25, 12);
      g.fillCircle(62, 25, 12);
      // Lava Core
      g.fillStyle(0xffaa00, 1);
      g.fillCircle(40, 45, 16);
      g.generateTexture('boss_fortitudo', 80, 80);
      g.destroy();
    }

    // 5. Boss — Temperantia (Auditia of Temperance - Colossus Boss)
    if (!tm.exists('boss_temperantia')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Sacred Mechanical Golem
      g.fillStyle(0x4a6572, 1);
      g.fillRect(10, 10, 70, 70);
      // Golden Inscription Rings
      g.lineStyle(4, 0xffd700, 1);
      g.strokeCircle(45, 45, 28);
      // Glowing Azure Eye
      g.fillStyle(0x00e5ff, 1);
      g.fillCircle(45, 45, 12);
      g.generateTexture('boss_temperantia', 90, 90);
      g.destroy();
    }

    // 6. Projectile — Divine Arrow
    if (!tm.exists('proj_divine_arrow')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00ffff, 1);
      g.fillRect(0, 3, 12, 2);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(12, 0, 16, 4, 12, 8);
      g.generateTexture('proj_divine_arrow', 16, 8);
      g.destroy();
    }

    if (!tm.exists('proj_magic_orb')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38206f, 0.45);
      g.fillCircle(14, 14, 13);
      g.fillStyle(0x4e9be8, 0.7);
      g.fillCircle(14, 14, 10);
      g.fillStyle(0x67e8ff, 1);
      g.fillCircle(14, 14, 7);
      g.fillStyle(0xe9fdff, 1);
      g.fillCircle(12, 11, 3);
      g.fillRect(2, 13, 5, 2);
      g.fillRect(21, 13, 5, 2);
      g.fillRect(13, 2, 2, 5);
      g.fillRect(13, 21, 2, 5);
      g.generateTexture('proj_magic_orb', 28, 28);
      g.destroy();
    }

    if (!tm.exists('proj_magic_bolt')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38206f, 0.35);
      g.fillRoundedRect(0, 1, 44, 8, 4);
      g.fillStyle(0x67e8ff, 0.85);
      g.fillTriangle(4, 2, 48, 5, 4, 8);
      g.fillStyle(0xe9fdff, 1);
      g.fillTriangle(12, 4, 48, 5, 12, 6);
      g.generateTexture('proj_magic_bolt', 48, 10);
      g.destroy();
    }

    if (!tm.exists('proj_ranger_arrow')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x80502c, 1);
      g.fillRect(4, 5, 27, 3);
      g.fillStyle(0xe9edf0, 1);
      g.fillTriangle(31, 2, 39, 6, 31, 11);
      g.fillStyle(0xb7d86b, 1);
      g.fillTriangle(8, 6, 0, 1, 3, 6);
      g.fillTriangle(8, 7, 0, 12, 3, 7);
      g.generateTexture('proj_ranger_arrow', 40, 13);
      g.destroy();
    }

    if (!tm.exists('proj_rogue_dagger')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xdfe6f5, 1);
      g.fillTriangle(4, 3, 24, 7, 4, 11);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(5, 4, 20, 7, 5, 7);
      g.fillStyle(0xe84f75, 1);
      g.fillRect(2, 3, 4, 8);
      g.fillStyle(0x6b3d2a, 1);
      g.fillRect(0, 5, 4, 4);
      g.generateTexture('proj_rogue_dagger', 25, 14);
      g.destroy();
    }

    if (!tm.exists('proj_sword_wave')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(6, 0xf8e7a4, 0.95);
      g.beginPath();
      g.arc(4, 18, 16, -1.1, 1.1, false);
      g.strokePath();
      g.lineStyle(2, 0xffffff, 0.9);
      g.beginPath();
      g.arc(5, 18, 11, -1.05, 1.05, false);
      g.strokePath();
      g.generateTexture('proj_sword_wave', 25, 36);
      g.destroy();
    }

    // 7. Projectile — Wicked Weave Fist
    if (!tm.exists('fx_wicked_fist')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Dark Purple Demonic Giant Hand
      g.fillStyle(0x660099, 0.9);
      g.fillCircle(30, 30, 26);
      g.fillStyle(0xaa00ff, 1);
      g.fillRect(10, 10, 40, 40);
      g.fillStyle(0xff33cc, 1);
      g.fillCircle(20, 20, 6);
      g.fillCircle(40, 20, 6);
      g.generateTexture('fx_wicked_fist', 60, 60);
      g.destroy();
    }

    // 7b. Summon — small glowing wisp (tinted per class at spawn)
    if (!tm.exists('fx_summon')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(12, 12, 11);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(12, 12, 6);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(9, 9, 2);
      g.generateTexture('fx_summon', 24, 24);
      g.destroy();
    }

    // Narrative marker fallback used by legacy stages without a custom NPC sprite.
    if (!tm.exists('poi_vestige')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0b2a24, 1);
      g.fillCircle(12, 12, 11);
      g.lineStyle(2, 0x8fe0c8, 1);
      g.strokeCircle(12, 12, 10);
      g.fillStyle(0x8fe0c8, 1);
      g.fillCircle(12, 12, 4);
      g.generateTexture('poi_vestige', 24, 24);
      g.destroy();
    }

    // 7b. Key pickup
    if (!tm.exists('item_key')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffd700, 1);
      g.fillCircle(7, 7, 6);
      g.fillStyle(0x000000, 0);
      g.fillStyle(0xffd700, 1);
      g.fillRect(11, 5, 9, 4);
      g.fillRect(16, 9, 3, 4);
      g.generateTexture('item_key', 24, 24);
      g.destroy();
    }

    // 8. Map Tiles — Wall, Floor, Pillar, Water, Lava, Door, Chest, Stairs
    if (!tm.exists('tile_floor')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x5a3f45, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x674b4d, 1);
      g.fillRect(2, 2, 28, 28);
      g.lineStyle(1, 0x80605b, 1);
      g.strokeRect(0, 0, 32, 32);
      g.lineStyle(1, 0x493238, 1);
      g.lineBetween(4, 26, 12, 18);
      g.generateTexture('tile_floor', 32, 32);
      g.destroy();
    }

    if (!tm.exists('tile_wall')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x170f1b, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x3b2938, 1);
      g.fillRect(1, 1, 30, 25);
      g.fillStyle(0x523849, 1);
      g.fillRect(3, 3, 26, 8);
      g.fillRect(3, 14, 12, 9);
      g.fillRect(18, 14, 11, 9);
      g.fillStyle(0x0b080d, 1);
      g.fillRect(0, 27, 32, 5);
      g.lineStyle(1, 0x765469, 1);
      g.strokeRect(0, 0, 32, 32);
      g.generateTexture('tile_wall', 32, 32);
      g.destroy();
    }

    if (!tm.exists('tile_pillar')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x201720, 1);
      g.fillRect(2, 5, 28, 25);
      g.fillStyle(0x75606b, 1);
      g.fillRect(4, 2, 24, 24);
      g.fillStyle(0x9a7e76, 1);
      g.fillRect(7, 5, 18, 5);
      g.fillStyle(0xd7a43b, 1);
      g.fillRect(7, 15, 5, 5);
      g.fillRect(20, 15, 5, 5);
      g.lineStyle(2, 0x33242e, 1);
      g.strokeRect(4, 2, 24, 24);
      g.generateTexture('tile_pillar', 32, 32);
      g.destroy();
    }

    if (!tm.exists('tile_lava')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xcc2200, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xffbb00, 0.8);
      g.fillCircle(16, 16, 10);
      g.generateTexture('tile_lava', 32, 32);
      g.destroy();
    }

    if (!tm.exists('tile_water')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x004488, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x0088cc, 0.6);
      g.fillCircle(16, 16, 8);
      g.generateTexture('tile_water', 32, 32);
      g.destroy();
    }

    if (!tm.exists('tile_stairs')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1a0f2b, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x3a154d, 1);
      g.fillCircle(16, 16, 14);
      g.lineStyle(3, 0xf6d77a, 1);
      g.strokeCircle(16, 16, 11);
      g.lineStyle(2, 0xc06cff, 1);
      g.strokeCircle(16, 16, 6);
      g.generateTexture('tile_stairs', 32, 32);
      g.destroy();
    }

    if (!tm.exists('item_potion')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00cc44, 1);
      g.fillCircle(12, 14, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 4, 4, 4);
      g.generateTexture('item_potion', 24, 24);
      g.destroy();
    }

    if (!tm.exists('item_heart')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      const outline = [
        new Phaser.Geom.Point(12, 22), new Phaser.Geom.Point(3, 13),
        new Phaser.Geom.Point(3, 7), new Phaser.Geom.Point(6, 4),
        new Phaser.Geom.Point(10, 4), new Phaser.Geom.Point(12, 7),
        new Phaser.Geom.Point(14, 4), new Phaser.Geom.Point(18, 4),
        new Phaser.Geom.Point(21, 7), new Phaser.Geom.Point(21, 13),
      ];
      g.fillStyle(0x4d1021, 1);
      g.fillPoints(outline, true, true);
      const heart = [
        new Phaser.Geom.Point(12, 19), new Phaser.Geom.Point(5, 12),
        new Phaser.Geom.Point(5, 8), new Phaser.Geom.Point(7, 6),
        new Phaser.Geom.Point(10, 6), new Phaser.Geom.Point(12, 9),
        new Phaser.Geom.Point(14, 6), new Phaser.Geom.Point(17, 6),
        new Phaser.Geom.Point(19, 8), new Phaser.Geom.Point(19, 12),
      ];
      g.fillStyle(0xf0445e, 1);
      g.fillPoints(heart, true, true);
      g.fillStyle(0xff9aac, 1);
      g.fillRect(7, 7, 3, 3);
      g.generateTexture('item_heart', 24, 24);
      g.destroy();
    }

    if (!tm.exists('item_halo')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(3, 0xffd700, 1);
      g.strokeCircle(12, 12, 8);
      g.fillStyle(0xffea00, 0.5);
      g.fillCircle(12, 12, 7);
      g.generateTexture('item_halo', 24, 24);
      g.destroy();
    }

    if (!tm.exists('weapon_scarborough_fair')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x2a193b, 1);
      g.fillRoundedRect(5, 14, 34, 11, 3);
      g.fillRect(28, 22, 9, 19);
      g.fillStyle(0xf0c74b, 1);
      g.fillRect(8, 17, 29, 4);
      g.fillRect(31, 24, 4, 13);
      g.fillStyle(0x6f1f4c, 1);
      g.fillRoundedRect(25, 39, 34, 11, 3);
      g.fillRect(27, 47, 9, 13);
      g.fillStyle(0xff6a9b, 1);
      g.fillRect(28, 42, 28, 4);
      g.fillRect(29, 48, 4, 10);
      g.generateTexture('weapon_scarborough_fair', 64, 64);
      g.destroy();
    }

    if (!tm.exists('weapon_shuraba')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf3e9dc, 1);
      g.fillTriangle(12, 52, 47, 9, 54, 5);
      g.fillTriangle(12, 52, 48, 16, 47, 9);
      g.fillStyle(0xff4169, 1);
      g.fillTriangle(18, 48, 48, 14, 44, 23);
      g.fillStyle(0xe8b84a, 1);
      g.fillRoundedRect(10, 46, 18, 5, 2);
      g.fillStyle(0x321426, 1);
      g.fillRoundedRect(4, 50, 15, 8, 2);
      g.generateTexture('weapon_shuraba', 64, 64);
      g.destroy();
    }

    if (!tm.exists('weapon_kulshedra')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(6, 0x37164d, 1);
      g.beginPath();
      g.moveTo(13, 53);
      g.lineTo(22, 43);
      g.lineTo(38, 46);
      g.lineTo(52, 37);
      g.lineTo(54, 23);
      g.lineTo(44, 12);
      g.lineTo(29, 11);
      g.strokePath();
      g.lineStyle(3, 0xc265ff, 1);
      g.beginPath();
      g.moveTo(14, 51);
      g.lineTo(23, 42);
      g.lineTo(38, 45);
      g.lineTo(50, 36);
      g.lineTo(51, 24);
      g.lineTo(43, 15);
      g.lineTo(30, 14);
      g.strokePath();
      g.fillStyle(0xe4c56a, 1);
      g.fillRoundedRect(6, 49, 14, 9, 3);
      g.generateTexture('weapon_kulshedra', 64, 64);
      g.destroy();
    }

    if (!tm.exists('weapon_durga')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x4b1e20, 1);
      g.fillRoundedRect(7, 30, 20, 22, 5);
      g.fillStyle(0xff6a24, 1);
      g.fillTriangle(7, 33, 10, 8, 15, 33);
      g.fillTriangle(14, 31, 20, 5, 21, 34);
      g.fillTriangle(21, 34, 29, 13, 27, 39);
      g.fillStyle(0x173c5c, 1);
      g.fillRoundedRect(37, 30, 20, 22, 5);
      g.fillStyle(0x65dcff, 1);
      g.fillTriangle(37, 39, 35, 13, 43, 34);
      g.fillTriangle(43, 34, 44, 5, 50, 31);
      g.fillTriangle(50, 33, 55, 8, 57, 33);
      g.generateTexture('weapon_durga', 64, 64);
      g.destroy();
    }

    if (!tm.exists('weapon_kilgore')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x263326, 1);
      g.fillRoundedRect(7, 20, 47, 23, 5);
      g.fillStyle(0x92b84c, 1);
      g.fillRect(12, 24, 35, 7);
      g.fillStyle(0x141916, 1);
      g.fillCircle(51, 31, 10);
      g.fillStyle(0xd8e58c, 1);
      g.fillCircle(51, 31, 5);
      g.fillStyle(0x38483a, 1);
      g.fillRoundedRect(19, 41, 13, 15, 3);
      g.fillStyle(0xff8b2c, 1);
      g.fillTriangle(7, 25, 7, 39, 0, 32);
      g.generateTexture('weapon_kilgore', 64, 64);
      g.destroy();
    }

    if (!tm.exists('item_chest')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8b4513, 1);
      g.fillRect(2, 6, 28, 20);
      g.fillStyle(0xd4af37, 1);
      g.fillRect(2, 6, 28, 4);
      g.fillRect(14, 14, 4, 6);
      g.generateTexture('item_chest', 32, 32);
      g.destroy();
    }
  }
}
