import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const runNode = (script, args = [], env = {}) => {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

rmSync(path.join(root, 'dist'), { recursive: true, force: true });
mkdirSync(path.join(root, 'dist'), { recursive: true });

for (const entry of ['index', 'virtual', 'headless']) {
  runNode('node_modules/vite/bin/vite.js', ['build'], { VJR_ENTRY: entry });
}

for (const file of [
  'view-json-react.esm.js',
  'view-json-react.cjs',
  'virtual.js',
  'virtual.cjs',
]) {
  const outputPath = path.join(root, 'dist', file);
  writeFileSync(outputPath, `"use client";\n${readFileSync(outputPath, 'utf8')}`);
}

runNode('node_modules/typescript/bin/tsc', ['-p', 'tsconfig.build.json']);
copyFileSync(path.join(root, 'src/styles.css'), path.join(root, 'dist/styles.css'));
writeFileSync(
  path.join(root, 'dist/styles.css.d.ts'),
  'declare const stylesheet: string;\nexport default stylesheet;\n',
);
