import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { JsonViewer } from './JsonViewer.js';

const sampleData = {
  user: {
    id: 42,
    name: 'Ada Lovelace',
    active: true,
    roles: ['admin', 'reviewer'],
    profile: {
      location: 'London',
      biography: 'Mathematician and writer known for work on the Analytical Engine.',
    },
  },
  metrics: {
    requests: 1_250,
    errorRate: 0.012,
  },
  generatedAt: '2026-01-15T10:30:00Z',
  metadata: null,
};

const meta = {
  title: 'Components/JsonViewer',
  component: JsonViewer,
  parameters: { layout: 'padded' },
  args: {
    data: sampleData,
    theme: 'light',
  },
  argTypes: {
    data: { control: 'object', description: 'The value to inspect.' },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'auto'],
      description: 'Built-in color theme.',
    },
    rootName: { control: 'text', description: 'Display-only root label.' },
    defaultExpandDepth: {
      control: { type: 'number', min: 0 },
      description: 'Initial uncontrolled expansion depth.',
    },
    collapseStringsAfterLength: {
      control: { type: 'number', min: 0 },
      description: 'Length at which strings become expandable.',
    },
    maxVisibleNodes: {
      control: { type: 'number', min: 1 },
      description: 'Visible traversal safety limit.',
    },
    showObjectSize: { control: 'boolean' },
    sortKeys: { control: 'boolean' },
    copy: { control: 'boolean' },
    onCopy: {
      action: 'copy result',
      description: 'Runs after the asynchronous clipboard attempt finishes.',
    },
    onExpand: { action: 'expansion changed' },
    onSearchMatchCount: { action: 'search count changed' },
  },
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkTheme: Story = {
  args: { theme: 'dark', defaultExpandDepth: 2 },
  decorators: [Story => (
    <div style={{ minHeight: 420, padding: 24, background: '#0d1117' }}>
      <Story />
    </div>
  )],
};

export const SystemTheme: Story = {
  args: { theme: 'auto', defaultExpandDepth: 2 },
};

export const FullyExpanded: Story = {
  args: { defaultExpandDepth: 10 },
};

export const SortedKeys: Story = {
  args: {
    data: { zebra: 1, alpha: 2, middle: { z: false, a: true } },
    sortKeys: true,
    defaultExpandDepth: 3,
  },
};

export const LongStrings: Story = {
  args: {
    data: {
      summary: 'This string is deliberately long so it can be expanded and collapsed without changing the value copied to the clipboard.',
      short: 'Always visible',
    },
    collapseStringsAfterLength: 32,
  },
};

const SearchDemo = () => {
  const [query, setQuery] = useState('Ada Lovelace');
  const [matchCount, setMatchCount] = useState(0);
  return (
    <div style={{ color: '#24292f', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 320, marginBlockEnd: 16 }}>
        <label htmlFor="json-search" style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Search JSON
          <input
            id="json-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-describedby="json-search-count"
            style={{
              boxSizing: 'border-box',
              inlineSize: '100%',
              minBlockSize: 36,
              padding: '6px 10px',
              border: '1px solid #afb8c1',
              borderRadius: 6,
              color: 'inherit',
              background: '#fff',
              font: 'inherit',
              fontWeight: 400,
            }}
          />
        </label>
        <output
          id="json-search-count"
          aria-live="polite"
          style={{ display: 'block', marginBlockStart: 6, color: '#57606a', fontSize: 13 }}
        >
          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
        </output>
      </div>
      <JsonViewer
        data={sampleData}
        searchQuery={query}
        copy={{ value: true, path: true }}
        onSearchMatchCount={setMatchCount}
      />
    </div>
  );
};

export const Search: Story = {
  render: () => <SearchDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Search is controlled by the application. F3 and Shift+F3 navigate matches while the tree is focused.',
      },
    },
  },
};

export const JavaScriptValues: Story = {
  render: () => {
    const data: Record<string, unknown> = {
      bigint: 9_007_199_254_740_993n,
      undefined,
      notANumber: Number.NaN,
      infinity: Number.POSITIVE_INFINITY,
      negativeZero: -0,
      date: new Date('2026-01-15T10:30:00Z'),
      regexp: /json/giu,
      map: new Map([['role', 'admin']]),
      set: new Set(['read', 'write']),
      error: new TypeError('Request failed'),
      typedArray: new Uint16Array([7, 11, 42]),
      symbol: Symbol('private'),
      function: function refresh() {},
      blockedObject: new Proxy({}, {
        ownKeys: () => { throw new Error('Inspection blocked'); },
      }),
      emptySlot: [, 'present'],
    };
    data.self = data;
    Object.defineProperty(data, 'token', {
      enumerable: true,
      get: () => 'must not execute',
    });
    return <JsonViewer data={data} defaultExpandDepth={3} />;
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: 'Non-JSON values, sparse arrays, accessors, cycles, and reflection failures are represented explicitly without crashing.',
      },
    },
  },
};

export const CopyAndRedaction: Story = {
  args: {
    data: {
      user: 'Ada',
      token: 'visible-but-redacted-when-copied',
      nested: { token: 'also-redacted' },
    },
    copy: { value: true, path: true, indent: 2 },
    redact: path => path.at(-1) === 'token',
    defaultExpandDepth: 3,
  },
};

export const CustomValueRendering: Story = {
  args: {
    data: { launched: new Date('2026-01-15T10:30:00Z'), status: 'ready' },
    renderValue: ({ type, formatted }) => type === 'date'
      ? <time style={{ fontWeight: 700 }}>{formatted}</time>
      : undefined,
  },
};

export const RightToLeft: Story = {
  args: {
    data: { مستخدم: { الاسم: 'آدا', نشط: true }, أدوار: ['مدير', 'مراجع'] },
    rootName: 'الاستجابة',
    dir: 'rtl',
    defaultExpandDepth: 3,
  },
};

export const CustomTheme: Story = {
  args: {
    style: {
      '--vjr-background': '#fff8e7',
      '--vjr-text': '#302400',
      '--vjr-key': '#7a3e00',
      '--vjr-string': '#146c2e',
      '--vjr-active': '#ffe08a',
      '--vjr-indent': '20px',
    },
    defaultExpandDepth: 2,
  },
};
