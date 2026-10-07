import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Logo, DEFAULT_BRAND_NAME } from './logo'

export interface FooterNavColumn {
  heading: string
  links: { label: string; href: string }[]
}

export interface SocialLink {
  label: string
  href: string
  /** Inline SVG path data for the icon */
  icon: ReactNode
}

interface FooterProps {
  siteName?: string
  tagline?: string
  navColumns?: FooterNavColumn[]
  socialLinks?: SocialLink[]
  className?: string
}

const DEFAULT_NAV_COLUMNS: FooterNavColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

export function Footer({
  siteName,
  tagline = 'Built with trustdesign starter.',
  navColumns = DEFAULT_NAV_COLUMNS,
  socialLinks = [],
  className,
}: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        {/* Top row: logo + nav columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1fr_repeat(3,auto)] lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Logo name={siteName} />
            {tagline && (
              <p className="text-sm text-muted-foreground max-w-xs">{tagline}</p>
            )}
            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nav columns */}
          {navColumns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={`${col.heading}:${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row: copyright */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {year} {siteName ?? DEFAULT_BRAND_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
