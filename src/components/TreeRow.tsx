import type { MouseEvent, ReactNode } from 'react';
import { formatValue } from '../core/value.js';
import type {
  CopyOptions,
  JsonViewerLabels,
  TreeRow as TreeRowData,
  ValueRenderContext,
} from '../types/index.js';

interface CopyButtonProps {
  kind: 'value' | 'path';
  label: string;
  copied: boolean;
  disabled: boolean;
  tabIndex: number;
  onCopy: (kind: 'value' | 'path') => void;
}

const CopyButton = ({
  kind,
  label,
  copied,
  disabled,
  tabIndex,
  onCopy,
}: CopyButtonProps) => (
  <button
    type="button"
    className={`vjr-action ${copied ? 'vjr-action--copied' : ''}`}
    aria-label={label}
    title={label}
    disabled={disabled}
    tabIndex={tabIndex}
    onClick={event => {
      event.stopPropagation();
      onCopy(kind);
    }}
  >
    <span aria-hidden="true">{kind === 'path' ? '#' : copied ? '✓' : '⧉'}</span>
  </button>
);

const getNodeName = (row: TreeRowData, rootName?: string): string => {
  if (row.depth === 0) return rootName === '' ? '""' : rootName ?? 'root';
  return row.key === '' ? '""' : String(row.key);
};

const getNodeDescription = (
  row: TreeRowData,
  rootName: string | undefined,
  depthLimitedLabel: string,
): string => {
  const name = getNodeName(row, rootName);
  if (row.error) return `${name}, unavailable, ${row.error.message}`;
  if (row.type === 'array' || row.type === 'object') {
    const size = row.size === undefined
      ? ''
      : ` with ${row.size} ${row.size === 1 ? 'item' : 'items'}`;
    const state = row.depthLimited
      ? `, ${depthLimitedLabel}`
      : row.expandable ? `, ${row.expanded ? 'expanded' : 'collapsed'}` : '';
    return `${name}, ${row.type}${size}${state}`;
  }
  return `${name}, ${row.type}, ${formatValue(row.value, row.type, row.referencePointer)}`;
};

const renderName = (row: TreeRowData, rootName?: string): ReactNode => {
  if (row.depth === 0) {
    return rootName === undefined ? null : (
      <span className="vjr-key">{JSON.stringify(rootName)}</span>
    );
  }
  if (typeof row.key === 'number') {
    return <span className="vjr-index">{row.key}</span>;
  }
  return <span className="vjr-key">{JSON.stringify(row.key)}</span>;
};

const truncateString = (value: string, limit: number): string => {
  let end = 0;
  let count = 0;
  for (const character of value) {
    if (count >= limit) break;
    end += character.length;
    count += 1;
  }
  return value.slice(0, end);
};

const renderCollectionValue = (row: TreeRowData): ReactNode => {
  const brackets = row.type === 'array' ? ['[', ']'] : ['{', '}'];
  return (
    <span className="vjr-collection">
      {brackets[0]}
      {row.size !== 0 && <span className="vjr-ellipsis">…</span>}
      {brackets[1]}
    </span>
  );
};

interface TreeRowProps {
  row: TreeRowData;
  id: string;
  active: boolean;
  rootName?: string;
  showObjectSize: boolean;
  copyOptions: Required<Pick<CopyOptions, 'value' | 'path'>>;
  copyState?: {
    pointer: string;
    kind: 'value' | 'path';
    status: 'pending' | 'success' | 'error';
  };
  labels: JsonViewerLabels;
  renderValue?: (context: ValueRenderContext) => ReactNode;
  matched?: boolean;
  collapseStringsAfterLength?: number;
  stringExpanded: boolean;
  onToggleString: (row: TreeRowData) => void;
  onActivate: (row: TreeRowData) => void;
  onCopy: (row: TreeRowData, kind: 'value' | 'path') => void;
}

