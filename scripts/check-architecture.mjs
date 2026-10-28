import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const TYPE_EXTENSIONS = ['.ts', '.tsx'];
const PROTECTED_PREFIXES = ['src/stages/', 'src/narrative/'];
const FORBIDDEN_RUNTIME_PREFIXES = [
  'src/scenes/',
  'src/combat/',
  'src/simulation/',
  'src/progression/',
  'src/ai/',
];
const TRANSITIVE_RUNTIME_ALLOWLIST = Object.freeze([Object.freeze({
  id: 'procedural-deterministic-random',
  rootPrefixes: Object.freeze(['src/stages/', 'src/application/stages/']),
  viaPrefix: 'src/procedural/',
  target: 'src/simulation/core/DeterministicRandom.ts',
  reason: 'StageLoader delega ao boundary procedural existente, que reutiliza somente o RNG determinístico.',
})]);

function normalize(value) {
  return value.split(path.sep).join('/');
}

function relative(root, value) {
  return normalize(path.relative(root, value));
}

function isInside(relativePath, prefix) {
  return relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (TYPE_EXTENSIONS.some(extension => entry.name.endsWith(extension)) &&
      !entry.name.endsWith('.d.ts')) files.push(fullPath);
  }
  return files.sort();
}

function importClauseIsTypeOnly(clause) {
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  if (clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) return false;
  return clause.namedBindings.elements.length > 0 &&
    clause.namedBindings.elements.every(element => element.isTypeOnly);
}

function collectImports(filePath, source) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = [];
  const add = (specifier, typeOnly, line, dynamic = false) =>
    imports.push({ specifier, typeOnly, line, dynamic });
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, importClauseIsTypeOnly(node.importClause),
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, node.isTypeOnly,
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
      add(node.moduleReference.expression.text, node.isTypeOnly,
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    } else if (ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        add(node.arguments[0].text, false, line);
      } else {
        add('<dynamic>', false, line, true);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return imports;
}

function resolveLocal(root, sourcePath, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(sourcePath), specifier);
  else return undefined;

  const extension = path.extname(base);
  const withoutJs = ['.js', '.jsx', '.mjs', '.cjs'].includes(extension)
    ? base.slice(0, -extension.length)
    : base;
  const candidates = extension && !['.js', '.jsx', '.mjs', '.cjs'].includes(extension)
    ? [base]
    : [withoutJs, ...TYPE_EXTENSIONS.map(item => `${withoutJs}${item}`),
      ...TYPE_EXTENSIONS.map(item => path.join(withoutJs, `index${item}`))];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function isProtected(file) {
  return PROTECTED_PREFIXES.some(prefix => isInside(file, prefix));
}

function isApplicationStage(file) {
  return isInside(file, 'src/application/stages/');
}

function isForbiddenRuntime(file) {
  return FORBIDDEN_RUNTIME_PREFIXES.some(prefix => isInside(file, prefix));
}

function isLegacyResultException(edge) {
  return edge.from === 'src/stages/contracts/StageLoad.ts' &&
    edge.to === 'src/simulation/index.ts' && edge.typeOnly;
}

function transitiveRuntimeException(start, currentPath, target) {
  return TRANSITIVE_RUNTIME_ALLOWLIST.find(exception =>
    exception.rootPrefixes.some(prefix => isInside(start, prefix)) &&
    currentPath.some(item => isInside(item, exception.viaPrefix)) &&
    target === exception.target);
}

function contentChapter(file) {
  const match = /^src\/stages\/chapters\/([^/]+)\//.exec(file);
  return match?.[1];
}

function contentTargetAllowed(source, target) {
  const chapter = contentChapter(source);
  if (!chapter || !target) return false;
  return isInside(target, `src/stages/chapters/${chapter}/`) ||
    isInside(target, 'src/stages/contracts/') ||
    isInside(target, 'src/narrative/contracts/');
}

function pushViolation(violations, violation) {
  const key = `${violation.rule}|${violation.file}|${violation.line ?? 0}|${violation.message}`;
  if (!violations.some(item => item.key === key)) violations.push({ ...violation, key });
}

