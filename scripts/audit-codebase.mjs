import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.html', '.ps1']);
const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const GENERATED_MARKER = /auto-generated|generated (?:by|from)|do not edit/i;
const BRANCH_KINDS = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.ConditionalExpression,
]);

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .map(file => file.replaceAll('\\', '/'));
}

function category(file, text) {
  if (file.startsWith('src/tests/') || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file)) return 'tests';
  if (file.startsWith('scripts/')) return 'scripts';
  if (file.includes('/generated/') || /\bGenerated[A-Z]/.test(path.basename(file)) || GENERATED_MARKER.test(text)) {
    return 'generated';
  }
  if (file.startsWith('src/devtools/') || file.startsWith('src/tools/')) return 'tools';
  return 'production';
}

function subsystem(file) {
  if (file.startsWith('scripts/')) return 'scripts';
  const parts = file.split('/');
  return parts[0] === 'src' && parts.length > 2 ? parts[1] : parts[0];
}

function countTokenLines(text, extension) {
  if (!TS_EXTENSIONS.has(extension)) {
    let block = false;
    return text.split(/\r?\n/).filter(line => {
      let value = line.trim();
      if (block) {
        const end = value.indexOf('*/');
        if (end < 0) return false;
        value = value.slice(end + 2).trim();
        block = false;
      }
      while (value.startsWith('/*')) {
        const end = value.indexOf('*/', 2);
        if (end < 0) {
          block = true;
          return false;
        }
        value = value.slice(end + 2).trim();
      }
      return value.length > 0 && !value.startsWith('//') && !value.startsWith('#');
    }).length;
  }
  const source = ts.createSourceFile('audit' + extension, text, ts.ScriptTarget.Latest, true);
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const lines = new Set();
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    lines.add(source.getLineAndCharacterOfPosition(scanner.getTokenPos()).line);
  }
  return lines.size;
}

function resolveRelative(from, specifier, files) {
  if (!specifier.startsWith('.')) return undefined;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, `${base}/index.ts`]
    .find(candidate => files.has(candidate));
}

function astMetrics(file, text, sourceFiles) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const dependencies = [];
  const structuralKinds = [];
  const classes = [];
  let interfaces = 0;
  let functions = 0;
  let branches = 1;
  let imports = 0;
  let exports = 0;

  function visit(node, currentClass) {
    structuralKinds.push(node.kind);
    let classMetric = currentClass;
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      classMetric = { name: node.name?.text ?? '<anonymous>', branches: 1, methods: 0 };
      classes.push(classMetric);
    }
    if (ts.isInterfaceDeclaration(node)) interfaces += 1;
    if (ts.isFunctionLike(node)) functions += 1;
    if (ts.isMethodDeclaration(node) && classMetric) classMetric.methods += 1;
    if (BRANCH_KINDS.has(node.kind)) {
      branches += 1;
      if (classMetric) classMetric.branches += 1;
    }
    if (ts.isBinaryExpression(node) && [
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
    ].includes(node.operatorToken.kind)) {
      branches += 1;
      if (classMetric) classMetric.branches += 1;
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports += 1;
      const resolved = resolveRelative(file, node.moduleSpecifier.text, sourceFiles);
      if (resolved) dependencies.push(resolved);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const resolved = resolveRelative(file, node.moduleSpecifier.text, sourceFiles);
      if (resolved) dependencies.push(resolved);
    }
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node) ||
      (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0) exports += 1;
    ts.forEachChild(node, child => visit(child, classMetric));
  }
  visit(source, undefined);
  return {
    classes,
    interfaces,
    functions,
    branches,
    imports,
    exports,
    dependencies: [...new Set(dependencies)],
    structuralHash: createHash('sha256').update(structuralKinds.join(',')).digest('hex'),
  };
}

