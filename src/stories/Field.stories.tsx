import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

const meta: Meta = {
  title: 'UI/Field',
  decorators: [
    (Story) => (
      <div className="p-6 w-96">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj

export const BasicField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" placeholder="johndoe" />
    </Field>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email address</FieldLabel>
      <Input id="email" type="email" placeholder="you@company.com" />
      <FieldDescription>
        We will send a confirmation link to this address.
      </FieldDescription>
    </Field>
  ),
}

export const WithError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="email-invalid">Email address</FieldLabel>
      <Input
        id="email-invalid"
        type="email"
        defaultValue="notanemail"
        aria-invalid
      />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
}

export const WithErrorAndDescription: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <Input
        id="password"
        type="password"
        defaultValue="abc"
        aria-invalid
      />
      <FieldDescription>
        Must be at least 8 characters with a number and symbol.
      </FieldDescription>
      <FieldError>Password is too short.</FieldError>
    </Field>
  ),
}

export const MultipleErrors: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="new-password">New password</FieldLabel>
      <Input
        id="new-password"
        type="password"
        defaultValue="abc"
        aria-invalid
      />
      <FieldError
        errors={[
          { message: 'Must be at least 8 characters.' },
          { message: 'Must contain at least one number.' },
          { message: 'Must contain at least one special character.' },
        ]}
      />
    </Field>
  ),
}

export const HorizontalOrientation: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldTitle>Notifications</FieldTitle>
        <Switch />
      </Field>
      <Field orientation="horizontal">
        <FieldTitle>Marketing emails</FieldTitle>
        <Switch defaultChecked />
      </Field>
    </FieldGroup>
  ),
}

export const TextareaField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="bio">Bio</FieldLabel>
      <Textarea id="bio" placeholder="Tell us about yourself…" />
      <FieldDescription>
        This will appear on your public profile. Max 160 characters.
      </FieldDescription>
    </Field>
  ),
}

export const CheckboxField: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="agree" />
      <FieldContent>
        <FieldTitle>Accept terms and conditions</FieldTitle>
        <FieldDescription>
          By checking this box you agree to our{' '}
          <a href="#">Terms of Service</a> and{' '}
          <a href="#">Privacy Policy</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Personal information</FieldLegend>
      <Field>
        <FieldLabel htmlFor="first-name">First name</FieldLabel>
        <Input id="first-name" placeholder="Jane" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last-name">Last name</FieldLabel>
        <Input id="last-name" placeholder="Smith" />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-email">Email</FieldLabel>
        <Input id="contact-email" type="email" placeholder="jane@example.com" />
        <FieldDescription>Used for account recovery only.</FieldDescription>
      </Field>
    </FieldSet>
  ),
}

export const WithSeparator: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="sep-email">Email</FieldLabel>
        <Input id="sep-email" type="email" placeholder="you@company.com" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="sep-phone">Phone number</FieldLabel>
        <Input id="sep-phone" type="tel" placeholder="+1 555 000 0000" />
      </Field>
    </FieldGroup>
  ),
}
