'use client';

import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import { JsonViewer } from './JsonViewer';
import type {
  InternalRendererProps,
  RowRendererProps,
} from './internal/RowRenderer';
import type {
  JsonViewerHandle,
  JsonViewerProps,
  VirtualJsonViewerProps,
} from './types';

type VirtualOptions = {
  rowHeight: number;
  overscan: number;
};

const finiteInteger = (value: number, fallback: number, minimum: number) =>
  Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : fallback;

const VirtualRows = ({
  rows,
  activePointer,
  setActivePointer,
  treeRef,
  renderRow,
  options,
}: RowRendererProps) => {
  const { rowHeight, overscan } = options as VirtualOptions;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const activeIndex = Math.max(
    0,
    rows.findIndex(row => row.pointer === activePointer),
  );

  useEffect(() => {
    const element = treeRef.current;
    if (!element) return;
    const updateHeight = () => setViewportHeight(element.clientHeight || 400);
    const handleScroll = () => {
      setScrollTop(element.scrollTop);
      const row = rows[
        Math.min(
          rows.length - 1,
          Math.max(0, Math.floor(element.scrollTop / rowHeight)),
        )
      ];
      if (row) setActivePointer(row.pointer);
    };

    updateHeight();
    element.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      return () => element.removeEventListener('scroll', handleScroll);
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', handleScroll);
    };
  }, [rowHeight, rows, setActivePointer, treeRef]);

  useEffect(() => {
    const element = treeRef.current;
    if (!element) return;
    const top = activeIndex * rowHeight;
    const bottom = top + rowHeight;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (bottom > element.scrollTop + element.clientHeight) {
      element.scrollTop = bottom - element.clientHeight;
    }
  }, [activeIndex, rowHeight, treeRef]);

  const range = useMemo(() => {
    const visibleCount = Math.max(1, Math.ceil(viewportHeight / rowHeight));
    let start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    let end = Math.min(rows.length, start + visibleCount + overscan * 2);
    if (activeIndex < start || activeIndex >= end) {
      start = Math.max(0, activeIndex - overscan);
      end = Math.min(rows.length, start + visibleCount + overscan * 2);
    }
    return { start, end };
  }, [activeIndex, overscan, rowHeight, rows.length, scrollTop, viewportHeight]);

  return (
    <div
      role="none"
      className="vjr-virtual-spacer"
      style={{ blockSize: rows.length * rowHeight }}
    >
      <div
        role="none"
        className="vjr-virtual-window"
        style={{ transform: `translateY(${range.start * rowHeight}px)` }}
      >
        {rows.slice(range.start, range.end).map(renderRow)}
      </div>
    </div>
  );
};

const InternalJsonViewer = JsonViewer as ForwardRefExoticComponent<
  JsonViewerProps & InternalRendererProps & RefAttributes<JsonViewerHandle>
>;

export const VirtualJsonViewer = forwardRef<
  JsonViewerHandle,
  VirtualJsonViewerProps
>(function VirtualJsonViewer(
  {
    height = 400,
    rowHeight: requestedRowHeight = 28,
    overscan: requestedOverscan = 6,
    style,
    ...props
  },
  ref,
) {
  const rowHeight = finiteInteger(requestedRowHeight, 28, 28);
  const overscan = finiteInteger(requestedOverscan, 6, 0);
  return (
    <InternalJsonViewer
      {...props}
      ref={ref}
      style={{
        ...style,
        '--vjr-row-height': `${rowHeight}px`,
        blockSize: height,
      }}
      __rowRenderer={VirtualRows}
      __rowRendererOptions={{ rowHeight, overscan } satisfies VirtualOptions}
    />
  );
});
