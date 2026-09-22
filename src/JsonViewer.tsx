'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ForwardRefExoticComponent,
  KeyboardEvent,
  RefAttributes,
} from 'react';
import {
  buildVisibleTree,
  collectDefaultExpandedPaths,
} from './core/tree.js';
import { searchTree } from './core/search.js';
import {
  formatJsonPath,
  getParentPointer,
  toJsonPointer,
} from './core/path.js';
import { stringifyValue } from './core/value.js';
import { TreeRow } from './components/TreeRow.js';
import {
  StandardRowRenderer,
} from './internal/RowRenderer.js';
import type { InternalRendererProps } from './internal/RowRenderer.js';
import type {
  CopyOptions,
  CopyResult,
  ExpansionChange,
  JsonPath,
  JsonViewerHandle,
  JsonViewerLabels,
  JsonViewerProps,
  TreeRow as TreeRowData,
} from './types/index.js';

const DEFAULT_LABELS: JsonViewerLabels = {
  tree: 'JSON data',
  expand: name => `Expand ${name}`,
  collapse: name => `Collapse ${name}`,
  copyValue: name => `Copy value of ${name}`,
  copyPath: name => `Copy path of ${name}`,
  copied: 'Copied to clipboard',
  copyFailed: 'Could not copy to clipboard',
  truncated: limit => `Only the first ${limit} visible nodes are shown`,
  depthLimited: 'Maximum depth reached',
  expandString: name => `Expand string value of ${name}`,
  collapseString: name => `Collapse string value of ${name}`,
  searchResults: count => `${count} search ${count === 1 ? 'match' : 'matches'}`,
  searchTruncated: 'Search stopped at the configured safety limit',
};

const normalizeCopyOptions = (
  copy: boolean | CopyOptions,
): CopyOptions & Required<Pick<CopyOptions, 'value' | 'path' | 'indent'>> => {
  if (copy === false) return { value: false, path: false, indent: 2 };
  if (copy === true) return { value: true, path: false, indent: 2 };
  return {
    value: copy.value ?? true,
    path: copy.path ?? false,
    indent: copy.indent ?? 2,
    stringify: copy.stringify,
  };
};

const pointerToId = (prefix: string, pointer: string): string => {
  if (!pointer) return `${prefix}-root`;
  let encoded = '';
  for (let index = 0; index < pointer.length; index += 1) {
    encoded += pointer.charCodeAt(index).toString(16).padStart(4, '0');
  }
  return `${prefix}-${encoded}`;
};

const getRowName = (row: TreeRowData, rootName?: string): string => {
  if (row.depth === 0) return rootName === '' ? '""' : rootName ?? 'root';
  return row.key === '' ? '""' : String(row.key);
};

const JsonViewerImplementation = forwardRef<
  JsonViewerHandle,
  JsonViewerProps & InternalRendererProps
