import type {
  WorldLabLocalReports,
  WorldLabReportLoader,
  WorldLabRuntimeReport,
} from './contracts';

const DEFAULT_BASE_PATH = '/devtools/world-lab/reports';

export interface LocalReportLoaderOptions {
  readonly basePath?: string;
  readonly fetchImplementation?: typeof fetch;
}

/**
 * Development-only loader for the JSON reports published by the homologation
 * harness under src/devtools/world-lab/reports. It reads only the index and the
 * files listed there; report content is parsed as data by the session.
 */
export function createLocalReportLoader(
  options: LocalReportLoaderOptions = {},
): WorldLabReportLoader {
  const basePath = options.basePath ?? DEFAULT_BASE_PATH;
  return async (): Promise<WorldLabLocalReports> => {
    const doFetch = options.fetchImplementation ??
      (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
    if (!doFetch) return Object.freeze({ reports: Object.freeze([]), error: 'fetch-unavailable' });
    try {
      const indexResponse = await doFetch(`${basePath}/index.json`, { cache: 'no-store' });
      if (!indexResponse.ok) {
        return Object.freeze({ reports: Object.freeze([]), error: `index-${indexResponse.status}` });
      }
      const index = await indexResponse.json() as {
        readonly generatedAt?: string;
        readonly reports?: readonly { readonly file?: string }[];
      };
      const reports: WorldLabRuntimeReport[] = [];
      for (const entry of index.reports ?? []) {
        if (!entry || typeof entry.file !== 'string') continue;
        const response = await doFetch(
          `${basePath}/${encodeURIComponent(entry.file)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) continue;
        reports.push(await response.json() as WorldLabRuntimeReport);
      }
      return Object.freeze({
        reports: Object.freeze(reports),
        ...(typeof index.generatedAt === 'string' ? { generatedAt: index.generatedAt } : {}),
      });
    } catch (error) {
      return Object.freeze({
        reports: Object.freeze([]),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