export function checkArchitecture(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const files = walk(path.join(root, 'src'));
  const graph = new Map();
  const violations = [];

  for (const filePath of files) {
    const from = relative(root, filePath);
    const imports = collectImports(filePath, fs.readFileSync(filePath, 'utf8'));
    const edges = imports.map(item => {
      const resolved = resolveLocal(root, filePath, item.specifier);
      return {
        ...item,
        from,
        to: resolved ? relative(root, resolved) : undefined,
        external: !item.specifier.startsWith('.') && !item.specifier.startsWith('@/'),
      };
    });
    graph.set(from, edges);

    for (const edge of edges) {
      const inProtectedZone = isProtected(from);
      const inApplication = isApplicationStage(from);
      if ((inProtectedZone || inApplication) && edge.dynamic) {
        pushViolation(violations, {
          rule: 'dynamic-import-forbidden', file: from, line: edge.line,
          message: 'imports dinâmicos não literais não podem contornar os architecture gates',
        });
      }
      if ((inProtectedZone || inApplication) &&
        (edge.specifier === 'phaser' || edge.specifier.startsWith('phaser/'))) {
        pushViolation(violations, {
          rule: 'headless-no-phaser', file: from, line: edge.line,
          message: `dependência proibida de Phaser: ${edge.specifier}`,
        });
      }
      if ((inProtectedZone || inApplication) && edge.to && isInside(edge.to, 'src/scenes/')) {
        pushViolation(violations, {
          rule: 'headless-no-scenes', file: from, line: edge.line,
          message: `dependência proibida de cena: ${edge.to}`,
        });
      }
      if (inProtectedZone && edge.to && isForbiddenRuntime(edge.to) &&
        !isLegacyResultException(edge)) {
        pushViolation(violations, {
          rule: 'headless-no-engine-internals', file: from, line: edge.line,
          message: `dependência proibida do motor: ${edge.to}`,
        });
      }
      if (isInside(from, 'src/narrative/') && edge.to && isInside(edge.to, 'src/procedural/')) {
        pushViolation(violations, {
          rule: 'narrative-no-procedural', file: from, line: edge.line,
          message: `narrativa não pode depender do pipeline procedural: ${edge.to}`,
        });
      }
      if (isInside(from, 'src/narrative/') && edge.to && isInside(edge.to, 'src/stages/') &&
        !isInside(edge.to, 'src/stages/contracts/')) {
        pushViolation(violations, {
          rule: 'narrative-stage-contracts-only', file: from, line: edge.line,
          message: `narrativa só pode consumir contratos de stages: ${edge.to}`,
        });
      }
      if ((isInside(from, 'src/stages/contracts/') || isInside(from, 'src/narrative/contracts/')) &&
        edge.to && /\/(runtime|persistence|compatibility|application|scenes)\//.test(`/${edge.to}`)) {
        pushViolation(violations, {
          rule: 'public-contract-no-implementation', file: from, line: edge.line,
          message: `contrato público depende de implementação: ${edge.to}`,
        });
      }
      if (inApplication && edge.to && isInside(edge.to, 'src/stages/') &&
        edge.to !== 'src/stages/index.ts') {
        pushViolation(violations, {
          rule: 'application-public-api-only', file: from, line: edge.line,
          message: `application deve importar stages pelo index público: ${edge.to}`,
        });
      }
      if (inApplication && edge.to && isInside(edge.to, 'src/narrative/') &&
        edge.to !== 'src/narrative/index.ts') {
        pushViolation(violations, {
          rule: 'application-public-api-only', file: from, line: edge.line,
          message: `application deve importar narrative pelo index público: ${edge.to}`,
        });
      }
      if (inApplication && edge.to && isForbiddenRuntime(edge.to)) {
        pushViolation(violations, {
          rule: 'application-no-engine-internals', file: from, line: edge.line,
          message: `application depende de implementação interna do motor: ${edge.to}`,
        });
      }
      if (contentChapter(from)) {
        if (edge.external || !edge.to || !contentTargetAllowed(from, edge.to)) {
          pushViolation(violations, {
            rule: 'chapter-public-contracts-only', file: from, line: edge.line,
            message: `módulo de capítulo só pode usar contratos públicos ou o próprio capítulo: ${edge.specifier}`,
          });
        }
      }
      if ((inProtectedZone || inApplication) && !edge.external && !edge.to) {
        pushViolation(violations, {
          rule: 'unresolved-local-import', file: from, line: edge.line,
          message: `import local não resolvido: ${edge.specifier}`,
        });
      }
    }
  }

  const roots = [...graph.keys()].filter(file => isProtected(file) || isApplicationStage(file));
  for (const start of roots) {
    const queue = [{ file: start, path: [start] }];
    const visited = new Set([start]);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const edge of graph.get(current.file) ?? []) {
        if (edge.typeOnly) continue;
        if (edge.specifier === 'phaser' || edge.specifier.startsWith('phaser/')) {
          if (current.path.length > 1) pushViolation(violations, {
            rule: 'forbidden-transitive-runtime', file: start, line: edge.line,
            message: `caminho transitivo alcança Phaser: ${[...current.path, 'phaser'].join(' -> ')}`,
          });
          continue;
        }
        if (!edge.to) continue;
        const nextPath = [...current.path, edge.to];
        if (isForbiddenRuntime(edge.to)) {
          if (transitiveRuntimeException(start, current.path, edge.to)) continue;
          if (current.path.length > 1) pushViolation(violations, {
            rule: 'forbidden-transitive-runtime', file: start, line: edge.line,
            message: `caminho transitivo alcança implementação proibida: ${nextPath.join(' -> ')}`,
          });
          continue;
        }
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ file: edge.to, path: nextPath });
        }
      }
    }
  }

  return {
    ok: violations.length === 0,
    filesChecked: files.length,
    edgesChecked: [...graph.values()].reduce((total, edges) => total + edges.length, 0),
    exceptions: [{
      id: 'stage-load-public-result-type',
      from: 'src/stages/contracts/StageLoad.ts',
      to: 'src/simulation/index.ts',
      reason: 'Import somente de tipo do Result público legado; sem dependência executável.',
    }, ...TRANSITIVE_RUNTIME_ALLOWLIST.map(exception => ({
      id: exception.id,
      from: `${exception.rootPrefixes.join(' | ')} via ${exception.viaPrefix}`,
      to: exception.target,
      reason: exception.reason,
    }))],
    violations: violations.map(({ key, ...item }) => item),
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
  const report = checkArchitecture(options.root);
  if (options.json) console.log(JSON.stringify(report));
  else if (report.ok) {
    console.log(`Architecture gates: OK (${report.filesChecked} arquivos, ${report.edgesChecked} dependências).`);
  } else {
    console.error(`Architecture gates: ${report.violations.length} violação(ões).`);
    for (const violation of report.violations) {
      console.error(`- [${violation.rule}] ${violation.file}:${violation.line ?? 0} ${violation.message}`);
    }
  }
  process.exitCode = report.ok ? 0 : 1;
}
