import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatUsPhone } from '@/shared/lib/validation';
import { BrandLockup } from '@/shared/brand/BrandMark';
import { useLandingStore } from '@/features/public/hooks/landingStore';
import { ArrowUpRight, CheckCircle2, ShieldCheck, Mail, MapPin } from 'lucide-react';

const formFields = [
  { name: 'name', label: 'Your Full Name', placeholder: 'Siddh Patel', type: 'text', half: false },
  { name: 'email', label: 'Email Address', placeholder: 'siddh@example.com', type: 'email', half: true },
  { name: 'phone', label: 'Phone Number', placeholder: '+1 (251) 555-0142', type: 'tel', half: true },
  { name: 'venue', label: 'Venue or Event Name', placeholder: 'Skyline Terrace', type: 'text', half: true },
  { name: 'city', label: 'City & State', placeholder: 'Mobile, AL', type: 'text', half: true },
] as const;

type LeadForm = { name: string; email: string; phone: string; venue: string; city: string };
const emptyForm: LeadForm = { name: '', email: '', phone: '', venue: '', city: '' };

const steps = [
  { step: '01', title: 'Claim Subdomain', desc: 'Choose your vanity address.' },
  { step: '02', title: 'Set Branding', desc: 'Upload your logo and colors.' },
  { step: '03', title: 'Connect Stripe', desc: 'Direct bank rolling payouts.' },
  { step: '04', title: 'Publish & Sell', desc: 'Draft tiers and open doors.' },
];

export function ClosingCta() {
  const heroVenue = useLandingStore((s) => s.venueName);
  const [values, setValues] = useState<LeadForm>({ ...emptyForm, venue: heroVenue.trim() });
  const venueTouched = useRef(false);

  useEffect(() => {
    if (!venueTouched.current) setValues((prev) => ({ ...prev, venue: heroVenue.trim() }));
  }, [heroVenue]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const venue = values.venue.trim();
    const city = values.city.trim();

    if (!name) {
      setError('Please provide your name.');
      return;
    }
    if (!email && !phone) {
      setError('Please enter either an email or phone number so we can reach you.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { createPlatformLead } = await import('@/features/public/services/platformLeadService');
      await createPlatformLead({
        name,
        companyName: venue || name,
        phone: phone || email,
        website: '',
        description: `Platform registration inquiry. Email: ${email} | Phone: ${phone} | City: ${city} | Venue: ${venue}`,
      });
      setSent(true);
    } catch (caught) {
      const { rpcErrorMessage } = await import('@/shared/session');
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="start" className="scroll-mt-20 pt-10 sm:pt-14 md:pt-16 bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-5 sm:p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-(--lp-green)">
              Get Started In Minutes
            </span>
            <h2 className="mt-2.5 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--lp-ink)">
              Create your branded box office.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-(--lp-ink-soft) leading-relaxed">
              No credit card required. Enter your details below and we&rsquo;ll provision your custom box office portal within minutes.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 border-y border-stone-100 py-4 sm:py-5">
            {steps.map((item) => (
              <div key={item.step} className="flex flex-col">
                <span className="font-mono text-[11px] sm:text-xs font-bold text-(--lp-green)">{item.step}</span>
                <h4 className="font-semibold text-xs sm:text-sm text-(--lp-ink) mt-0.5">{item.title}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>

          {sent ? (
            <div className="mt-8 rounded-2xl bg-emerald-50 p-6 sm:p-8 text-center border border-emerald-200">
              <div className="flex justify-center text-(--lp-green)">
                <CheckCircle2 className="size-9 sm:size-10" />
              </div>
              <h3 className="mt-3 text-xl sm:text-2xl font-bold text-(--lp-ink)">Your request is received.</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-(--lp-ink-soft) max-w-md mx-auto">
                Thank you. We&rsquo;ll review your venue details and send your personalized box office activation link directly to your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" noValidate>
              <div className="grid gap-x-4 sm:gap-x-6 gap-y-4 sm:grid-cols-2">
                {formFields.map((field) => (
                  <div key={field.name} className={field.half ? '' : 'sm:col-span-2'}>
                    <label htmlFor={`field-${field.name}`} className="block font-mono text-[11px] sm:text-xs font-semibold uppercase text-stone-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      id={`field-${field.name}`}
                      type={field.type}
                      name={field.name}
                      autoComplete={field.name === 'venue' ? 'organization' : field.name === 'city' ? 'address-level2' : field.name === 'phone' ? 'tel' : field.name}
                      value={values[field.name]}
                      onChange={(e) => {
                        if (field.name === 'venue') venueTouched.current = true;
                        setValues((prev) => ({
                          ...prev,
                          [field.name]: field.name === 'phone' ? formatUsPhone(e.target.value) : e.target.value,
                        }));
                      }}
                      placeholder={field.placeholder}
                      className="lp-input text-xs sm:text-sm"
                    />
                  </div>
                ))}
              </div>

              {error ? (
                <p className="rounded-lg bg-rose-50 p-2.5 sm:p-3 text-xs font-medium text-rose-700 border border-rose-200" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-(--lp-green) text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-(--lp-green-soft) transition-all active:scale-98 disabled:opacity-50"
              >
                <span>{submitting ? 'Submitting...' : 'Open Your Box Office'}</span>
                <ArrowUpRight className="size-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500 font-mono">
                <ShieldCheck className="size-3.5 sm:size-4 text-(--lp-green)" />
                <span>Zero card required · Cancel anytime</span>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="mt-12 sm:mt-16 border-t border-stone-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 md:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-4">
            <div className="space-y-2.5 md:col-span-2">
              <BrandLockup tone="ink" />
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm">
                Direct-to-fan white-label ticketing for independent music venues, supper clubs, theaters, and event organizers.
              </p>
              <p className="font-mono text-xs text-stone-500 flex items-center gap-1 pt-0.5">
                <MapPin className="size-3.5 text-stone-400" />
                <span>Crafted in Chickasaw, Alabama</span>
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">Platform</h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                <li><a href="#features" className="hover:text-stone-900">Features</a></li>
                <li><a href="#calculator" className="hover:text-stone-900">Fee Calculator</a></li>
                <li><a href="#pricing" className="hover:text-stone-900">Pricing</a></li>
                <li><a href="#showcase" className="hover:text-stone-900">Showcase</a></li>
                <li><a href="#specs" className="hover:text-stone-900">Specs</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">Support & Legal</h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                <li><Link to="/help" className="hover:text-stone-900">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-stone-900">Contact Team</Link></li>
                <li><Link to="/terms" className="hover:text-stone-900">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-stone-900">Privacy Policy</Link></li>
                <li>
                  <a href="mailto:support@ticketspan.com" className="hover:text-stone-900 flex items-center gap-1">
                    <Mail className="size-3" />
                    <span>support@ticketspan.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 text-xs text-stone-500 font-mono">
            <p>© {new Date().getFullYear()} TicketSpan. All rights reserved.</p>
            <p>Direct payments routed via Stripe Connect</p>
          </div>
        </div>
      </footer>
    </section>
  );
}
