# Contributing

Thank you for your interest in contributing to `view-json-react`!

## Ways to Contribute

- Report bugs via [GitHub Issues](https://github.com/nycruslan/view-json-react/issues)
- Suggest features or improvements
- Submit pull requests for fixes or enhancements
- Improve documentation

## Development Setup

**Requirements:** Node.js 18+, pnpm 8+

```bash
git clone https://github.com/nycruslan/view-json-react.git
cd view-json-react
pnpm install
```

## Common Commands

| Command | Description |
|---|---|
| `pnpm run storybook` | Start Storybook dev server on port 6006 |
| `pnpm run build` | Build the production library |
| `pnpm run lint` | Run ESLint and auto-fix |

## Pull Request Guidelines

1. **Fork** the repository and create a branch from `main`.
2. Keep changes focused — one feature or fix per PR.
3. Make sure `pnpm run build` and `pnpm run lint` both pass before opening a PR.
4. Update or add a Storybook story if your change affects the component API or visual output.
5. Update `CHANGELOG.md` under the `[Unreleased]` section describing your change.
6. Open the PR against `main` with a clear title and description.

## Reporting Bugs

Please include:
- Package version (`view-json-react@x.y.z`)
- React version
- A minimal reproduction (code snippet or StackBlitz link)
- Expected vs actual behavior

## Code Style

The project uses ESLint with TypeScript rules. Run `pnpm run lint` to check and auto-fix formatting issues before committing.

## License

By contributing you agree that your contributions will be licensed under the [MIT License](./LICENSE).
