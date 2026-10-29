import {
  DEFAULT_INTERACTION_RADIUS,
  poiInteractionPoints,
  resolveWorldInteraction,
} from '../application/interaction/WorldInteraction';
import type { WorldInteractionPoint } from '../application/interaction/WorldInteraction';

const poi = (x: number, y: number, id = 'npc.test.poi'): WorldInteractionPoint => ({
  kind: 'poi', id, x, y, label: 'Vestígio', dialogueId: 'dialogue.test.poi',
});
const exit = (x: number, y: number, available = true): WorldInteractionPoint => ({
  kind: 'exit', id: 'exit.test', x, y, label: 'Saída', physicalExitId: 'physical.test', available,
});

describe('world interaction resolution', () => {
  it('returns undefined when nothing is inside the radius', () => {
    expect(resolveWorldInteraction([poi(500, 500)], { x: 0, y: 0 })).toBeUndefined();
  });

  it('returns the POI when it is the only target in range', () => {
    const resolution = resolveWorldInteraction([poi(40, 0)], { x: 0, y: 0 });
    expect(resolution).toMatchObject({ action: 'dialogue', dialogueId: 'dialogue.test.poi' });
  });

  it('prefers the POI when a portal is also in range', () => {
    const resolution = resolveWorldInteraction([poi(40, 0), exit(30, 0)], { x: 0, y: 0 });
    expect(resolution?.action).toBe('dialogue');
    expect(resolution?.point.kind).toBe('poi');
  });

  it('prefers a clearly closer portal beyond the POI margin', () => {
    const resolution = resolveWorldInteraction(
      [poi(70, 0), exit(10, 0)],
      { x: 0, y: 0 },
      { poiPriorityMargin: 20 },
    );
    expect(resolution?.action).toBe('exit');
    expect(resolution?.physicalExitId).toBe('physical.test');
  });

  it('ignores unavailable exits', () => {
    expect(resolveWorldInteraction([exit(10, 0, false)], { x: 0, y: 0 })).toBeUndefined();
  });

  it('uses the default radius boundary', () => {
    expect(resolveWorldInteraction([poi(DEFAULT_INTERACTION_RADIUS, 0)], { x: 0, y: 0 })).toBeTruthy();
    expect(resolveWorldInteraction([poi(DEFAULT_INTERACTION_RADIUS + 1, 0)], { x: 0, y: 0 })).toBeUndefined();
  });

  it('maps tile-anchored NPCs to world coordinates and skips non-tile spawns', () => {
    const points = poiInteractionPoints([
      { id: 'npc.a', displayName: 'A', spawn: { kind: 'tile', x: 27, y: 17 }, interactionDialogueId: 'dialogue.a' },
      { id: 'npc.b', displayName: 'B', spawn: { kind: 'player-spawn' }, interactionDialogueId: 'dialogue.b' },
      { id: 'npc.c', displayName: 'C', spawn: { kind: 'tile', x: 1, y: 1 } },
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ id: 'npc.a', x: 27 * 32 + 16, y: 17 * 32 + 16, dialogueId: 'dialogue.a' });
  });
});
