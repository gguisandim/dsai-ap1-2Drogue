import type { SaveStoragePort } from '../../narrative';

export interface BrowserKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class BrowserCampaignSaveStorage implements SaveStoragePort {
  public constructor(private readonly storage: BrowserKeyValueStorage) {}

  public read(key: string): string | undefined {
    return this.storage.getItem(key) ?? undefined;
  }

  public write(key: string, value: string): void {
    this.storage.setItem(key, value);
  }
}

export function createBrowserCampaignSaveStorage(): BrowserCampaignSaveStorage | undefined {
  if (typeof globalThis.localStorage === 'undefined') return undefined;
  return new BrowserCampaignSaveStorage(globalThis.localStorage);
}
