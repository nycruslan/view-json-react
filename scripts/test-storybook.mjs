import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const output = path.resolve(import.meta.dirname, '../storybook-static');
for (const relativePath of [
  'llms.txt',
  'assets/view-json-react.png',
  'assets/social-preview.jpg',
]) {
  const filePath = path.join(output, relativePath);
  if (statSync(filePath).size === 0) {
    throw new Error(`Storybook discovery asset is empty: ${relativePath}`);
  }
}

const index = readFileSync(path.join(output, 'index.html'), 'utf8');
for (const expected of [
  'view-json-react — Accessible React JSON viewer',
  'application/ld+json',
  'view-json-react/llms.txt',
  'assets/social-preview.jpg',
]) {
  if (!index.includes(expected)) {
    throw new Error(`Storybook metadata is missing: ${expected}`);
  }
}

console.log('Storybook SEO, social preview, and AI discovery assets passed.');
