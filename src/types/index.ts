// JSON type definitions with proper type safety
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Type guard for collapsible nodes
export const isCollapsible = (value: JsonValue): value is JsonObject | JsonArray => {
  return typeof value === 'object' && value !== null;
};

// Helper to construct full path for copy operations
export const getFullPath = (path: string[], rootName?: string): string[] => {
  return rootName && path.length === 0 ? [rootName] : path;
};

// Copy callback types
export type OnCopyProps = {
  path: string[];
  value: JsonValue;
};

// Public API props
export interface JsonViewerProps {
  data: JsonValue;
  defaultExpandDepth?: number;
  rootName?: string;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark';
  showObjectSize?: boolean;
  onCopy?: (copyInfo: OnCopyProps) => void;
}

// Internal props for recursive rendering
export interface JsonNodeProps {
  data: JsonValue;
  name?: string;
  path: string[];
  depth: number;
  defaultExpandDepth: number;
  rootName?: string;
  showObjectSize?: boolean;
  onCopy?: (copyInfo: OnCopyProps) => void;
}
