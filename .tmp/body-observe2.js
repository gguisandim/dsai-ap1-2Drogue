const s = game.scene.keys.GameScene;
return { count: window.__sceneUpdates, time: Math.round(s.time.now), physicsTime: s.physics.world.time, steps: s.physics.world.stepsLastFrame };
