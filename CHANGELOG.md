# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nycruslan/view-json-react/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/nycruslan/view-json-react/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/nycruslan/view-json-react/compare/v1.1.2...v2.0.0
[1.1.2]: https://github.com/nycruslan/view-json-react/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/nycruslan/view-json-react/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nycruslan/view-json-react/releases/tag/v1.0.0
