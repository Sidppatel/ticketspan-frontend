import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { US_STATES, displayUsPhone, formatUsPhone } from '@/shared/lib/validation';
import { toast } from 'sonner';
import {
  User,
  Mail,
  MapPin,
  Pencil,
  Check,
  Copy,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import type { UserProfile, ProfileInput } from '@/shared/api/userApi';
import type { AuthUser } from '@/shared/auth/store';

interface PersonalInfoTabProps {
  user: AuthUser | UserProfile | null;
  profile: ProfileInput;
  form: ProfileInput;
  editing: boolean;
  saving: boolean;
  onFieldChange: (key: keyof ProfileInput, value: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => Promise<void>;
}

export function PersonalInfoTab({
  user,
  profile,
  form,
  editing,
  saving,
  onFieldChange,
  onStartEditing,
  onCancelEditing,
  onSave,
}: PersonalInfoTabProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [separateBilling, setSeparateBilling] = useState(
    Boolean(form.billingAddressLine || form.billingCity || form.billingState || form.billingZip),
  );

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1800);
    }
    toast.success('Copied to clipboard');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!separateBilling) {
      onFieldChange('billingAddressLine', '');
      onFieldChange('billingCity', '');
      onFieldChange('billingState', '');
      onFieldChange('billingZip', '');
    }
    await onSave();
  };

  const addressFormatted = [profile.addressLine, profile.city, profile.state, profile.zip]
    .filter(Boolean)
    .join(', ');

  const billingAddressFormatted = [
    profile.billingAddressLine,
    profile.billingCity,
    profile.billingState,
    profile.billingZip,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
            Profile Details
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink">Personal & Contact Details</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Your identity and billing information across all partner event venues.
          </p>
        </div>

        {!editing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSeparateBilling(
                Boolean(form.billingAddressLine || form.billingCity || form.billingState || form.billingZip),
              );
              onStartEditing();
            }}
            className="self-start sm:self-center h-9 rounded-full border-hairline font-mono text-xs hover:border-brand"
          >
            <Pencil className="mr-1.5 size-3.5 text-brand" /> Edit Info
          </Button>
        ) : null}
      </div>

      {!editing ? (

        <div className="grid gap-4 sm:grid-cols-2">
          {}
          <div className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 shadow-[var(--shadow-e1)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <User className="size-5" />
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">Legal Name</p>
                <p className="font-display text-lg font-semibold text-ink">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-hairline pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink-soft">Pronouns</span>
                <span className="font-medium text-ink">{profile.pronouns || 'Not set'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-ink-soft shrink-0">Bio</span>
                <span className="font-normal text-ink text-right line-clamp-2">
                  {profile.bio || 'Event lover and attendee on TicketSpan.'}
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 shadow-[var(--shadow-e1)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">Primary Email</p>
                  <p className="font-mono text-sm font-semibold text-ink truncate max-w-[200px] sm:max-w-[240px]">
                    {user?.email || '—'}
                  </p>
                </div>
              </div>
              {user?.email && (
                <button
                  type="button"
                  onClick={() => handleCopy(user.email, 'email')}
                  className="flex size-8 items-center justify-center rounded-lg bg-surface-sunken text-ink-soft transition-colors hover:text-ink hover:bg-surface"
                  title="Copy email"
                >
                  {copiedEmail ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              )}
            </div>

            <div className="space-y-3 border-t border-hairline pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink-soft">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-ink">
                    {profile.phone ? displayUsPhone(profile.phone) : 'No phone linked'}
                  </span>
                  {profile.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.phone || '', 'phone')}
                      className="text-ink-soft hover:text-ink"
                      title="Copy phone"
                    >
                      {copiedPhone ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink-soft">Email Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3" /> Verified Identity
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 shadow-[var(--shadow-e1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                  Mailing / Primary Address
                </p>
                <p className="font-display text-base font-semibold text-ink">
                  {addressFormatted || 'No address added'}
                </p>
              </div>
            </div>
            {profile.addressLine && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-hairline pt-3 font-mono text-xs">
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">Street</span>
                  <span className="text-ink font-medium">{profile.addressLine}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">City</span>
                  <span className="text-ink font-medium">{profile.city || '—'}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">State</span>
                  <span className="text-ink font-medium">{profile.state || '—'}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">ZIP</span>
                  <span className="text-ink font-medium">{profile.zip || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 shadow-[var(--shadow-e1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                  Billing Address for Invoices
                </p>
                <p className="font-display text-base font-semibold text-ink">
                  {billingAddressFormatted || (addressFormatted ? 'Same as Mailing Address' : 'Not set')}
                </p>
              </div>
            </div>
            {profile.billingAddressLine && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-hairline pt-3 font-mono text-xs">
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">Street</span>
                  <span className="text-ink font-medium">{profile.billingAddressLine}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">City</span>
                  <span className="text-ink font-medium">{profile.billingCity || '—'}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">State</span>
                  <span className="text-ink font-medium">{profile.billingState || '—'}</span>
                </div>
                <div>
                  <span className="block text-ink-faint text-[10px] uppercase">ZIP</span>
                  <span className="text-ink font-medium">{profile.billingZip || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (

        <form
          onSubmit={handleFormSubmit}
          className="space-y-6 rounded-[2rem] border border-hairline bg-surface p-6 sm:p-8 shadow-[var(--shadow-e2)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="font-mono text-xs uppercase tracking-wider text-ink">
                First Name
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => onFieldChange('firstName', e.target.value)}
                placeholder="e.g. Maya"
                className="h-11 rounded-xl bg-surface-sunken"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="font-mono text-xs uppercase tracking-wider text-ink">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => onFieldChange('lastName', e.target.value)}
                placeholder="e.g. Lin"
                className="h-11 rounded-xl bg-surface-sunken"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wider text-ink">
                Mobile Phone (for SMS Door Passes)
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => onFieldChange('phone', formatUsPhone(e.target.value))}
                placeholder="+1 (555) 000-0000"
                className="h-11 rounded-xl bg-surface-sunken font-mono text-sm"
              />
              <p className="font-mono text-[10.5px] text-ink-soft">
                Used for instant entry barcodes & gate emergency updates.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pronouns" className="font-mono text-xs uppercase tracking-wider text-ink">
                Pronouns (optional)
              </Label>
              <Input
                id="pronouns"
                value={form.pronouns || ''}
                onChange={(e) => onFieldChange('pronouns', e.target.value)}
                placeholder="they/them, she/her, he/him"
                className="h-11 rounded-xl bg-surface-sunken"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="font-mono text-xs uppercase tracking-wider text-ink">
              Bio & Attendee Notes (optional)
            </Label>
            <Textarea
              id="bio"
              value={form.bio || ''}
              onChange={(e) => onFieldChange('bio', e.target.value)}
              placeholder="Tell organizers or friends what kinds of experiences and music you enjoy..."
              rows={3}
              className="rounded-xl bg-surface-sunken text-sm"
            />
          </div>

          {}
          <div className="space-y-4 border-t border-hairline pt-5">
            <h3 className="font-display text-base font-semibold text-ink">Mailing & Primary Address</h3>
            <div className="space-y-1.5">
              <Label htmlFor="addressLine" className="font-mono text-xs uppercase tracking-wider text-ink">
                Street Address
              </Label>
              <Input
                id="addressLine"
                value={form.addressLine}
                onChange={(e) => onFieldChange('addressLine', e.target.value)}
                placeholder="123 Main St, Suite 4B"
                className="h-11 rounded-xl bg-surface-sunken"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="font-mono text-xs uppercase tracking-wider text-ink">
                  City
                </Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => onFieldChange('city', e.target.value)}
                  placeholder="Austin"
                  className="h-11 rounded-xl bg-surface-sunken"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="font-mono text-xs uppercase tracking-wider text-ink">
                  State / Region
                </Label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => onFieldChange('state', e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-hairline bg-surface-sunken px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zip" className="font-mono text-xs uppercase tracking-wider text-ink">
                  ZIP / Postal Code
                </Label>
                <Input
                  id="zip"
                  value={form.zip}
                  onChange={(e) => onFieldChange('zip', e.target.value)}
                  placeholder="78701"
                  className="h-11 rounded-xl bg-surface-sunken font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {}
          <div className="space-y-4 border-t border-hairline pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Separate Billing Address</h3>
                <p className="text-xs text-ink-soft">
                  Enable if your credit card or company billing address differs from your primary address.
                </p>
              </div>
              <Switch
                id="billing-switch"
                checked={separateBilling}
                onCheckedChange={setSeparateBilling}
              />
            </div>

            {separateBilling && (
              <div className="space-y-4 rounded-2xl border border-hairline bg-surface-sunken/40 p-4 sm:p-5 animate-in fade-in-50">
                <div className="space-y-1.5">
                  <Label htmlFor="billingAddressLine" className="font-mono text-xs uppercase tracking-wider text-ink">
                    Billing Street Address
                  </Label>
                  <Input
                    id="billingAddressLine"
                    value={form.billingAddressLine || ''}
                    onChange={(e) => onFieldChange('billingAddressLine', e.target.value)}
                    placeholder="456 Corporate Blvd"
                    className="h-11 rounded-xl bg-surface"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="billingCity" className="font-mono text-xs uppercase tracking-wider text-ink">
                      Billing City
                    </Label>
                    <Input
                      id="billingCity"
                      value={form.billingCity || ''}
                      onChange={(e) => onFieldChange('billingCity', e.target.value)}
                      placeholder="Austin"
                      className="h-11 rounded-xl bg-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billingState" className="font-mono text-xs uppercase tracking-wider text-ink">
                      Billing State
                    </Label>
                    <select
                      id="billingState"
                      value={form.billingState || ''}
                      onChange={(e) => onFieldChange('billingState', e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billingZip" className="font-mono text-xs uppercase tracking-wider text-ink">
                      Billing ZIP
                    </Label>
                    <Input
                      id="billingZip"
                      value={form.billingZip || ''}
                      onChange={(e) => onFieldChange('billingZip', e.target.value)}
                      placeholder="78701"
                      className="h-11 rounded-xl bg-surface font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="flex items-center gap-3 border-t border-hairline pt-5">
            <Button
              type="submit"
              disabled={saving}
              className="h-10 rounded-full px-6 font-mono text-xs font-semibold"
            >
              {saving ? 'Saving Changes…' : 'Save Profile'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onCancelEditing}
              className="h-10 rounded-full px-5 font-mono text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
