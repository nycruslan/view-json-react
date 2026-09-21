# Contributing

Thank you for your interest in contributing to `view-json-react`!

## Ways to Contribute

- Report bugs via [GitHub Issues](https://github.com/nycruslan/view-json-react/issues)
- Suggest features or improvements
- Submit pull requests for fixes or enhancements
- Improve documentation

## Development Setup

**Requirements:** Node.js 24 and the pnpm version pinned in `package.json`

```bash
git clone https://github.com/nycruslan/view-json-react.git
cd view-json-react
pnpm install
```

## Common Commands

| Command | Description |
|---|---|
| `pnpm run storybook` | Start Storybook dev server on port 6006 |
| `pnpm run test:run` | Run the unit and component tests once |
| `pnpm run test:coverage` | Run tests with coverage thresholds |
| `pnpm run test:package` | Test the packed ESM, CommonJS, types, SSR, CSS, and subpaths |
| `pnpm run typecheck` | Check TypeScript types |
| `pnpm run lint` | Check source and test lint rules |
| `pnpm run lint:fix` | Apply safe ESLint fixes |
| `pnpm run build` | Build all entries, declarations, CSS, and size budgets |
| `pnpm run benchmark` | Build and run the reproducible SSR benchmark |
| `pnpm run check` | Run lint, type checks, tests, build, and size checks |

## Pull Request Guidelines

1. **Fork** the repository and create a branch from `main`.
2. Keep changes focused — one feature or fix per PR.
3. Make sure `pnpm run check` and `pnpm run test:package` pass before submitting a change.
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

## Code Style

The project uses ESLint with TypeScript rules. Run `pnpm run lint` to check, or `pnpm run lint:fix` to apply safe fixes.

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
