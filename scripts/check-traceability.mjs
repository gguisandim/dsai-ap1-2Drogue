import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'umbra-prompt-record/v1';
const UNKNOWN = new Set(['desconhecido', 'pendente']);
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
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'MODELO-REGISTRO.md')
    .map(entry => path.join(promptsDirectory, entry.name))
    .sort();
}

function fieldsFrom(content) {
  const fields = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = /^- ([\p{L}-]+):\s*(.*)$/u.exec(line);
    if (match) fields.set(match[1], clean(match[2]));
  }
  return fields;
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

export function checkTraceability(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const promptsDirectory = path.join(root, 'prompts');
  const files = promptFiles(promptsDirectory);
  const violations = [];
  let records = 0;
  let legacy = 0;

  if (!fs.existsSync(promptsDirectory)) {
    violations.push(violation('prompts/', 'prompts-directory-missing', 'Diretório prompts/ não existe.'));
  }

  for (const filePath of files) {
    const file = normalize(path.relative(root, filePath));
    const content = fs.readFileSync(filePath, 'utf8');
    const fields = fieldsFrom(content);
    const schema = fields.get('Schema');
    if (schema !== SCHEMA) {
      if (/^\d{2}-/.test(path.basename(filePath))) legacy += 1;
      continue;
    }
    records += 1;

    for (const field of REQUIRED_FIELDS) {
      if (!fields.get(field)) {
        violations.push(violation(file, 'required-field-missing', `Campo obrigatório ausente: ${field}.`));
      }
    }

    const date = fields.get('Data');
    if (date && !UNKNOWN.has(date) && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      violations.push(violation(file, 'date-invalid', `Data inválida: ${date}.`));
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

    const modifiedFiles = modifiedFilesFrom(content);
    if (modifiedFiles.length === 0) {
      violations.push(violation(file, 'modified-files-missing', 'Seção Arquivos modificados está vazia ou ausente.'));
    }
    for (const modifiedFile of modifiedFiles) {
      if (!UNKNOWN.has(modifiedFile) && !fs.existsSync(path.join(root, modifiedFile))) {
        violations.push(violation(file, 'modified-file-missing', `Arquivo modificado não existe: ${modifiedFile}.`));
      }
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
      `${report.legacyFilesAccepted} arquivo(s) legado(s) aceito(s)).`);
  } else {
    console.error(`Traceability gates: ${report.violations.length} violação(ões).`);
    for (const item of report.violations) {
      console.error(`- [${item.rule}] ${item.file}: ${item.message}`);
    }
  }
  process.exitCode = report.ok ? 0 : 1;
}
