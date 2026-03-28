import { memo } from 'react';
import { CopyButton } from './CopyButton';
import { getFullPath } from '../types';
import type { JsonNodeProps } from '../types';
import styles from '../styles.module.scss';

export const LeafNode: React.FC<JsonNodeProps> = memo(({
  data,
  name,
  path,
  rootName,
  onCopy,
}) => {
  const valueType = data === null ? 'null' : typeof data;
  const displayName = path.length === 0 && rootName ? rootName : name;

  const handleCopy = () => {
    if (!onCopy) return;
    onCopy({ path: getFullPath(path, rootName), value: data });
  };

  return (
    <div className={styles.node}>
      {displayName && (
        <span className={`${styles.key} ${styles.primitive}`}>
          "{displayName}":
        </span>
      )}
      <span className={`${styles.primitiveValue} ${styles[valueType] || ''}`}>
        {JSON.stringify(data)}
      </span>
      {onCopy && <CopyButton handleCopy={handleCopy} />}
    </div>
  );
});
