import type { SaveStoragePort } from '../contracts';
import { cloneFrozen, compareStrings } from '../runtime/data';

export class MemorySaveStorage implements SaveStoragePort {
  private readonly values = new Map<string, string>();

  public constructor(initial: Readonly<Record<string, string>> = {}) {
    Object.entries(initial).forEach(([key, value]) => this.values.set(key, String(value)));
  }

  public read(key: string): string | undefined {
    return this.values.get(key);
  }

  public write(key: string, value: string): void {
    this.values.set(key, String(value));
  }

  public snapshot(): Readonly<Record<string, string>> {
    return cloneFrozen(Object.fromEntries([...this.values.entries()]
      .sort(([left], [right]) => compareStrings(left, right))));
  }
}
