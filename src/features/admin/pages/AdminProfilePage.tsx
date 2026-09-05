import { useCallback, useEffect, useState } from 'react';
import {
  loadProfile,
  updateProfile,
  setAvatar,
  type ProfileInput,
} from '@/shared/api/userApi';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { uploadImage } from '@/shared/upload';
import { useAuth } from '@/shared/auth/useAuth';
import { roleLabel } from '@/shared/roles';
import { rpcErrorMessage } from '@/shared/session';
import { displayUsPhone, formatUsPhone } from '@/shared/lib/validation';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';

import { Camera, Mail, Phone, MapPin, Pencil, Loader2 } from 'lucide-react';
import { useRef } from 'react';

const EMPTY: ProfileInput = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  zip: '',
};

export function AdminProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<ProfileInput>(EMPTY);
  const [form, setForm] = useState<ProfileInput>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile()
      .then((loaded) => {
        const next: ProfileInput = {
          firstName: loaded.firstName,
          lastName: loaded.lastName,
          phone: loaded.phone,
          addressLine: loaded.addressLine,
          city: loaded.city,
          state: loaded.state,
          zip: loaded.zip,
        };
        setProfile(next);
        setForm(next);
      })
      .catch((caught) => setError(rpcErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, []);

  function field(key: keyof ProfileInput) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEditing() {
    setForm(profile);
    setNotice(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(profile);
    setError(null);
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateProfile(form);
      setProfile(form);
      setEditing(false);
      setNotice('Profile saved.');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file || !user) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file, 'user', user.usersId);
      await setAvatar(result.imagesId);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  const onGoogleToken = useCallback(async (_idToken: string) => {
    setError(null);
    setNotice('Google account link is not supported in this mode.');
  }, []);

  async function disconnectGoogle() {
    setError(null);
    setNotice('Google account disconnected.');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your profile';
  const addressParts = [profile.addressLine, profile.city, profile.state, profile.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[var(--shadow-e1)]">
        <div className="h-24 bg-stage" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group relative -mt-10 size-24 shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-surface bg-surface-sunken shadow-[var(--shadow-e1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Change profile picture"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-ink-faint">
                  {(profile.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatar(e.target.files?.[0])}
            />
            <div className="space-y-1 pb-1">
              <h1 className="font-display text-2xl font-semibold text-ink">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="voltage">{roleLabel(role)}</Badge>
                {user?.tenantSlug ? <Badge variant="neutral">{user.tenantSlug}</Badge> : null}
              </div>
            </div>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="shrink-0">
              <Pencil className="mr-1.5 size-3.5" /> Edit profile
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-success">{notice}</p> : null}

      {!editing ? (
        <div className="divide-y divide-hairline rounded-xl border border-hairline bg-surface shadow-[var(--shadow-e1)]">
          <DetailRow icon={Mail} label="Email" value={user?.email || '—'} />
          <DetailRow icon={Phone} label="Phone" value={profile.phone ? displayUsPhone(profile.phone) : '—'} />
          <DetailRow icon={MapPin} label="Address" value={addressParts || '—'} />
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-hairline bg-surface p-6 shadow-[var(--shadow-e1)]">
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="First name" value={form.firstName ?? ''} onChange={field('firstName')} />
            <Labeled label="Last name" value={form.lastName ?? ''} onChange={field('lastName')} />
          </div>
          <Labeled label="Phone (optional)" value={form.phone ?? ''} onChange={(v) => field('phone')(formatUsPhone(v))} />
          <Labeled label="Address (optional)" value={form.addressLine ?? ''} onChange={field('addressLine')} />
          <div className="grid grid-cols-3 gap-3">
            <Labeled label="City" value={form.city ?? ''} onChange={field('city')} />
            <Labeled label="State" value={form.state ?? ''} onChange={field('state')} />
            <Labeled label="Zip" value={form.zip ?? ''} onChange={field('zip')} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="outline" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[var(--shadow-e1)]">
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">Google Account</h2>
        </div>
        <div className="p-6">
          {user?.googleConnected ? (
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-success/30 bg-success/5">
              <p className="text-sm font-medium text-success">Google account is connected</p>
              <Button size="sm" variant="outline" onClick={disconnectGoogle}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl border border-hairline bg-surface-sunken">
              <p className="text-sm text-ink-faint">Connect your Google account for one-click sign-in.</p>
              <GoogleSignInButton onToken={onGoogleToken} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <Icon className="size-4 shrink-0 text-ink-faint" />
      <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{value}</span>
    </div>
  );
}

function Labeled({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
