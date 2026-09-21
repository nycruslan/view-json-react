import { displayPointer } from './path.js';
import type { JsonPath, ValueType } from './types.js';

const SPECIAL_VALUE = Symbol('view-json-react.special-value');

type SpecialKind = 'accessor' | 'hole' | 'unavailable';

interface SpecialValue {
  readonly [SPECIAL_VALUE]: SpecialKind;
  readonly label?: string;
  readonly error?: Error;
}

interface CollectionEntry {
  key: string | number;
  value: unknown;
}

export interface CollectionInspection {
  entries: CollectionEntry[];
  size: number;
  hasMore: boolean;
  error?: Error;
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const createSpecialValue = (
  kind: SpecialKind,
  options: Omit<SpecialValue, typeof SPECIAL_VALUE> = {},
): SpecialValue => ({ [SPECIAL_VALUE]: kind, ...options });

const getSpecialKind = (value: unknown): SpecialKind | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  return (value as Partial<SpecialValue>)[SPECIAL_VALUE];
};

const readDescriptorValue = (descriptor: PropertyDescriptor): unknown => {
  if ('value' in descriptor) return descriptor.value;
  const accessors = [descriptor.get && 'Getter', descriptor.set && 'Setter']
    .filter(Boolean)
    .join('/');
  return createSpecialValue('accessor', { label: accessors || 'Accessor' });
};

export const classifyValue = (value: unknown): ValueType => {
  let specialKind: SpecialKind | undefined;
  try {
    specialKind = getSpecialKind(value);
  } catch {
    return 'unavailable';
  }
  if (specialKind) return specialKind;
  if (value === null) return 'null';

  const primitiveType = typeof value;
  if (primitiveType !== 'object' && primitiveType !== 'function') {
    return primitiveType as ValueType;
  }
  if (primitiveType === 'function') return 'function';

  try {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value instanceof Error) return 'error';
    if (ArrayBuffer.isView(value)) return 'typed-array';
    return 'object';
  } catch {
    return 'unavailable';
  }
};

export const isExpandableType = (type: ValueType): boolean =>
  type === 'array' || type === 'object';

export const inspectCollection = (
  value: unknown,
  limit = Number.POSITIVE_INFINITY,
): CollectionInspection => {
  const type = classifyValue(value);

  try {
    if (type === 'array') {
      const array = value as unknown[];
      const lengthDescriptor = Reflect.getOwnPropertyDescriptor(array, 'length');
      const size = Number(lengthDescriptor?.value ?? 0);
      const count = Math.min(size, Math.max(0, limit));
      const entries: CollectionEntry[] = [];

      for (let index = 0; index < count; index += 1) {
        const descriptor = Reflect.getOwnPropertyDescriptor(array, String(index));
        entries.push({
          key: index,
          value: descriptor
            ? readDescriptorValue(descriptor)
            : createSpecialValue('hole'),
        });
      }

      return { entries, size, hasMore: count < size };
    }

    if (type === 'object') {
      const object = value as object;
      const entries: CollectionEntry[] = [];
      let size = 0;

      for (const key of Reflect.ownKeys(object)) {
        if (typeof key !== 'string') continue;
        const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
        if (!descriptor?.enumerable) continue;
        size += 1;
        if (entries.length < limit) {
          entries.push({ key, value: readDescriptorValue(descriptor) });
        }
      }

      return { entries, size, hasMore: entries.length < size };
    }
  } catch (error) {
    const normalizedError = toError(error);
    return {
      entries: [
        {
          key: '[error]',
          value: createSpecialValue('unavailable', { error: normalizedError }),
        },
      ],
      size: 0,
      hasMore: false,
      error: normalizedError,
    };
  }

  return { entries: [], size: 0, hasMore: false };
};

const safely = (read: () => string, fallback: string): string => {
  try {
    return read();
  } catch {
    return fallback;
  }
};

