import { memo } from 'react';
import { JsonNode } from './JsonNode';
import { CopyButton } from './CopyButton';
import { useCollapsible } from '../hooks';
import { getFullPath } from '../types';
import type { JsonNodeProps } from '../types';
import styles from '../styles.module.scss';

export const ObjectNode: React.FC<JsonNodeProps> = memo(({
  data,
  name,
  path,
  depth,
  defaultExpandDepth,
  rootName,
  showObjectSize,
  onCopy,
}) => {
  const isArray = Array.isArray(data);
  const [openBracket, closeBracket] = isArray ? ['[', ']'] : ['{', '}'];
  const displayName = path.length === 0 && rootName ? rootName : name;
  const shouldStartCollapsed = depth >= defaultExpandDepth;

  const { collapsed, toggle } = useCollapsible(shouldStartCollapsed);

  const entries = isArray
    ? (data as unknown[]).map((val, idx) => [String(idx), val] as const)
    : Object.entries(data as object);

  const handleCopy = () => {
    if (!onCopy) return;
    onCopy({ path: getFullPath(path, rootName), value: data });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      toggle();
      event.preventDefault();
    }
  };

  return (
    <div className={styles.node}>
      <span
        tabIndex={0}
        role="button"
        aria-expanded={!collapsed}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={`${styles.key} ${styles.collapsible}`}
      >
        <span className={`${styles.arrow} ${collapsed ? styles.collapsed : styles.expanded}`} />
        {displayName && <span className={styles.keyName}>"{displayName}":</span>}
        {collapsed ? (
          <>
            {openBracket}
            {entries.length > 0 && (
              <>
                <span className={styles.dots}>...</span>
                {showObjectSize && (
                  <span className={styles.size}>{entries.length}</span>
                )}
              </>
            )}
            {closeBracket}
          </>
        ) : (
          openBracket
        )}
      </span>
      {onCopy && <CopyButton handleCopy={handleCopy} />}

      {!collapsed && (
        <>
          <div className={styles.children}>
            {entries.map(([key, value]) => (
              <JsonNode
                key={key}
                name={key}
                data={value}
                path={[...path, key]}
                depth={depth + 1}
                defaultExpandDepth={defaultExpandDepth}
                rootName={rootName}
                showObjectSize={showObjectSize}
                onCopy={onCopy}
              />
            ))}
          </div>
          <span className={styles.bracket}>
            {closeBracket}
          </span>
        </>
      )}
    </div>
  );
});
