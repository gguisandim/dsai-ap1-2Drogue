const s=game.scene.keys.GameScene;
return {wave:s.currentWaveIndex,alive:s.enemies.countActive(true),exitsRevealed:s.exitsRevealed,levelCleared:s.levelClearedBannerShowing,pendingExitTiles:s.pendingExitTiles,player:{x:Math.round(s.player.x),y:Math.round(s.player.y),hp:s.player.hp},objective:(s.objectiveText&&s.objectiveText.text)||null};
