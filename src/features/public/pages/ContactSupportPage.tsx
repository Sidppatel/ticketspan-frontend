import { Mail, MessageSquareText, LifeBuoy, Ticket, ArrowRight } from 'lucide-react';
import { StaticPageShell } from '@/features/public/components/StaticPageShell';
import { Card, CardContent } from '@/shared/ui/card';

const channels = [
  {
    icon: Mail,
    title: 'Email Support',
    body: 'Best for billing errors, account issues, and anything with a booking reference. We reply within one business day.',
    action: { label: 'support@ticketspan.com', href: 'mailto:support@ticketspan.com' },
  },
  {
    icon: Ticket,
    title: 'Ticket & Booking Issues',
    body: 'Missing tickets, claim links, or QR problems? Check My Tickets first; most issues resolve there.',
    action: { label: 'Go to My Tickets', href: '/tickets' },
  },
  {
    icon: LifeBuoy,
    title: 'Help Center',
    body: 'Search common questions about payments, check-in, and table bookings before waiting on a reply.',
    action: { label: 'Browse Help Center', href: '/help' },
  },
  {
    icon: MessageSquareText,
    title: 'Feedback',
    body: 'Ideas, praise, or something we could do better; feedback goes straight to the team.',
    action: { label: 'Give Feedback', href: '/feedback' },
  },
];

export function ContactSupportPage() {
  return (
    <StaticPageShell
      eyebrow="Support"
      title="Contact Support"
      intro="Pick the channel that fits your issue. Including your booking reference and event name gets you the fastest answer."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {channels.map((channel) => (
          <Card key={channel.title} className="hover:border-primary/40 transition-colors">
            <CardContent className="flex flex-col gap-3 p-6 h-full">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <channel.icon className="size-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">{channel.title}</h2>
              <p className="flex-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">{channel.body}</p>
              <a
                href={channel.action.href}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2 pt-2"
              >
                {channel.action.label} <ArrowRight className="size-3" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-xs sm:text-sm text-muted-foreground space-y-3">
        <h3 className="font-display text-base font-bold text-foreground">Before You Write In</h3>
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
          <li>Include the email address used for the booking.</li>
          <li>Add the event name and date, plus a booking reference if you have one.</li>
          <li>For payment issues, include the charge date and amount (never send full card numbers).</li>
        </ul>
        <p className="pt-2 text-xs border-t border-border/40">
          Remember: all sales are final. Support can assist with billing discrepancies, ticket sharing, and account recovery.
        </p>
      </div>
    </StaticPageShell>
  );
}
