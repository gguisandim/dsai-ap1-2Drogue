import Phaser from 'phaser';

const BACKDROP_TEXTURE = 'world_root_trail_composition';

export function createForestMenuBackdrop(scene: Phaser.Scene): void {
  const { width, height } = scene.scale.gameSize;
  if (scene.textures.exists(BACKDROP_TEXTURE)) {
    const texture = scene.textures.get(BACKDROP_TEXTURE).getSourceImage();
    const scale = Math.max(width / texture.width, height / texture.height);
    scene.add.image(width / 2, height / 2, BACKDROP_TEXTURE)
      .setScale(scale)
      .setTint(0x9cae98)
      .setDepth(-3);
  } else {
    scene.cameras.main.setBackgroundColor('#101c1b');
  }

  scene.add.rectangle(width / 2, height / 2, width, height, 0x07100f, 0.62)
    .setDepth(-2);
  scene.add.rectangle(width / 2, height * 0.84, width, height * 0.32, 0x08100e, 0.42)
    .setDepth(-1);

  for (let index = 0; index < 7; index += 1) {
    const x = width * (0.12 + ((index * 37) % 76) / 100);
    const y = height * (0.3 + ((index * 23) % 50) / 100);
    const mote = scene.add.circle(x, y, index % 3 === 0 ? 2 : 1.5, 0xe7d990, 0.18)
      .setDepth(1);
    scene.tweens.add({
      targets: mote,
      x: x + (index % 2 === 0 ? 11 : -9),
      y: y - 16 - (index % 3) * 5,
      alpha: { from: 0.12, to: 0.5 },
      duration: 3600 + index * 430,
      delay: index * 250,
      yoyo: true,
      repeat: -1,
    });
  }
}
