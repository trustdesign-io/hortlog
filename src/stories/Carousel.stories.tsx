import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const meta: Meta<typeof Carousel> = {
  title: 'UI/Carousel',
  component: Carousel,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center px-16 py-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Carousel>

const slides = [
  {
    id: 1,
    title: 'Build faster',
    description: 'Ship production-ready features in hours, not days.',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    id: 2,
    title: 'Scale confidently',
    description: 'Infrastructure that grows with your team without friction.',
    bg: 'bg-violet-100 dark:bg-violet-950',
  },
  {
    id: 3,
    title: 'Collaborate easily',
    description: 'Role-based access and real-time presence built in.',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: 4,
    title: 'Stay secure',
    description: 'SOC 2 compliant with end-to-end encryption by default.',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
  {
    id: 5,
    title: 'Ship anywhere',
    description: 'Deploy to Vercel, AWS, or self-host — your choice.',
    bg: 'bg-rose-100 dark:bg-rose-950',
  },
]

export const FeatureCards: Story = {
  render: () => (
    <Carousel className="w-full max-w-sm">
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <Card className={slide.bg}>
              <CardHeader>
                <CardTitle role="heading" aria-level={3}>
                  {slide.title}
                </CardTitle>
                <CardDescription>{slide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-24 items-center justify-center rounded-md bg-background/40 text-4xl font-bold text-muted-foreground">
                  {slide.id}
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}

const products = [
  { id: 1, name: 'Starter', price: '$0', description: 'Up to 3 projects, 1 seat.' },
  { id: 2, name: 'Pro', price: '$49/mo', description: 'Unlimited projects, 5 seats.' },
  { id: 3, name: 'Team', price: '$149/mo', description: 'Everything in Pro, 20 seats.' },
  { id: 4, name: 'Enterprise', price: 'Custom', description: 'Dedicated support & SLAs.' },
]

export const ProductShowcase: Story = {
  render: () => (
    <Carousel
      opts={{ align: 'start' }}
      className="w-full max-w-xl"
    >
      <CarouselContent className="-ml-2">
        {products.map((product) => (
          <CarouselItem key={product.id} className="pl-2 basis-1/2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle role="heading" aria-level={3}>
                  {product.name}
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{product.price}</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Carousel orientation="vertical" className="w-64 max-h-72">
      <CarouselContent className="-mt-2 h-72">
        {slides.map((slide) => (
          <CarouselItem key={slide.id} className="pt-2">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{slide.title}</span>
                <span className="text-muted-foreground text-sm">{slide.id} / {slides.length}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}
