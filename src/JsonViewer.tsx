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
import type { KeyboardEvent } from 'react';
import {
  buildVisibleTree,
  collectDefaultExpandedPaths,
} from './core/tree';
import {
  formatJsonPath,
  getParentPointer,
  toJsonPointer,
} from './core/path';
import { stringifyValue } from './core/value';
import { TreeRow } from './components/TreeRow';
import type {
  CopyOptions,
  CopyResult,
  ExpansionChange,
  JsonPath,
  JsonViewerHandle,
  JsonViewerLabels,
  JsonViewerProps,
  TreeRow as TreeRowData,
} from './types';
import './styles.css';

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

const pointerToId = (prefix: string, pointer: string): string =>
  `${prefix}-${encodeURIComponent(pointer || 'root').replaceAll('%', '_')}`;

const getRowName = (row: TreeRowData, rootName?: string): string =>
  row.depth === 0 ? rootName ?? 'root' : String(row.key);

export const JsonViewer = forwardRef<JsonViewerHandle, JsonViewerProps>(
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
      labels: labelOverrides,
      renderValue,
      onKeyDown,
      ...htmlProps
    },
    ref,
  ) {
    const labels = useMemo(
      () => ({ ...DEFAULT_LABELS, ...labelOverrides }),
      [labelOverrides],
    );
    const copyOptions = useMemo(() => normalizeCopyOptions(copy), [copy]);
    const [uncontrolledExpandedPaths, setUncontrolledExpandedPaths] = useState(
      () => defaultExpandedPaths
        ? new Set(defaultExpandedPaths)
        : collectDefaultExpandedPaths(data, defaultExpandDepth, maxVisibleNodes),
    );
    const currentExpandedPaths = expandedPaths ?? uncontrolledExpandedPaths;
    const tree = useMemo(
      () => buildVisibleTree(data, {
        isExpanded: path => currentExpandedPaths.has(toJsonPointer(path)),
        maxDepth,
        maxVisibleNodes,
      }),
      [currentExpandedPaths, data, maxDepth, maxVisibleNodes],
    );
    const [activePointer, setActivePointer] = useState('');
    const [copyState, setCopyState] = useState<{
      pointer: string;
      kind: 'value' | 'path';
      status: 'pending' | 'success' | 'error';
    }>();
    const [statusMessage, setStatusMessage] = useState('');
    const treeRef = useRef<HTMLDivElement>(null);
    const typeahead = useRef('');
    const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const idPrefix = `vjr-${useId().replaceAll(':', '')}`;

    const rowByPointer = useMemo(
      () => new Map(tree.rows.map(row => [row.pointer, row])),
      [tree.rows],
    );

    useEffect(() => {
      if (!rowByPointer.has(activePointer)) setActivePointer('');
    }, [activePointer, rowByPointer]);

    useEffect(() => {
      if (!copyState || copyState.status === 'pending') return;
      const timer = setTimeout(() => setCopyState(undefined), 1_500);
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
      const nextPaths = new Set(currentExpandedPaths);
      if (shouldExpand) nextPaths.add(pointer);
      else nextPaths.delete(pointer);
      commitExpansion(nextPaths, {
        path: row?.path ?? (typeof path === 'string' ? [] : path),
        value: row?.value,
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

    const expandAll = useCallback(() => {
      const allRows = buildVisibleTree(data, {
        isExpanded: () => true,
        maxDepth,
        maxVisibleNodes,
      }).rows;
      const nextPaths = new Set(
        allRows.filter(row => row.expandable).map(row => row.pointer),
      );
      commitExpansion(nextPaths, { path: [], value: data, expanded: true });
    }, [commitExpansion, data, maxDepth, maxVisibleNodes]);

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
    }), [collapseAll, expandAll, focusPointer, setPointerExpanded]);

    const activateRow = useCallback((row: TreeRowData) => {
      setActivePointer(row.pointer);
      treeRef.current?.focus();
      if (row.expandable) setRowExpanded(row, !row.expanded);
    }, [setRowExpanded]);

    const handleTreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.target !== event.currentTarget) return;

      const currentIndex = Math.max(
        0,
        tree.rows.findIndex(row => row.pointer === activePointer),
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
        case 'ArrowRight':
          if (currentRow.expandable && !currentRow.expanded) {
            setRowExpanded(currentRow, true);
          } else if (tree.rows[currentIndex + 1]?.depth === currentRow.depth + 1) {
            moveTo(currentIndex + 1);
          }
          break;
        case 'ArrowLeft':
          if (currentRow.expandable && currentRow.expanded) {
            setRowExpanded(currentRow, false);
          } else {
            const parentPointer = getParentPointer(currentRow.pointer);
            if (parentPointer !== undefined) setActivePointer(parentPointer);
          }
          break;
        case 'Enter':
        case ' ':
          if (currentRow.expandable) setRowExpanded(currentRow, !currentRow.expanded);
          break;
        case '*': {
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
          typeahead.current += event.key.toLocaleLowerCase();
          if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
          typeaheadTimer.current = setTimeout(() => {
            typeahead.current = '';
          }, 500);
          const query = typeahead.current;
          for (let offset = 1; offset <= tree.rows.length; offset += 1) {
            const index = (currentIndex + offset) % tree.rows.length;
            const candidate = tree.rows[index];
            if (getRowName(candidate, rootName).toLocaleLowerCase().startsWith(query)) {
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

    return (
      <>
        <div
          {...htmlProps}
          ref={treeRef}
          role="tree"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-activedescendant={pointerToId(idPrefix, activePointer)}
          className={rootClassName}
          style={style}
          data-theme={theme}
          onKeyDown={handleTreeKeyDown}
        >
          {tree.rows.map(row => (
            <TreeRow
              key={row.pointer}
              row={row}
              id={pointerToId(idPrefix, row.pointer)}
              active={row.pointer === activePointer}
              rootName={rootName}
              showObjectSize={showObjectSize}
              copyOptions={{ value: copyOptions.value, path: copyOptions.path }}
              copyState={copyState}
              labels={labels}
              renderValue={renderValue}
              onActivate={activateRow}
              onCopy={(selectedRow, kind) => void copyRow(selectedRow, kind)}
            />
          ))}
          {tree.truncated && (
            <div
              role="treeitem"
              aria-disabled="true"
              aria-level={1}
              className="vjr-notice"
            >
              {labels.truncated(maxVisibleNodes)}
            </div>
          )}
        </div>
        <span className="vjr-sr-only" role="status" aria-live="polite">
          {statusMessage}
        </span>
      </>
    );
  },
);
