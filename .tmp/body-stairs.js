const s=game.scene.keys.GameScene;
const stairs=s.stairTiles?s.stairTiles.getChildren().map(w=>({x:w.x,y:w.y,w:w.width,h:w.height,active:w.active,vis:w.visible,tex:w.texture&&w.texture.key})):[];
return {count:stairs.length,stairs,levelId:s.currentLevel.id,tileW:s.currentLevel.tileWidth,tileH:s.currentLevel.tileHeight};