>(
  function JsonViewer(
    {
      data,
      rootName,
      className,
      style,
      theme = 'light',
      defaultExpandDepth = 1,
      defaultExpandedPaths,
      expandedPaths,
      onExpandedPathsChange,
      onExpand,
      showObjectSize = true,
      copy = true,
      onCopy,
      redact,
      maxDepth = 100,
      maxVisibleNodes = 10_000,
      sortKeys = false,
      collapseStringsAfterLength = 120,
      searchQuery = '',
      maxSearchResults = 1_000,
      maxSearchNodes = 100_000,
      onSearchMatchCount,
      labels: labelOverrides,
      renderValue,
      onKeyDown,
      __rowRenderer: RowRenderer = StandardRowRenderer,
      __rowRendererOptions,
      __rowHeight = 28,
      ...htmlProps
    },
    ref,
  ) {
    const labels = useMemo(
      () => ({ ...DEFAULT_LABELS, ...labelOverrides }),
      [labelOverrides],
    );
    const copyOptions = useMemo(() => normalizeCopyOptions(copy), [copy]);
    const visibleNodeLimit = Number.isFinite(maxVisibleNodes)
      ? Math.max(1, Math.floor(maxVisibleNodes))
      : 10_000;
    const [uncontrolledExpandedPaths, setUncontrolledExpandedPaths] = useState(
      () => defaultExpandedPaths
        ? new Set(defaultExpandedPaths)
        : collectDefaultExpandedPaths(data, defaultExpandDepth, visibleNodeLimit),
    );
    const currentExpandedPaths = expandedPaths ?? uncontrolledExpandedPaths;
    const normalizedSearchQuery = searchQuery.trim();
    const searchResult = useMemo(
      () => searchTree(data, normalizedSearchQuery, {
        maxDepth,
        maxResults: maxSearchResults,
        maxVisitedNodes: maxSearchNodes,
        sortKeys,
      }),
      [data, maxDepth, maxSearchNodes, maxSearchResults, normalizedSearchQuery, sortKeys],
    );
    const normalTree = useMemo(
      () => normalizedSearchQuery
        ? { rows: [], truncated: false }
        : buildVisibleTree(data, {
            isExpanded: path => currentExpandedPaths.has(toJsonPointer(path)),
            maxDepth,
            maxVisibleNodes: visibleNodeLimit,
            sortKeys,
          }),
      [
        currentExpandedPaths,
        data,
        maxDepth,
        normalizedSearchQuery,
        sortKeys,
        visibleNodeLimit,
      ],
    );
    const tree = useMemo(() => {
      if (!normalizedSearchQuery) return normalTree;
      const matchingRows = searchResult.rows.filter(row =>
        searchResult.visible.has(row.pointer),
      );
      const limitedRows = matchingRows.slice(0, visibleNodeLimit);
      const visibleParents = new Set(
        limitedRows.map(row => row.parentPointer).filter(pointer => pointer !== undefined),
      );
      return {
        rows: limitedRows.map(row => row.expandable
          ? { ...row, expanded: visibleParents.has(row.pointer) }
          : row),
        truncated: searchResult.truncated || matchingRows.length > visibleNodeLimit,
      };
    }, [normalTree, normalizedSearchQuery, searchResult, visibleNodeLimit]);
    const [activePointer, setActivePointer] = useState('');
    const [copyState, setCopyState] = useState<{
      pointer: string;
      kind: 'value' | 'path';
      status: 'pending' | 'success' | 'error';
    }>();
    const [statusMessage, setStatusMessage] = useState('');
    const [expandedStrings, setExpandedStrings] = useState<Set<string>>(
      () => new Set(),
    );
    const treeRef = useRef<HTMLDivElement>(null);
    const typeahead = useRef('');
    const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const idPrefix = `vjr-${useId().replaceAll(':', '')}`;

    const rowByPointer = useMemo(
      () => new Map(tree.rows.map(row => [row.pointer, row])),
      [tree.rows],
    );
    const resolvedActivePointer = rowByPointer.has(activePointer)
      ? activePointer
      : '';
    useEffect(() => {
      if (!rowByPointer.has(activePointer)) setActivePointer('');
    }, [activePointer, rowByPointer]);

    useEffect(() => {
      onSearchMatchCount?.(searchResult.matches.size);
    }, [onSearchMatchCount, searchResult.matches.size]);

    useEffect(() => {
      if (!copyState || copyState.status === 'pending') return;
      const timer = setTimeout(() => {
        setCopyState(undefined);
        setStatusMessage('');
      }, 1_500);
      return () => clearTimeout(timer);
    }, [copyState]);

    useEffect(() => () => {
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    }, []);

    const commitExpansion = useCallback((
      nextPaths: Set<string>,
      change: ExpansionChange,
    ) => {
      if (expandedPaths === undefined) setUncontrolledExpandedPaths(nextPaths);
      onExpandedPathsChange?.(nextPaths, change);
      onExpand?.(change);
    }, [expandedPaths, onExpand, onExpandedPathsChange]);

    const setRowExpanded = useCallback((
      row: TreeRowData,
      shouldExpand: boolean,
    ) => {
      if (!row.expandable) return;
      const nextPaths = new Set(currentExpandedPaths);
      if (shouldExpand) nextPaths.add(row.pointer);
      else nextPaths.delete(row.pointer);
      commitExpansion(nextPaths, {
        path: row.path,
        value: row.value,
        expanded: shouldExpand,
      });
    }, [commitExpansion, currentExpandedPaths]);

    const setPointerExpanded = useCallback((
      path: JsonPath | string,
      shouldExpand: boolean,
    ) => {
      const pointer = typeof path === 'string' ? path : toJsonPointer(path);
      const row = rowByPointer.get(pointer);
      const isCollection = row?.type === 'array' || row?.type === 'object';
      if (
        !row
        || !isCollection
        || row.error
        || row.size === 0
        || (shouldExpand && row.depthLimited)
        || currentExpandedPaths.has(pointer) === shouldExpand
      ) return;
      const nextPaths = new Set(currentExpandedPaths);
      if (shouldExpand) nextPaths.add(pointer);
      else nextPaths.delete(pointer);
      commitExpansion(nextPaths, {
        path: row.path,
        value: row.value,
        expanded: shouldExpand,
      });
    }, [commitExpansion, currentExpandedPaths, rowByPointer]);

    const copyRow = useCallback(async (
      row: TreeRowData,
      kind: 'value' | 'path',
    ) => {
      setCopyState({ pointer: row.pointer, kind, status: 'pending' });
      setStatusMessage('');
      let text = '';
      let error: unknown;

      try {
        if (kind === 'path') {
          text = formatJsonPath(row.path);
        } else if (copyOptions.stringify) {
          text = await copyOptions.stringify(row.value, row.path);
        } else {
          text = stringifyValue(row.value, {
            space: copyOptions.indent,
            redact: redact
              ? (relativePath, value) => redact([...row.path, ...relativePath], value)
              : undefined,
          });
        }

        if (typeof text !== 'string') {
          throw new TypeError('The copy formatter must return a string');
        }
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
          throw new Error('The Clipboard API is not available');
        }
        await navigator.clipboard.writeText(text);
        setCopyState({ pointer: row.pointer, kind, status: 'success' });
        setStatusMessage(labels.copied);
      } catch (caughtError) {
        error = caughtError;
        setCopyState({ pointer: row.pointer, kind, status: 'error' });
        setStatusMessage(labels.copyFailed);
      }

      const result: CopyResult = {
        path: row.path,
        value: row.value,
        text,
        kind,
        success: error === undefined,
        ...(error === undefined ? {} : { error }),
      };
      onCopy?.(result);
    }, [copyOptions, labels, onCopy, redact]);

    const focusPointer = useCallback((pointer: string): boolean => {
      if (!rowByPointer.has(pointer)) return false;
      setActivePointer(pointer);
      treeRef.current?.focus();
      return true;
    }, [rowByPointer]);

    const moveMatch = useCallback((direction: 1 | -1): boolean => {
      const matches = tree.rows.filter(row => searchResult.matches.has(row.pointer));
      if (matches.length === 0) return false;
      const currentIndex = matches.findIndex(
        row => row.pointer === resolvedActivePointer,
      );
      const nextIndex = currentIndex < 0
        ? direction === 1 ? 0 : matches.length - 1
        : (currentIndex + direction + matches.length) % matches.length;
      return focusPointer(matches[nextIndex].pointer);
    }, [focusPointer, resolvedActivePointer, searchResult.matches, tree.rows]);

    const toggleString = useCallback((row: TreeRowData) => {
      setExpandedStrings(current => {
        const next = new Set(current);
        if (next.has(row.pointer)) next.delete(row.pointer);
        else next.add(row.pointer);
        return next;
      });
    }, []);

    const expandAll = useCallback(() => {
      const allRows = buildVisibleTree(data, {
        isExpanded: () => true,
        maxDepth,
        maxVisibleNodes: visibleNodeLimit,
        sortKeys,
      }).rows;
      const nextPaths = new Set(
        allRows.filter(row => row.expandable).map(row => row.pointer),
      );
      commitExpansion(nextPaths, { path: [], value: data, expanded: true });
    }, [commitExpansion, data, maxDepth, sortKeys, visibleNodeLimit]);

    const collapseAll = useCallback(() => {
      setActivePointer('');
      commitExpansion(new Set(), { path: [], value: data, expanded: false });
    }, [commitExpansion, data]);

    useImperativeHandle(ref, () => ({
      focus: () => treeRef.current?.focus(),
      focusPath: path => focusPointer(
        typeof path === 'string' ? path : toJsonPointer(path),
      ),
      expand: path => setPointerExpanded(path, true),
      collapse: path => setPointerExpanded(path, false),
      expandAll,
      collapseAll,
      nextMatch: () => moveMatch(1),
      previousMatch: () => moveMatch(-1),
    }), [collapseAll, expandAll, focusPointer, moveMatch, setPointerExpanded]);

    const activateRow = useCallback((row: TreeRowData) => {
      setActivePointer(row.pointer);
      treeRef.current?.focus();
      if (!normalizedSearchQuery && row.expandable) {
        setRowExpanded(row, !row.expanded);
      }
    }, [normalizedSearchQuery, setRowExpanded]);

    const handleTreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.target !== event.currentTarget) return;

      const currentIndex = Math.max(
        0,
        tree.rows.findIndex(row => row.pointer === resolvedActivePointer),
      );
      const currentRow = tree.rows[currentIndex];
      if (!currentRow) return;

      const moveTo = (index: number) => {
        const row = tree.rows[Math.max(0, Math.min(index, tree.rows.length - 1))];
        if (row) setActivePointer(row.pointer);
      };

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        if (typeof window !== 'undefined' && window.getSelection()?.toString()) return;
        const kind = event.shiftKey ? 'path' : 'value';
        if (!copyOptions[kind]) return;
        void copyRow(currentRow, kind);
        event.preventDefault();
        return;
      }

      switch (event.key) {
        case 'F3':
          if (!moveMatch(event.shiftKey ? -1 : 1)) return;
          break;
        case 'ArrowDown':
          moveTo(currentIndex + 1);
          break;
        case 'ArrowUp':
          moveTo(currentIndex - 1);
          break;
        case 'Home':
          moveTo(0);
          break;
        case 'End':
          moveTo(tree.rows.length - 1);
          break;
        case 'PageDown':
          moveTo(currentIndex + Math.max(
            1,
            Math.floor((treeRef.current?.clientHeight || 400) / __rowHeight),
          ));
          break;
        case 'PageUp':
          moveTo(currentIndex - Math.max(
            1,
            Math.floor((treeRef.current?.clientHeight || 400) / __rowHeight),
          ));
          break;
        case 'ArrowRight':
          if (!normalizedSearchQuery && currentRow.expandable && !currentRow.expanded) {
            setRowExpanded(currentRow, true);
          } else if (tree.rows[currentIndex + 1]?.depth === currentRow.depth + 1) {
            moveTo(currentIndex + 1);
          }
          break;
        case 'ArrowLeft':
          if (!normalizedSearchQuery && currentRow.expandable && currentRow.expanded) {
            setRowExpanded(currentRow, false);
          } else {
            const parentPointer = getParentPointer(currentRow.pointer);
            if (parentPointer !== undefined) setActivePointer(parentPointer);
          }
          break;
        case 'Enter':
        case ' ':
          if (!normalizedSearchQuery && currentRow.expandable) {
            setRowExpanded(currentRow, !currentRow.expanded);
          }
          break;
        case '*': {
          if (normalizedSearchQuery) break;
          const nextPaths = new Set(currentExpandedPaths);
          for (const row of tree.rows) {
            if (
              row.expandable
              && row.depth === currentRow.depth
              && row.parentPointer === currentRow.parentPointer
            ) {
              nextPaths.add(row.pointer);
            }
          }
          commitExpansion(nextPaths, {
            path: currentRow.path,
            value: currentRow.value,
            expanded: true,
          });
          break;
        }
        default: {
          if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
            return;
          }
          typeahead.current += event.key.toLowerCase();
          if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
          typeaheadTimer.current = setTimeout(() => {
            typeahead.current = '';
          }, 500);
          const query = typeahead.current;
          for (let offset = 1; offset <= tree.rows.length; offset += 1) {
            const index = (currentIndex + offset) % tree.rows.length;
            const candidate = tree.rows[index];
            if (getRowName(candidate, rootName).toLowerCase().startsWith(query)) {
              moveTo(index);
              break;
            }
          }
          return;
        }
      }
      event.preventDefault();
    };

    const rootClassName = ['vjr-viewer', className].filter(Boolean).join(' ');
    const ariaLabel = htmlProps['aria-label'] ?? labels.tree;
    const renderRow = (row: TreeRowData) => (
      <TreeRow
        key={row.pointer}
        row={row}
        id={pointerToId(idPrefix, row.pointer)}
        active={row.pointer === resolvedActivePointer}
        rootName={rootName}
        showObjectSize={showObjectSize}
        copyOptions={{ value: copyOptions.value, path: copyOptions.path }}
        copyState={copyState}
        labels={labels}
        renderValue={renderValue}
        matched={searchResult.matches.has(row.pointer)}
        collapseStringsAfterLength={collapseStringsAfterLength}
        stringExpanded={expandedStrings.has(row.pointer)}
        onToggleString={toggleString}
        onActivate={activateRow}
        onCopy={(selectedRow, kind) => void copyRow(selectedRow, kind)}
      />
    );
    const searchStatus = normalizedSearchQuery
      ? `${labels.searchResults(searchResult.matches.size)}${
          searchResult.truncated ? `. ${labels.searchTruncated}` : ''
        }`
      : '';

    return (
      <>
        <div
          {...htmlProps}
          ref={treeRef}
          role="tree"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-activedescendant={pointerToId(idPrefix, resolvedActivePointer)}
          className={rootClassName}
          style={style}
          data-theme={theme}
          onKeyDown={handleTreeKeyDown}
        >
          <RowRenderer
            rows={tree.rows}
            activePointer={resolvedActivePointer}
            setActivePointer={setActivePointer}
            treeRef={treeRef}
            renderRow={renderRow}
            options={__rowRendererOptions}
          />
          {tree.truncated && (
            <div
              role="treeitem"
              aria-disabled="true"
              aria-level={1}
              className="vjr-notice"
            >
              {normalizedSearchQuery
                ? labels.searchTruncated
                : labels.truncated(visibleNodeLimit)}
            </div>
          )}
        </div>
        <span className="vjr-sr-only" role="status" aria-live="polite">
          {statusMessage || searchStatus}
        </span>
      </>
    );
  },
);

/** Accessible, bounded, read-only tree for inspecting JSON and JavaScript values. */
export const JsonViewer = JsonViewerImplementation as ForwardRefExoticComponent<
  JsonViewerProps & RefAttributes<JsonViewerHandle>
>;
