import type {
  ComponentType,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from 'react';
import type { TreeRow } from '../types';

export interface RowRendererProps {
  rows: TreeRow[];
  activePointer: string;
  setActivePointer: Dispatch<SetStateAction<string>>;
  treeRef: RefObject<HTMLDivElement | null>;
  renderRow: (row: TreeRow) => ReactNode;
  options?: unknown;
}

export interface InternalRendererProps {
  /** @internal */
  __rowRenderer?: ComponentType<RowRendererProps>;
  /** @internal */
  __rowRendererOptions?: unknown;
  /** @internal */
  __rowHeight?: number;
}

export const StandardRowRenderer = ({ rows, renderRow }: RowRendererProps) => (
  <>{rows.map(renderRow)}</>
);
