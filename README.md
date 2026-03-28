# JsonViewer Component Library

**[Live Docs & Storybook](https://nycruslan.github.io/view-json-react/)**

Welcome to the JsonViewer component library! This React-based tool is designed to render JSON data in a beautifully structured, collapsible format. It offers a convenient and intuitive way to visualize JSON structures, with features that enhance both functionality and user experience.

## Features

- 🎨 **Light & Dark Theme** - Built-in theme support with CSS variables
- 📦 **Collapsible Nodes** - Interactive expand/collapse for objects and arrays
- 📋 **Copy to Clipboard** - Easily copy JSON values with visual feedback
- 🎯 **Type-Safe** - Written in TypeScript with full type definitions
- ⚡ **Lightweight** - Under 10KB (brotli compressed)
- ♿ **Accessible** - Keyboard navigation and ARIA labels
- 🎨 **Customizable** - CSS variables and className for easy theming
- 📱 **Mobile-Friendly** - Touch device support with accessible controls
- 🔧 **Flexible API** - Root naming, expand depth control, copy callbacks
- 🌳 **Tree-Shakeable** - ESM build with proper side-effects declaration

## Installation

Install the JsonViewer component library with npm:

```bash
npm install view-json-react
```

Or with Yarn:

```bash
yarn add view-json-react
```

## Usage

Incorporate the JsonViewer component into your React application like so:

```jsx
import React from 'react';
import { JsonViewer } from 'view-json-react';

const App = () => {
  const jsonData = {
    /* your JSON data */
  };

  return (
    <JsonViewer
      data={jsonData}
      defaultExpandDepth={1}
      theme="light"
      showObjectSize={true}
    />
  );
};

export default App;
```

## Props

The JsonViewer component accepts the following props:

- `data` (required): The JSON data to visualize.
- `rootName` (optional): Name for the root node. No root name if not specified.
- `className` (optional): CSS class name for the viewer container.
- `style` (optional): CSS properties for custom styling.
- `defaultExpandDepth` (optional, default: `1`): Number of levels to expand by default.
- `theme` (optional, default: `'light'`): Color theme - `'light'` or `'dark'`.
- `showObjectSize` (optional, default: `true`): Show item count for collapsed objects/arrays.
- `onCopy` (optional): Callback for the copy action with `{ path: string[], value: any }`.

## Customization

### Theme Support

Choose between light and dark themes:

```jsx
<JsonViewer
  data={yourData}
  theme="dark"
/>
```

### Custom Styling with CSS Variables

The component uses CSS variables for easy theming. You can override them:

```jsx
<JsonViewer
  data={yourData}
  style={{
    '--json-string-color': '#00ff00',
    '--json-number-color': '#ff00ff',
    '--json-bg-color': '#1e1e1e',
  }}
/>
```

Available CSS variables:
- `--json-font-family`, `--json-font-size`, `--json-line-height`
- `--json-text-color`, `--json-bg-color`, `--json-key-color`
- `--json-string-color`, `--json-number-color`, `--json-boolean-color`, `--json-null-color`
- `--json-border-color`, `--json-hover-bg`, `--json-arrow-color`, `--json-dots-color`
- And more for copy button styling...

### Copy Functionality

Enable data copying with the `onCopy` prop:

```jsx
<JsonViewer
  data={yourData}
  onCopy={({ path, value }) => {
    console.log('Copied from path:', path);
    console.log('Copied value:', value);
  }}
/>
```

## Contributing

We welcome contributions! Feel free to open an issue or submit a pull request for any bugs, feature requests, or improvements.

## License

JsonViewer is made available under the MIT License. See the [LICENSE](./LICENSE) file for more details.
