import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'umbra-prompt-record/v1';
const UNKNOWN = new Set(['desconhecido', 'pendente']);
const HISTORICAL_PROMPT_FILES = new Set([
  '01-arquitetura-campanha-modular.md',
  '02-caracterizacao-fases-legadas.md',
  '03-contratos-stage-registry.md',
  '04-stage-loader-headless.md',
  '05-endurecimento-stage-loader.md',
  '06-runtime-narrativo-headless.md',
  '07-persistencia-campanha.md',
  '08-integracao-phaser-etapa-5.md',
]);
const INSTITUTIONAL_FILES = new Set([
  'README.md',
  'MODELO-REGISTRO.md',
  'registro-completo.md',
]);
const REQUIRED_FIELDS = [
  'Prompt-ID',
  'Data',
  'Agente',
  'Modelo',
  'Esforço',
  'SPEC',
  'Commit',
  'Execução',
];

function normalize(value) {
  return value.split(path.sep).join('/');
}

function clean(value) {
  return value.trim().replace(/^`|`$/g, '').trim();
}

function promptFiles(promptsDirectory) {
  if (!fs.existsSync(promptsDirectory)) return [];
  return fs.readdirSync(promptsDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(promptsDirectory, entry.name))
    .sort();
}

function fieldsFrom(content) {
  const fields = new Map();
  const duplicates = new Set();
  const metadataHeader = content.split(/^## /m)[0];
  for (const line of metadataHeader.split(/\r?\n/)) {
    const match = /^- ([\p{L}-]+):\s*(.*)$/u.exec(line);
    if (match) {
      if (fields.has(match[1])) duplicates.add(match[1]);
      fields.set(match[1], clean(match[2]));
    }
  }
  return { fields, duplicates: [...duplicates] };
}

function modifiedFilesFrom(content) {
  const match = /## Arquivos modificados\s*\r?\n([\s\S]*?)(?=\r?\n## |$)/.exec(content);
  if (!match) return [];
  return match[1].split(/\r?\n/)
    .map(line => /^-\s+(.+)$/.exec(line)?.[1])
    .filter(Boolean)
    .map(clean);
}

function effectivePromptFrom(content) {
  const section = /## Prompt efetivamente recebido\s*\r?\n([\s\S]*?)(?=\r?\n## |$)/.exec(content)?.[1];
  if (!section) return undefined;
  return /```(?:text)?\s*\r?\n([\s\S]*?)\r?\n```/.exec(section)?.[1];
}

function violation(file, rule, message) {
  return { file, rule, message };
}

function sectionCount(content, title) {
  return content.split(/\r?\n/).filter(line => line.trim() === `## ${title}`).length;
}

function pathIsInside(root, candidate) {
  const relativePath = path.relative(root, candidate);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function deriveAddedCommit(root, file) {
  const topLevel = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });
  if (topLevel.status !== 0 || path.resolve(topLevel.stdout.trim()) !== root) return undefined;
  const history = spawnSync('git', [
    '-C', root, 'log', '--diff-filter=A', '--format=%H', '--', file,
  ], { encoding: 'utf8' });
  if (history.status !== 0) return undefined;
  const commit = history.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  return commit && /^[0-9a-f]{40}$/i.test(commit) ? commit : undefined;
}

