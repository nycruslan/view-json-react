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
  const [query, setQuery] = useState('ada');
  return (
    <div>
      <label style={{ display: 'grid', gap: 6, marginBlockEnd: 12 }}>
        Search JSON
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          style={{ maxWidth: 320, padding: 8 }}
        />
      </label>
      <JsonViewer
        data={sampleData}
        searchQuery={query}
        copy={{ value: true, path: true }}
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
        story: 'Non-JSON values, sparse arrays, accessors, and cycles are represented explicitly without crashing.',
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
