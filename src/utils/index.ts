import styles from '../styles.module.scss';
import type { JsonValue } from '../types';

export const isCollapsible = (value: JsonValue): boolean =>
  typeof value === 'object' && value !== null;

export const getBrackets = (value: JsonValue): [string, string] =>
  Array.isArray(value) ? ['[', ']'] : ['{', '}'];

export const getKeyClass = (collapsible: boolean) =>
  collapsible
    ? `${styles.key} ${styles.collapsible}`
    : `${styles.key} ${styles.primitive}`;

export const handleKeyDown = (
  event: React.KeyboardEvent<HTMLSpanElement>,
  toggleCollapse: () => void
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    toggleCollapse();
    event.preventDefault();
  }
};
