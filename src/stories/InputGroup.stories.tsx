import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  SearchIcon,
  AtSignIcon,
  LinkIcon,
  LockIcon,
  EyeIcon,
  DollarSignIcon,
  PercentIcon,
} from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group'

const meta: Meta<typeof InputGroup> = {
  title: 'UI/InputGroup',
  component: InputGroup,
}

export default meta

type Story = StoryObj<typeof InputGroup>

export const SearchWithIcon: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search projects…" />
    </InputGroup>
  ),
}

export const EmailWithAtSign: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <AtSignIcon />
      </InputGroupAddon>
      <InputGroupInput type="email" placeholder="you@example.com" />
    </InputGroup>
  ),
}

export const UrlWithPrefix: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="your-domain.com" />
    </InputGroup>
  ),
}

export const PasswordWithReveal: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <LockIcon />
      </InputGroupAddon>
      <InputGroupInput type="password" placeholder="Enter password" defaultValue="mysecretpassword" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" variant="ghost" aria-label="Show password">
          <EyeIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const CurrencyAmount: Story = {
  render: () => (
    <InputGroup className="w-48">
      <InputGroupAddon align="inline-start">
        <DollarSignIcon />
      </InputGroupAddon>
      <InputGroupInput type="number" placeholder="0.00" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const PercentInput: Story = {
  render: () => (
    <InputGroup className="w-40">
      <InputGroupInput type="number" placeholder="0" min={0} max={100} />
      <InputGroupAddon align="inline-end">
        <PercentIcon />
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const BlockStartLabel: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="block-start" className="border-b">
        <LinkIcon className="size-4" />
        <span className="text-xs">Website URL</span>
      </InputGroupAddon>
      <InputGroupInput placeholder="https://acme.io" />
    </InputGroup>
  ),
}

export const TextareaWithLabel: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="block-start" className="border-b">
        <span className="text-xs font-medium">Feedback</span>
      </InputGroupAddon>
      <InputGroupTextarea
        placeholder="Tell us what you think…"
        rows={4}
      />
      <InputGroupAddon align="block-end" className="border-t justify-end">
        <InputGroupButton size="xs" variant="default">
          Submit
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const WithActionButton: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupInput placeholder="Enter invite email" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="xs" variant="default">
          Invite
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}
