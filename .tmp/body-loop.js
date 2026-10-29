const s = game.scene.keys.GameScene;
return {
  actualFps: game.loop.actualFps, delta: game.loop.delta, targetFps: game.loop.targetFps,
  isRunning: game.loop.running, paused: game.loop.paused,
  sceneActive: s.scene.isActive(), scenePaused: s.scene.isPaused(),
  combatInputEnabled: s.player.combatInputEnabled,
  playerSpeed: s.player.speed, heroSpeed: s.player.heroClass && s.player.heroClass.speed,
  isDodging: s.player.isDodging, isTransitioning: s.isTransitioning,
  keyD: s.player.keyD ? { isDown: s.player.keyD.isDown, enabled: s.player.keyD.enabled } : null,
  body: s.player.body ? { vx: Math.round(s.player.body.velocity.x), vy: Math.round(s.player.body.velocity.y), enable: s.player.body.enable } : null,
  visibility: document.visibilityState, hidden: document.hidden,
};
