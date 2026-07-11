import { StaticPageShell, StaticSection } from '@/features/public/components/StaticPageShell';

export function RefundPolicyPage() {
  return (
    <StaticPageShell
      eyebrow="Legals"
      title="All Sales Final — No Refunds"
      intro="Every ticket and table booking on this platform is sold on a strict no-refund basis. Please review your order carefully before paying."
      updated="July 2026"
    >
      <StaticSection heading="The Policy">
        <p>
          <strong>All sales are final.</strong> Once payment is completed, tickets and VIP table bookings cannot be
          refunded, exchanged, or credited — this includes:
        </p>
        <ul>
          <li>Change of mind or inability to attend.</li>
          <li>Lineup, performer, set time, or schedule changes.</li>
          <li>Weather, transport, or other circumstances outside the organizer's control.</li>
          <li>Being refused entry or removed for violating venue or event policies.</li>
          <li>Arriving after doors close or missing the event entirely.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="Why This Policy Exists">
        <p>
          Events sold here have fixed capacity and firm commitments to venues and performers. A no-refund policy keeps
          inventory honest and pricing fair for every attendee. This policy is displayed at checkout, in the site
          footer, and in your confirmation email before and after every purchase.
        </p>
      </StaticSection>
      <StaticSection heading="Can't Attend?">
        <p>
          If your event supports it, you can share individual tickets with friends using the ticket claim flow from
          your <a href="/tickets" className="text-accent-burgundy underline">My Tickets</a> page. The recipient claims the ticket
          into their own account and checks in under their own name.
        </p>
      </StaticSection>
      <StaticSection heading="Cancelled Events">
        <p>
          If an organizer cancels an event outright, the organizer — as seller of record — is responsible for
          communicating remedies to ticket holders. Watch your email and the event page for instructions.
        </p>
      </StaticSection>
      <StaticSection heading="Billing Errors">
        <p>
          Duplicate charges or amounts that don't match your checkout total are billing errors, not refund requests —
          report them via <a href="/contact" className="text-accent-burgundy underline">Contact Support</a> and we will
          investigate promptly.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
