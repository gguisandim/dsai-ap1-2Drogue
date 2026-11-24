import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(repositoryRoot, 'dist');
const pagesBase = '/dsai-ap1-2Drogue/';
const indexPath = path.join(outputRoot, 'index.html');

function fail(message) {
  throw new Error(`Artefato do GitHub Pages inválido: ${message}`);
}

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(item) : [item];
  });
}

if (!fs.existsSync(indexPath)) fail('dist/index.html não foi gerado.');

const outputFiles = filesBelow(outputRoot);
const textFiles = outputFiles.filter(file => /\.(?:html|css|js|json|map|svg)$/i.test(file));
const pageUrlPattern = /\/dsai-ap1-2Drogue\/[^\s"'`()<>]+/g;
const referencedUrls = new Set();

for (const file of textFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(pageUrlPattern)) {
    referencedUrls.add(match[0].replace(/[?#].*$/, ''));
  }
  if (/\b(?:src|href)=["']\/assets\//.test(source)) {
    fail(`${path.relative(repositoryRoot, file)} contém URL absoluta fora do base path.`);
  }
}

const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes(`${pagesBase}assets/`)) {
  fail(`dist/index.html não referencia ${pagesBase}assets/.`);
}

for (const url of referencedUrls) {
  const relative = decodeURIComponent(url.slice(pagesBase.length));
  const target = path.resolve(outputRoot, relative);
  if (!target.startsWith(`${outputRoot}${path.sep}`) || !fs.existsSync(target)) {
    fail(`${url} não resolve para um arquivo emitido em dist.`);
  }
}

const emittedAssets = outputFiles.filter(file => file.startsWith(path.join(outputRoot, 'assets')));
if (emittedAssets.length === 0) fail('nenhum asset foi emitido em dist/assets.');

console.log(
  `Artefato do Pages validado: ${outputFiles.length} arquivo(s), `
  + `${emittedAssets.length} asset(s) e ${referencedUrls.size} URL(s) verificadas.`,
);
