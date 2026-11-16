export function firstFocusableIndex(items: readonly boolean[]): number {
  return items.findIndex(Boolean);
}

export function moveFocus(
  items: readonly boolean[],
  current: number,
  direction: -1 | 1,
): number {
  if (items.length === 0 || !items.some(Boolean)) return -1;
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (current + direction * offset + items.length) % items.length;
    if (items[index]) return index;
  }
  return -1;
}
