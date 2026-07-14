import { StaticPageShell, StaticSection } from '@/features/public/components/StaticPageShell';

export function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legals"
      title="Terms of Service"
      intro="These terms govern your use of the EntryVine box office platform, including ticket purchases, table bookings, and event check-in services."
      updated="July 2026"
    >
      <StaticSection heading="1. Acceptance of Terms">
        <p>
          By accessing this site, creating an account, or purchasing a ticket or table booking, you agree to be bound by
          these Terms of Service. If you do not agree, do not use the platform.
        </p>
      </StaticSection>
      <StaticSection heading="2. The Platform">
        <p>
          EntryVine provides ticketing and box office technology on behalf of independent event organizers. The organizer
          named on each event page (not EntryVine) is the seller of record, host of the event, and responsible for the
          event taking place as described.
        </p>
      </StaticSection>
      <StaticSection heading="3. Tickets & Bookings">
        <ul>
          <li>A ticket or table booking is a revocable license to attend the specified event.</li>
          <li>Tickets are valid only when purchased through this platform or claimed via an official invite link.</li>
          <li>Each ticket admits one person once; QR codes are voided at check-in.</li>
          <li>Unauthorized resale, duplication, or transfer outside the platform's claim flow voids the ticket without refund.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="4. Pricing, Fees & Taxes">
        <p>
          Prices, service fees, and applicable sales tax are displayed before you confirm payment. The total shown at
          checkout is the full amount charged. Payment is processed securely by Stripe; EntryVine does not store your card
          details.
        </p>
      </StaticSection>
      <StaticSection heading="5. All Sales Final">
        <p>
          <strong>All sales are final.</strong> Tickets and table bookings are non-refundable and non-exchangeable,
          including for non-attendance. See our <a href="/refund-policy" className="text-accent-burgundy underline">No Refunds policy</a> for
          full details.
        </p>
      </StaticSection>
      <StaticSection heading="6. Entry & Conduct">
        <ul>
          <li>Admission is subject to the venue's age, dress code, and capacity policies.</li>
          <li>The organizer or venue may refuse entry or remove attendees for unsafe or disruptive behavior, without refund.</li>
          <li>Valid photo ID may be required at check-in for age-restricted events.</li>
        </ul>
      </StaticSection>
      <StaticSection heading="7. Event Changes">
        <p>
          Organizers may change lineups, performers, set times, or venue details. Such changes do not entitle you to a
          refund. If an event is cancelled outright, the organizer is responsible for communicating next steps to
          ticket holders.
        </p>
      </StaticSection>
      <StaticSection heading="8. Accounts">
        <p>
          You are responsible for the accuracy of your account details and for safeguarding your login. Tickets claimed
          to your account are tied to your identity and may be checked against ID at the door.
        </p>
      </StaticSection>
      <StaticSection heading="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, EntryVine's liability to you for any claim arising out of the platform is
          limited to the amount you paid for the affected booking. EntryVine is not liable for the acts or omissions of
          organizers, venues, or performers.
        </p>
      </StaticSection>
      <StaticSection heading="10. Changes to These Terms">
        <p>
          We may update these terms from time to time. Continued use of the platform after an update constitutes
          acceptance. Material changes will be highlighted on this page.
        </p>
      </StaticSection>
      <StaticSection heading="11. Contact">
        <p>
          Questions about these terms? Reach us via the <a href="/contact" className="text-accent-burgundy underline">Contact Support</a> page.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
