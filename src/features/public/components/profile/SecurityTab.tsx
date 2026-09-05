import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import {
  KeyRound,
  Mail,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import type { UserProfile } from '@/shared/api/userApi';
import type { AuthUser } from '@/shared/auth/store';

interface SecurityTabProps {
  user: AuthUser | UserProfile | null;
  onRefreshUser?: () => Promise<void>;
}

export function SecurityTab({ user, onRefreshUser }: SecurityTabProps) {
  const [resettingPassword, setResettingPassword] = useState(false);
  const [requestingMagic, setRequestingMagic] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    try {
      toast.info('Password reset requests are currently handled via administrator assistance.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleMagicLink = async () => {
    if (!user?.email) return;
    setRequestingMagic(true);
    try {
      toast.info('Magic links are disabled in OpenIddict mode. Use your password to sign in.');
    } finally {
      setRequestingMagic(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setUnlinkingGoogle(true);
    try {
      toast.info('OAuth provider management is disabled.');
      if (onRefreshUser) await onRefreshUser();
    } finally {
      setUnlinkingGoogle(false);
    }
  };

  return (
    <div className="space-y-8">
      {}
      <div className="border-b border-hairline pb-4">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-brand">
          Account Security
        </span>
        <h2 className="font-display text-2xl font-semibold text-ink">Authentication & Connected Accounts</h2>
        <p className="text-xs text-ink-soft mt-0.5">
          Manage your sign-in credentials, OAuth providers, and security tokens.
        </p>
      </div>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Globe className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Single Sign-On & OAuth Providers</h3>
            <p className="text-xs text-ink-soft">
              Connect external providers for instant 1-click authentication without passwords.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-sunken/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white border border-hairline shadow-xs">
                {}
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-semibold text-ink">Google Account</p>
                  {user?.googleConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" /> Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-mono text-[10px] text-ink-faint">
                      Not Linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-soft">
                  {user?.googleConnected
                    ? 'Your Google credentials can be used for instant sign-in.'
                    : 'Sign in to any partner event page with a single Google tap.'}
                </p>
              </div>
            </div>

            {user?.googleConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={unlinkingGoogle}
                className="h-9 rounded-full border-hairline font-mono text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {unlinkingGoogle ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Unlink Google
              </Button>
            ) : (
              <Badge variant="neutral" className="font-mono text-xs">
                Available at Login
              </Badge>
            )}
          </div>
        </div>
      </section>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Lock className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Password & Passwordless Recovery</h3>
            <p className="text-xs text-ink-soft">
              Trigger instant password resets or receive passwordless magic links.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {}
          <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface-sunken/40 p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-brand" />
                <h4 className="font-display text-sm font-semibold text-ink">Reset Account Password</h4>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Send a secure tokenized password reset link to <strong className="text-ink font-mono">{user?.email}</strong>.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resettingPassword || !user?.email}
              className="h-9 rounded-full font-mono text-xs self-start"
            >
              {resettingPassword ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Mail className="size-3.5 mr-1.5" />}
              Send Password Reset
            </Button>
          </div>

          {}
          <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface-sunken/40 p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-emerald-500" />
                <h4 className="font-display text-sm font-semibold text-ink">Passwordless Magic Link</h4>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Email an instant one-time login link for password-free sign in on any device.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleMagicLink}
              disabled={requestingMagic || !user?.email}
              className="h-9 rounded-full font-mono text-xs self-start"
            >
              {requestingMagic ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Mail className="size-3.5 mr-1.5" />}
              Send Magic Link
            </Button>
          </div>
        </div>
      </section>

      {}
      <section className="rounded-[1.75rem] border border-hairline/80 bg-surface p-6 sm:p-7 shadow-[var(--shadow-e1)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="size-4.5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Single Identity & Cross-Domain Access</h3>
            <p className="text-xs text-ink-soft">
              How your TicketSpan identity seamlessly works across all organizer subdomains.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-sunken/40 p-5 space-y-4 text-xs leading-relaxed text-ink-soft">
          <p>
            TicketSpan operates on a <strong className="text-ink">Unified Attendee Architecture</strong>. Your single profile, QR gate passes, and stored payment receipts are automatically authenticated across all partner box offices without needing separate accounts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-hairline bg-surface p-3 space-y-1">
              <span className="block font-mono text-[10px] uppercase text-ink-faint">Session Protocol</span>
              <span className="font-mono text-xs font-semibold text-ink">gRPC-Web · TLS Encrypted</span>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-3 space-y-1">
              <span className="block font-mono text-[10px] uppercase text-ink-faint">Account UID</span>
              <span className="font-mono text-xs font-semibold text-ink truncate block">
                {user?.usersId ? `${user.usersId.slice(0, 12)}…` : '—'}
              </span>
            </div>
            <div className="rounded-xl border border-hairline bg-surface p-3 space-y-1">
              <span className="block font-mono text-[10px] uppercase text-ink-faint">Multi-Tenant Sync</span>
              <span className="font-mono text-xs font-semibold text-emerald-500">Cross-Cookie Active</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
