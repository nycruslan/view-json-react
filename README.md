# view-json-react

[![npm version](https://img.shields.io/npm/v/view-json-react.svg)](https://www.npmjs.com/package/view-json-react)
[![npm downloads](https://img.shields.io/npm/dw/view-json-react.svg)](https://www.npmjs.com/package/view-json-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/view-json-react)](https://bundlephobia.com/package/view-json-react)
[![license](https://img.shields.io/npm/l/view-json-react.svg)](./LICENSE)

A lightweight, accessible React component for visualizing JSON data as a collapsible tree. Supports dark mode, built-in clipboard copy, CSS variable theming, and full TypeScript types.

**[Live Docs & Storybook](https://nycruslan.github.io/view-json-react/?path=/docs/components-jsonviewer--docs)**

---

## Features

- **Light & Dark theme** — built-in via `theme` prop, fully customizable with CSS variables
- **Collapsible nodes** — expand/collapse objects and arrays interactively
- **Clipboard copy** — every node has a copy button; writes to clipboard automatically
- **Type-safe** — full TypeScript types exported from the package
- **Lightweight** — ~5 KB brotli compressed, zero runtime dependencies
- **Accessible** — keyboard navigation (Enter/Space), ARIA attributes, focus styles
- **Mobile-friendly** — touch device support

---

## Installation

```bash
npm install view-json-react
# or
pnpm add view-json-react
# or
yarn add view-json-react
```

**Peer dependencies:** React 18 or 19

---

## Quick Start

```tsx
import { JsonViewer } from 'view-json-react';

function App() {
  const data = { name: 'Alice', age: 30, roles: ['admin', 'user'] };

  return <JsonViewer data={data} />;
}
```

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `unknown` | — | **(Required)** The value to visualize. Accepts any JSON-serializable value. |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme. |
| `defaultExpandDepth` | `number` | `1` | How many levels to expand on first render. `0` = all collapsed. |
| `showObjectSize` | `boolean` | `true` | Show item count next to collapsed objects and arrays. |
| `rootName` | `string` | — | Label shown on the root node. Hidden if not provided. |
| `className` | `string` | — | Extra CSS class added to the root container. |
| `style` | `CSSProperties` | — | Inline styles on the root container. Use to override CSS variables. |
| `onCopy` | `(info: OnCopyProps) => void` | — | Optional callback fired after a copy button is clicked. Clipboard write happens automatically regardless. |

### `OnCopyProps`

```ts
type OnCopyProps = {
  path: string[];   // key path to the copied node, e.g. ['users', '0', 'name']
  value: JsonValue; // the value that was copied
};
```

---

## Usage Examples

### Dark theme

```tsx
<JsonViewer data={data} theme="dark" />
```

### Control expand depth

```tsx
// All collapsed on load
<JsonViewer data={data} defaultExpandDepth={0} />

// Expand first 3 levels
<JsonViewer data={data} defaultExpandDepth={3} />
```

### Named root node

```tsx
<JsonViewer data={data} rootName="response" />
```

### Copy callback

Copy buttons are always visible and write to the clipboard automatically. Use `onCopy` to be notified:

```tsx
<JsonViewer
  data={data}
  onCopy={({ path, value }) => {
    console.log('Copied path:', path.join('.'));
    console.log('Copied value:', value);
  }}
/>
```

### TypeScript — typed data

Because `data` accepts `unknown`, any typed object works without a cast:

```tsx
import { JsonViewer } from 'view-json-react';
import type { JsonValue, OnCopyProps } from 'view-json-react';

interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

const response: ApiResponse = { status: 200, body: { ok: true } };

// No cast needed
<JsonViewer data={response} />

// Typed callback
const handleCopy = (info: OnCopyProps) => {
  console.log(info.path, info.value);
};

<JsonViewer data={response} onCopy={handleCopy} />
```

---

## CSS Variable Theming

Override any token via the `style` prop or a CSS class:

```tsx
<JsonViewer
  data={data}
  style={{
    '--json-bg-color': '#1e1e1e',
    '--json-string-color': '#ce9178',
    '--json-number-color': '#b5cea8',
  }}
/>
```

### Available tokens

| Token | Description |
|---|---|
| `--json-font-family` | Font stack |
| `--json-font-size` | Base font size |
| `--json-line-height` | Line height |
| `--json-indent` | Indentation per level |
| `--json-text-color` | Default text color |
| `--json-bg-color` | Background color (transparent by default) |
| `--json-key-color` | Object key color |
| `--json-string-color` | String value color |
| `--json-number-color` | Number value color |
| `--json-boolean-color` | Boolean value color |
| `--json-null-color` | Null value color |
| `--json-border-color` | Connector line color |
| `--json-hover-bg` | Key hover background |
| `--json-arrow-color` | Expand/collapse arrow color |
| `--json-dots-color` | Collapsed `...` indicator color |
| `--json-focus-color` | Keyboard focus outline color |
| `--json-copy-bg` | Copy button background |
| `--json-copy-border` | Copy button border |
| `--json-copy-text` | Copy button icon color |
| `--json-copy-hover-bg` | Copy button hover background |
| `--json-copy-hover-border` | Copy button hover border |
| `--json-copied-bg` | Copy button background after copy |
| `--json-copied-border` | Copy button border after copy |
| `--json-copied-text` | Copy button icon color after copy |

---

## Exported Types

```ts
import type {
  JsonViewerProps, // component props
  OnCopyProps,     // onCopy callback argument
  JsonValue,       // JsonPrimitive | JsonObject | JsonArray
} from 'view-json-react';
```

---

## Browser Support

Works in all modern browsers that support `navigator.clipboard` (Chrome 66+, Firefox 63+, Safari 13.1+). In environments without clipboard access (non-HTTPS, old browsers), the copy button is still rendered but the write is a no-op.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Please be respectful in all interactions.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a full history of changes.

## License

MIT — see [LICENSE](./LICENSE).
