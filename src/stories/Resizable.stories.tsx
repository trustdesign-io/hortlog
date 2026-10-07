import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const meta: Meta = {
  title: 'UI/Resizable',
}

export default meta

type Story = StoryObj

export const HorizontalSplit: Story = {
  render: () => (
    <ResizablePanelGroup
      // @ts-expect-error — react-resizable-panels direction prop not reflected in wrapped type
      direction="horizontal"
      className="h-48 w-full max-w-2xl rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Left panel
          </p>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Right panel
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const VerticalSplit: Story = {
  render: () => (
    <ResizablePanelGroup
      // @ts-expect-error — react-resizable-panels direction prop not reflected in wrapped type
      direction="vertical"
      className="h-64 w-full max-w-2xl rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Top panel
          </p>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Bottom panel
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const ThreePanelLayout: Story = {
  render: () => (
    <ResizablePanelGroup
      // @ts-expect-error — react-resizable-panels direction prop not reflected in wrapped type
      direction="horizontal"
      className="h-64 w-full max-w-3xl rounded-lg border"
    >
      <ResizablePanel defaultSize={20} minSize={15}>
        <div className="flex h-full flex-col gap-1 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Sidebar
          </p>
          {['Overview', 'Analytics', 'Reports', 'Settings'].map((item) => (
            <button
              key={item}
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              {item}
            </button>
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={55}>
        {/* @ts-expect-error — react-resizable-panels direction prop not reflected in wrapped type */}
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={65}>
            <div className="flex h-full flex-col gap-2 p-4">
              <p className="text-sm font-semibold">Main content</p>
              <p className="text-sm text-muted-foreground">
                This is the primary content area. Drag the handles to resize
                each panel.
              </p>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35}>
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Detail / preview
              </p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize={15}>
        <div className="flex h-full flex-col gap-2 p-4">
          <p className="text-sm font-semibold">Inspector</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Width</span>
              <span>320px</span>
            </div>
            <div className="flex justify-between">
              <span>Height</span>
              <span>256px</span>
            </div>
            <div className="flex justify-between">
              <span>Opacity</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const WithoutHandleGrip: Story = {
  render: () => (
    <ResizablePanelGroup
      // @ts-expect-error — react-resizable-panels direction prop not reflected in wrapped type
      direction="horizontal"
      className="h-40 w-full max-w-2xl rounded-lg border"
    >
      <ResizablePanel defaultSize={33}>
        <div className="flex h-full items-center justify-center bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Panel A</p>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={34}>
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">Panel B</p>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={33}>
        <div className="flex h-full items-center justify-center bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Panel C</p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
