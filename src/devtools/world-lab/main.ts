import './world-lab.css';
import { WorldLabDataService } from './WorldLabDataService';
import { WorldLabSession } from './WorldLabSession';
import { WorldLabApp } from './ui/WorldLabApp';

const root = document.querySelector<HTMLElement>('#world-lab-root');
if (!root) throw new Error('Umbra World Lab root element is missing.');

const query = new URLSearchParams(globalThis.location?.search ?? '');
const presentationVariantId = query.get('presentationVariant')?.trim() || undefined;
const focusStageId = query.get('stage')?.trim() || query.get('stagePreview')?.trim() || undefined;
const session = new WorldLabSession(new WorldLabDataService({
  presentationVariantId,
  ...(focusStageId ? { focusStageId } : {}),
}));
new WorldLabApp(root, session).start();

