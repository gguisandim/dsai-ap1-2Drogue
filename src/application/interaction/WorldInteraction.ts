/**
 * Pure selection of the single world interaction an `E` press should trigger.
 * Shared by every stage/NPC so GameScene never grows a per-stage branch.
 */

export interface WorldInteractionPlayer {
  readonly x: number;
  readonly y: number;
}

export interface WorldInteractionPoint {
  readonly kind: 'poi' | 'exit';
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly dialogueId?: string;
  readonly physicalExitId?: string;
  /** Exits can be blocked; POIs are always actionable when in range. */
  readonly available?: boolean;
}

export interface WorldInteractionOptions {
  /** Maximum distance at which a point becomes actionable. */
  readonly radius?: number;
  /**
   * Bias granted to POIs when a portal is also in range. 0 means "always
   * prefer the POI"; a larger value lets a clearly closer portal win.
   */
  readonly poiPriorityMargin?: number;
}

export interface WorldInteractionResolution {
  readonly point: WorldInteractionPoint;
  readonly distance: number;
  readonly action: 'dialogue' | 'exit';
  readonly dialogueId?: string;
  readonly physicalExitId?: string;
}

export const DEFAULT_INTERACTION_RADIUS = 78;
export const DEFAULT_POI_PRIORITY_MARGIN = 24;

interface Candidate {
  readonly point: WorldInteractionPoint;
  readonly distance: number;
}

function usable(point: WorldInteractionPoint): boolean {
  return point.kind !== 'exit' || point.available !== false;
}

/**
 * Resolves exactly one interaction (never both portal and POI). POIs win when
 * inside `radius`, unless an available portal is closer by more than
 * `poiPriorityMargin`. Ties prefer the POI.
 */
export function resolveWorldInteraction(
  points: readonly WorldInteractionPoint[],
  player: WorldInteractionPlayer,
  options: WorldInteractionOptions = {},
): WorldInteractionResolution | undefined {
  const radius = options.radius ?? DEFAULT_INTERACTION_RADIUS;
  const margin = options.poiPriorityMargin ?? DEFAULT_POI_PRIORITY_MARGIN;
  const candidates: Candidate[] = [];
  for (const point of points) {
    if (!usable(point)) continue;
    const distance = Math.hypot(point.x - player.x, point.y - player.y);
    if (distance <= radius) candidates.push({ point, distance });
  }
  if (candidates.length === 0) return undefined;

  const nearestPoi = nearest(candidates, 'poi');
  const nearestExit = nearest(candidates, 'exit');
  let chosen: Candidate;
  if (nearestPoi && nearestExit) {
    chosen = nearestPoi.distance <= nearestExit.distance + margin ? nearestPoi : nearestExit;
  } else {
    chosen = (nearestPoi ?? nearestExit) as Candidate;
  }
  return Object.freeze({
    point: chosen.point,
    distance: chosen.distance,
    action: chosen.point.kind === 'poi' ? 'dialogue' as const : 'exit' as const,
    ...(chosen.point.dialogueId ? { dialogueId: chosen.point.dialogueId } : {}),
    ...(chosen.point.physicalExitId ? { physicalExitId: chosen.point.physicalExitId } : {}),
  });
}

function nearest(candidates: readonly Candidate[], kind: WorldInteractionPoint['kind']): Candidate | undefined {
  let best: Candidate | undefined;
  for (const candidate of candidates) {
    if (candidate.point.kind !== kind) continue;
    if (!best || candidate.distance < best.distance) best = candidate;
  }
  return best;
}

/** Builds interaction points from a loaded stage's NPCs and its campaign exits. */
export function poiInteractionPoints(
  npcs: readonly { readonly id: string; readonly displayName: string; readonly spawn: { readonly kind: string; readonly x?: number; readonly y?: number }; readonly interactionDialogueId?: string }[],
): WorldInteractionPoint[] {
  const points: WorldInteractionPoint[] = [];
  for (const npc of npcs) {
    if (npc.spawn.kind !== 'tile' || npc.spawn.x === undefined || npc.spawn.y === undefined) continue;
    if (!npc.interactionDialogueId) continue;
    points.push(Object.freeze({
      kind: 'poi' as const,
      id: npc.id,
      x: npc.spawn.x * 32 + 16,
      y: npc.spawn.y * 32 + 16,
      label: npc.displayName,
      dialogueId: npc.interactionDialogueId,
    }));
  }
  return points;
}
