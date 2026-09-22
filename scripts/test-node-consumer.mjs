import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const expectedMajorArgument = process.argv.find((argument) =>
  argument.startsWith('--expected-major='),
);
const expectedMajor = expectedMajorArgument?.split('=')[1];
const actualMajor = process.versions.node.split('.')[0];

if (expectedMajor !== undefined) {
  assert.equal(
    actualMajor,
    expectedMajor,
    `Expected Node.js ${expectedMajor}, received ${process.versions.node}`,
  );
}

const require = createRequire(import.meta.url);
const esm = await import('view-json-react');
const esmVirtual = await import('view-json-react/virtual');
const esmHeadless = await import('view-json-react/headless');
const commonjs = require('view-json-react');
const commonjsVirtual = require('view-json-react/virtual');
const commonjsHeadless = require('view-json-react/headless');

for (const [label, component] of [
  ['ESM root', esm.JsonViewer],
  ['CommonJS root', commonjs.JsonViewer],
  ['ESM virtual', esmVirtual.VirtualJsonViewer],
  ['CommonJS virtual', commonjsVirtual.VirtualJsonViewer],
]) {
  assert.ok(
    component !== null && ['function', 'object'].includes(typeof component),
    `${label} should expose a React component`,
  );
}
for (const [label, utility] of [
  ['ESM headless', esmHeadless.buildVisibleTree],
  ['CommonJS headless', commonjsHeadless.buildVisibleTree],
]) {
  assert.equal(typeof utility, 'function', `${label} should expose a function`);
}

assert.equal(typeof document, 'undefined', 'The consumer test must run without a DOM');

const data = {
  user: { name: 'Ada Lovelace', active: true },
  roles: ['admin', 'reviewer'],
};
const markup = renderToStaticMarkup(
  React.createElement(esm.JsonViewer, {
    data,
    defaultExpandDepth: 2,
    copy: false,
  }),
);

assert.match(markup, /role="tree"/);
assert.match(markup, /Ada Lovelace/);

const virtualMarkup = renderToStaticMarkup(
  React.createElement(esmVirtual.VirtualJsonViewer, {
    data,
    defaultExpandDepth: 1,
    height: 160,
    copy: false,
  }),
);
assert.match(virtualMarkup, /role="tree"/);

const expandedPaths = new Set(['', '/user']);
const tree = esmHeadless.buildVisibleTree(data, {
  isExpanded: (path) => expandedPaths.has(esmHeadless.toJsonPointer(path)),
});
assert.equal(tree.rows[0]?.pointer, '');
assert.ok(tree.rows.some((row) => row.pointer === '/user/name'));

console.log(`Node.js ${process.versions.node} consumer compatibility passed.`);
