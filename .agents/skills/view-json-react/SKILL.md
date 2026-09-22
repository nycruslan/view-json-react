---
name: view-json-react
description: Integrate and review view-json-react v3 in React applications. Use when an application needs an accessible read-only JSON or JavaScript value inspector, bounded search, clipboard redaction, custom value rendering, SSR/CSP support, or virtualized large-data rendering, and when migrating view-json-react v2 code.
license: MIT
compatibility: React 18 or 19. Use the documentation shipped with the installed package as the version-matched authority.
metadata:
  package: view-json-react
---

# Use view-json-react

Use the smallest public entry that satisfies the task. Do not deep-import from `dist` or `src`, invent undocumented props, add runtime CSS injection, or turn the viewer into an editor.

## Verify the installed version

Before changing consumer code, inspect:

- `node_modules/view-json-react/package.json`
- `node_modules/view-json-react/README.md`
- the exported declarations under `node_modules/view-json-react/dist/`

Prefer those version-matched files over remembered APIs or examples from an unknown release.

## Standard integration

Install the package and import its static stylesheet once in the application's supported global CSS entry:

```tsx
import { JsonViewer } from 'view-json-react';
import 'view-json-react/styles.css';

export function Inspector({ data }: { data: unknown }) {
  return <JsonViewer data={data} rootName="response" theme="auto" />;
}
```

The package supports React 18 and 19. UI entries are client components and are safe to server-render, but interactive framework boundaries may still require the consuming module to be a client component.

## Choose the correct entry

- `view-json-react`: standard accessible tree for ordinary bounded views.
- `view-json-react/virtual`: fixed-row windowing for many expanded visible rows.
- `view-json-react/headless`: inspection, path, search, formatting, and safe serialization without React.
- `view-json-react/styles.css`: static opt-in styles; import once.

Use `VirtualJsonViewer` only when windowing is needed:

```tsx
import { VirtualJsonViewer } from 'view-json-react/virtual';
import 'view-json-react/styles.css';

<VirtualJsonViewer data={data} height={480} rowHeight={28} overscan={8} />
```

Do not import the virtual entry merely because the input object is large. Collapsed standard trees are bounded; windowing helps when many rows are visible.

## Preserve package semantics

- `data` is `unknown`; cycles, accessors, sparse arrays, and non-JSON values have explicit safe representations.
- `rootName` changes display only and never becomes part of a path.
- Expansion strings are RFC 6901 JSON Pointers. Typed callback paths use numeric array indexes.
- Search is controlled through `searchQuery`; the package intentionally provides no search input.
- `redact` changes copied serialization, not visible content.
- Clipboard results are asynchronous; use the `success` and `error` fields from `onCopy`.
- `renderValue` customizes leaves. Return `undefined` for built-in rendering; returning `null` intentionally renders nothing.
- Importing the stylesheet is required for built-in presentation. The standard viewer does not inject runtime styles.
- Use the documented safety limits instead of disabling bounds for untrusted or very large values.

## Large-data and security choices

Start with the defaults. Adjust `maxDepth`, `maxVisibleNodes`, `maxSearchNodes`, and `maxSearchResults` only from measured application needs. Use the virtual entry when expanded output is large.

For copied secrets:

```tsx
<JsonViewer
  data={data}
  copy={{ value: true, path: true }}
  redact={path => path.at(-1) === 'token'}
  onCopy={({ success, error }) => {
    if (!success) console.error(error);
  }}
/>
```

Never claim that redaction hides values on screen. Do not pass executable proxy objects from an untrusted security boundary; JavaScript proxy traps can run during reflection.

## Accessibility and testing

Keep the component's tree semantics intact. Do not replace tree rows with unrelated interactive markup or disable keyboard behavior without an equivalent accessible interaction.

Prefer role-based tests:

```tsx
const tree = screen.getByRole('tree', { name: 'JSON data' });
tree.focus();
fireEvent.keyDown(tree, { key: 'ArrowDown' });
expect(tree).toHaveAttribute('aria-activedescendant');
```

Test clipboard success and failure after the returned promise settles. For large views, verify the virtual entry mounts substantially fewer tree items than the model contains.

## Migration checks

When updating v2 code:

- add the explicit `styles.css` import;
- replace legacy CSS-module selectors and `--json-*` variables with documented `--vjr-*` tokens;
- update `onCopy` handling to the asynchronous result object;
- keep numeric array path segments and display-only `rootName` semantics;
- replace deep imports with documented package entries;
- query `tree` and `treeitem` roles instead of old recursive DOM details.

Read `node_modules/view-json-react/MIGRATION.md` for the complete version-matched migration guide.
