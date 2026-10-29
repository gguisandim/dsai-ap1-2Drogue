// src/ui/ShopUI.ts
// Gates of Hell Shop interface managed by Rodin.
// Allows buying new weapons, accessories, lollipops, and witch heart upgrades using Halos.

import Phaser from 'phaser';
import { ITEM_DATABASE } from '../data/ItemDatabase';
import { Player } from '../entities/Hero';
import { isShopItemSupported, purchaseShopItem } from './ShopPurchase';

export class ShopUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isOpen: boolean = false;
  private player: Player;
  private haloText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    this.buildUI();
  }

  private buildUI(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Dark semi-transparent overlay
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x05020a, 0.92);
    this.container.add(overlay);

    // Shop Panel Container
    const panel = this.scene.add.rectangle(width / 2, height / 2, 700, 500, 0x1a0f2b, 0.95);
    panel.setStrokeStyle(3, 0xd4af37, 1);
    this.container.add(panel);

    // Title — Gates of Hell
    const title = this.scene.add.text(width / 2, height / 2 - 220, "THE GATES OF HELL", {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(title);

    const subtitle = this.scene.add.text(width / 2, height / 2 - 190, "Rodin's Treasury of Demon Arms & Relics", {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#aa88cc',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    this.container.add(subtitle);

    // Halo Counter
    this.haloText = this.scene.add.text(width / 2 + 200, height / 2 - 220, "Halos: 0", {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ffee66',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.haloText);

    // Close Button (Press ESC or Click X)
    const closeBtn = this.scene.add.text(width / 2 + 320, height / 2 - 220, "[X]", {
      fontSize: '22px',
      color: '#ff3366',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggle(false));
    this.container.add(closeBtn);

    // Item Cards Container
    this.renderShopItems(width, height);
  }

  private renderShopItems(width: number, height: number): void {
    let startY = height / 2 - 140;
    const itemKeys = ['green_lollipop', 'purple_lollipop', 'yellow_lollipop', 'moon_mahaa_kalaa', 'evil_harvest_rosary'];

    // Combine weapons and items
    const shopList: {
      name: string; price: number; desc: string; supported: boolean; buyFn: () => void;
    }[] = [];

    itemKeys.forEach(iKey => {
      const item = ITEM_DATABASE[iKey];
      if (item) {
        shopList.push({
          name: item.name,
          price: item.price,
          desc: item.description,
          supported: isShopItemSupported(item),
          buyFn: () => {
            const purchase = purchaseShopItem(this.player, item);
            if (purchase.ok) {
              this.updateHaloCount();
              alert(`Purchased: ${item.name}!`);
            } else {
              alert(purchase.error.message);
            }
          }
        });
      }
    });

    // Display first 5 shop entries visually
    shopList.slice(0, 5).forEach((entry, idx) => {
      const itemBg = this.scene.add.rectangle(width / 2, startY, 640, 60, 0x2d1a40, 0.8);
      itemBg.setStrokeStyle(1, 0x663399, 1);
      this.container.add(itemBg);

      const nameTxt = this.scene.add.text(width / 2 - 300, startY - 15, entry.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      this.container.add(nameTxt);

      const descTxt = this.scene.add.text(
        width / 2 - 300,
        startY + 5,
        entry.supported ? entry.desc.substring(0, 55) + '...' : 'Efeito indisponível nesta versão.',
        {
          fontSize: '12px',
          color: entry.supported ? '#bb99dd' : '#776688'
        },
      );
      this.container.add(descTxt);

      const buyBtn = this.scene.add.text(
        width / 2 + 220,
        startY,
        entry.supported ? `BUY (${entry.price} ⏣)` : 'INDISPONÍVEL',
        {
          fontSize: '14px',
          color: entry.supported ? '#ffd700' : '#776688',
          backgroundColor: entry.supported ? '#4a154b' : '#2a1a33',
          padding: { x: 10, y: 6 }
        },
      ).setOrigin(0.5);

      if (entry.supported) {
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', entry.buyFn);
      }
      this.container.add(buyBtn);

      startY += 70;
    });
  }

  public toggle(show?: boolean): void {
    this.isOpen = show !== undefined ? show : !this.isOpen;
    this.container.setVisible(this.isOpen);
    if (this.isOpen) {
      this.player.setVelocity(0, 0);
      this.scene.physics.world.pause();
      this.updateHaloCount();
    } else {
      this.scene.physics.world.resume();
    }
  }

  public updateHaloCount(): void {
    if (this.haloText && this.player) {
      this.haloText.setText(`Halos: ${this.player.halos || 0}`);
    }
  }

  public getIsVisible(): boolean {
    return this.isOpen;
  }
}
