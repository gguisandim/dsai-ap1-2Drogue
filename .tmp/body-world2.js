const s = game.scene.keys.GameScene; const w=s.physics.world;
return {
  stepsLastFrame: w.stepsLastFrame, frameTime: w._frameTime,
  worldTime: Math.round(w.time), sceneTime: Math.round(s.time.now),
  fixedDelta: w.fixedDelta, isPaused: w.isPaused,
  hasStepFn: typeof w.step, physicsConfig: s.sys.settings.physics ? Object.keys(s.sys.settings.physics) : null,
  arcadeSystems: !!s.physics, bodyCount: w.bodies.size,
  enemies: (s.enemies.getChildren()||[]).map(e=>({x:Math.round(e.x),y:Math.round(e.y),bprev:{x:Math.round(e.body.prev.x),y:Math.round(e.body.prev.y)},vel:{x:Math.round(e.body.velocity.x),y:Math.round(e.body.velocity.y)}})),
};
