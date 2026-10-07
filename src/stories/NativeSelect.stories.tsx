import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof NativeSelect> = {
  title: 'UI/NativeSelect',
  component: NativeSelect,
  decorators: [
    (Story) => (
      <div className="p-4 w-64">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof NativeSelect>

export const Default: Story = {
  render: () => (
    <NativeSelect>
      <NativeSelectOption value="">Select an option</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
  ),
}

export const SizeDefault: Story = {
  render: () => (
    <NativeSelect size="default">
      <NativeSelectOption value="design">Design</NativeSelectOption>
      <NativeSelectOption value="engineering">Engineering</NativeSelectOption>
      <NativeSelectOption value="marketing">Marketing</NativeSelectOption>
    </NativeSelect>
  ),
}

export const SizeSmall: Story = {
  render: () => (
    <NativeSelect size="sm">
      <NativeSelectOption value="design">Design</NativeSelectOption>
      <NativeSelectOption value="engineering">Engineering</NativeSelectOption>
      <NativeSelectOption value="marketing">Marketing</NativeSelectOption>
    </NativeSelect>
  ),
}

export const Disabled: Story = {
  render: () => (
    <NativeSelect disabled>
      <NativeSelectOption value="locked">Locked option</NativeSelectOption>
    </NativeSelect>
  ),
}

export const Invalid: Story = {
  render: () => (
    <NativeSelect aria-invalid>
      <NativeSelectOption value="">Please select a value</NativeSelectOption>
      <NativeSelectOption value="a">Option A</NativeSelectOption>
      <NativeSelectOption value="b">Option B</NativeSelectOption>
    </NativeSelect>
  ),
}

export const WithOptGroups: Story = {
  render: () => (
    <NativeSelect>
      <NativeSelectOption value="">Select a timezone</NativeSelectOption>
      <NativeSelectOptGroup label="North America">
        <NativeSelectOption value="est">
          Eastern Standard Time (EST)
        </NativeSelectOption>
        <NativeSelectOption value="cst">
          Central Standard Time (CST)
        </NativeSelectOption>
        <NativeSelectOption value="pst">
          Pacific Standard Time (PST)
        </NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Europe">
        <NativeSelectOption value="gmt">
          Greenwich Mean Time (GMT)
        </NativeSelectOption>
        <NativeSelectOption value="cet">
          Central European Time (CET)
        </NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="country">Country</Label>
      <NativeSelect id="country">
        <NativeSelectOption value="">Select your country</NativeSelectOption>
        <NativeSelectOption value="au">Australia</NativeSelectOption>
        <NativeSelectOption value="ca">Canada</NativeSelectOption>
        <NativeSelectOption value="nz">New Zealand</NativeSelectOption>
        <NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
        <NativeSelectOption value="us">United States</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
}

export const WithLabelSmall: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="role-sm">Role</Label>
      <NativeSelect id="role-sm" size="sm">
        <NativeSelectOption value="">Select a role</NativeSelectOption>
        <NativeSelectOption value="admin">Admin</NativeSelectOption>
        <NativeSelectOption value="editor">Editor</NativeSelectOption>
        <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
}
