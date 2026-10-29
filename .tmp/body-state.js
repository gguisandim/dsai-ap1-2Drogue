const s = game.scene.keys.GameScene;
const enemies = (s.enemies && s.enemies.getChildren) ? s.enemies.getChildren() : [];
return {
  levelId: s.currentLevel && s.currentLevel.id,
  levelName: s.currentLevel && s.currentLevel.name,
  macroCampaign: s.macroCampaign,
  macroRunId: s.macroRunId,
  macroRunSeed: s.macroRunSeed,
  macroStageSource: s.macroStageSource,
  modularStageSource: s.modularStageSource,
  currentWaveIndex: s.currentWaveIndex,
  wavesCount: Array.isArray(s.waves) ? s.waves.length : null,
  waveSizes: Array.isArray(s.waves) ? s.waves.map(w => (w.enemies||[]).length) : null,
  waveTransition: s.waveTransition,
  exitsRevealed: s.exitsRevealed,
  levelCleared: s.levelClearedBannerShowing,
  pendingExitTiles: s.pendingExitTiles && s.pendingExitTiles.length,
  player: s.player ? { x: Math.round(s.player.x), y: Math.round(s.player.y), hp: s.player.hp, maxHp: s.player.maxHp, magic: s.player.magic, maxMagic: s.player.maxMagic } : null,
  enemies: enemies.map(e => ({ x: Math.round(e.x), y: Math.round(e.y), hp: e.hp, maxHp: e.maxHp, active: e.active, kind: e.constructor && e.constructor.name })),
  enemyGroupCount: s.enemies ? s.enemies.getLength() : null,
};
