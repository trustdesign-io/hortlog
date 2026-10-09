import type { Metadata } from 'next'
import { CookieSettingsButton } from '@/components/cookie-banner'

export const metadata: Metadata = {
  title: 'Privacy notice',
  description: 'How hortlog collects, uses and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl font-medium mb-2">Privacy notice</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: October 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-heading text-xl font-medium mb-3">Who we are</h2>
          <p>
            hortlog is operated by trustdesign. If you have questions about this notice,
            contact us at <a href="mailto:hello@trustdesign.io" className="underline underline-offset-2">hello@trustdesign.io</a>.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-medium mb-3">What data we collect</h2>
          <p>When you create an account or use hortlog we collect:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your email address and display name (account registration)</li>
            <li>Specimen records, work logs, and notes you enter</li>
            <li>Usage data via Google Analytics (see below)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-medium mb-3">Google Analytics</h2>
          <p>
            With your consent, we use Google Analytics 4 to understand how visitors use hortlog.
            Google Analytics sets cookies on your device to track page views and interactions.
            The cookies used are:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>_ga</strong> — distinguishes users; expires after 2 years</li>
            <li><strong>_ga_*</strong> — stores session state; expires after 2 years</li>
          </ul>
          <p className="mt-3">
            We configure Google Analytics with <strong>anonymised IP addresses</strong> and
            do not share your email, name or user ID with Google. Share-link pages and
            invite-acceptance pages are excluded from tracking.
          </p>
          <p className="mt-3">
            Google Analytics data is processed by Google LLC. For details, see{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Google&apos;s privacy policy
            </a>.
          </p>
          <p className="mt-3">
            You can withdraw consent or change your cookie preferences at any time:
          </p>
          <p className="mt-2">
            <CookieSettingsButton />
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-medium mb-3">Legal basis</h2>
          <p>
            We process your account data on the basis of contract (to provide the service
            you signed up for). Analytics cookies are processed on the basis of your consent,
            in compliance with UK GDPR and PECR.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-medium mb-3">Your rights</h2>
          <p>
            Under UK GDPR you have the right to access, correct, or delete your personal
            data, and to object to or restrict processing. To exercise these rights, contact
            us at <a href="mailto:hello@trustdesign.io" className="underline underline-offset-2">hello@trustdesign.io</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
