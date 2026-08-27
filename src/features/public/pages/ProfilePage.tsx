import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadProfile, updateProfile, setAvatar, removeAvatar, type ProfileInput } from '@/features/auth/services/authService';
import { uploadImage } from '@/shared/upload';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from 'sonner';
import { useProfilePreferencesStore } from '@/features/public/store/profilePreferencesStore';
import { ProfileHeroCard } from '@/features/public/components/profile/ProfileHeroCard';
import { PersonalInfoTab } from '@/features/public/components/profile/PersonalInfoTab';
import { PreferencesTab } from '@/features/public/components/profile/PreferencesTab';
import { SecurityTab } from '@/features/public/components/profile/SecurityTab';
import { ActivityTab } from '@/features/public/components/profile/ActivityTab';
import { DigitalPassModal } from '@/features/public/components/profile/DigitalPassModal';
import { User, Compass, ShieldCheck, Ticket } from 'lucide-react';

const EMPTY_PROFILE: ProfileInput = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  zip: '',
  bio: '',
  pronouns: '',
  preferencesJson: '',
  billingAddressLine: '',
  billingCity: '',
  billingState: '',
  billingZip: '',
};

type ProfileTab = 'identity' | 'preferences' | 'security' | 'activity';

export function ProfilePage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileInput>(EMPTY_PROFILE);
  const [form, setForm] = useState<ProfileInput>(EMPTY_PROFILE);
  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [digitalPassOpen, setDigitalPassOpen] = useState(false);

  const interestsCount = useProfilePreferencesStore((s) => s.interests.length);

  const fetchProfileData = useCallback(async () => {
    try {
      const loaded = await loadProfile();
      const next: ProfileInput = {
        firstName: loaded.firstName || '',
        lastName: loaded.lastName || '',
        phone: loaded.phone || '',
        addressLine: loaded.addressLine || '',
        city: loaded.city || '',
        state: loaded.state || '',
        zip: loaded.zip || '',
        bio: loaded.bio || '',
        pronouns: loaded.pronouns || '',
        preferencesJson: loaded.preferencesJson || '',
        billingAddressLine: loaded.billingAddressLine || '',
        billingCity: loaded.billingCity || '',
        billingState: loaded.billingState || '',
        billingZip: loaded.billingZip || '',
      };
      setProfile(next);
      setForm(next);

      if (loaded.preferencesJson) {
        try {
          const parsed = JSON.parse(loaded.preferencesJson);
          if (parsed && typeof parsed === 'object') {
            useProfilePreferencesStore.getState().updatePreferences(parsed);
          }
        } catch {
          void 0;
        }
      }
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchProfileData();
    };
    init();
  }, [fetchProfileData]);

  const handleFieldChange = (key: keyof ProfileInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartEditing = () => {
    setForm(profile);
    setActiveTab('identity');
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setForm(profile);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setProfile(form);
      setEditing(false);
      toast.success('Profile successfully updated in database.');
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (prefsJson: string) => {
    const updated = { ...profile, preferencesJson: prefsJson };
    await updateProfile(updated);
    setProfile(updated);
    setForm(updated);
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, 'user', user.usersId);
      await setAvatar(result.imagesId);
      toast.success('Profile avatar updated.');
      await fetchProfileData();
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await removeAvatar();
      toast.success('Profile avatar removed.');
      await fetchProfileData();
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const { logout: authLogout } = await import('@/features/auth/services/authService');
    await authLogout();
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
        <Skeleton className="h-72 w-full rounded-[2.25rem]" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  const tabItems: { id: ProfileTab; label: string; icon: typeof User; badge?: number }[] = [
    { id: 'identity', label: 'Identity & Details', icon: User },
    { id: 'preferences', label: 'Event Preferences', icon: Compass, badge: interestsCount },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'activity', label: 'Wallet & Activity', icon: Ticket },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      {}
      <ProfileHeroCard
        user={user}
        role={role}
        profile={profile}
        uploading={uploading}
        onAvatarUpload={handleAvatarUpload}
        onRemoveAvatar={handleRemoveAvatar}
        onOpenDigitalPass={() => setDigitalPassOpen(true)}
        onStartEditing={handleStartEditing}
        onLogout={handleLogout}
        interestsCount={interestsCount}
      />

      {}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-full border border-hairline bg-surface/80 shadow-[var(--shadow-e1)] backdrop-blur-md">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (editing && tab.id !== 'identity') {
                  setEditing(false);
                }
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-brand text-brand-ink shadow-md'
                  : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand'
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {}
      <div className="rounded-[2.25rem] bg-black/5 p-2 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
        <div className="rounded-[calc(2.25rem-0.5rem)] border border-hairline bg-surface p-6 sm:p-8 md:p-10 shadow-[var(--shadow-e1)]">
          {activeTab === 'identity' && (
            <PersonalInfoTab
              user={user}
              profile={profile}
              form={form}
              editing={editing}
              saving={saving}
              onFieldChange={handleFieldChange}
              onStartEditing={handleStartEditing}
              onCancelEditing={handleCancelEditing}
              onSave={handleSave}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesTab onSavePreferences={handleSavePreferences} />
          )}

          {activeTab === 'security' && (
            <SecurityTab user={user} onRefreshUser={fetchProfileData} />
          )}

          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>

      {}
      <DigitalPassModal
        open={digitalPassOpen}
        onOpenChange={setDigitalPassOpen}
        user={user}
        role={role}
      />
    </div>
  );
}
