const s=game.scene.keys.GameScene;
const c=s.modularComposition, l=s.macroLoadedStage;
if(!c||!l) return {missing:{c:!!c,l:!!l}};
const key=`umbra-trail-campaign-v1:${s.macroRunId}:${l.manifest.chapterId}:${l.manifest.id}`;
const created=c.createNarrativeSession(l,{campaignId:s.macroCampaignAdapter && s.macroCampaignAdapter.campaignId(),runId:s.macroRunId,runSeed:s.macroRunSeed,stageInstanceId:s.campaignNavigation && s.campaignNavigation.currentNode.id},{level:s.progression.levelProgress().level,unlockedContent:s.progression.snapshot().unlockedContent},key);
return {ok:created.ok, error:created.ok?null:created.error, chapterId:l.manifest.chapterId, stageId:l.manifest.id, node:s.campaignNavigation && s.campaignNavigation.currentNode.id, key};
