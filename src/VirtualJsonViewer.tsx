'use client';

import { forwardRef } from 'react';
import { JsonViewer } from './JsonViewer';
import type { JsonViewerHandle, VirtualJsonViewerProps } from './types';

export const VirtualJsonViewer = forwardRef<
  JsonViewerHandle,
  VirtualJsonViewerProps
>(function VirtualJsonViewer(props, ref) {
  return <JsonViewer {...props} ref={ref} virtualize />;
});