export const TreeRow = ({
  row,
  id,
  active,
  rootName,
  showObjectSize,
  copyOptions,
  copyState,
  labels,
  renderValue,
  matched,
  collapseStringsAfterLength,
  stringExpanded,
  onToggleString,
  onActivate,
  onCopy,
}: TreeRowProps) => {
  const name = getNodeName(row, rootName);
  const formatted = formatValue(row.value, row.type, row.referencePointer);
  const isCollection = row.type === 'array' || row.type === 'object';
  const requestedStringLimit = collapseStringsAfterLength ?? 0;
  const stringLimit = Number.isFinite(requestedStringLimit)
    ? Math.max(0, Math.floor(requestedStringLimit))
    : 0;
  const stringPrefix = row.type === 'string' && stringLimit > 0
    ? truncateString(row.value as string, stringLimit)
    : '';
  const stringCanCollapse = row.type === 'string'
    && stringLimit > 0
    && stringPrefix.length < (row.value as string).length;
  const truncatedString = stringCanCollapse && !stringExpanded
    ? `${JSON.stringify(stringPrefix)}…`
    : formatted;
  const customValue = isCollection ? undefined : renderValue?.({
    value: row.value,
    formatted,
    type: row.type,
    path: row.path,
  });
  const defaultValue = stringCanCollapse ? (
    <button
      type="button"
      className="vjr-string-toggle"
      aria-expanded={stringExpanded}
      aria-label={stringExpanded
        ? labels.collapseString(name)
        : labels.expandString(name)}
      title={formatted}
      tabIndex={active ? 0 : -1}
      onClick={event => {
        event.stopPropagation();
        onToggleString(row);
      }}
    >
      {truncatedString}
    </button>
  ) : formatted;
  const renderedValue = row.error
    ? <span className="vjr-value--unavailable">[Unavailable: {row.error.message}]</span>
    : isCollection
      ? renderCollectionValue(row)
      : customValue === undefined ? defaultValue : customValue;
  const isPending = copyState?.pointer === row.pointer && copyState.status === 'pending';
  const copiedKind = copyState?.pointer === row.pointer && copyState.status === 'success'
    ? copyState.kind
    : undefined;

  const handleActionClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    onActivate(row);
  };

  return (
    <div
      id={id}
      role="treeitem"
      className="vjr-row"
      data-active={active || undefined}
      data-search-match={matched || undefined}
      data-depth={row.depth}
      aria-label={getNodeDescription(row, rootName, labels.depthLimited)}
      aria-level={row.depth + 1}
      aria-posinset={row.position}
      aria-setsize={row.setSize}
      aria-expanded={row.expandable ? row.expanded : undefined}
      title={row.expandable
        ? row.expanded ? labels.collapse(name) : labels.expand(name)
        : undefined}
      onClick={handleActionClick}
    >
      <span className="vjr-indentation" aria-hidden="true">
        {Array.from({ length: row.depth }, (_, index) => (
          <span className="vjr-guide" key={index} />
        ))}
      </span>
      <span
        className={`vjr-chevron ${row.expanded ? 'vjr-chevron--expanded' : ''}`}
        aria-hidden="true"
      >
        {row.expandable ? '›' : ''}
      </span>
      {renderName(row, rootName)}
      {(row.depth > 0 || rootName !== undefined) && <span className="vjr-colon">:</span>}
      <span className={`vjr-value vjr-value--${row.type}`}>{renderedValue}</span>
      {showObjectSize && row.expandable && row.size !== undefined && (
        <span className="vjr-size">{row.size}</span>
      )}
      {row.depthLimited && <span className="vjr-limit">{labels.depthLimited}</span>}
      {(copyOptions.value || copyOptions.path) && (
        <span className="vjr-actions">
          {copyOptions.value && (
            <CopyButton
              kind="value"
              label={labels.copyValue(name)}
              copied={copiedKind === 'value'}
              disabled={isPending}
              tabIndex={active ? 0 : -1}
              onCopy={kind => onCopy(row, kind)}
            />
          )}
          {copyOptions.path && (
            <CopyButton
              kind="path"
              label={labels.copyPath(name)}
              copied={copiedKind === 'path'}
              disabled={isPending}
              tabIndex={active ? 0 : -1}
              onCopy={kind => onCopy(row, kind)}
            />
          )}
        </span>
      )}
    </div>
  );
};
