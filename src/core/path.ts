import type { JsonPath, JsonPathSegment } from './types';

const escapePointerSegment = (segment: JsonPathSegment): string =>
  String(segment).replaceAll('~', '~0').replaceAll('/', '~1');

export const toJsonPointer = (path: JsonPath): string =>
  path.length === 0 ? '' : `/${path.map(escapePointerSegment).join('/')}`;

export const getParentPointer = (pointer: string): string | undefined => {
  if (pointer === '') return undefined;
  const separator = pointer.lastIndexOf('/');
  return separator <= 0 ? '' : pointer.slice(0, separator);
};

export const appendPath = (
  path: JsonPath,
  segment: JsonPathSegment,
): JsonPath => [...path, segment];

export const formatJsonPath = (path: JsonPath): string =>
  path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    if (/^[A-Za-z_$][\w$]*$/.test(segment)) return `${result}.${segment}`;
    return `${result}[${JSON.stringify(segment)}]`;
  }, '$');

export const displayPointer = (pointer: string): string => pointer || '/';
