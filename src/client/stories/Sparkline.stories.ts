import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '../components/chart/Sparkline';

// Sample data for different scenarios
const trendingUpData = [1, 3, 2, 8, 5, 12, 9, 15, 18, 25, 22, 30];
const trendingDownData = [30, 28, 25, 22, 18, 15, 12, 8, 5, 3, 2, 1];
const volatileData = [10, 15, 8, 20, 5, 25, 12, 18, 6, 22, 9, 16];
const steadyData = [10, 11, 10, 12, 11, 13, 12, 14, 13, 15, 14, 16];
const smallDataSet = [5, 8, 3, 12, 7];

const meta = {
  title: 'Components/Chart/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact sparkline chart component using recharts AreaChart for displaying data trends.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of numbers to display in the sparkline',
    },
    width: {
      control: { type: 'range', min: 50, max: 400, step: 10 },
      description: 'Width of the sparkline chart',
    },
    height: {
      control: { type: 'range', min: 20, max: 200, step: 5 },
      description: 'Height of the sparkline chart',
    },
    color: {
      control: 'color',
      description: 'Color of the line and fill area',
    },
    showGradient: {
      control: 'boolean',
      description: 'Whether to show gradient fill',
    },
    strokeWidth: {
      control: { type: 'range', min: 1, max: 10, step: 1 },
      description: 'Stroke width of the line',
    },
    fillOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Fill opacity of the area',
    },
    className: {
      control: 'text',
      description: 'CSS class name for styling',
    },
  },
  args: {
    data: trendingUpData,
    width: 100,
    height: 40,
    color: '#2680eb', // Default theme color
    showGradient: true,
    strokeWidth: 2,
    fillOpacity: 0.2,
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic sparkline with default settings
export const Default: Story = {
  args: {
    data: trendingUpData,
    color: '#2680eb',
  },
};

// Upward trending data in green
export const UpwardTrend: Story = {
  args: {
    data: trendingUpData,
    color: '#10b981',
  },
};

// Downward trending data in red
export const DownwardTrend: Story = {
  args: {
    data: trendingDownData,
    color: '#ef4444',
  },
};

// Volatile data in orange
export const VolatileData: Story = {
  args: {
    data: volatileData,
    color: '#f59e0b',
  },
};

// Steady growth in blue
export const SteadyGrowth: Story = {
  args: {
    data: steadyData,
    color: '#3b82f6',
  },
};

// Large size sparkline
export const LargeSize: Story = {
  args: {
    data: volatileData,
    width: 200,
    height: 80,
    color: '#8b5cf6',
  },
};

// Small size sparkline
export const SmallSize: Story = {
  args: {
    data: smallDataSet,
    width: 60,
    height: 25,
    color: '#06b6d4',
  },
};

// Line only (no gradient)
export const LineOnly: Story = {
  args: {
    data: steadyData,
    color: '#6366f1',
    showGradient: false,
    strokeWidth: 3,
  },
};

// High fill opacity
export const HighOpacity: Story = {
  args: {
    data: trendingUpData,
    color: '#10b981',
    fillOpacity: 0.6,
  },
};

// Thick stroke
export const ThickStroke: Story = {
  args: {
    data: volatileData,
    color: '#f59e0b',
    strokeWidth: 4,
    showGradient: false,
  },
};

// Custom styling with className
export const CustomStyling: Story = {
  args: {
    data: trendingUpData,
    color: '#ec4899',
    className: 'border border-pink-200 rounded-md p-2',
    width: 120,
    height: 50,
  },
};

// Empty data (should render nothing)
export const EmptyData: Story = {
  args: {
    data: [],
  },
};

// Single data point
export const SingleDataPoint: Story = {
  args: {
    data: [15],
    color: '#84cc16',
  },
};

// Two data points (minimal line)
export const TwoDataPoints: Story = {
  args: {
    data: [10, 20],
    color: '#f97316',
    strokeWidth: 3,
  },
};
