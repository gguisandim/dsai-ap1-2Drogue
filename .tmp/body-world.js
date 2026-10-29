const s = game.scene.keys.GameScene; const w = s.physics.world; const b=s.player.body;
return {
  worldPaused: w.isPaused, worldBodies: w.bodies ? w.bodies.size : null,
  bodyInWorld: w.bodies ? w.bodies.contains(b) : null,
  bodyWorldSame: b.world === w,
  bodyEnable: b.enable, bodyEnableBody: b.enableBody, bodyMoves: b.moves,
  bodyPos: {x:b.x,y:b.y}, playerPos:{x:s.player.x,y:s.player.y},
  bodyPrev: {x:b.prev.x,y:b.prev.y},
  bodyGravity: {x:b.gravity.x,y:b.gravity.y},
  stepListeners: w.bodies ? 'ok':null,
  fixedStep: w.fixedStep, overlapBias: w.overlapBias,
  sysStep: s.sys.settings.status,
};
