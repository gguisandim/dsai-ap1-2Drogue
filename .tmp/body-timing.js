const s = game.scene.keys.GameScene; const w=s.physics.world;
return { elapsed: w._elapsed, frameTimeMS: w._frameTimeMS, frameTime: w._frameTime, timeScale: w.timeScale, fixedStep: w.fixedStep, isPaused: w.isPaused, bodies: w.bodies.size, stepsLastFrame: w.stepsLastFrame, clockDelta: Math.round(s.game.loop.delta) };
