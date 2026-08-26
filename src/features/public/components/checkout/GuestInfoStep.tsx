import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuth } from '@/shared/auth/useAuth';
import { formatUsPhone } from '@/shared/lib/validation';
import { getUniversalLoginUrl } from '@/shared/subdomain';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
  billingZip?: string;
  billingAddressLine?: string;
  billingCity?: string;
  billingState?: string;
}

interface GuestInfoStepProps {
  buyerInfo: BuyerInfo;
  onChange: (info: BuyerInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GuestInfoStep({ buyerInfo, onChange, onNext, onBack }: GuestInfoStepProps) {
  const { isAuthenticated, user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const initRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !initRef.current) {
      initRef.current = true;
      const bZip = user.billingZip || user.zip || '';
      const bLine = user.billingAddressLine || user.addressLine || '';
      const bCity = user.billingCity || user.city || '';
      const bState = user.billingState || user.state || '';

      onChange({
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || buyerInfo.name,
        email: user.email || buyerInfo.email,
        phone: user.phone || buyerInfo.phone,
        billingZip: bZip || buyerInfo.billingZip,
        billingAddressLine: bLine || buyerInfo.billingAddressLine,
        billingCity: bCity || buyerInfo.billingCity,
        billingState: bState || buyerInfo.billingState,
      });
    }
  }, [isAuthenticated, user, buyerInfo, onChange]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!buyerInfo.name.trim()) errs.name = 'Full name is required';
    if (!buyerInfo.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(buyerInfo.email)) {
      errs.email = 'Please enter a valid email address';
    }
    
    // Phone number is optional
    if (buyerInfo.phone.trim()) {
      const digits = buyerInfo.phone.replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 10) {
        errs.phone = 'Please enter a valid 10-digit phone number';
      }
    }


    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFieldChange = (field: keyof BuyerInfo, value: string) => {
    onChange({ ...buyerInfo, [field]: value });
    
    // Clear validation error dynamically if the field becomes valid
    if (errors[field]) {
      const errs = { ...errors };
      if (field === 'name') {
        if (value.trim()) delete errs.name;
      } else if (field === 'email') {
        if (value.trim() && /\S+@\S+\.\S+/.test(value)) delete errs.email;
      } else if (field === 'phone') {
        const digits = value.replace(/\D/g, '');
        if (!value.trim() || digits.length >= 10) delete errs.phone;
      }
      setErrors(errs);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
    });
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-1">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
            1
          </span>
          <h3 className="font-sans text-base font-bold text-white tracking-tight">
            Attendee & Delivery Details
          </h3>
        </div>
        <p className="text-xs text-white/60 pl-8">
          Digital entry passes and booking receipts will be dispatched instantly to this email.
        </p>
      </div>

      {/* Authenticated Fast Fill Badge or Guest Notice */}
      {isAuthenticated && user ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-white truncate">Profile autofill active</p>
              <p className="text-[11px] text-white/60 truncate font-mono">{user.email}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
            Verified
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Sparkles className="size-3.5" /> Have a TicketSpan Account?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = getUniversalLoginUrl(window.location.href);
              }}
              className="h-7 rounded-lg border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider"
            >
              Sign In
            </Button>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            Signing in automatically saves tickets to your account for 1-click door entry.
          </p>
        </div>
      )}

      {/* Form Fields Card */}
      <div className="rounded-2xl border border-white/10 bg-[#131722] p-4 sm:p-5 space-y-4 shadow-inner">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="buyer_name" className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
            <User className="size-3.5 text-amber-400" /> Full Name
          </Label>
          <div className="relative">
            <Input
              id="buyer_name"
              placeholder="e.g. Eleanor Vance"
              value={buyerInfo.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={cn(
                'h-11 bg-[#0c0f17] border-white/15 text-white rounded-xl px-3.5 text-sm transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400',
                errors.name && touched.name && 'border-danger/80 focus:border-danger focus:ring-danger',
              )}
              aria-invalid={!!errors.name}
            />
          </div>
          {errors.name && touched.name && (
            <p className="text-[11px] font-bold text-danger animate-in fade-in-50">{errors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <Label htmlFor="buyer_email" className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
            <Mail className="size-3.5 text-amber-400" /> Email Address
          </Label>
          <div className="relative">
            <Input
              id="buyer_email"
              type="email"
              placeholder="eleanor@example.com"
              value={buyerInfo.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={cn(
                'h-11 bg-[#0c0f17] border-white/15 text-white rounded-xl px-3.5 text-sm transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono',
                errors.email && touched.email && 'border-danger/80 focus:border-danger focus:ring-danger',
              )}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && touched.email && (
            <p className="text-[11px] font-bold text-danger animate-in fade-in-50">{errors.email}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="buyer_phone" className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
              <Phone className="size-3.5 text-amber-400" /> Phone Number
            </Label>
            <span className="text-[10px] text-slate-400 font-mono">Optional</span>
          </div>
          <Input
            id="buyer_phone"
            type="tel"
            placeholder="(555) 000-0000"
            value={buyerInfo.phone}
            onChange={(e) => handleFieldChange('phone', formatUsPhone(e.target.value))}
            onBlur={() => handleBlur('phone')}
            className={cn(
              'h-11 bg-[#0c0f17] border-white/15 text-white rounded-xl px-3.5 text-sm transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono',
              errors.phone && touched.phone && 'border-danger/80 focus:border-danger focus:ring-danger',
            )}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && touched.phone && (
            <p className="text-[11px] font-bold text-danger animate-in fade-in-50">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Security Assurance Callout */}
      <div className="flex items-center gap-2 px-1 text-[11.5px] text-white/60">
        <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
        <span>Your information is encrypted and never sold or shared with 3rd parties.</span>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 px-5 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold"
        >
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>

        <Button
          type="submit"
          className="flex-1 ticketspan-spring-btn h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 gap-2"
        >
          Continue to Payment <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
