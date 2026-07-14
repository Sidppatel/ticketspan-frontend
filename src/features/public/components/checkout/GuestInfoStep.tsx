import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuth } from '@/shared/auth/useAuth';
import { formatUsPhone } from '@/shared/lib/validation';

export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
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

  const initRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !initRef.current) {
      initRef.current = true;
      onChange({
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || buyerInfo.name,
        email: user.email || buyerInfo.email,
        phone: user.phone || buyerInfo.phone,
      });
    }
  }, [isAuthenticated, user, buyerInfo.name, buyerInfo.email, buyerInfo.phone, onChange]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!buyerInfo.name.trim()) errs.name = 'Full name is required';
    if (!buyerInfo.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(buyerInfo.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!buyerInfo.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (buyerInfo.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Please enter a valid phone number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div>
        <h3 className="text-lg font-black text-white font-display uppercase tracking-tight">Attendee Information</h3>
        <p className="text-xs text-white/50">Enter delivery and billing details for your digital entry passes</p>
      </div>

      { }
      {!isAuthenticated && (
        <div className="bg-accent-gold/10 border border-accent-gold/20 p-4 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-accent-gold">Secure your EntryVine Profile</p>
          <p className="text-white/70 leading-relaxed text-[11px]">
            Create an account to manage your tickets in one place. Guests must enter a valid email to receive entry codes.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={() => {
                window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
              }}
              className="bg-accent-gold hover:bg-accent-gold/90 text-voltage-ink text-[10px] font-black uppercase tracking-wider py-2 h-auto px-3 rounded-lg"
            >
              Sign In / Sign Up
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        { }
        <div className="space-y-1.5">
          <Label htmlFor="buyer_name" className="text-xs font-bold text-white/80 uppercase tracking-wide">Full Name</Label>
          <Input
            id="buyer_name"
            placeholder="John Doe"
            value={buyerInfo.name}
            onChange={(e) => onChange({ ...buyerInfo, name: e.target.value })}
            className="bg-white/5 border-white/10 text-white rounded-xl py-5 focus:border-accent-burgundy"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name_err' : undefined}
          />
          {errors.name && (
            <p id="name_err" className="text-[10px] font-bold text-danger animate-pulse">{errors.name}</p>
          )}
        </div>

        { }
        <div className="space-y-1.5">
          <Label htmlFor="buyer_email" className="text-xs font-bold text-white/80 uppercase tracking-wide">Email Address</Label>
          <Input
            id="buyer_email"
            type="email"
            placeholder="john@example.com"
            value={buyerInfo.email}
            onChange={(e) => onChange({ ...buyerInfo, email: e.target.value })}
            className="bg-white/5 border-white/10 text-white rounded-xl py-5 focus:border-accent-burgundy"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email_err' : undefined}
          />
          {errors.email && (
            <p id="email_err" className="text-[10px] font-bold text-danger animate-pulse">{errors.email}</p>
          )}
        </div>

        { }
        <div className="space-y-1.5">
          <Label htmlFor="buyer_phone" className="text-xs font-bold text-white/80 uppercase tracking-wide">Phone Number</Label>
          <Input
            id="buyer_phone"
            type="tel"
            placeholder="(555) 555-5555"
            value={buyerInfo.phone}
            onChange={(e) => onChange({ ...buyerInfo, phone: formatUsPhone(e.target.value) })}
            className="bg-white/5 border-white/10 text-white rounded-xl py-5 focus:border-accent-burgundy"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone_err' : undefined}
          />
          {errors.phone && (
            <p id="phone_err" className="text-[10px] font-bold text-danger animate-pulse">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          onClick={onBack}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-5 hover:text-white"
        >
          Back
        </Button>
        <Button type="submit" className="flex-1 bg-accent-burgundy hover:bg-accent-burgundy/95 text-white py-5 shadow-lg">
          Proceed to Payment
        </Button>
      </div>
    </form>
  );
}
