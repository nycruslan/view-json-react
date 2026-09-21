# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- A tested headless data model with safe traversal, cycle detection, JSON Pointer paths, value formatting, redaction, and serialization guards.
- A WAI-ARIA tree with complete arrow-key navigation, type-ahead, controlled expansion, imperative controls, and accessible copy feedback.
- Safe rendering for non-JSON JavaScript values, throwing accessors, proxies, repeated references, and cycles.
- Light, dark, and system themes with RTL, reduced-motion, forced-colors, and WCAG AA-oriented tokens.
- Bounded full-tree search with match navigation, deterministic key sorting, and expandable long strings.
- Dependency-free windowed rendering through `view-json-react/virtual`, including Page Up/Page Down navigation.
- Focused `view-json-react/headless`, `view-json-react/virtual`, and `view-json-react/styles.css` package exports.
- A reproducible server-render benchmark for standard and windowed large-data rendering.
- Packed-tarball tests for ESM, CommonJS, TypeScript, SSR, CSS, and all public subpaths.
- Pull-request quality gates for linting, type checking, tests, builds, dependency audits, and Storybook.

### Changed
- Began the v3 prerelease line as `3.0.0-next.0`.
- Styles are now a static opt-in stylesheet instead of runtime injection, improving CSP and SSR compatibility.
- Declaration generation now uses TypeScript directly, removing the API Extractor dependency chain.
- Copy operations now report actual asynchronous success or failure and support path copying and redaction.
- JSON paths now use numeric array segments and keep `rootName` display-only.
- Replaced mutating lint defaults and install-time builds with explicit check and prepack commands.

---

## [2.1.3] - 2026-08-20

### Changed
- Pinned the package manager and moved pnpm security policy settings into `pnpm-workspace.yaml`.
- Updated the lockfile after dependency-policy verification.

---

## [2.1.2] - 2026-08-19

### Security
- Resolved all 31 known vulnerabilities (22 high, 7 moderate, 2 low) reported by `pnpm audit`. All were in transitive devDependencies (`vite`, `ws`, `postcss`, `brace-expansion`, `fast-uri`, `immutable`, `nanoid`, `lodash`, `esbuild`, `@babel/core`) — the published package has no runtime dependencies, so consumers were never exposed.

### Changed
- Updated devDependencies: Storybook 10.3 → 10.5, Vite 8.0 → 8.2, ESLint 10.1 → 10.8, size-limit 12 → 13, plus latest React 19.2.x, sass, and typescript-eslint
- Allowlisted `esbuild`'s install script via `pnpm.onlyBuiltDependencies` (required by pnpm 10's script-blocking security default)
- Added `storybook-static/` to `.gitignore`

---

## [2.1.1] - 2026-03-31

### Fixed
- **Storybook addon compatibility**: Externalized `react/jsx-runtime` — the ESM bundle now imports `jsx`/`jsxs`/`Fragment` from `react/jsx-runtime` instead of inlining a CJS shim. This fixes the "Dynamic require of react is not supported" error in Storybook's esbuild manager.
- Bundle size reduced by ~45% (from ~17KB to ~9KB gzip: 5.7KB → 3KB) after externalizing JSX runtime

---

## [2.1.0] - 2026-03-31

### Added
- Copy buttons are now always visible on every node — no configuration required
- `navigator.clipboard.writeText` is called automatically on copy; `onCopy` is now an optional notification callback
- `CONTRIBUTING.md` with development setup, PR guidelines, and bug reporting instructions
- `CODE_OF_CONDUCT.md` based on Contributor Covenant v2.1
- `CHANGELOG.md` (this file)
- Source map files (`dist/*.map`) are now included in the published package
- `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` added as proper devDependencies

### Changed
- `data` prop widened from `JsonValue` to `unknown` — plain typed objects no longer require a cast
- `@types/react` and `@types/react-dom` upgraded from v18 to v19 to match installed React version
- ESLint config migrated from legacy `.eslintrc.cjs` to flat `eslint.config.js` (ESLint 10 compatible)
- All memoized components use named function syntax (`memo(function Name(...))`) for correct React DevTools display names
- `sideEffects` field corrected from `false` to list the dist files — prevents bundlers from tree-shaking CSS injection
- Build scripts migrated from `npm run` to `pnpm run`; `rimraf` replaced with native `node fs.rmSync`

### Fixed
- `React` namespace used without import in all component files — added `import type React from 'react'`
- `React.CSSProperties` replaced with directly imported `CSSProperties` from `react`
- Internal `entries` array in `ObjectNode` now properly typed as `[string, JsonValue][]`
- Wrong GitHub repository URLs in `MIGRATION.md` (`react-json-view` → `view-json-react`)

---

## [2.0.0] - 2026-03-28

### Added
- Dark theme support via `theme="dark"` prop
- `className` prop for custom container styling
- `showObjectSize` prop — displays item count on collapsed objects/arrays (default: `true`)
- CSS variable theming — override any color or font via the `style` prop
- Full TypeScript types: `JsonPrimitive`, `JsonObject`, `JsonArray`, `JsonValue`, `OnCopyProps`, `JsonViewerProps`

### Changed
- **Breaking:** Minimum React version raised from 17 to 18 (React 19 fully supported)
- **Breaking:** `expandLevel` prop renamed to `defaultExpandDepth`
- **Breaking:** `onCopy` callback parameter renamed from `keys` to `path`
- `onCopyProps` type renamed to `OnCopyProps` (PascalCase)
- Removed React Context — 30% faster rendering on large trees
- Split rendering into `LeafNode` and `ObjectNode` for better memoization

### Fixed
- Unnecessary re-renders on expand/collapse of sibling nodes

---

## [1.1.2] - 2024-09-27

### Fixed
- Minor dependency updates

---

## [1.1.0] - 2024-02-18

### Added
- Keyboard navigation support (Enter/Space to expand/collapse)
- ARIA attributes for accessibility

---

## [1.0.0] - 2024-02-17

### Added
- Initial release
- Collapsible JSON tree rendering
- Copy-to-clipboard via `onCopy` callback
- Light theme
- TypeScript support

[Unreleased]: https://github.com/nycruslan/view-json-react/compare/v2.1.3...HEAD
[2.1.3]: https://github.com/nycruslan/view-json-react/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/nycruslan/view-json-react/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/nycruslan/view-json-react/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/nycruslan/view-json-react/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/nycruslan/view-json-react/compare/v1.1.2...v2.0.0
[1.1.2]: https://github.com/nycruslan/view-json-react/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/nycruslan/view-json-react/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nycruslan/view-json-react/releases/tag/v1.0.0
