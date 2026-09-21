import { getParentPointer } from './path';
import { buildVisibleTree } from './tree';
import type { TreeRow, TreeSearchOptions, TreeSearchResult } from './types';
import { formatValue } from './value';

const searchableText = (row: TreeRow): string => {
  const key = row.key === undefined ? 'root' : String(row.key);
  const value = row.expandable
    ? `${row.type} ${row.size ?? ''}`
    : formatValue(row.value, row.type, row.referencePointer);
  return `${key} ${value}`.toLowerCase();
};

const positiveInteger = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
};

export const searchTree = (
  data: unknown,
  query: string,
  options: TreeSearchOptions = {},
): TreeSearchResult => {
  const normalizedQuery = query.trim().toLowerCase();
  const visible = new Set<string>(['']);
  const matches = new Set<string>();
  if (!normalizedQuery) return { rows: [], matches, visible, truncated: false };

  const maxResults = positiveInteger(options.maxResults, 1_000);
  const tree = buildVisibleTree(data, {
    isExpanded: () => true,
    maxDepth: options.maxDepth,
    maxVisibleNodes: positiveInteger(options.maxVisitedNodes, 100_000),
    sortKeys: options.sortKeys,
  });

  for (const row of tree.rows) {
    if (!searchableText(row).includes(normalizedQuery)) continue;
    if (matches.size >= maxResults) {
      return { rows: tree.rows, matches, visible, truncated: true };
    }

    matches.add(row.pointer);
    let pointer: string | undefined = row.pointer;
    while (pointer !== undefined) {
      visible.add(pointer);
      pointer = getParentPointer(pointer);
    }
  }

  return { rows: tree.rows, matches, visible, truncated: tree.truncated };
};
