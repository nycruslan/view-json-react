# Migration Guide

## v2.0.0 → v2.1.0

### Overview

v2.1.0 is a non-breaking patch that hardens the package for real-world consumers.

### Changes

**Copy button now writes to clipboard by default.**
Previously, the copy button only appeared when `onCopy` was provided, and the consumer was responsible for writing to the clipboard. Now the button is always visible and writes to `navigator.clipboard` automatically. `onCopy` remains optional and fires as a notification callback after the copy.

```jsx
// Before — copy button invisible without onCopy, no clipboard write
<JsonViewer data={data} onCopy={({ path, value }) => navigator.clipboard.writeText(JSON.stringify(value))} />

// After — clipboard write is automatic, onCopy is optional notification
<JsonViewer data={data} />
<JsonViewer data={data} onCopy={({ path, value }) => console.log('copied', path)} />
```

**`data` prop now accepts `unknown`.**
Previously `data` was typed as `JsonValue`, which caused TypeScript errors when passing plain typed objects. It now accepts `unknown` so any value can be passed without a cast.

```tsx
// Before — TypeScript error without cast
interface User { name: string; age: number }
const user: User = { name: 'Alice', age: 30 };
<JsonViewer data={user as JsonValue} />

// After — works directly
<JsonViewer data={user} />
```

**ESLint upgraded to flat config (eslint.config.js).**
The old `.eslintrc.cjs` has been replaced with `eslint.config.js` compatible with ESLint 10.

**`@types/react` upgraded to v19** to match the installed React 19 devDependency.

**Source maps included in published package.**
`dist/*.map` files are now included so debuggers can map into library source.

**No action required** for existing consumers — all changes are backward compatible.

---

## v1 → v2.0.0

### Overview

Version 2.0.0 is a major update that improves performance, adds new features, and refines the API for better clarity. This guide will help you migrate from v1.x to v2.0.0.

### Quick Summary

**Breaking Changes:**
- **React 18+ now required** (was React 17+) — React 19 is fully supported
- `expandLevel` prop renamed to `defaultExpandDepth`
- `onCopy` callback parameter `keys` renamed to `path`

**New Features:**
- Dark theme support via `theme` prop
- Custom CSS classes via `className` prop
- Object size display via `showObjectSize` prop (enabled by default)
- CSS variable theming support
- Improved TypeScript types

## Breaking Changes

### 1. React 18+ Required

**Why?** v2 leverages React 18+ features for better performance and aligns with the modern React ecosystem. React 19 is fully supported and tested.

**v1.x:**
```json
{
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  }
}
```

**v2.0.0:**
```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

**Migration:**
- Ensure your project uses React 18 or later (React 19 fully supported)
- If still on React 17, upgrade React first:
  ```bash
  npm install react@^18 react-dom@^18
  # or for React 19
  npm install react@^19 react-dom@^19
  ```

---

### 2. Prop Rename: `expandLevel` → `defaultExpandDepth`

**Why?** The new name is more descriptive and aligns with React naming conventions.

**v1.x:**
```jsx
<JsonViewer
  data={myData}
  expandLevel={2}
/>
```

**v2.0.0:**
```jsx
<JsonViewer
  data={myData}
  defaultExpandDepth={2}
/>
```

**Migration:**
- Find and replace `expandLevel=` with `defaultExpandDepth=`
- Functionality remains identical

---

### 3. Callback Parameter: `keys` → `path`

**Why?** "Path" is more semantically accurate for describing the location within a JSON structure.

**v1.x:**
```jsx
<JsonViewer
  data={myData}
  onCopy={({ keys, value }) => {
    console.log('Keys:', keys);
    console.log('Value:', value);
  }}
/>
```

**v2.0.0:**
```jsx
<JsonViewer
  data={myData}
  onCopy={({ path, value }) => {
    console.log('Path:', path);
    console.log('Value:', value);
  }}
