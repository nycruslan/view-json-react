import { memo } from 'react';
import type { JsonViewerProps } from './types';
import { JsonNode } from './components/JsonNode';
import styles from './styles.module.scss';

/**
 * Renders a JSON Viewer component that displays JSON data in a collapsible tree format.
 *
 * @component
 * @param {JsonViewerProps} props - The properties passed to the JsonViewer component.
 * @param {unknown} props.data - The JSON data to visualize.
 * @param {string} [props.rootName] - Optional name for the root node.
 * @param {string} [props.className] - Optional CSS class name for the viewer container.
 * @param {React.CSSProperties} [props.style] - Optional CSS styles for the viewer container.
 * @param {number} [props.defaultExpandDepth=1] - How many levels to expand by default (1 = expand first level).
 * @param {'light' | 'dark'} [props.theme='light'] - Color theme for the viewer.
 * @param {boolean} [props.showObjectSize=true] - Show size count for collapsed objects/arrays.
 * @param {Function} [props.onCopy] - Optional callback when copy button is clicked.
 *
 * @example
 * <JsonViewer
 *   data={{ key: 'value', nested: { anotherKey: 'anotherValue' } }}
 *   rootName="myData"
 *   className="my-json-viewer"
 *   defaultExpandDepth={2}
 *   theme="dark"
 *   showObjectSize={true}
 *   onCopy={(info) => console.log('Copied:', info)}
 * />
 */
export const JsonViewer: React.FC<JsonViewerProps> = memo(({
  data,
  rootName,
  className,
  style,
  theme = 'light',
  defaultExpandDepth = 1,
  showObjectSize = true,
  onCopy,
}) => {
  const viewerClass = [
    styles.viewer,
    theme === 'dark' && styles.dark,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={viewerClass} style={style}>
      <JsonNode
        data={data}
        path={[]}
        depth={0}
        defaultExpandDepth={defaultExpandDepth}
        rootName={rootName}
        showObjectSize={showObjectSize}
        onCopy={onCopy}
      />
    </div>
  );
});
