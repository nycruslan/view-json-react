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
  isExpanded?: (path: JsonPath, depth: number) => boolean;
  maxDepth?: number;
  maxVisibleNodes?: number;
  sortKeys?: boolean | KeyComparator;
}

export interface TreeSearchOptions {
  maxDepth?: number;
  maxResults?: number;
  maxVisitedNodes?: number;
  sortKeys?: boolean | KeyComparator;
}

export interface TreeSearchResult {
  rows: TreeRow[];
  matches: Set<string>;
  visible: Set<string>;
  truncated: boolean;
}

export interface StringifyOptions {
  space?: number;
  maxDepth?: number;
  maxBreadth?: number;
  maxNodes?: number;
  redact?: (
    path: JsonPath,
    value: unknown,
  ) => boolean | string | null | undefined;
}
