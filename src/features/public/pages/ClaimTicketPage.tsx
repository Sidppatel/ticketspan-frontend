import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { claimTicket } from '@/features/public/services/ticketService';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { Button } from '@/shared/ui/button';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export function ClaimTicketPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const { user } = useAuth();
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>(token ? 'pending' : 'error');
  const [error, setError] = useState<string | null>(token ? null : 'Missing or invalid invitation token.');

  useEffect(() => {
    if (!token || !user) {
      return;
    }
    let active = true;
    const run = async () => {
      try {
        await claimTicket(token);
        if (active) {
          setStatus('done');
          toast.success('Ticket claimed successfully!', {
            description: 'Your gate entry pass is ready in your tickets wallet.',
          });
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 30, 40]);
          }
        }
      } catch (caught) {
        if (active) {
          setStatus('error');
          setError(rpcErrorMessage(caught));
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token, user]);

  if (token && !user) {
    setReturnTo(`/claim?token=${token}`);
    return (
      <div className="mx-auto mt-16 max-w-md px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
            <Sparkles className="size-8" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
              Invitation Received
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              Claim Your Event Pass
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed">
              You've been invited to attend an event. Sign in or create an account to accept your pass and generate your door entry QR code.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-11 rounded-xl bg-brand text-white font-mono text-xs font-bold shadow-md hover:opacity-90 active:scale-98"
              onClick={() => navigate('/login')}
            >
              Sign In to Claim
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-mono text-xs font-semibold"
              onClick={() => navigate('/register')}
            >
              Create Free Account
            </Button>
          </div>

          <p className="text-[11px] font-mono text-ink-faint flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="size-3.5 text-emerald-500" /> Instant Door Verification
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-4 pb-20">
      <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface p-8 shadow-2xl text-center space-y-6">
        {status === 'pending' && (
          <div className="py-8 space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-surface-sunken text-brand">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">Claiming Your Pass…</h2>
              <p className="text-xs text-ink-soft font-mono">
                Verifying invite token and generating your live entry pass.
              </p>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-5">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-emerald-500 font-bold">
                Pass Activated
              </span>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Ticket Successfully Claimed!
              </h2>
              <p className="text-sm text-ink-soft">
                Your entry ticket has been added to your universal wallet with a live door QR code.
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <Button
                className="w-full h-11 rounded-xl bg-brand text-white font-mono text-xs font-bold shadow-md hover:opacity-90 active:scale-98 gap-1.5"
                onClick={() => navigate('/tickets')}
              >
                <TicketIcon className="size-4" /> View My Gate Passes <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-inner">
              <AlertCircle className="size-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Unable to Claim Ticket
              </h2>
              <p className="text-sm text-destructive">{error || 'This invite link is invalid or has expired.'}</p>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-mono text-xs font-semibold"
                onClick={() => navigate('/tickets')}
              >
                Go to My Tickets
              </Button>
              <Link
                to="/"
                className="text-xs font-mono text-ink-soft hover:text-ink pt-2"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
