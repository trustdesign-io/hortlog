import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
}

export default meta

type Story = StoryObj<typeof Accordion>

export const SingleOpen: Story = {
  render: () => (
    <Accordion multiple={false} className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included in the Pro plan?</AccordionTrigger>
        <AccordionContent>
          <p>
            The Pro plan includes unlimited projects, priority support, advanced
            analytics, custom domains, and up to 10 team members. Billing is
            monthly or annually with a 20% discount for annual subscriptions.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
        <AccordionContent>
          <p>
            You can cancel at any time from your account settings under Billing.
            Your access will continue until the end of the current billing
            period. We do not offer refunds for partial months.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I switch plans mid-cycle?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes. Upgrades take effect immediately and are prorated to your
            current billing period. Downgrades take effect at the start of your
            next billing cycle.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          <p>
            All new accounts include a 14-day free trial of the Pro plan — no
            credit card required. After the trial ends your account is
            automatically moved to the Free tier unless you add billing details.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const MultipleOpen: Story = {
  render: () => (
    <Accordion multiple className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included in the Pro plan?</AccordionTrigger>
        <AccordionContent>
          <p>
            The Pro plan includes unlimited projects, priority support, advanced
            analytics, custom domains, and up to 10 team members.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
        <AccordionContent>
          <p>
            You can cancel at any time from your account settings under Billing.
            Your access will continue until the end of the current billing
            period.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I switch plans mid-cycle?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes. Upgrades take effect immediately and are prorated. Downgrades
            take effect at the start of your next billing cycle.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          <p>
            All new accounts include a 14-day free trial of the Pro plan — no
            credit card required.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const WithDefaultOpen: Story = {
  render: () => (
    <Accordion
      multiple={false}
      defaultValue={["item-1"]}
      className="w-full max-w-lg"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included in the Pro plan?</AccordionTrigger>
        <AccordionContent>
          <p>
            The Pro plan includes unlimited projects, priority support, advanced
            analytics, custom domains, and up to 10 team members.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
        <AccordionContent>
          <p>
            You can cancel at any time from your account settings under Billing.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          <p>All new accounts include a 14-day free trial of the Pro plan.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const WithDisabledItem: Story = {
  render: () => (
    <Accordion multiple={false} className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included in the Pro plan?</AccordionTrigger>
        <AccordionContent>
          <p>
            The Pro plan includes unlimited projects, priority support, advanced
            analytics, and custom domains.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Enterprise pricing (coming soon)</AccordionTrigger>
        <AccordionContent>
          <p>Enterprise pricing details will be available soon.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          <p>All new accounts include a 14-day free trial of the Pro plan.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
