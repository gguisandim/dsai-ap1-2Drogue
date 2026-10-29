return {
  gameCount: this.length,
  running: game.isRunning,
  sceneKeys: Object.keys(game.scene.keys || {}),
  activeScenes: (game.scene.getScenes(true) || []).map(s => s.scene.key),
};
