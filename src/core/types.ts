export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonPathSegment = string | number;
export type JsonPath = readonly JsonPathSegment[];

export type ValueType =
  | 'null'
  | 'string'
  | 'number'
  | 'boolean'
  | 'undefined'
  | 'bigint'
  | 'symbol'
  | 'function'
  | 'array'
  | 'object'
  | 'date'
  | 'regexp'
  | 'map'
  | 'set'
  | 'error'
  | 'typed-array'
  | 'accessor'
  | 'hole'
  | 'unavailable'
  | 'reference';

export interface TreeRow {
  path: JsonPath;
  pointer: string;
  parentPointer?: string;
  key?: JsonPathSegment;
  depth: number;
  value: unknown;
  type: ValueType;
  expandable: boolean;
  expanded: boolean;
  size?: number;
  position: number;
  setSize: number;
  referencePointer?: string;
  error?: Error;
  depthLimited?: boolean;
}

export interface TreeBuildResult {
  rows: TreeRow[];
  truncated: boolean;
}

export type KeyComparator = (a: string, b: string) => number;

export interface TreeBuildOptions {
  /** Return whether a collection path should be expanded. @default false */
  isExpanded?: (path: JsonPath, depth: number) => boolean;
  /** Maximum traversed collection depth. @default 100 */
  maxDepth?: number;
  /** Maximum rows returned by the visible model. @default 10000 */
  maxVisibleNodes?: number;
  /** Sort object keys by code point or a custom comparator. @default false */
  sortKeys?: boolean | KeyComparator;
}

export interface TreeSearchOptions {
  /** Maximum traversed collection depth. @default 100 */
  maxDepth?: number;
  /** Maximum matching rows. @default 1000 */
  maxResults?: number;
  /** Maximum rows inspected by the bounded search. @default 100000 */
  maxVisitedNodes?: number;
  /** Sort object keys by code point or a custom comparator. @default false */
  sortKeys?: boolean | KeyComparator;
}

export interface TreeSearchResult {
  rows: TreeRow[];
  matches: Set<string>;
  visible: Set<string>;
  truncated: boolean;
}

export interface StringifyOptions {
  /** JSON indentation. @default 2 */
  space?: number;
  /** Maximum traversed collection depth. @default 100 */
  maxDepth?: number;
  /** Maximum inspected entries per collection. @default 10000 */
  maxBreadth?: number;
  /** Maximum values normalized across the complete result. @default 100000 */
  maxNodes?: number;
  /** Replace selected values with `[Redacted]` or a returned string. */
  redact?: (
    path: JsonPath,
    value: unknown,
  ) => boolean | string | null | undefined;
}
