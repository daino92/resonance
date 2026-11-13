import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });

  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : [join(dir, entry.name)],
      ),
    )
  ).flat();
};

const errors = [];

for (const file of (await walk('src')).filter((file) => /\.tsx?$/.test(file))) {
  const source = await readFile(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const modules = new Set();

  const lineOf = (position) =>
    tree.getLineAndCharacterOfPosition(position).line;
  const isMultiline = (node) =>
    lineOf(node.getStart(tree)) !== lineOf(node.end);
  const isImport = (node) =>
    ts.isImportDeclaration(node) ||
    (ts.isExportDeclaration(node) && Boolean(node.moduleSpecifier));
  const lines = source.split('\n');

  const checkPadding = (statements, topLevel) => {
    for (let index = 1; index < statements.length; index++) {
      const previous = statements[index - 1];
      const next = statements[index];
      const from = lineOf(previous.end);
      const to = lineOf(next.getStart(tree));

      if (from === to || (isImport(previous) && isImport(next))) continue;

      const required =
        topLevel ||
        isMultiline(previous) ||
        isMultiline(next) ||
        ts.isReturnStatement(next) ||
        previous.kind !== next.kind;

      if (required && !lines.slice(from + 1, to).some((line) => !line.trim()))
        errors.push(`${file}:${to + 1}: Add a blank line between statements`);
    }
  };

  const visit = (node) => {
    if (ts.isSourceFile(node)) checkPadding(node.statements, true);

    if (
      ts.isBlock(node) ||
      ts.isModuleBlock(node) ||
      ts.isCaseOrDefaultClause(node)
    )
      checkPadding(node.statements, false);

    const fail = (message) => errors.push(`${file}: ${message}`);

    if (ts.isImportDeclaration(node)) {
      const name = node.moduleSpecifier.text;

      if (modules.has(name)) fail(`Duplicate import: ${name}`);

      modules.add(name);

      if (
        node.importClause?.namedBindings &&
        ts.isNamespaceImport(node.importClause.namedBindings)
      )
        fail('Use named imports');

      if (name.startsWith('../') || /^@\/[^/]+\//.test(name))
        fail('Import other role folders through their barrel');
    }

    if (ts.isFunctionDeclaration(node)) fail('Use const arrow functions');

    if (node.kind === ts.SyntaxKind.AnyKeyword)
      fail('Use precise types or unknown');

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      /^use[A-Z]/.test(node.expression.text) &&
      !file.includes('/hooks/') &&
      ![
        'useAtlas',
        'useUniverse',
        'useAudioPreview',
        'useGenreDetails',
        'useLearningChapter',
      ].includes(node.expression.text)
    )
      fail('Put custom state and behavior in hooks/');

    ts.forEachChild(node, visit);
  };

  visit(tree);
}

assert.equal(errors.length, 0, errors.join('\n'));

console.log(
  'PASS: role imports, named imports, arrow functions, hook placement, statement padding and no any.',
);