function stronglyConnected(graph) {
  let nextIndex = 0;
  const indices = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];
  function visit(vertex) {
    indices.set(vertex, nextIndex);
    low.set(vertex, nextIndex);
    nextIndex += 1;
    stack.push(vertex);
    onStack.add(vertex);
    for (const target of graph.get(vertex) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        low.set(vertex, Math.min(low.get(vertex), low.get(target)));
      } else if (onStack.has(target)) low.set(vertex, Math.min(low.get(vertex), indices.get(target)));
    }
    if (low.get(vertex) !== indices.get(vertex)) return;
    const component = [];
    let current;
    do {
      current = stack.pop();
      onStack.delete(current);
      component.push(current);
    } while (current !== vertex);
    if (component.length > 1) components.push(component.sort());
  }
  for (const vertex of graph.keys()) if (!indices.has(vertex)) visit(vertex);
  return components.sort((left, right) => right.length - left.length);
}

function reachable(graph, entries) {
  const seen = new Set();
  const pending = [...entries];
  while (pending.length) {
    const current = pending.pop();
    if (!current || seen.has(current) || !graph.has(current)) continue;
    seen.add(current);
    pending.push(...(graph.get(current) ?? []));
  }
  return seen;
}

function grouped(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const id = row[key];
    const value = result.get(id) ?? { files: 0, physical: 0, nonblank: 0, tokenLines: 0, classes: 0 };
    value.files += 1;
    value.physical += row.physical;
    value.nonblank += row.nonblank;
    value.tokenLines += row.tokenLines;
    value.classes += row.classes.length;
    result.set(id, value);
  }
  return [...result].map(([name, value]) => ({ [key]: name, ...value }))
    .sort((left, right) => right.tokenLines - left.tokenLines);
}

function groupedByCategoryAndSubsystem(rows) {
  const annotated = rows.map(row => ({
    ...row,
    categorySubsystem: `${row.category}:${row.subsystem}`,
  }));
  return grouped(annotated, 'categorySubsystem').map(row => {
    const [categoryName, subsystemName] = row.categorySubsystem.split(':');
    const { categorySubsystem: _ignored, ...metrics } = row;
    return { category: categoryName, subsystem: subsystemName, ...metrics };
  });
}

function duplicateGroups(rows, hashKey) {
  const groups = new Map();
  for (const row of rows) {
    if (!row[hashKey]) continue;
    const group = groups.get(row[hashKey]) ?? [];
    group.push(row.file);
    groups.set(row[hashKey], group);
  }
  return [...groups.values()].filter(group => group.length > 1).sort((a, b) => b.length - a.length);
}

const indexedFiles = trackedFiles();
const missingTrackedFiles = indexedFiles.filter(file => !existsSync(file));
const allTracked = indexedFiles.filter(file => existsSync(file));
const codeFiles = allTracked.filter(file => CODE_EXTENSIONS.has(path.extname(file).toLowerCase()));
const sourceFiles = new Set(codeFiles.filter(file => TS_EXTENSIONS.has(path.extname(file).toLowerCase())));
const rows = codeFiles.map(file => {
  const text = readFileSync(file, 'utf8');
  const extension = path.extname(file).toLowerCase();
  const ast = TS_EXTENSIONS.has(extension)
    ? astMetrics(file, text, sourceFiles)
    : { classes: [], interfaces: 0, functions: 0, branches: 0, imports: 0, exports: 0,
        dependencies: [], structuralHash: undefined };
  const lines = text.split(/\r?\n/);
  return {
    file,
    category: category(file, text),
    subsystem: subsystem(file),
    physical: lines.length,
    nonblank: lines.filter(line => line.trim()).length,
    tokenLines: countTokenLines(text, extension),
    exactHash: createHash('sha256').update(text).digest('hex'),
    ...ast,
  };
});

const graph = new Map(rows.filter(row => sourceFiles.has(row.file)).map(row => [row.file, row.dependencies]));
const gameReachable = reachable(graph, ['src/main.ts']);
const labReachable = reachable(graph, ['src/devtools/world-lab/main.ts']);
const runtimeReachable = new Set([...gameReachable, ...labReachable]);
const unreachable = rows.filter(row => row.file.startsWith('src/') && row.category === 'production' &&
  sourceFiles.has(row.file) && !runtimeReachable.has(row.file));
