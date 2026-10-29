const s=game.scene.keys.GameScene;
const sess=s.modularNarrativeSession;
const snap=sess?sess.director.snapshot():null;
return {
  levelId:s.currentLevel.id,
  guide:s.controlsGuideOpen,
  points:(s.interactionPoints||[]).length,
  markers:(s.poiMarkers||[]).length,
  session:!!sess,
  flag:snap&&snap.flags['flag.aguas.igapo.eco-das-aguas-seen'],
  processed:snap?snap.processedEventIds.length:null,
  fired:snap?snap.firedRuleIds.length:null,
  applied:snap?snap.appliedOperationIds.length:null,
};
