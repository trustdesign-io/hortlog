import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BarChart2Icon, BookOpenIcon, LayersIcon, ShieldIcon, ZapIcon } from 'lucide-react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const meta: Meta<typeof NavigationMenu> = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  decorators: [
    (Story) => (
      <div className="flex min-h-40 items-start justify-center pt-8">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof NavigationMenu>

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-1 p-1 md:w-80">
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <LayersIcon />
                    Platform
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Build and ship products faster with our unified platform.
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <ZapIcon />
                    Automations
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Automate repetitive workflows without writing code.
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <BarChart2Icon />
                    Analytics
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Real-time dashboards and reports for every team.
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-1 p-1 md:w-72">
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldIcon />
                    Enterprise
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Security, compliance, and dedicated support for large teams.
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <ZapIcon />
                    Startups
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Move fast with generous free tiers and startup credits.
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-1 p-1 md:w-64">
              <li>
                <NavigationMenuLink href="#" className="flex-col items-start gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <BookOpenIcon />
                    Getting started
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Set up your first project in under 5 minutes.
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">API reference</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">Changelog</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

export const SimpleLinks: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            About
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Blog
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}
