const s=game.scene.keys.GameScene;
return {levelId:s.currentLevel&&s.currentLevel.id,levelName:s.currentLevel&&s.currentLevel.name,macroCampaign:s.macroCampaign,macroRunId:s.macroRunId,macroRunSeed:s.macroRunSeed,macroStageSource:s.macroStageSource,player:{x:Math.round(s.player.x),y:Math.round(s.player.y),hp:s.player.hp},alive:s.enemies.countActive(true)};
