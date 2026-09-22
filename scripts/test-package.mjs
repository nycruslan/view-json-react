import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const temporaryDirectory = mkdtempSync(path.join(root, '.package-test-'));

const collectRelativeFiles = (directory, prefix = '') => readdirSync(
  directory,
  { withFileTypes: true },
).flatMap(entry => {
  const relativePath = path.posix.join(prefix, entry.name);
  return entry.isDirectory()
    ? collectRelativeFiles(path.join(directory, entry.name), relativePath)
    : [relativePath];
});
const publicBuildLeaks = new Set(
  collectRelativeFiles(path.join(root, 'public')).map(file => `dist/${file}`),
);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: temporaryDirectory,
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
  return result.stdout;
};

try {
  const packOutput = run('npm', [
    'pack',
    root,
    '--json',
    '--ignore-scripts',
    '--pack-destination',
    temporaryDirectory,
  ]);
  const parsedPackOutput = JSON.parse(packOutput);
  const packResult = Array.isArray(parsedPackOutput)
    ? parsedPackOutput[0]
    : Object.values(parsedPackOutput)[0];
  const { filename } = packResult;
  const tarballPath = path.join(temporaryDirectory, filename);
  run(process.execPath, [
    path.join(root, 'node_modules/publint/src/cli.js'),
    tarballPath,
    '--pack=false',
    '--strict',
  ]);
  run(process.execPath, [
    path.join(root, 'node_modules/@arethetypeswrong/cli/dist/index.js'),
    tarballPath,
    '--profile',
    'node16',
    '--exclude-entrypoints',
    './styles.css',
  ]);
  run('tar', ['-xzf', tarballPath, '-C', temporaryDirectory]);

  const nodeModules = path.join(temporaryDirectory, 'node_modules');
  const installedPackage = path.join(nodeModules, 'view-json-react');
  mkdirSync(nodeModules);
  renameSync(path.join(temporaryDirectory, 'package'), installedPackage);

  const packageManifest = JSON.parse(
    readFileSync(path.join(installedPackage, 'package.json'), 'utf8'),
  );
  const packedPaths = new Set(packResult.files.map(file => file.path));
  for (const expectedPath of [
    '.agents/skills/view-json-react/SKILL.md',
    'llms.txt',
    'README.md',
    'SECURITY.md',
    'RELEASING.md',
    'MIGRATION.md',
    'LICENSE',
    'package.json',
  ]) {
    if (!packedPaths.has(expectedPath)) {
      throw new Error(`The package is missing ${expectedPath}`);
    }
  }
  for (const packedPath of packedPaths) {
    if (
      /^(?:src|scripts|public|docs|coverage|storybook-static)\//u.test(packedPath)
      || publicBuildLeaks.has(packedPath)
    ) {
      throw new Error(`The package contains repository-only file ${packedPath}`);
    }
  }
  if (Object.keys(packageManifest.dependencies ?? {}).length !== 0) {
    throw new Error('The published package must not have runtime dependencies');
  }
  if (packageManifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    throw new Error('The package must publish only to the npm public registry');
  }
  if (!packageManifest.description?.includes('React JSON tree viewer')) {
    throw new Error('The package description is missing its primary search phrase');
  }
  if (!packageManifest.keywords?.includes('react json viewer')) {
    throw new Error('The package keywords are missing the primary search phrase');
  }
  const publicEntries = Object.keys(packageManifest.exports ?? {}).sort();
  const expectedEntries = ['.', './headless', './package.json', './styles.css', './virtual'];
  if (JSON.stringify(publicEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(`Unexpected public entries: ${publicEntries.join(', ')}`);
  }
  if (!packageManifest.pi?.skills?.includes('./.agents/skills')) {
    throw new Error('The packaged Pi skill manifest is missing or invalid');
  }
  const llmsText = readFileSync(path.join(installedPackage, 'llms.txt'), 'utf8');
  if (!llmsText.startsWith('# view-json-react')) {
    throw new Error('llms.txt is missing or invalid');
  }
  const skillText = readFileSync(
    path.join(installedPackage, '.agents/skills/view-json-react/SKILL.md'),
    'utf8',
  );
  if (!skillText.startsWith('---\nname: view-json-react\n')) {
    throw new Error('The packaged Agent Skill is missing or invalid');
  }
  for (const dependency of ['react', 'react-dom']) {
    symlinkSync(
      path.join(root, 'node_modules', dependency),
      path.join(nodeModules, dependency),
      'junction',
    );
  }

  writeFileSync(
    path.join(temporaryDirectory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  writeFileSync(
    path.join(temporaryDirectory, 'consumer.mjs'),
    `import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonViewer } from 'view-json-react';
import { VirtualJsonViewer } from 'view-json-react/virtual';
import { buildVisibleTree } from 'view-json-react/headless';
if (!import.meta.resolve('view-json-react/styles.css').endsWith('/dist/styles.css')) throw new Error('CSS export failed');
if (buildVisibleTree({ ok: true }, { isExpanded: () => true }).rows.length !== 2) throw new Error('Headless export failed');
for (const Component of [JsonViewer, VirtualJsonViewer]) {
  const html = renderToStaticMarkup(React.createElement(Component, { data: { ok: true } }));
  if (!html.includes('role="tree"')) throw new Error('SSR failed');
}
`,
  );
  writeFileSync(
    path.join(temporaryDirectory, 'consumer.cjs'),
    `const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JsonViewer } = require('view-json-react');
const { VirtualJsonViewer } = require('view-json-react/virtual');
const { toJsonPointer } = require('view-json-react/headless');
if (toJsonPointer(['ok']) !== '/ok') throw new Error('CommonJS headless export failed');
for (const Component of [JsonViewer, VirtualJsonViewer]) {
  if (!renderToStaticMarkup(React.createElement(Component, { data: null })).includes('role="tree"')) throw new Error('CommonJS SSR failed');
}
`,
  );
  writeFileSync(
    path.join(temporaryDirectory, 'consumer.ts'),
    `import { JsonViewer, type JsonViewerProps } from 'view-json-react';
import { VirtualJsonViewer, type VirtualJsonViewerProps } from 'view-json-react/virtual';
import { searchTree, type JsonPath } from 'view-json-react/headless';
import 'view-json-react/styles.css';
const path: JsonPath = ['items', 0];
const props: JsonViewerProps = { data: { ok: true }, searchQuery: 'ok' };
const virtualProps: VirtualJsonViewerProps = { ...props, height: 300 };
void [JsonViewer, VirtualJsonViewer, searchTree(props.data, 'ok'), path, virtualProps];
`,
  );
  writeFileSync(
    path.join(temporaryDirectory, 'consumer.cts'),
    `import { JsonViewer, type JsonViewerProps } from 'view-json-react';
import { VirtualJsonViewer } from 'view-json-react/virtual';
import { toJsonPointer } from 'view-json-react/headless';
const props: JsonViewerProps = { data: null };
void [JsonViewer, VirtualJsonViewer, toJsonPointer([]), props];
`,
  );
  writeFileSync(
    path.join(temporaryDirectory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: 'ES2020',
      },
      files: ['consumer.ts', 'consumer.cts'],
    }),
  );

  run(process.execPath, ['consumer.mjs']);
  run(process.execPath, ['consumer.cjs']);
  run(process.execPath, [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '--project',
    'tsconfig.json',
  ]);

  const packedRoot = path.join(installedPackage, 'dist');
  for (const file of [
    'view-json-react.esm.js',
    'view-json-react.cjs',
    'virtual.js',
    'virtual.cjs',
  ]) {
    const content = readFileSync(path.join(packedRoot, file), 'utf8');
    if (!content.startsWith('"use client";')) {
      throw new Error(`${file} is missing its client boundary`);
    }
    if (content.includes('createElement("style")')) {
      throw new Error(`${file} injects styles at runtime`);
    }
  }

  console.log('Packed ESM, CommonJS, TypeScript, SSR, CSS, AI docs, publint, ATTW, and subpath exports passed.');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
