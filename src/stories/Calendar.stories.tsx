'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
}

export default meta

type Story = StoryObj<typeof Calendar>

export const Default: Story = {
  render: () => <Calendar />,
}

export const SelectedDate: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(
      new Date(2025, 2, 14)
    )
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
      />
    )
  },
}

export const RangeSelection: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | undefined>({
      from: new Date(2025, 2, 10),
      to: new Date(2025, 2, 18),
    })
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
      />
    )
  },
}

export const DisabledDates: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>()
    const disabledDays = [
      new Date(2025, 2, 3),
      new Date(2025, 2, 7),
      new Date(2025, 2, 15),
      new Date(2025, 2, 22),
      { dayOfWeek: [0, 6] as [number, number] },
    ]
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={disabledDays}
        defaultMonth={new Date(2025, 2)}
      />
    )
  },
}

export const DropdownCaption: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        captionLayout="dropdown"
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2030, 11)}
      />
    )
  },
}