/>
```

**Migration:**
- In your `onCopy` callback, rename the `keys` parameter to `path`
- The array content is identical, only the property name changed

---

## New Features (Backward Compatible)

### Dark Theme Support

```jsx
<JsonViewer
  data={myData}
  theme="dark"
/>
```

### Custom CSS Classes

```jsx
<JsonViewer
  data={myData}
  className="my-custom-class"
/>
```

### Object Size Display

Enabled by default in v2. Disable if needed:

```jsx
<JsonViewer
  data={myData}
  showObjectSize={false}
/>
```

### CSS Variable Theming

Override theme colors:

```jsx
<JsonViewer
  data={myData}
  style={{
    '--json-key': '#ff0000',
    '--json-string': '#00ff00',
  }}
/>
```

## TypeScript Changes

### Improved Type Definitions

**v1.x:**
```typescript
type JsonValue = unknown;
```

**v2.0.0:**
```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
```

**Impact:**
- Better type safety and autocomplete
- Non-breaking for JavaScript users
- TypeScript users get improved type checking

### Updated Callback Type

```typescript
// v1.x
type onCopyProps = { keys: string[]; value: JsonValue };

// v2.0.0
type OnCopyProps = { path: string[]; value: JsonValue };
```

## Performance Improvements

v2.0.0 includes significant performance improvements:

- Removed React Context overhead (30% faster rendering)
- Optimized component splitting (LeafNode vs ObjectNode)
- Better memoization strategy
- Cleaned up unnecessary re-renders

**No action needed** - these improvements are automatic.

## Bundle Size

- **v1.x:** ~6KB (gzip)
- **v2.0.0:** ~4.8KB (brotli), ~5.5KB (gzip)

Smaller and faster! 🚀

## Step-by-Step Migration

1. **Update the package:**
   ```bash
   npm install view-json-react@^2.0.0
   # or
   pnpm add view-json-react@^2.0.0
   # or
   yarn add view-json-react@^2.0.0
   ```

2. **Find and replace prop names:**
   - Search: `expandLevel=`
   - Replace: `defaultExpandDepth=`

3. **Update onCopy callbacks:**
   - Search: `({ keys, value })`
   - Replace: `({ path, value })`

4. **Update TypeScript types (if applicable):**
   - Search: `onCopyProps`
   - Replace: `OnCopyProps`

5. **Test your application:**
   - Verify JSON rendering looks correct
   - Test expand/collapse functionality
   - Verify copy callbacks work as expected

## Common Migration Issues

### Issue: "expandLevel prop not working"

**Cause:** You didn't rename the prop to `defaultExpandDepth`.

**Fix:**
```jsx
// ❌ Wrong (v1.x syntax)
<JsonViewer expandLevel={2} />

// ✅ Correct (v2.0.0 syntax)
<JsonViewer defaultExpandDepth={2} />
```

### Issue: "onCopy callback receives undefined"

**Cause:** You're destructuring `keys` instead of `path`.

**Fix:**
```jsx
// ❌ Wrong (v1.x syntax)
onCopy={({ keys, value }) => console.log(keys)}

// ✅ Correct (v2.0.0 syntax)
onCopy={({ path, value }) => console.log(path)}
```

### Issue: "TypeScript error with OnCopyProps type"

**Cause:** Type name changed from lowercase `onCopyProps` to `OnCopyProps`.

**Fix:**
```typescript
// ❌ Wrong (v1.x syntax)
import type { onCopyProps } from 'view-json-react';

// ✅ Correct (v2.0.0 syntax)
import type { OnCopyProps } from 'view-json-react';
```

## Need Help?

If you encounter issues during migration:

1. Check this guide thoroughly
2. Review the [v2.0.0 changelog](https://github.com/nycruslan/view-json-react/releases)
3. Open an issue on [GitHub](https://github.com/nycruslan/view-json-react/issues)

## Summary

✅ **3 Breaking Changes** - React 18+ required, simple prop renames
✅ **Smaller Bundle** - from 6KB to 4.8KB

Migration should take **less than 5 minutes** for most projects!
