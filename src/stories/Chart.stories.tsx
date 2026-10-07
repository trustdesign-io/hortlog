import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

const meta: Meta = {
  title: 'UI/Chart',
}

export default meta

type Story = StoryObj

const monthlyRevenue = [
  { month: 'Jan', revenue: 18400, target: 20000 },
  { month: 'Feb', revenue: 21200, target: 20000 },
  { month: 'Mar', revenue: 19800, target: 22000 },
  { month: 'Apr', revenue: 24500, target: 22000 },
  { month: 'May', revenue: 27100, target: 25000 },
  { month: 'Jun', revenue: 25600, target: 25000 },
  { month: 'Jul', revenue: 30200, target: 28000 },
  { month: 'Aug', revenue: 28900, target: 28000 },
  { month: 'Sep', revenue: 33400, target: 30000 },
  { month: 'Oct', revenue: 31700, target: 30000 },
  { month: 'Nov', revenue: 36200, target: 33000 },
  { month: 'Dec', revenue: 39800, target: 33000 },
]

const revenueConfig: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  target: {
    label: 'Target',
    color: 'hsl(var(--chart-2))',
  },
}

export const BarChartMonthlyRevenue: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ChartContainer config={revenueConfig} className="h-72">
        <BarChart data={monthlyRevenue} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  `$${Number(value).toLocaleString()}`
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
}

const signupData = [
  { week: 'W1', signups: 120 },
  { week: 'W2', signups: 185 },
  { week: 'W3', signups: 164 },
  { week: 'W4', signups: 210 },
  { week: 'W5', signups: 195 },
  { week: 'W6', signups: 243 },
  { week: 'W7', signups: 271 },
  { week: 'W8', signups: 258 },
  { week: 'W9', signups: 312 },
  { week: 'W10', signups: 340 },
  { week: 'W11', signups: 325 },
  { week: 'W12', signups: 389 },
]

const signupsConfig: ChartConfig = {
  signups: {
    label: 'New signups',
    color: 'hsl(var(--chart-3))',
  },
}

export const LineChartUserSignups: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ChartContainer config={signupsConfig} className="h-72">
        <LineChart data={signupData} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line
            type="monotone"
            dataKey="signups"
            stroke="var(--color-signups)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  ),
}
