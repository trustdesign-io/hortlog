import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4 space-y-3">
        <h3 className="text-base font-semibold">Project overview</h3>
        <p className="text-sm text-muted-foreground">
          Track progress across all active workstreams. 3 of 7 milestones
          completed. Next deadline: 28 March.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['Tasks', 'Members', 'Comments'] as const).map((label, i) => (
            <div key={label} className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{[24, 8, 142][i]}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="analytics" className="mt-4 space-y-3">
        <h3 className="text-base font-semibold">Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Page views are up 14% this week. Unique visitors: 3,241. Bounce rate:
          38%.
        </p>
        <div className="h-32 rounded-lg border flex items-center justify-center text-sm text-muted-foreground">
          Chart placeholder
        </div>
      </TabsContent>
      <TabsContent value="reports" className="mt-4 space-y-3">
        <h3 className="text-base font-semibold">Reports</h3>
        <p className="text-sm text-muted-foreground">
          3 reports generated this month. Last report: Weekly summary — 10 March
          2026.
        </p>
        <ul className="space-y-1 text-sm">
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Weekly summary</span>
            <span className="text-muted-foreground">10 Mar</span>
          </li>
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Monthly rollup</span>
            <span className="text-muted-foreground">1 Mar</span>
          </li>
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Q1 review</span>
            <span className="text-muted-foreground">28 Feb</span>
          </li>
        </ul>
      </TabsContent>
    </Tabs>
  ),
}

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports" disabled>
          Reports
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <p className="text-sm text-muted-foreground">
          Track progress across all active workstreams.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        <p className="text-sm text-muted-foreground">
          Page views are up 14% this week.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <p className="text-sm text-muted-foreground">
          Track progress across all active workstreams.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        <p className="text-sm text-muted-foreground">
          Page views are up 14% this week.
        </p>
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        <p className="text-sm text-muted-foreground">
          3 reports generated this month.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs
      defaultValue="overview"
      orientation="vertical"
      className="w-full max-w-2xl"
    >
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="px-4">
        <h3 className="text-base font-semibold">Overview</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Track progress across all active workstreams.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="px-4">
        <h3 className="text-base font-semibold">Analytics</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Page views are up 14% this week.
        </p>
      </TabsContent>
      <TabsContent value="reports" className="px-4">
        <h3 className="text-base font-semibold">Reports</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          3 reports generated this month.
        </p>
      </TabsContent>
    </Tabs>
  ),
}
