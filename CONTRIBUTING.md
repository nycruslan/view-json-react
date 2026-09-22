# Contributing

Thank you for your interest in contributing to `view-json-react`!

## Ways to Contribute

- Report bugs via [GitHub Issues](https://github.com/nycruslan/view-json-react/issues)
- Suggest features or improvements
- Submit pull requests for fixes or enhancements
- Improve documentation

## Development Setup

**Requirements:** Node.js 24 and the pnpm version pinned in `package.json`.
TypeScript is intentionally pinned to the newest release accepted by the
`@typescript-eslint` peer range; do not force an unsupported compiler/parser
combination.

```bash
git clone https://github.com/nycruslan/view-json-react.git
cd view-json-react
pnpm install
```

## Common Commands

| Command | Description |
|---|---|
| `pnpm run audit` | Fail on any known dependency advisory |
| `pnpm run storybook` | Start Storybook dev server on port 6006 |
| `pnpm run test:run` | Run the unit and component tests once |
| `pnpm run test:coverage` | Run tests and generate coverage reports |
| `pnpm run test:package` | Test packed modules, types, SSR, CSS, AI docs, and subpaths |
| `pnpm run typecheck` | Check TypeScript types |
| `pnpm run lint` | Run ESLint and unused-code/dependency analysis |
| `pnpm run lint:fix` | Apply safe ESLint fixes |
| `pnpm run lint:unused` | Run Knip by itself |
| `pnpm run build` | Build all entries, declarations, CSS, and size budgets |
| `pnpm run benchmark` | Build and run the reproducible SSR benchmark |
| `pnpm run check` | Run lint, types, tests, builds, size limits, and packed-package validation |

## Pull Request Guidelines

1. **Fork** the repository and create a branch from `main`.
2. Keep changes focused — one feature or fix per PR.
3. Make sure `pnpm run check` passes before submitting a change.
4. Add behavior, keyboard, and axe coverage where applicable. Automated checks do not replace manual keyboard and screen-reader review.
5. Update or add a Storybook story if your change affects the component API or visual output.
6. Update `CHANGELOG.md` under the `[Unreleased]` section describing your change.
7. Open the PR against `main` with a clear title and description.

## Reporting Bugs

Please include:
- Package version (`view-json-react@x.y.z`)
- React version
- A minimal reproduction (code snippet or StackBlitz link)
- Expected vs actual behavior

## Architecture

- `src/core` is the framework-free, iterative inspection model.
- `src/JsonViewer.tsx` owns accessible tree behavior and public state.
- `src/VirtualJsonViewer.tsx` adds windowing without increasing the standard entry.
- `src/styles.css` is the only shipped stylesheet; runtime injection is not allowed.
- Public exports are limited to the root, `virtual`, `headless`, and `styles.css` subpaths.

Keep traversal bounded, do not invoke property getters, preserve numeric array path segments, and avoid adding runtime dependencies without strong justification.

## Agent-facing documentation

- `AGENTS.md` contains concise repository instructions shared by coding agents.
- `.agents/skills/view-json-react/SKILL.md` is the portable consumer-integration skill shipped in the npm package.
- `llms.txt` is copied to the Storybook root and indexes the authoritative Markdown documentation.

Keep the README and TypeScript declarations authoritative. The skill should remain a concise workflow rather than duplicating the full API, and `llms.txt` should link to maintained source documents instead of embedding another copy.

## Code Style

The project uses ESLint with TypeScript rules. Run `pnpm run lint` to check, or `pnpm run lint:fix` to apply safe fixes.

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
