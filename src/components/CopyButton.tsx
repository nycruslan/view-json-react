import { memo, useState, useEffect } from 'react';
import type React from 'react';
import styles from '../styles.module.scss';

interface CopyButtonProps {
  handleCopy: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = memo(function CopyButton({ handleCopy }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCopy();
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
      aria-label={copied ? 'Copied!' : 'Copy value'}
      title={copied ? 'Copied!' : 'Copy value'}
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
});