export const formatValue = (
  value: unknown,
  type = classifyValue(value),
  referencePointer?: string,
): string => {
  switch (type) {
    case 'null':
      return 'null';
    case 'string':
      return JSON.stringify(value);
    case 'number': {
      const number = value as number;
      if (Number.isNaN(number)) return 'NaN';
      if (number === Number.POSITIVE_INFINITY) return 'Infinity';
      if (number === Number.NEGATIVE_INFINITY) return '-Infinity';
      if (Object.is(number, -0)) return '-0';
      return String(number);
    }
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'bigint':
      return `${String(value)}n`;
    case 'symbol':
      return safely(() => String(value), 'Symbol()');
    case 'function':
      return safely(() => {
        const name = (value as (...args: never[]) => unknown).name;
        return name ? `[Function ${name}]` : '[Function]';
      }, '[Function]');
    case 'date':
      return safely(() => (value as Date).toISOString(), 'Invalid Date');
    case 'regexp':
      return safely(() => String(value), '[RegExp]');
    case 'map':
      return safely(() => `Map(${(value as Map<unknown, unknown>).size})`, 'Map');
    case 'set':
      return safely(() => `Set(${(value as Set<unknown>).size})`, 'Set');
    case 'error':
      return safely(() => {
        const error = value as Error;
        return `${error.name || 'Error'}: ${error.message}`;
      }, 'Error');
    case 'typed-array':
      return safely(
        () => `${(value as object).constructor.name}(${(value as ArrayBufferView).byteLength})`,
        'TypedArray',
      );
    case 'accessor':
      return `[${(value as SpecialValue).label || 'Accessor'}]`;
    case 'hole':
      return '<empty>';
    case 'unavailable':
      return safely(() => {
        const error = (value as Partial<SpecialValue>)?.error;
        return error ? `[Unavailable: ${error.message}]` : '[Unavailable]';
      }, '[Unavailable]');
    case 'reference':
      return `[Reference → ${displayPointer(referencePointer || '')}]`;
    case 'array':
      return `Array(${safely(() => String((value as unknown[]).length), '?')})`;
    case 'object':
      return 'Object';
  }
};

interface Ancestor {
  value: object;
  pointer: string;
  parent?: Ancestor;
}

const findAncestor = (
  ancestor: Ancestor | undefined,
  value: object,
): string | undefined => {
  let current = ancestor;
  while (current) {
    if (current.value === value) return current.pointer;
    current = current.parent;
  }
  return undefined;
};

interface NormalizeOptions {
  maxDepth: number;
  maxBreadth: number;
  redact?: (
    path: JsonPath,
    value: unknown,
  ) => boolean | string | null | undefined;
}

const normalizeForSerialization = (
  value: unknown,
  path: JsonPath,
  depth: number,
  ancestor: Ancestor | undefined,
  options: NormalizeOptions,
): unknown => {
  const redaction = options.redact?.(path, value);
  if (redaction === true || typeof redaction === 'string') {
    return typeof redaction === 'string' ? redaction : '[Redacted]';
  }

  const type = classifyValue(value);
  if (type === 'string' || type === 'boolean' || type === 'null') return value;
  if (type === 'number') {
    const number = value as number;
    return Number.isFinite(number) && !Object.is(number, -0)
      ? number
      : formatValue(number, type);
  }
  if (type === 'array' || type === 'object') {
    if (depth >= options.maxDepth) return '[Maximum depth reached]';
    const object = value as object;
    const referencePointer = findAncestor(ancestor, object);
    if (referencePointer !== undefined) {
      return `[Reference → ${displayPointer(referencePointer)}]`;
    }

    const pointer = path.length === 0
      ? ''
      : `/${path.map(segment => String(segment).replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`;
    const nextAncestor: Ancestor = { value: object, pointer, parent: ancestor };
    const inspected = inspectCollection(value, options.maxBreadth);
    if (inspected.error) return `[Unavailable: ${inspected.error.message}]`;

    if (type === 'array') {
      const result = inspected.entries.map(entry =>
        normalizeForSerialization(
          entry.value,
          [...path, entry.key],
          depth + 1,
          nextAncestor,
          options,
        ),
      );
      if (inspected.hasMore) result.push(`[${inspected.size - result.length} more items]`);
      return result;
    }

    const result: Record<string, unknown> = {};
    for (const entry of inspected.entries) {
      result[String(entry.key)] = normalizeForSerialization(
        entry.value,
        [...path, entry.key],
        depth + 1,
        nextAncestor,
        options,
      );
    }
    if (inspected.hasMore) {
      result['…'] = `[${inspected.size - inspected.entries.length} more properties]`;
    }
    return result;
  }

  return formatValue(value, type);
};

export const stringifyValue = (
  value: unknown,
  options: import('./types.js').StringifyOptions = {},
): string => {
  const normalized = normalizeForSerialization(value, [], 0, undefined, {
    maxDepth: options.maxDepth ?? 100,
    maxBreadth: options.maxBreadth ?? 10_000,
    redact: options.redact,
  });
  return JSON.stringify(normalized, null, options.space ?? 2) ?? 'undefined';
};
