import { useEffect, useState } from 'react';
import { loadProfile, updateProfile, setAvatar, type ProfileInput } from '@/features/auth/services/authService';
import { uploadImage } from '@/shared/upload';
import { useAuth } from '@/shared/auth/useAuth';
import { roleLabel } from '@/shared/roles';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const EMPTY: ProfileInput = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  zip: '',
};

export function ProfilePage() {
  const { user, role } = useAuth();
  const [form, setForm] = useState<ProfileInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadProfile()
      .then((profile) =>
        setForm({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          addressLine: profile.addressLine,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
        }),
      )
      .catch((caught) => setError(rpcErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, []);

  function field(key: keyof ProfileInput) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateProfile(form);
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

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatar">Profile picture</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => onAvatar(e.target.files?.[0])}
              />
              {uploading ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Email: {user?.email}</p>
            <p>Role: {roleLabel(role)}</p>
            <p>Tenant: {user?.tenantSlug || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="First name" value={form.firstName} onChange={field('firstName')} />
            <Labeled label="Last name" value={form.lastName} onChange={field('lastName')} />
          </div>
          <Labeled label="Phone (optional)" value={form.phone} onChange={field('phone')} />
          <Labeled label="Address (optional)" value={form.addressLine} onChange={field('addressLine')} />
          <div className="grid grid-cols-3 gap-3">
            <Labeled label="City" value={form.city} onChange={field('city')} />
            <Labeled label="State" value={form.state} onChange={field('state')} />
            <Labeled label="Zip" value={form.zip} onChange={field('zip')} />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-success">{notice}</p> : null}
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
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
