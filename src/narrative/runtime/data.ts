export function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function cloneFrozen<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => cloneFrozen(item))) as T;
  }
  if (value !== null && typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = cloneFrozen(item);
    }
    return Object.freeze(clone) as T;
  }
  return value;
}

export function success<T>(value: T): { readonly ok: true; readonly value: T } {
  return Object.freeze({ ok: true as const, value });
}

export function failure<E>(error: E): { readonly ok: false; readonly error: E } {
  return Object.freeze({ ok: false as const, error });
}

export const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

export function isScalar(value: unknown): value is boolean | number | string {
  return typeof value === 'boolean' || typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value));
}
