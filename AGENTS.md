# Repository guidance

## Product constraints

- Keep `view-json-react` a focused, read-only value inspector.
- Preserve zero runtime dependencies and React 18/19 compatibility.
- Keep public package entries limited to `.`, `./virtual`, `./headless`, `./styles.css`, and `./package.json`.
- Do not add editing, schema, fetching, persistence, or runtime style injection.
- Treat accessibility, bounded traversal, getter safety, cycle handling, SSR, CSP, ESM, and CommonJS support as required behavior.

## Source layout

- `src/core/`: framework-independent inspection, paths, search, and serialization.
- `src/JsonViewer.tsx`: standard accessible tree and shared interaction logic.
- `src/VirtualJsonViewer.tsx`: optional fixed-row windowing entry.
- `src/components/` and `src/internal/`: private rendering implementation.
- `scripts/build.mjs`: sequential JS, declaration, and stylesheet build.
- `scripts/test-package.mjs`: packed consumer, publint, and ATTW validation.

## Change rules

- Use explicit `.js` specifiers in relative TypeScript imports so emitted declarations resolve under Node16/NodeNext.
- Avoid invoking accessors while inspecting values. Proxy reflection traps may execute by JavaScript design and must fail safely.
- Preserve typed paths: object keys are strings, array indexes are numbers, and `rootName` is display-only.
- Keep standard and virtual entry points separate; do not make the root bundle pay for windowing.
- Add focused regression tests for behavior changes. Do not add abstractions without a demonstrated use.
- Do not publish, tag, or change the package version unless explicitly requested.

## Validation

Use pnpm 12 and Node.js 24 for repository development.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test:coverage
pnpm build-storybook
pnpm run audit
```

`pnpm check` runs ESLint, Knip, TypeScript, tests, builds, size limits, and packed-package validation. Keep build, pack, and package validators sequential because they share `dist/`.
