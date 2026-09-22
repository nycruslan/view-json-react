import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from 'react';
import type {
  JsonArray,
  JsonObject,
  JsonPath,
  JsonPathSegment,
  JsonPrimitive,
  JsonValue,
  KeyComparator,
  TreeRow,
  ValueType,
} from '../core/types.js';

export type {
  JsonArray,
  JsonObject,
  JsonPath,
  JsonPathSegment,
  JsonPrimitive,
  JsonValue,
  KeyComparator,
  TreeRow,
  ValueType,
};

export type JsonViewerTheme = 'light' | 'dark' | 'auto';

export type JsonViewerStyle = CSSProperties & {
  [variable: `--vjr-${string}`]: string | number | undefined;
};

export interface CopyOptions {
  /** Show value-copy actions. @default true */
  value?: boolean;
  /** Show JSONPath-copy actions. @default false */
  path?: boolean;
  /** JSON indentation used by the built-in serializer. @default 2 */
  indent?: number;
  /**
   * Replace built-in value serialization. The callback must apply any desired
   * redaction itself and may return asynchronously.
   */
  stringify?: (
    value: unknown,
    path: JsonPath,
  ) => string | Promise<string>;
}

export interface CopyResult {
  path: JsonPath;
  value: unknown;
  text: string;
  kind: 'value' | 'path';
  success: boolean;
  error?: unknown;
}

/** @deprecated Use CopyResult. */
export type OnCopyProps = CopyResult;

export interface ExpansionChange {
  path: JsonPath;
  value: unknown;
  expanded: boolean;
}

export interface JsonViewerLabels {
  tree: string;
  expand: (name: string) => string;
  collapse: (name: string) => string;
  copyValue: (name: string) => string;
  copyPath: (name: string) => string;
  copied: string;
  copyFailed: string;
  truncated: (limit: number) => string;
  depthLimited: string;
  expandString: (name: string) => string;
  collapseString: (name: string) => string;
  searchResults: (count: number) => string;
  searchTruncated: string;
}

export interface ValueRenderContext {
  value: unknown;
  formatted: string;
  type: ValueType;
  path: JsonPath;
}

export interface JsonViewerHandle {
  /** Focus the tree container. */
  focus: () => void;
  /** Focus a currently visible typed path or JSON Pointer. */
  focusPath: (path: JsonPath | string) => boolean;
  /** Expand a currently visible branch. */
  expand: (path: JsonPath | string) => void;
  /** Collapse a currently visible branch. */
  collapse: (path: JsonPath | string) => void;
  /** Expand branches within the configured depth and visible-node limits. */
  expandAll: () => void;
  /** Collapse every branch. */
  collapseAll: () => void;
  /** Focus the next rendered search match, wrapping at the end. */
  nextMatch: () => boolean;
  /** Focus the previous rendered search match, wrapping at the start. */
  previousMatch: () => boolean;
}

export interface JsonViewerProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'onCopy' | 'style' | 'role'
  > {
  /** Value to inspect. JSON and supported non-JSON JavaScript values are accepted. */
  data: unknown;
  /** Initial uncontrolled expansion depth. @default 1 */
  defaultExpandDepth?: number;
  /** Initial uncontrolled expanded branches as RFC 6901 JSON Pointers. */
  defaultExpandedPaths?: Iterable<string>;
  /** Controlled expanded branches as RFC 6901 JSON Pointers. */
  expandedPaths?: ReadonlySet<string>;
  /** Runs after an expansion request with the complete next controlled value. */
  onExpandedPathsChange?: (
    paths: ReadonlySet<string>,
    change: ExpansionChange,
  ) => void;
  /** Runs after an individual branch expansion request. */
  onExpand?: (change: ExpansionChange) => void;
  /** Display-only root label; never included in paths. */
  rootName?: string;
  /** Container styles, including typed `--vjr-*` custom properties. */
  style?: JsonViewerStyle;
  /** Built-in color theme. @default 'light' */
  theme?: JsonViewerTheme;
  /** Show collection item counts. @default true */
  showObjectSize?: boolean;
  /** Configure value/path clipboard actions, or disable them. @default true */
  copy?: boolean | CopyOptions;
  /** Runs after a clipboard attempt settles with its actual result. */
  onCopy?: (result: CopyResult) => void;
  /** Redact built-in copied serialization without changing visible content. */
  redact?: (
    path: JsonPath,
    value: unknown,
  ) => boolean | string | null | undefined;
  /** Maximum traversed collection depth. @default 100 */
  maxDepth?: number;
  /** Maximum rows in the visible model. @default 10000 */
  maxVisibleNodes?: number;
  /** Sort object keys by code point or a custom comparator. @default false */
  sortKeys?: boolean | KeyComparator;
  /** Collapse longer strings by Unicode code point; zero disables it. @default 120 */
  collapseStringsAfterLength?: number;
  /** Controlled, case-insensitive search query. @default '' */
  searchQuery?: string;
  /** Maximum search matches. @default 1000 */
  maxSearchResults?: number;
  /** Maximum nodes visited by search. @default 100000 */
  maxSearchNodes?: number;
  /** Runs when the bounded full-tree match count changes. */
  onSearchMatchCount?: (count: number) => void;
  /** Override control and status labels. */
  labels?: Partial<JsonViewerLabels>;
  /** Replace leaf output; return `undefined` for the default or `null` for no output. */
  renderValue?: (context: ValueRenderContext) => ReactNode;
  /** Runs before built-in tree keyboard handling; prevent default to opt out. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export interface VirtualJsonViewerProps extends JsonViewerProps {
  /** Scroll viewport block size. @default 400 */
  height?: number | string;
  /** Fixed row height in pixels; values below 28 are clamped. @default 28 */
  rowHeight?: number;
  /** Rows rendered beyond each viewport edge. @default 6 */
  overscan?: number;
}
