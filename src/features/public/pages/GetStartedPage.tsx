import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPlatformLead } from '@/features/public/services/platformLeadService';
import { rpcErrorMessage } from '@/shared/session';
import { formatUsPhone } from '@/shared/lib/validation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export function GetStartedPage() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid = name.trim() && companyName.trim() && phone.trim() && description.trim();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) {
      setError('Fill in your name, company, phone, and what you are looking for.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPlatformLead({ name, companyName, phone, website, description });
      setDone(true);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stage">
      <main className="mx-auto flex max-w-xl flex-col px-4 py-10 md:py-16">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-on-stage">
            EntryVine
          </Link>
          <Link to="/" className="text-sm text-on-stage-soft underline underline-offset-4 hover:text-on-stage">
            Back to events
          </Link>
        </div>

        {done ? (
          <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-e2)]">
            <div className="space-y-3 p-8">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Request received</p>
              <h1 className="font-display text-3xl text-ink">You're on the list</h1>
              <p className="text-ink-soft">
                Thanks, {name.trim()}. We'll reach out to {companyName.trim()} within one business day to set up
                your box office.
              </p>
            </div>
            <div className="entryvine-ticket-edge" style={{ ['--entryvine-notch' as string]: 'var(--stage)' }} />
            <div className="p-6">
              <Link to="/" className="text-sm text-text-link underline underline-offset-4">
                Browse events while you wait
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-surface p-8 shadow-[var(--shadow-e2)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-voltage-ink">Start free</p>
            <h1 className="mt-3 font-display text-3xl text-ink">Tell us about your events</h1>
            <p className="mt-2 text-sm text-ink-soft">
              A specialist sets up your box office and walks you through it. Free, no credit card.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="lead-name">Your name</Label>
                <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-company">Company or organization</Label>
                <Input
                  id="lead-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lead-phone">Phone number</Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatUsPhone(e.target.value))}
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead-website">Website (optional)</Label>
                  <Input
                    id="lead-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="yourvenue.com"
                    autoComplete="url"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-description">What are you looking for?</Label>
                <Textarea
                  id="lead-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Monthly rooftop series, about 300 tickets plus 12 tables per night..."
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting ? 'Sending…' : 'Request my box office'}
              </Button>
              <p className="text-center font-mono text-xs text-ink-faint">We only use this to contact you about EntryVine.</p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
