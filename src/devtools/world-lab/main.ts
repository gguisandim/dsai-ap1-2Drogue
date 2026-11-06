import './world-lab.css';
import {
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../../stages';
import { WorldLabDataService } from './WorldLabDataService';
import { WorldLabSession } from './WorldLabSession';
import { WorldLabApp } from './ui/WorldLabApp';
import { authoringChapters, createAuthoringValidationSource } from './authoringValidation';

const root = document.querySelector<HTMLElement>('#world-lab-root');
if (!root) throw new Error('Umbra World Lab root element is missing.');

const query = new URLSearchParams(globalThis.location?.search ?? '');
const presentationVariantId = query.get('presentationVariant')?.trim() || undefined;
const focusStageId = query.get('stage')?.trim() || query.get('stagePreview')?.trim() || undefined;

const registry = new StageRegistry();
registerLegacyStages(registry);
registerCampaignChapters(registry);
authoringChapters().forEach(entry => {
  try {
    registerCampaignChapters(registry, [entry]);
  } catch {
    // An invalid authoring chapter must not take the whole World Lab down.
  }
});

const session = new WorldLabSession(new WorldLabDataService({
  presentationVariantId,
  registry,
  validationSource: createAuthoringValidationSource(),
  ...(focusStageId ? { focusStageId } : {}),
}));
new WorldLabApp(root, session).start();

