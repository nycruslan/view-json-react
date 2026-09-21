import { performance } from 'node:perf_hooks';
import process from 'node:process';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonViewer } from '../dist/view-json-react.esm.js';
import { VirtualJsonViewer } from '../dist/virtual.js';

const sizes = [1_000, 10_000, 50_000];

for (const size of sizes) {
  const data = Array.from({ length: size }, (_, index) => index);
  for (const [name, Component] of [
    ['standard', JsonViewer],
    ['virtual', VirtualJsonViewer],
  ]) {
    globalThis.gc?.();
    const heapBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    const html = renderToStaticMarkup(
      React.createElement(Component, { data, copy: false }),
    );
    const duration = performance.now() - start;
    const heapDelta = process.memoryUsage().heapUsed - heapBefore;
    console.log(JSON.stringify({
      name,
      nodes: size,
      durationMs: Number(duration.toFixed(1)),
      htmlBytes: Buffer.byteLength(html),
      heapDeltaMb: Number((heapDelta / 1024 / 1024).toFixed(1)),
    }));
  }
}
