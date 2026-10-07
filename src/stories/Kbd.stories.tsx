import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CommandIcon } from 'lucide-react'

import { Kbd, KbdGroup } from '@/components/ui/kbd'

const meta: Meta<typeof Kbd> = {
  title: 'UI/Kbd',
  component: Kbd,
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Kbd>

export const Default: Story = {
  args: { children: 'K' },
}

export const WithIcon: Story = {
  render: () => (
    <Kbd>
      <CommandIcon />
    </Kbd>
  ),
}

export const CommandK: Story = {
  render: () => (
    <KbdGroup>
      <Kbd><CommandIcon /></Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
}

export const CtrlShiftP: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  ),
}

export const SaveShortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd><CommandIcon /></Kbd>
      <Kbd>S</Kbd>
    </KbdGroup>
  ),
}

export const EscapeKey: Story = {
  render: () => <Kbd>Esc</Kbd>,
}

export const EnterKey: Story = {
  render: () => <Kbd>↵</Kbd>,
}

export const CommonShortcuts: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-sm p-4">
      {[
        { label: 'Open command palette', keys: [<CommandIcon key="cmd" />, 'K'] },
        { label: 'Save document', keys: [<CommandIcon key="cmd" />, 'S'] },
        { label: 'Find in file', keys: [<CommandIcon key="cmd" />, 'F'] },
        { label: 'Close tab', keys: [<CommandIcon key="cmd" />, 'W'] },
        { label: 'Undo', keys: [<CommandIcon key="cmd" />, 'Z'] },
      ].map(({ label, keys }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-muted-foreground">{label}</span>
          <KbdGroup>
            {keys.map((key, i) => (
              <Kbd key={i}>{key}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
    </div>
  ),
}
