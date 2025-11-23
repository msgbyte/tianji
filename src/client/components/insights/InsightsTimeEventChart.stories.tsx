import type { Meta, StoryObj } from '@storybook/react-vite';
import { InsightsTimeEventChart } from './InsightsTimeEventChart';
import dayjs from 'dayjs';
import { chatByCountryDemo } from './__fixtures__/ai_sample';

// Raw database query results (before processGroupedTimeSeriesData)
const rawChatData = [
  { date: '2025-11-14', country: 'Brazil', chat_send_count: 14355480 },
  { date: '2025-11-15', country: 'Brazil', chat_send_count: 15458445 },
  { date: '2025-11-16', country: 'Brazil', chat_send_count: 14431208 },
  { date: '2025-11-17', country: 'Brazil', chat_send_count: 12109150 },
  { date: '2025-11-18', country: 'Brazil', chat_send_count: 13500000 },
  { date: '2025-11-14', country: 'United States', chat_send_count: 8928823 },
  { date: '2025-11-15', country: 'United States', chat_send_count: 9410006 },
  { date: '2025-11-16', country: 'United States', chat_send_count: 9004098 },
  { date: '2025-11-17', country: 'United States', chat_send_count: 7876202 },
  { date: '2025-11-18', country: 'United States', chat_send_count: 8500000 },
  { date: '2025-11-14', country: 'Mexico', chat_send_count: 8257533 },
  { date: '2025-11-15', country: 'Mexico', chat_send_count: 8623542 },
  { date: '2025-11-16', country: 'Mexico', chat_send_count: 9581085 },
  { date: '2025-11-17', country: 'Mexico', chat_send_count: 7917975 },
  { date: '2025-11-18', country: 'Mexico', chat_send_count: 8200000 },
  { date: '2025-11-14', country: 'Philippines', chat_send_count: 4818833 },
  { date: '2025-11-15', country: 'Philippines', chat_send_count: 4799538 },
  { date: '2025-11-16', country: 'Philippines', chat_send_count: 3806469 },
  { date: '2025-11-17', country: 'Philippines', chat_send_count: 3051425 },
  { date: '2025-11-18', country: 'Philippines', chat_send_count: 3800000 },
  { date: '2025-11-14', country: 'Argentina', chat_send_count: 3433657 },
  { date: '2025-11-15', country: 'Argentina', chat_send_count: 3784942 },
  { date: '2025-11-16', country: 'Argentina', chat_send_count: 3486112 },
  { date: '2025-11-17', country: 'Argentina', chat_send_count: 2959003 },
  { date: '2025-11-18', country: 'Argentina', chat_send_count: 3200000 },
  { date: '2025-11-14', country: 'Indonesia', chat_send_count: 3601281 },
  { date: '2025-11-15', country: 'Indonesia', chat_send_count: 3885473 },
  { date: '2025-11-16', country: 'Indonesia', chat_send_count: 2886720 },
  { date: '2025-11-17', country: 'Indonesia', chat_send_count: 2315993 },
  { date: '2025-11-18', country: 'Indonesia', chat_send_count: 2900000 },
];

const meta = {
  title: 'Components/Insights/InsightsTimeEventChart',
  component: InsightsTimeEventChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InsightsTimeEventChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Using raw database query results (recommended approach)
export const ChatByCountryFromRawData: Story = {
  args: {
    rawData: rawChatData,
    metrics: [{ name: 'chat_send_count' }],
    groups: [
      {
        value: 'country',
      },
    ],
    time: {
      startAt: dayjs('2025-11-14').valueOf(),
      endAt: dayjs('2025-11-18').valueOf(),
      unit: 'day',
    },
    chartType: 'line',
    valueFormatter: (value: number) =>
      value.toLocaleString('en-US', { maximumFractionDigits: 0 }),
  },
};

export const ChatByCountryFromRawDataGeneratedByAI: Story = {
  args: {
    rawData: chatByCountryDemo,
    metrics: [
      {
        name: 'chat_count',
      },
    ],
    groups: [
      {
        value: 'country',
      },
    ],
    time: {
      unit: 'day',
      startAt: '2025-11-15T16:00:00.000Z',
      endAt: '2025-11-20T15:59:59.999Z',
    } as any,
    chartType: 'line',
    valueFormatter: (value: number) =>
      value.toLocaleString('en-US', { maximumFractionDigits: 0 }),
  },
};

// Chat analytics with stacked bar chart (from raw data)
export const ChatByCountryStackedFromRaw: Story = {
  args: {
    rawData: rawChatData,
    metrics: [{ name: 'chat_send_count' }],
    groups: [
      {
        value: 'country',
      },
    ],
    time: {
      startAt: dayjs('2025-11-14').valueOf(),
      endAt: dayjs('2025-11-18').valueOf(),
      unit: 'day',
    },
    chartType: 'bar',
    valueFormatter: (value: number) =>
      value.toLocaleString('en-US', { maximumFractionDigits: 0 }),
  },
};

// Empty data
export const Empty: Story = {
  args: {
    rawData: [],
    groups: [],
    time: {
      startAt: dayjs('2024-01-01').valueOf(),
      endAt: dayjs('2024-01-07').valueOf(),
      unit: 'day',
    },
  },
};
