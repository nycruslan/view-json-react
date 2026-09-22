# Migration Guide

## v2 → v3

v3 replaces the recursive display component with a safe data model and an accessible ARIA tree. It remains a read-only viewer, supports React 18 and 19, and has no runtime dependencies.

### 1. Import the stylesheet

v2 injected CSS from JavaScript. v3 publishes static CSS for CSP, SSR, caching, and predictable bundling.

```tsx
import { JsonViewer } from 'view-json-react';
import 'view-json-react/styles.css';
```

Import the stylesheet once through your application's global CSS entry. The component will be unstyled if it is omitted.

### 2. Update custom CSS tokens and selectors

The v2 `--json-*` variables and CSS-module-generated class names no longer exist. v3's stable public tokens use the `--vjr-*` prefix.

```tsx
// v2
<JsonViewer style={{ '--json-bg-color': '#111' } as React.CSSProperties} />

// v3: custom properties are included in the style prop type
<JsonViewer
  data={data}
  style={{
    '--vjr-background': '#111',
    '--vjr-text': '#eee',
    '--vjr-key': '#80bfff',
  }}
/>
```

Prefer variables over targeting internal `.vjr-*` structural classes. See the README for the token list.

### 3. Update `onCopy`

v2 notified immediately and could report success even when the asynchronous clipboard write failed. v3 waits for the write and reports its outcome.

```tsx
// v2
<JsonViewer onCopy={({ path, value }) => console.log(path, value)} />

// v3
<JsonViewer
  data={data}
  onCopy={({ path, value, text, kind, success, error }) => {
    if (success) console.log(kind, path, value, text);
    else console.error(error);
  }}
/>
```

Other changes:

- `path` is now `readonly (string | number)[]`; array indexes are numbers.
- `rootName` is display-only and is never inserted into a path.
- `OnCopyProps` remains as a deprecated alias for `CopyResult`.
- Clipboard denial or an unsupported browser is a reported failure, not a silent no-op.
- `copy={false}` removes copy actions. Use `copy={{ value: true, path: true }}` to add path copying.

### 4. Review expansion behavior

`defaultExpandDepth` remains, but expansion can now be controlled with JSON Pointer strings.

```tsx
const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['']));

<JsonViewer
  data={data}
  expandedPaths={expanded}
  onExpandedPathsChange={setExpanded}
/>
```

- `''` is the root pointer.
- `'/users/0'` points to the first user.
- `defaultExpandedPaths` is used only for initial uncontrolled state.
- `onExpand` receives `{ path, value, expanded }`.

Do not depend on the old recursive DOM remaining mounted after a branch is collapsed.

### 5. Account for the ARIA tree interaction model

v2 exposed every branch control as an independent tab stop. v3 has one managed tree focus target and follows the WAI-ARIA Tree View keyboard model.

If application tests queried the old buttons or DOM nesting, migrate them to roles and accessible names:

```tsx
const tree = screen.getByRole('tree', { name: 'JSON data' });
tree.focus();
await user.keyboard('{ArrowDown}{ArrowRight}');
expect(screen.getByRole('treeitem', { name: /profile, object/i }))
  .toHaveAttribute('aria-expanded', 'true');
```

Custom `onKeyDown` handlers run first. Calling `event.preventDefault()` opts out of built-in handling for that event.

### 6. Review non-JSON value output

v2 could render blanks, empty objects, misleading values, or throw for JavaScript values. v3 explicitly formats them:

- `bigint`, `undefined`, symbols, functions, dates, regular expressions, errors
- `NaN`, infinities, and `-0`
- maps, sets, and typed arrays as summarized leaf values
- sparse-array holes and accessor descriptors
- cycles as reference rows
- revoked or throwing values as unavailable rows where possible

Valid JSON keeps its familiar representation. To override leaf rendering, use `renderValue`. To override copied serialization, use `copy.stringify`.

### 7. Choose the large-data entry when needed

The standard viewer has lazy expansion and safety limits. For large expanded arrays or objects, switch imports:

```tsx
import { VirtualJsonViewer } from 'view-json-react/virtual';
import 'view-json-react/styles.css';

<VirtualJsonViewer data={data} height={480} />
```

The virtual entry is intentionally separate so the standard bundle does not include windowing code.

### 8. Replace deep imports

Only documented package exports are supported:

```ts
import { JsonViewer } from 'view-json-react';
import { VirtualJsonViewer } from 'view-json-react/virtual';
import { buildVisibleTree } from 'view-json-react/headless';
import 'view-json-react/styles.css';
```

Imports from `view-json-react/dist/*` or old source paths are blocked by package exports.

### 9. Search is controlled

v3 does not impose a search toolbar. Connect `searchQuery` to your own UI:

```tsx
<input value={query} onChange={event => setQuery(event.target.value)} />
<JsonViewer data={data} searchQuery={query} />
```

`F3` and `Shift+F3` move through matches while the tree is focused. The imperative ref also exposes `nextMatch()` and `previousMatch()`.

### 10. Check security and CSP expectations

- The standard viewer no longer creates a runtime `<style>` element.
- Redaction affects copied text; it does not hide the visible row.
- Enumerable getters are not invoked during normal inspection.
- Custom renderers are responsible for their own output safety.
- The virtual viewer uses inline positioning styles, which matters under `style-src-attr 'none'`.

### Recommended migration sequence

1. Install v3 and import `view-json-react/styles.css`.
2. Remove v2 CSS selector overrides and migrate variables to `--vjr-*`.
3. Update `onCopy` types and assertions.
4. Update tests to query `tree` and `treeitem` roles.
5. Verify paths that contain array indexes or a custom `rootName`.
6. Exercise circular and non-JSON values relevant to your application.
7. Set appropriate `maxDepth`, `maxVisibleNodes`, and search limits.
8. Use the virtual entry for large expanded collections.

## v1 → v2 reference

v2 raised the peer requirement to React 18, renamed `expandLevel` to `defaultExpandDepth`, and renamed the copy callback's `keys` field to `path`. Apply those changes before following the v2 → v3 steps above.

## Help

See the [README](./README.md), [live Storybook](https://nycruslan.github.io/view-json-react/), and [issue tracker](https://github.com/nycruslan/view-json-react/issues).
