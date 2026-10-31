#!/usr/bin/env node
import { runChapterCli } from './chapter';

process.exitCode = runChapterCli(process.argv.slice(2));
