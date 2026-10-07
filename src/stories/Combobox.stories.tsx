'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from '@/components/ui/combobox'

const meta: Meta = {
  title: 'UI/Combobox',
}

export default meta

type Story = StoryObj

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'solid', label: 'SolidStart' },
  { value: 'qwik', label: 'Qwik City' },
]

export const FrameworkSelect: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('')
    return (
      <div className="w-64">
        <Combobox value={value} onValueChange={(v) => setValue(v ?? '')}>
          <ComboboxInput
            placeholder="Select a framework…"
            showTrigger
            showClear={!!value}
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No framework found.</ComboboxEmpty>
              {frameworks.map((fw) => (
                <ComboboxItem key={fw.value} value={fw.value}>
                  {fw.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  },
}

const countries = [
  { value: 'au', label: 'Australia', region: 'Oceania' },
  { value: 'nz', label: 'New Zealand', region: 'Oceania' },
  { value: 'gb', label: 'United Kingdom', region: 'Europe' },
  { value: 'de', label: 'Germany', region: 'Europe' },
  { value: 'fr', label: 'France', region: 'Europe' },
  { value: 'us', label: 'United States', region: 'North America' },
  { value: 'ca', label: 'Canada', region: 'North America' },
  { value: 'br', label: 'Brazil', region: 'South America' },
  { value: 'jp', label: 'Japan', region: 'Asia' },
  { value: 'sg', label: 'Singapore', region: 'Asia' },
]

const regions = [...new Set(countries.map((c) => c.region))]

export const GroupedCountries: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>('')
    return (
      <div className="w-64">
        <Combobox value={value} onValueChange={(v) => setValue(v ?? '')}>
          <ComboboxInput
            placeholder="Select a country…"
            showTrigger
            showClear={!!value}
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No country found.</ComboboxEmpty>
              {regions.map((region, i) => (
                <React.Fragment key={region}>
                  {i > 0 && <ComboboxSeparator />}
                  <ComboboxGroup>
                    <ComboboxLabel>{region}</ComboboxLabel>
                    {countries
                      .filter((c) => c.region === region)
                      .map((country) => (
                        <ComboboxItem key={country.value} value={country.value}>
                          {country.label}
                        </ComboboxItem>
                      ))}
                  </ComboboxGroup>
                </React.Fragment>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  },
}

export const MultiSelectChips: Story = {
  render: () => {
    const anchor = useComboboxAnchor()
    const [values, setValues] = React.useState<string[]>(['next', 'nuxt'])
    return (
      <div className="w-80">
        <Combobox
          value={values}
          onValueChange={setValues}
          multiple
        >
          <ComboboxChips ref={anchor}>
            {values.map((v) => {
              const fw = frameworks.find((f) => f.value === v)
              return (
                <ComboboxChip key={v}>
                  {fw?.label ?? v}
                </ComboboxChip>
              )
            })}
            <ComboboxChipsInput placeholder="Add framework…" />
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxList>
              <ComboboxEmpty>No framework found.</ComboboxEmpty>
              {frameworks.map((fw) => (
                <ComboboxItem key={fw.value} value={fw.value}>
                  {fw.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  },
}
