import type { Meta, StoryObj } from '@storybook/react';
import { VirtualJsonViewer } from './VirtualJsonViewer.js';

const meta = {
  title: 'Components/VirtualJsonViewer',
  component: VirtualJsonViewer,
  parameters: { layout: 'padded' },
  args: {
    data: [],
    height: 480,
    rowHeight: 28,
    overscan: 8,
  },
} satisfies Meta<typeof VirtualJsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const largeArray = Array.from({ length: 50_000 }, (_, index) => ({
  id: index + 1,
  status: index % 7 === 0 ? 'queued' : 'complete',
  durationMs: (index * 17) % 2_000,
}));

export const FiftyThousandItems: Story = {
  args: {
    data: largeArray,
    maxVisibleNodes: 50_001,
    copy: false,
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: 'Only viewport rows are mounted. Increase maxVisibleNodes deliberately when the model itself should include more than the 10,000-node safety default.',
      },
    },
  },
};

export const SearchLargeData: Story = {
  args: {
    data: largeArray,
    searchQuery: '19999',
    maxSearchNodes: 100_000,
    copy: false,
  },
  parameters: { controls: { disable: true } },
};
