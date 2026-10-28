import './world-lab.css';
import { WorldLabApp } from './ui/WorldLabApp';

const root = document.querySelector<HTMLElement>('#world-lab-root');
if (!root) throw new Error('Umbra World Lab root element is missing.');

new WorldLabApp(root).start();

