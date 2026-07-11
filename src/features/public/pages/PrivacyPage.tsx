import { StaticPageShell, StaticSection } from '@/features/public/components/StaticPageShell';

export function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legals"
      title="Privacy Policy"
      intro="How Svyne collects, uses, and protects your information when you browse events, buy tickets, and attend."
      updated="July 2026"
    >
      <StaticSection heading="1. Information We Collect">
        <ul>
          <li><strong>Account details</strong> — name, email address, and login credentials.</li>
          <li><strong>Booking details</strong> — events, tickets, tables, and amounts paid.</li>
          <li><strong>Payment data</strong> — handled entirely by Stripe; we never see or store full card numbers.</li>
          <li><strong>Check-in records</strong> — when and how your ticket was scanned at an event.</li>
          <li><strong>Technical data</strong> — browser type and basic usage logs used for security and diagnostics.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="2. How We Use It">
        <ul>
          <li>Fulfilling your ticket and table bookings, including QR delivery and check-in.</li>
          <li>Sending transactional emails such as confirmations, invites, and receipts.</li>
          <li>Calculating and remitting applicable sales tax.</li>
          <li>Preventing fraud, duplicate check-ins, and unauthorized ticket transfers.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="3. Sharing With Organizers">
        <p>
          The organizer of an event you book receives the attendee information needed to run that event: your name,
          email, ticket type, and check-in status. Organizers may not use this data for purposes unrelated to their
          event.
        </p>
      </StaticSection>
      <StaticSection heading="4. What We Don't Do">
        <ul>
          <li>We do not sell your personal information.</li>
          <li>We do not share your data with advertisers.</li>
          <li>We do not store payment card details on our servers.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="5. Data Retention">
        <p>
          Booking and tax records are retained as required for financial reporting and legal compliance. Account data
          is kept while your account is active; you may request deletion via support, subject to records we must retain
          by law.
        </p>
      </StaticSection>
      <StaticSection heading="6. Security">
        <p>
          All traffic is encrypted in transit. Access to attendee data is role-restricted — organizers see only their
          own events, and staff see only what check-in requires. Security-relevant actions are audit-logged.
        </p>
      </StaticSection>
      <StaticSection heading="7. Your Rights">
        <p>
          You may access and update your profile at any time from your account page. To request a copy or deletion of
          your data, contact us via the <a href="/contact" className="text-accent-burgundy underline">Contact Support</a> page.
        </p>
      </StaticSection>
      <StaticSection heading="8. Changes to This Policy">
        <p>
          We may revise this policy as the platform evolves. The "Last updated" date above reflects the latest
          revision.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
