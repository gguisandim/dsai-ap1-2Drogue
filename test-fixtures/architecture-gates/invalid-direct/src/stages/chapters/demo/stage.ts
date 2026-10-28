import { internalCombatRuntime } from '../../../combat/internal';

const runtimeModule = 'phaser';
export const stage = internalCombatRuntime;
export const loadRuntime = () => import(runtimeModule);
