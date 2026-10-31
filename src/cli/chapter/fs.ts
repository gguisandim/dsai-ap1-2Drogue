import fs from 'node:fs';
import path from 'node:path';
import type { ChapterFileSystem } from './types';

export const nodeChapterFileSystem: ChapterFileSystem = Object.freeze({
  exists(target: string): boolean {
    return fs.existsSync(target);
  },
  isDirectory(target: string): boolean {
    try {
      return fs.statSync(target).isDirectory();
    } catch {
      return false;
    }
  },
  readFile(target: string): string {
    return fs.readFileSync(target, 'utf8');
  },
  writeFile(target: string, content: string): void {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  },
  mkdirp(target: string): void {
    fs.mkdirSync(target, { recursive: true });
  },
  makeTempDir(parent: string, prefix: string): string {
    return fs.mkdtempSync(path.join(parent, prefix));
  },
  rename(from: string, to: string): void {
    fs.renameSync(from, to);
  },
  removeTree(target: string): void {
    fs.rmSync(target, { recursive: true, force: true });
  },
  listDirectories(parent: string): readonly string[] {
    if (!fs.existsSync(parent)) return Object.freeze([]);
    return Object.freeze(fs.readdirSync(parent, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort());
  },
});
