import { useState } from 'react';
import {
  GLOBAL_EVENT_CATEGORIES,
  useProfilePreferencesStore,
  type SeatingPreference,
} from '@/features/public/store/profilePreferencesStore';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import {
  Compass,
  Bell,
  Armchair,
  Accessibility,
  Utensils,
  Check,
  Plus,
  Flame,
  Smartphone,
  Mail,
  Save,
} from 'lucide-react';

const SEATING_OPTIONS: { id: SeatingPreference; label: string; desc: string }[] = [
  { id: 'any', label: 'Best Available', desc: 'No seating preference, prioritize best view' },
  { id: 'aisle', label: 'Aisle Preferred', desc: 'Easy entry & exit for fast movement' },
  { id: 'center', label: 'Center Orchestra', desc: 'Direct center acoustic line of sight' },
  { id: 'front_row', label: 'Front Row / Pit', desc: 'Closest to the stage & performer action' },
  { id: 'vip_box', label: 'VIP Box / Mezzanine', desc: 'Elevated luxury lounge seating' },
];

interface PreferencesTabProps {
  onSavePreferences?: (prefsJson: string) => Promise<void>;
}

export function PreferencesTab({ onSavePreferences }: PreferencesTabProps) {
  const [savingCloud, setSavingCloud] = useState(false);
  const store = useProfilePreferencesStore();
  const {
    interests,
    toggleInterest,
    seatingPreference,
    setSeatingPreference,
    accessibilityRequired,
    setAccessibilityRequired,
    accessibilityNotes,
    setAccessibilityNotes,
    smsGatePasses,
    setSmsGatePasses,
    emailReceipts,
    setEmailReceipts,
    dropAlerts,
    setDropAlerts,
    preferredCity,
    setPreferredCity,
    dietaryNotes,
    setDietaryNotes,
  } = store;

  const handleToggleInterest = (cat: string) => {
    toggleInterest(cat);
    const isAdding = !interests.includes(cat);
    toast.success(isAdding ? `Added "${cat}" to interests` : `Removed "${cat}"`);
  };

  const handleCloudSave = async () => {
    if (!onSavePreferences) {
      toast.success('Preferences saved locally.');
      return;
    }
    setSavingCloud(true);
    try {
      const payload = {
        interests: store.interests,
        seatingPreference: store.seatingPreference,
        accessibilityRequired: store.accessibilityRequired,
        accessibilityNotes: store.accessibilityNotes,
        smsGatePasses: store.smsGatePasses,
        emailReceipts: store.emailReceipts,
        dropAlerts: store.dropAlerts,
        weeklyDigest: store.weeklyDigest,
        preferredCity: store.preferredCity,
        dietaryNotes: store.dietaryNotes,
        pronouns: store.pronouns,
        bio: store.bio,
      };
      await onSavePreferences(JSON.stringify(payload));
      toast.success('Experience preferences saved to your account.');
    } catch {
      toast.error('Failed to sync preferences to cloud.');
    } finally {
      setSavingCloud(false);
    }
  };

  return (
    <div className="space-y-8">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
            Personalization Engine
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink">Experience Preferences</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Customize what types of events, seating options, and drop alerts you receive across all partner venues.
          </p>
        </div>

        {onSavePreferences && (
          <Button
            size="sm"
            onClick={handleCloudSave}
            disabled={savingCloud}
            className="self-start sm:self-center h-9 rounded-full px-5 font-mono text-xs font-semibold gap-1.5"
          >
            <Save className="size-3.5" />
            {savingCloud ? 'Saving…' : 'Save Preferences'}
          </Button>
        )}
      </div>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Compass className="size-4.5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Event Interests & Categories</h3>
              <p className="text-xs text-ink-soft">
                Select your favorite experience styles for customized recommendations.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center font-mono text-xs text-brand font-medium">
            {interests.length} selected
          </span>
        </div>

        {}
        <div className="flex flex-wrap gap-2 pt-2">
          {GLOBAL_EVENT_CATEGORIES.map((category) => {
            const isSelected = interests.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleToggleInterest(category)}
                className={`group flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-xs transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-brand text-brand-ink font-semibold shadow-md ring-2 ring-brand/30'
                    : 'bg-surface-sunken text-ink-soft hover:bg-surface-sunken/80 hover:text-ink border border-hairline'
                }`}
              >
                {isSelected ? (
                  <Check className="size-3.5" />
                ) : (
                  <Plus className="size-3.5 opacity-50 group-hover:opacity-100" />
                )}
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <Label htmlFor="preferredCity" className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            Preferred Experience City / Metropolitan Area
          </Label>
          <Input
            id="preferredCity"
            value={preferredCity}
            onChange={(e) => setPreferredCity(e.target.value)}
            placeholder="e.g. Austin, New York, London, Tokyo, Worldwide"
            className="mt-1.5 h-11 max-w-md rounded-xl bg-surface-sunken text-sm"
          />
        </div>
      </section>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Armchair className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Seating & Venue Accommodation</h3>
            <p className="text-xs text-ink-soft">
              Default seating tier applied during fast-checkout reservation selection.
            </p>
          </div>
        </div>

        {}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEATING_OPTIONS.map((opt) => {
            const isCurrent = seatingPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSeatingPreference(opt.id);
                  toast.success(`Seating set to ${opt.label}`);
                }}
                className={`flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  isCurrent
                    ? 'border-2 border-brand bg-brand/5 shadow-md ring-1 ring-brand/20'
                    : 'border border-hairline bg-surface-sunken/60 hover:bg-surface-sunken hover:border-hairline-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-ink">{opt.label}</span>
                  <div
                    className={`size-4 rounded-full border flex items-center justify-center ${
                      isCurrent ? 'border-brand bg-brand' : 'border-hairline bg-surface'
                    }`}
                  >
                    {isCurrent && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {}
        <div className="space-y-4 rounded-2xl border border-hairline bg-surface-sunken/40 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Accessibility className="size-5 text-ink-soft" />
              <div>
                <Label htmlFor="acc-switch" className="font-display text-sm font-semibold text-ink cursor-pointer">
                  ADA Accessible Seating & Step-Free Access
                </Label>
                <p className="text-xs text-ink-soft">
                  Flag ticket selections for wheelchair spaces, hearing loop, or companion seats.
                </p>
              </div>
            </div>
            <Switch
              id="acc-switch"
              checked={accessibilityRequired}
              onCheckedChange={(v) => {
                setAccessibilityRequired(v);
                toast.success(v ? 'Accessibility preferences enabled' : 'Accessibility preference updated');
              }}
            />
          </div>

          {accessibilityRequired && (
            <div className="space-y-1.5 pt-2 animate-in fade-in-50">
              <Label htmlFor="accNotes" className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                Specific Accessibility Instructions for Door Staff
              </Label>
              <Input
                id="accNotes"
                value={accessibilityNotes}
                onChange={(e) => setAccessibilityNotes(e.target.value)}
                placeholder="e.g. Wheelchair ramp required, service animal accompanying"
                className="h-10 rounded-xl bg-surface"
              />
            </div>
          )}
        </div>
      </section>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Bell className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Notifications & Drop Channels</h3>
            <p className="text-xs text-ink-soft">
              Control which direct alerts and secret presale notices you receive.
            </p>
          </div>
        </div>

        <div className="divide-y divide-hairline rounded-2xl border border-hairline bg-surface-sunken/40">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Smartphone className="size-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <Label htmlFor="sms-gate" className="font-display text-sm font-semibold text-ink cursor-pointer">
                  SMS Gate Pass & Door Reminders
                </Label>
                <p className="text-xs text-ink-soft">
                  Receive live entry QR codes via SMS 2 hours before gate opening for zero-delay scanning.
                </p>
              </div>
            </div>
            <Switch
              id="sms-gate"
              checked={smsGatePasses}
              onCheckedChange={(v) => {
                setSmsGatePasses(v);
                toast.success('SMS gate pass preference updated');
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Flame className="size-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <Label htmlFor="drop-alerts" className="font-display text-sm font-semibold text-ink cursor-pointer">
                  Flash Drop & Secret Presale Alerts
                </Label>
                <p className="text-xs text-ink-soft">
                  Get instant priority alerts for sudden performer drop announcements and early-bird tickets.
                </p>
              </div>
            </div>
            <Switch
              id="drop-alerts"
              checked={dropAlerts}
              onCheckedChange={(v) => {
                setDropAlerts(v);
                toast.success('Flash drop alerts updated');
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <Label htmlFor="email-receipts" className="font-display text-sm font-semibold text-ink cursor-pointer">
                  Email Invoices & Order Confirmations
                </Label>
                <p className="text-xs text-ink-soft">
                  Receive PDF receipts with itemized tax summaries for all paid bookings.
                </p>
              </div>
            </div>
            <Switch
              id="email-receipts"
              checked={emailReceipts}
              onCheckedChange={(v) => {
                setEmailReceipts(v);
                toast.success('Receipt preference updated');
              }}
            />
          </div>
        </div>
      </section>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Utensils className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">VIP Hospitality & Dietary Notes</h3>
            <p className="text-xs text-ink-soft">
              Forwarded to venue hosts and catering for VIP tables, festivals, and gala dinners.
            </p>
          </div>
        </div>

        <Textarea
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          placeholder="e.g. Vegetarian, Gluten-Free, Nut Allergy, Sparkling Water preference for VIP Table"
          rows={3}
          className="rounded-xl bg-surface-sunken text-sm"
        />
      </section>
    </div>
  );
}