export function checkTraceability(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const promptsDirectory = path.join(root, 'prompts');
  const files = promptFiles(promptsDirectory);
  const violations = [];
  const commitStatuses = [];
  const promptIds = new Map();
  let records = 0;
  let legacy = 0;

  if (!fs.existsSync(promptsDirectory)) {
    violations.push(violation('prompts/', 'prompts-directory-missing', 'Diretório prompts/ não existe.'));
  }

  for (const filePath of files) {
    const file = normalize(path.relative(root, filePath));
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    if (HISTORICAL_PROMPT_FILES.has(fileName)) {
      legacy += 1;
      continue;
    }
    if (INSTITUTIONAL_FILES.has(fileName)) continue;

    const parsed = fieldsFrom(content);
    const fields = parsed.fields;
    const schema = fields.get('Schema');
    if (schema !== SCHEMA) {
      violations.push(violation(
        file,
        schema ? 'schema-unsupported' : 'unversioned-prompt-record',
        schema
          ? `Schema não suportado: ${schema}.`
          : `Novo registro de prompt deve declarar Schema: ${SCHEMA}.`,
      ));
      continue;
    }
    records += 1;

    for (const duplicate of parsed.duplicates) {
      violations.push(violation(file, 'field-duplicated', `Campo duplicado: ${duplicate}.`));
    }

    for (const field of REQUIRED_FIELDS) {
      if (!fields.get(field)) {
        violations.push(violation(file, 'required-field-missing', `Campo obrigatório ausente: ${field}.`));
      }
    }

    const date = fields.get('Data');
    if (date && !UNKNOWN.has(date) && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      violations.push(violation(file, 'date-invalid', `Data inválida: ${date}.`));
    }

    const promptId = fields.get('Prompt-ID');
    if (promptId) {
      if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(promptId)) {
        violations.push(violation(file, 'prompt-id-invalid', `Prompt-ID inválido: ${promptId}.`));
      }
      const previous = promptIds.get(promptId);
      if (previous) {
        violations.push(violation(file, 'prompt-id-duplicated',
          `Prompt-ID ${promptId} já usado por ${previous}.`));
      } else {
        promptIds.set(promptId, file);
      }
    }

    const spec = fields.get('SPEC');
    if (spec && !UNKNOWN.has(spec)) {
      if (!spec.startsWith('SPEC/') || !fs.existsSync(path.join(root, spec))) {
        violations.push(violation(file, 'spec-invalid', `SPEC inexistente ou fora de SPEC/: ${spec}.`));
      }
    }

    const commit = fields.get('Commit');
    if (commit && !UNKNOWN.has(commit) && !/^[0-9a-f]{7,40}$/i.test(commit)) {
      violations.push(violation(file, 'commit-invalid', 'Commit deve ser hash Git, desconhecido ou pendente.'));
    }
    if (commit === 'pendente') {
      const derivedCommit = deriveAddedCommit(root, file);
      commitStatuses.push({
        file,
        promptId,
        status: derivedCommit ? 'derived' : 'pending',
        ...(derivedCommit ? { commit: derivedCommit } : {}),
      });
    } else if (commit) {
      commitStatuses.push({ file, promptId, status: commit === 'desconhecido' ? 'unknown' : 'explicit',
        ...(commit !== 'desconhecido' ? { commit } : {}) });
    }

    const modifiedSectionCount = sectionCount(content, 'Arquivos modificados');
    if (modifiedSectionCount !== 1) {
      violations.push(violation(file, 'modified-files-section-invalid',
        `Esperada uma seção Arquivos modificados; encontradas ${modifiedSectionCount}.`));
    }
    const modifiedFiles = modifiedFilesFrom(content);
    if (modifiedFiles.length === 0) {
      violations.push(violation(file, 'modified-files-missing', 'Seção Arquivos modificados está vazia ou ausente.'));
    }
    for (const modifiedFile of modifiedFiles) {
      if (!UNKNOWN.has(modifiedFile)) {
        const resolved = path.resolve(root, modifiedFile);
        if (!pathIsInside(root, resolved)) {
          violations.push(violation(file, 'modified-file-outside-repository',
            `Arquivo modificado fora do repositório: ${modifiedFile}.`));
        } else if (!fs.existsSync(resolved)) {
          violations.push(violation(file, 'modified-file-missing', `Arquivo modificado não existe: ${modifiedFile}.`));
        }
      }
    }

    const promptSectionCount = sectionCount(content, 'Prompt efetivamente recebido');
    if (promptSectionCount !== 1) {
      violations.push(violation(file, 'effective-prompt-section-invalid',
        `Esperada uma seção Prompt efetivamente recebido; encontradas ${promptSectionCount}.`));
    }
    const prompt = effectivePromptFrom(content);
    if (!prompt?.trim()) {
      violations.push(violation(file, 'effective-prompt-missing',
        'A seção Prompt efetivamente recebido deve conter um bloco de texto não vazio.'));
    }
  }

  return {
    ok: violations.length === 0,
    schema: SCHEMA,
    recordsChecked: records,
    legacyFilesAccepted: legacy,
    historicalAllowlist: [...HISTORICAL_PROMPT_FILES],
    commitStatuses,
    violations,
  };
}

function parseArguments(argv) {
  const result = { root: process.cwd(), json: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root') result.root = argv[++index];
    else if (argv[index] === '--json') result.json = true;
    else throw new Error(`Argumento desconhecido: ${argv[index]}`);
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArguments(process.argv.slice(2));
  const report = checkTraceability(options.root);
  if (options.json) console.log(JSON.stringify(report));
  else if (report.ok) {
    console.log(`Traceability gates: OK (${report.recordsChecked} registro(s) v1, ` +
      `${report.legacyFilesAccepted} arquivo(s) legado(s) aceito(s), ` +
      `${report.commitStatuses.filter(item => item.status === 'pending').length} commit(s) pendente(s)).`);
  } else {
    console.error(`Traceability gates: ${report.violations.length} violação(ões).`);
    for (const item of report.violations) {
      console.error(`- [${item.rule}] ${item.file}: ${item.message}`);
    }
  }
  process.exitCode = report.ok ? 0 : 1;
}
