import type { Meta, StoryObj } from '@storybook/react';
import { JsonViewer } from './JsonViewer';

const meta = {
  title: 'Components/JsonViewer',
  component: JsonViewer,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'The JSON data to visualize',
    },
    rootName: {
      control: 'text',
      description: 'Optional name for the root node',
    },
    className: {
      control: 'text',
      description: 'CSS class name for the viewer container',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme for the JSON viewer',
    },
    defaultExpandDepth: {
      control: 'number',
      description: 'How many levels to expand by default (0 = all collapsed)',
    },
    showObjectSize: {
      control: 'boolean',
      description: 'Show object/array item count',
    },
  },
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = {
  name: 'John Doe',
  age: 30,
  email: 'john.doe@example.com',
  isActive: true,
  address: {
    street: '123 Main St',
    city: 'New York',
    zipCode: '10001',
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
  },
  hobbies: ['reading', 'coding', 'hiking'],
  metadata: null,
};

const complexData = {
  users: [
    {
      id: 1,
      name: 'Alice Johnson',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      lastLogin: '2024-03-28T10:30:00Z',
    },
    {
      id: 2,
      name: 'Bob Smith',
      role: 'user',
      permissions: ['read'],
      lastLogin: null,
    },
  ],
  settings: {
    notifications: {
      email: true,
      push: false,
      sms: true,
    },
    theme: 'dark',
    language: 'en',
  },
  statistics: {
    totalUsers: 1250,
    activeToday: 342,
    averageSessionTime: 15.7,
  },
};

const arrayData = [
  { id: 1, name: 'Product A', price: 29.99, inStock: true },
  { id: 2, name: 'Product B', price: 49.99, inStock: false },
  { id: 3, name: 'Product C', price: 19.99, inStock: true },
];

const primitiveData = {
  string: 'Hello, World!',
  number: 42,
  boolean: true,
  null: null,
  emptyString: '',
  zero: 0,
  negativeNumber: -273.15,
  largeNumber: 1234567890,
};

export const Default: Story = {
  args: {
    data: sampleData,
    theme: 'light',
  },
};

export const DarkTheme: Story = {
  args: {
    data: sampleData,
    theme: 'dark',
  },
  globals: {
    backgrounds: { value: 'dark' },
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#1a1a1a', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export const DefaultExpanded: Story = {
  args: {
    data: complexData,
    defaultExpandDepth: 10,
    theme: 'light',
  },
};

export const WithObjectSize: Story = {
  args: {
    data: complexData,
    showObjectSize: true,
    theme: 'light',
  },
};

export const ArrayOfObjects: Story = {
  args: {
    data: arrayData,
    theme: 'light',
  },
};

export const PrimitiveTypes: Story = {
  args: {
    data: primitiveData,
    defaultExpandDepth: 10,
    theme: 'light',
  },
};

export const EmptyObject: Story = {
  args: {
    data: {},
    theme: 'light',
  },
};

export const EmptyArray: Story = {
  args: {
    data: [],
    theme: 'light',
  },
};

export const WithRootName: Story = {
  args: {
    data: sampleData,
    rootName: 'userData',
    theme: 'light',
  },
};

export const WithClassName: Story = {
  args: {
    data: sampleData,
    className: 'custom-json-viewer',
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates using the className prop for custom styling. Add your own CSS class to customize appearance.',
      },
    },
  },
};
