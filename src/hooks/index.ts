import { useCallback, useState } from 'react';

export const useCollapsible = (initialCollapsed: boolean) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return { collapsed, toggle };
};
