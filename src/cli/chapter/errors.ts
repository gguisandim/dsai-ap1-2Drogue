import type { CliDiagnostic } from './types';

/**
 * Expected authoring failure. The entry point prints the code and message
 * without a stack trace; exit code 2 is reserved for invalid usage.
 */
export class ChapterCliError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly exitCode = 1,
    public readonly diagnostics: readonly CliDiagnostic[] = [],
  ) {
    super(message);
    this.name = 'ChapterCliError';
  }
}

export function usageError(code: string, message: string): ChapterCliError {
  return new ChapterCliError(code, message, 2);
}
