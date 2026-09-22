# Releasing view-json-react

Releases are published from GitHub Actions through npm Trusted Publishing. The workflow stages the package first; a maintainer must inspect and approve it with npm two-factor authentication before it becomes public. Never publish from a developer token or reuse a failed release tag.

## 1. Prepare the release commit

1. Start from an up-to-date `main` with a clean working tree.
2. Confirm the target version is absent from both public npm versions and npm staged releases.
3. Update `package.json` and move the relevant `CHANGELOG.md` items out of **Unreleased**. Do not create the tag yet.
4. Use the intended development runtime and package manager:

   ```bash
   node --version # Node.js 24
   pnpm --version # version pinned by packageManager
   pnpm install --frozen-lockfile
   pnpm release:check
   ```

5. Review `npm pack --dry-run --ignore-scripts`, the generated tarball checks from `scripts/test-package.mjs`, and bundle-size output.
6. Commit and push the release commit. Wait for all CI jobs and the Storybook deployment to pass.
7. Verify the deployed documentation, including:
   - <https://nycruslan.github.io/view-json-react/>
   - <https://nycruslan.github.io/view-json-react/llms.txt>

## 2. Trigger trusted staging

Create and push an annotated tag that exactly matches the package version (use a signed tag when signing is configured):

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

The `Publish` workflow verifies the tag, reruns the release-grade gate, inspects the package without lifecycle scripts, and calls `npm stage publish`. The npm Trusted Publisher configuration must remain restricted to:

- repository: `nycruslan/view-json-react`;
- workflow: `.github/workflows/publish.yml`;
- the npm public registry.

## 3. Inspect and approve

1. Open npm’s staged-release page for `view-json-react`.
2. Download and inspect the staged tarball and provenance.
3. Confirm the version, dist-tag (`next`, `beta`, `rc`, or `latest`), file list, exports, README, declarations, `SECURITY.md`, Agent Skill, and `llms.txt`.
4. Approve with npm 2FA only after those checks pass. Reject the stage if anything differs from the release commit.

## 4. Verify the public release

```bash
npm view view-json-react version dist-tags --json
npm view view-json-react@X.Y.Z dist.integrity dist.shasum --json
npm pack view-json-react@X.Y.Z --ignore-scripts
```

Then verify ESM, CommonJS, TypeScript, SSR, stylesheet, virtual, and headless consumption from the public tarball. Confirm the GitHub release notes and documentation refer to an installable npm version.

## Recovery

- **Validation failed before staging:** fix the release commit, choose a new version if a tag was already pushed, and rerun the process.
- **Stage rejected or expired:** diagnose first; do not bypass Trusted Publishing with a local token.
- **Tag exists but npm publish failed:** do not move or reuse the tag. Record the failed attempt and release the fix under a new version.
- **Compromised release:** deprecate the affected npm version, publish a corrected version, and use GitHub’s security-advisory process for coordinated disclosure.
