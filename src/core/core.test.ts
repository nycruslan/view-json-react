import { describe, expect, it } from 'vitest';
import {
  buildVisibleTree,
  classifyValue,
  collectDefaultExpandedPaths,
  formatJsonPath,
  formatValue,
  searchTree,
  stringifyValue,
  toJsonPointer,
} from './index.js';

describe('JSON paths', () => {
  it('encodes JSON Pointer and JSONPath without ambiguity', () => {
    const path = ['users', 0, 'a/b~c', ''] as const;
    expect(toJsonPointer(path)).toBe('/users/0/a~1b~0c/');
    expect(formatJsonPath(path)).toBe('$.users[0]["a/b~c"][""]');
  });
});

describe('value inspection', () => {
  it('formats JavaScript values without pretending they are JSON', () => {
    expect(formatValue(-0)).toBe('-0');
    expect(formatValue(Number.NaN)).toBe('NaN');
    expect(formatValue(12n)).toBe('12n');
    expect(formatValue(new Date('2024-01-01T00:00:00Z'))).toBe(
      '2024-01-01T00:00:00.000Z',
    );
    expect(formatValue(new Uint32Array(2))).toBe('Uint32Array(2)');
    expect(formatValue(new DataView(new ArrayBuffer(8)))).toBe('DataView(8)');
  });

  it('does not crash on revoked proxies', () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    expect(classifyValue(proxy)).toBe('unavailable');
    expect(formatValue(proxy)).toBe('[Unavailable]');
  });
});

describe('tree building', () => {
  it('builds visible rows and detects cycles', () => {
    const data: { name: string; self?: unknown } = { name: 'root' };
    data.self = data;

    const result = buildVisibleTree(data, { isExpanded: () => true });
    expect(result.rows.map(row => row.pointer)).toEqual(['', '/name', '/self']);
    expect(result.rows[2]).toMatchObject({
      type: 'reference',
      referencePointer: '',
      expandable: false,
    });
  });

  it('normalizes errors from throwing reflection traps', () => {
    const unprintable = Object.create(null) as { [Symbol.toPrimitive]?: () => never };
    unprintable[Symbol.toPrimitive] = () => {
      throw new Error('cannot stringify');
    };
    const data = new Proxy({}, {
      ownKeys() {
        throw unprintable;
      },
    });

    const result = buildVisibleTree(data, { isExpanded: () => true });
    expect(result.rows[0]).toMatchObject({
      expandable: false,
      error: { message: 'Unknown error' },
    });
    expect(stringifyValue(data)).toBe('"[Unavailable: Unknown error]"');
  });

  it('does not invoke property getters', () => {
    let getterCalls = 0;
    const data: Record<string, unknown> = {};
    Object.defineProperty(data, 'secret', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'should not run';
      },
    });

    const result = buildVisibleTree(data, { isExpanded: () => true });
    expect(getterCalls).toBe(0);
    expect(result.rows[1].type).toBe('accessor');
    expect(formatValue(result.rows[1].value)).toBe('[Getter]');
  });

  it('renders repeated sibling references independently', () => {
    const shared = { value: 1 };
    const result = buildVisibleTree(
      { first: shared, second: shared },
      { isExpanded: () => true },
    );

    expect(result.rows.filter(row => row.type === 'reference')).toHaveLength(0);
    expect(result.rows.filter(row => row.key === 'value')).toHaveLength(2);
  });

  it('enforces the visible node budget', () => {
    const result = buildVisibleTree([0, 1, 2, 3], {
      isExpanded: () => true,
      maxVisibleNodes: 3,
    });
    expect(result.rows).toHaveLength(3);
    expect(result.truncated).toBe(true);

    const nested = buildVisibleTree(
      { first: { alpha: 1, beta: 2 }, second: 3 },
      { isExpanded: () => true, maxVisibleNodes: 4 },
    );
    expect(nested.rows.map(row => row.pointer)).toEqual([
      '',
      '/first',
      '/first/alpha',
      '/first/beta',
    ]);
    expect(nested.truncated).toBe(true);
  });

  it('collects initial expansion paths by depth', () => {
    const paths = collectDefaultExpandedPaths({ nested: { value: 1 } }, 2);
    expect([...paths]).toEqual(['', '/nested']);
  });

  it('supports root-only depth limits and deterministic key sorting', () => {
    const rootOnly = buildVisibleTree({ child: 1 }, {
      isExpanded: () => true,
      maxDepth: 0,
    });
    expect(rootOnly.rows).toHaveLength(1);
    expect(rootOnly.rows[0]).toMatchObject({
      depthLimited: true,
      expandable: false,
      expanded: false,
    });

    const sorted = buildVisibleTree({ zebra: 1, alpha: 2 }, {
      isExpanded: () => true,
      sortKeys: true,
    });
    expect(sorted.rows.map(row => row.key)).toEqual([undefined, 'alpha', 'zebra']);

    const limited = buildVisibleTree({ zebra: 1, alpha: 2, middle: 3 }, {
      isExpanded: () => true,
      maxVisibleNodes: 3,
      sortKeys: true,
    });
    expect(limited.rows.map(row => row.key)).toEqual([undefined, 'alpha', 'middle']);
  });

  it('treats empty collections as leaves', () => {
    const result = buildVisibleTree({ emptyObject: {}, emptyArray: [] }, {
      isExpanded: () => true,
    });
    expect(result.rows.slice(1)).toEqual([
      expect.objectContaining({ key: 'emptyObject', size: 0, expandable: false }),
      expect.objectContaining({ key: 'emptyArray', size: 0, expandable: false }),
    ]);
  });
});

