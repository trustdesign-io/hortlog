import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HeroSection } from '@/components/landing/hero-section'

const SampleHeading = (
  <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight mb-6">
    A living record for botanical collections
  </h1>
)

const SampleBody = (
  <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto">
    hortlog gives every specimen its own page — identification, provenance,
    conservation status — readable from a QR code at the vantage point,
    however far back the plant is planted.
  </p>
)

const SampleActions = (
  <div className="flex flex-col sm:flex-row gap-3 justify-center">
    <button className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
      Sign up
    </button>
    <button className="inline-flex items-center justify-center rounded-md border border-input px-8 py-3 text-sm font-medium">
      Sign in
    </button>
  </div>
)

const meta: Meta<typeof HeroSection> = {
  title: 'Landing/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    heading: SampleHeading,
    body: SampleBody,
    actions: SampleActions,
  },
}

export default meta

type Story = StoryObj<typeof HeroSection>

export const NoMedia: Story = {}

export const WithImage: Story = {
  args: {
    backgroundMedia: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1440&q=80',
      alt: 'A formal garden with hedgerows and specimen trees',
      sizes: '100vw',
    },
  },
}

export const WithVideo: Story = {
  args: {
    backgroundMedia: {
      type: 'video',
      src: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1440&q=80',
    },
  },
}
