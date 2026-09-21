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
} from '../core/types';

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
  value?: boolean;
  path?: boolean;
  indent?: number;
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
  focus: () => void;
  focusPath: (path: JsonPath | string) => boolean;
  expand: (path: JsonPath | string) => void;
  collapse: (path: JsonPath | string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  nextMatch: () => boolean;
  previousMatch: () => boolean;
}

export interface JsonViewerProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'onCopy' | 'style' | 'role'
  > {
  data: unknown;
  defaultExpandDepth?: number;
  defaultExpandedPaths?: Iterable<string>;
  expandedPaths?: ReadonlySet<string>;
  onExpandedPathsChange?: (
    paths: ReadonlySet<string>,
    change: ExpansionChange,
  ) => void;
  onExpand?: (change: ExpansionChange) => void;
  rootName?: string;
  style?: JsonViewerStyle;
  theme?: JsonViewerTheme;
  showObjectSize?: boolean;
  copy?: boolean | CopyOptions;
  onCopy?: (result: CopyResult) => void;
  redact?: (
    path: JsonPath,
    value: unknown,
  ) => boolean | string | null | undefined;
  maxDepth?: number;
  maxVisibleNodes?: number;
  sortKeys?: boolean | KeyComparator;
  collapseStringsAfterLength?: number;
  searchQuery?: string;
  maxSearchResults?: number;
  maxSearchNodes?: number;
  onSearchMatchCount?: (count: number) => void;
  labels?: Partial<JsonViewerLabels>;
  renderValue?: (context: ValueRenderContext) => ReactNode;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export interface VirtualJsonViewerProps extends JsonViewerProps {
  height?: number | string;
  rowHeight?: number;
  overscan?: number;
}
