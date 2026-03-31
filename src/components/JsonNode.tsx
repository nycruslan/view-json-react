import { memo } from 'react';
import type React from 'react';
import { LeafNode } from './LeafNode';
import { ObjectNode } from './ObjectNode';
import { isCollapsible } from '../types';
import type { JsonNodeProps } from '../types';

/**
 * Router component that delegates to LeafNode or ObjectNode based on data type.
 * This component has a single responsibility: type-based routing.
 */
export const JsonNode: React.FC<JsonNodeProps> = memo(function JsonNode(props) {
  return isCollapsible(props.data)
    ? <ObjectNode {...props} />
    : <LeafNode {...props} />;
});
