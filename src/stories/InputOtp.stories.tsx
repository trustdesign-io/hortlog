import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

const meta: Meta<typeof InputOTP> = {
  title: 'UI/InputOTP',
  component: InputOTP,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof InputOTP>

export const SixDigitOTP: Story = {
  render: () => {
    const [value, setValue] = React.useState('')
    return (
      <div className="flex flex-col items-center gap-4">
        <InputOTP maxLength={6} value={value} onChange={setValue}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-muted-foreground">
          {value ? `Code: ${value}` : 'Enter your 6-digit verification code.'}
        </p>
      </div>
    )
  },
}

export const SixDigitWithSeparator: Story = {
  render: () => {
    const [value, setValue] = React.useState('')
    return (
      <div className="flex flex-col items-center gap-4">
        <InputOTP maxLength={6} value={value} onChange={setValue}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-muted-foreground">
          Enter the code from your authenticator app.
        </p>
      </div>
    )
  },
}

export const FourDigitPIN: Story = {
  render: () => {
    const [value, setValue] = React.useState('')
    return (
      <div className="flex flex-col items-center gap-4">
        <InputOTP maxLength={4} value={value} onChange={setValue}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-muted-foreground">Enter your 4-digit PIN.</p>
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <InputOTP maxLength={6} value="123456" disabled>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
}