const classRows = rows.flatMap(row => row.classes.map(metric => ({ file: row.file, ...metric })));
const result = {
  method: 'git ls-files + TypeScript scanner/AST; cloc fallback because local cloc requires unavailable Perl',
  trackedFiles: allTracked.length,
  missingTrackedFiles: missingTrackedFiles.length,
  codeFiles: rows.length,
  totals: {
    physical: rows.reduce((sum, row) => sum + row.physical, 0),
    nonblank: rows.reduce((sum, row) => sum + row.nonblank, 0),
    tokenLines: rows.reduce((sum, row) => sum + row.tokenLines, 0),
    classes: classRows.length,
  },
  byCategory: grouped(rows, 'category'),
  bySubsystem: grouped(rows, 'subsystem'),
  byCategorySubsystem: groupedByCategoryAndSubsystem(rows),
  largestFiles: [...rows].sort((a, b) => b.tokenLines - a.tokenLines).slice(0, 30)
    .map(({ file, category: group, physical, tokenLines, branches }) => ({ file, category: group, physical, tokenLines, branches })),
  complexFiles: [...rows].sort((a, b) => b.branches - a.branches).slice(0, 30)
    .map(({ file, branches, physical, classes }) => ({ file, branches, physical, classes: classes.length })),
  complexClasses: classRows.sort((a, b) => b.branches - a.branches).slice(0, 30),
  imports: rows.reduce((sum, row) => sum + row.imports, 0),
  exports: rows.reduce((sum, row) => sum + row.exports, 0),
  cycles: stronglyConnected(graph),
  duplicates: {
    exact: duplicateGroups(rows, 'exactHash'),
    structural: duplicateGroups(rows.filter(row => row.physical >= 20), 'structuralHash'),
  },
  reachability: {
    gameFiles: gameReachable.size,
    worldLabFiles: labReachable.size,
    unreachableProductionFiles: unreachable.length,
    unreachableProductionTokenLines: unreachable.reduce((sum, row) => sum + row.tokenLines, 0),
    largestCandidates: [...unreachable].sort((a, b) => b.tokenLines - a.tokenLines).slice(0, 40)
      .map(({ file, tokenLines, imports, exports }) => ({ file, tokenLines, imports, exports })),
  },
};

const serialized = JSON.stringify(result, null, 2) + '\n';
const outputArgument = process.argv.find(argument => argument.startsWith('--output='));
if (outputArgument) {
  const outputPath = outputArgument.slice('--output='.length);
  if (!outputPath) throw new TypeError('--output requires a path');
  writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Audit written to ${outputPath}`);
} else if (process.argv.includes('--json')) console.log(serialized.trimEnd());
else {
  console.log(`Method: ${result.method}`);
  console.log(`Tracked present: ${result.trackedFiles}; tracked removed: ${result.missingTrackedFiles}; code files: ${result.codeFiles}; token lines: ${result.totals.tokenLines}; classes: ${result.totals.classes}`);
  console.log('\nBy category');
  console.table(result.byCategory);
  console.log('\nBy subsystem');
  console.table(result.bySubsystem);
  console.log('\nBy category and subsystem');
  console.table(result.byCategorySubsystem);
  console.log('\nLargest files');
  console.table(result.largestFiles);
  console.log('\nHighest approximate complexity');
  console.table(result.complexFiles);
  console.log('\nHighest approximate class complexity');
  console.table(result.complexClasses);
  console.log(`\nImports: ${result.imports}; exports: ${result.exports}; dependency cycles: ${result.cycles.length}`);
  console.log(JSON.stringify(result.cycles, null, 2));
  console.log(`\nExact duplicate groups: ${result.duplicates.exact.length}`);
  console.log(JSON.stringify(result.duplicates.exact.slice(0, 20), null, 2));
  console.log(`\nStructural duplicate groups: ${result.duplicates.structural.length}`);
  console.log(JSON.stringify(result.duplicates.structural.slice(0, 20), null, 2));
  console.log(`\nReachable from game: ${result.reachability.gameFiles}; World Lab: ${result.reachability.worldLabFiles}`);
  console.log(`Unreachable production candidates: ${result.reachability.unreachableProductionFiles} files / ${result.reachability.unreachableProductionTokenLines} token lines`);
  console.table(result.reachability.largestCandidates);
}
