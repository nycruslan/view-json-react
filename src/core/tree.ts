import { appendPath, toJsonPointer } from './path';
import {
  classifyValue,
  inspectCollection,
  isExpandableType,
} from './value';
import type {
  JsonPath,
  JsonPathSegment,
  TreeBuildOptions,
  TreeBuildResult,
  TreeRow,
} from './types';

interface Ancestor {
  value: object;
  pointer: string;
  parent?: Ancestor;
}

interface PendingNode {
  value: unknown;
  path: JsonPath;
  key?: JsonPathSegment;
  depth: number;
  position: number;
  setSize: number;
  ancestor?: Ancestor;
}

const findAncestor = (
  ancestor: Ancestor | undefined,
  value: object,
): string | undefined => {
  let current = ancestor;
  while (current) {
    if (current.value === value) return current.pointer;
    current = current.parent;
  }
  return undefined;
};

const boundedInteger = (
  value: number | undefined,
  fallback: number,
  minimum: number,
): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.floor(value));
};

export const buildVisibleTree = (
  data: unknown,
  options: TreeBuildOptions = {},
): TreeBuildResult => {
  const maxDepth = boundedInteger(options.maxDepth, 100, 0);
  const maxVisibleNodes = boundedInteger(options.maxVisibleNodes, 10_000, 1);
  const isExpanded = options.isExpanded ?? (() => false);
  const rows: TreeRow[] = [];
  const stack: PendingNode[] = [
    { value: data, path: [], depth: 0, position: 1, setSize: 1 },
  ];
  let truncated = false;

  while (stack.length > 0) {
    if (rows.length >= maxVisibleNodes) {
      truncated = true;
      break;
    }

    const pending = stack.pop() as PendingNode;
    const pointer = toJsonPointer(pending.path);
    let type = classifyValue(pending.value);
    let referencePointer: string | undefined;

    if (isExpandableType(type)) {
      referencePointer = findAncestor(pending.ancestor, pending.value as object);
      if (referencePointer !== undefined) type = 'reference';
    }

    let expandable = isExpandableType(type);
    let expanded = expandable && isExpanded(pending.path, pending.depth);
    let size: number | undefined;
    let error: Error | undefined;
    let depthLimited = false;
    let entries: ReturnType<typeof inspectCollection>['entries'] = [];

    if (expandable) {
      const remaining = Math.max(0, maxVisibleNodes - rows.length - 1);
      const inspected = inspectCollection(pending.value, remaining);
      size = inspected.size;
      error = inspected.error;
      entries = inspected.entries;
      if (error) {
        expanded = false;
        expandable = false;
      }
      if (expanded && pending.depth >= maxDepth) {
        expanded = false;
        depthLimited = true;
      }
      if (expanded && inspected.hasMore) truncated = true;
    }

    rows.push({
      path: pending.path,
      pointer,
      parentPointer: pending.depth === 0
        ? undefined
        : toJsonPointer(pending.path.slice(0, -1)),
      key: pending.key,
      depth: pending.depth,
      value: pending.value,
      type,
      expandable,
      expanded,
      size,
      position: pending.position,
      setSize: pending.setSize,
      referencePointer,
      error,
      depthLimited,
    });

    if (!expanded || entries.length === 0) continue;

    const nextAncestor: Ancestor = {
      value: pending.value as object,
      pointer,
      parent: pending.ancestor,
    };

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      stack.push({
        value: entry.value,
        path: appendPath(pending.path, entry.key),
        key: entry.key,
        depth: pending.depth + 1,
        position: index + 1,
        setSize: size ?? entries.length,
        ancestor: nextAncestor,
      });
    }
  }

  return { rows, truncated };
};

export const collectDefaultExpandedPaths = (
  data: unknown,
  depth: number,
  maxVisibleNodes = 10_000,
): Set<string> => {
  if (depth <= 0) return new Set();
  const result = buildVisibleTree(data, {
    isExpanded: (_path, nodeDepth) => nodeDepth < depth,
    maxVisibleNodes,
  });

  return new Set(
    result.rows
      .filter(row => row.expandable && row.expanded)
      .map(row => row.pointer),
  );
};