describe('tree search', () => {
  it('finds collapsed descendants and includes their ancestors', () => {
    const result = searchTree(
      { user: { name: 'Ada', role: 'admin' }, ignored: true },
      'ada',
    );

    expect([...result.matches]).toEqual(['/user/name']);
    expect([...result.visible]).toEqual(['', '/user/name', '/user']);
    expect(result.truncated).toBe(false);
  });

  it('bounds searches over large values', () => {
    const result = searchTree(Array.from({ length: 100 }, (_, index) => index), '9', {
      maxResults: 1,
    });
    expect(result.matches.size).toBe(1);
    expect(result.truncated).toBe(true);
  });
});

describe('safe serialization', () => {
  it('preserves valid JSON data', () => {
    const data = { name: 'Ada', flags: [true, null], count: 2 };
    expect(JSON.parse(stringifyValue(data))).toEqual(data);
  });

  it('serializes cycles and unsupported values safely', () => {
    const data: Record<string, unknown> = { amount: 2n, value: Number.NaN };
    data.self = data;
    const text = stringifyValue(data);
    expect(text).toContain('"amount": "2n"');
    expect(text).toContain('"value": "NaN"');
    expect(text).toContain('"self": "[Reference → /]"');
  });

  it('redacts selected paths before copying', () => {
    const text = stringifyValue(
      { user: 'Ada', token: 'secret' },
      { redact: path => path.at(-1) === 'token' },
    );
    expect(text).toContain('"token": "[Redacted]"');
    expect(text).not.toContain('secret');
  });

  it('preserves prototype-like keys and truncation metadata', () => {
    const data = Object.create(null) as Record<string, unknown>;
    data.__proto__ = { safe: true };
    data['…'] = 'original';
    data.extra = 1;

    const complete = JSON.parse(stringifyValue(data)) as Record<string, unknown>;
    expect(Object.hasOwn(complete, '__proto__')).toBe(true);
    expect(complete.__proto__).toEqual({ safe: true });

    const truncated = JSON.parse(stringifyValue(data, { maxBreadth: 2 })) as Record<
      string,
      unknown
    >;
    expect(truncated['…']).toBe('original');
    expect(truncated['……']).toBe('[1 more properties]');
  });

  it('falls back to safe bounds for non-finite serialization options', () => {
    let data: Record<string, unknown> = { leaf: true };
    for (let index = 0; index < 105; index += 1) data = { child: data };

    expect(stringifyValue(data, { maxDepth: Number.NaN }))
      .toContain('[Maximum depth reached]');
    expect(JSON.parse(stringifyValue({ value: 1 }, { maxBreadth: Number.NaN })))
      .toEqual({ value: 1 });
  });

  it('enforces a total serialization node budget', () => {
    const text = stringifyValue(
      { first: { value: 1 }, second: { value: 2 } },
      { maxNodes: 3 },
    );
    expect(text).toContain('"second": "[Maximum node count reached]"');
    expect(text).not.toContain('"value": 2');
  });
});
