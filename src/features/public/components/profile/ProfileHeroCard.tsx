import { useRef, useState } from 'react';
import { roleLabel } from '@/shared/roles';
import { Button } from '@/shared/ui/button';
import {
  Camera,
  Loader2,
  Sparkles,
  QrCode,
  Pencil,
  CheckCircle2,
  CircleDashed,
  LogOut,
  MapPin,
  Mail,
  Phone,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import type { UserProfile } from '@/shared/proto/auth';
import type { ProfileInput } from '@/features/auth/services/authService';

interface ProfileHeroCardProps {
  user: UserProfile | null;
  role: number;
  profile: ProfileInput;
  uploading: boolean;
  onAvatarUpload: (file: File | undefined) => void;
  onRemoveAvatar: () => void;
  onOpenDigitalPass: () => void;
  onStartEditing: () => void;
  onLogout: () => void;
  interestsCount: number;
}

export function ProfileHeroCard({
  user,
  role,
  profile,
  uploading,
  onAvatarUpload,
  onRemoveAvatar,
  onOpenDigitalPass,
  onStartEditing,
  onLogout,
  interestsCount,
}: ProfileHeroCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Attendee Profile';

  const items = [
    { label: 'Name added', done: Boolean(profile.firstName && profile.lastName) },
    { label: 'Avatar set', done: Boolean(user?.avatarUrl && !imageError) },
    { label: 'Phone registered', done: Boolean(profile.phone) },
    { label: 'Address provided', done: Boolean(profile.addressLine && profile.city) },
    { label: 'Bio / Notes', done: Boolean(profile.bio || profile.pronouns) },
    { label: 'Interests curated', done: interestsCount > 0 },
  ];
  const completedCount = items.filter((i) => i.done).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  const memberId = user?.usersId
    ? `TS-${user.usersId.slice(0, 6).toUpperCase()}`
    : 'Digital Pass';

  const hasValidAvatar = Boolean(user?.avatarUrl && !imageError);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1018] text-white shadow-2xl p-6 sm:p-8">
      {}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 size-80 rounded-full bg-blue-600/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative size-24 sm:size-28 cursor-pointer overflow-hidden rounded-2xl border-2 border-white/20 bg-[#161c2b] shadow-xl transition-all duration-200 group-hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Change profile picture"
              title="Click to upload/change picture"
            >
              {hasValidAvatar ? (
                <img
                  src={user!.avatarUrl}
                  alt="Avatar"
                  className="size-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="flex size-full items-center justify-center font-display text-3xl sm:text-4xl font-bold text-white/80 bg-gradient-to-br from-stone-800 to-stone-900">
                  {(profile.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              )}

              {}
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="size-6 text-white" />
                    <span className="mt-1 font-mono text-[9.5px] uppercase tracking-wider text-white font-semibold">
                      Upload
                    </span>
                  </>
                )}
              </span>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setImageError(false);
                onAvatarUpload(e.target.files?.[0]);
              }}
            />

            {}
            {hasValidAvatar && (
              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAvatar();
                }}
                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer"
                title="Remove profile picture"
                aria-label="Remove profile picture"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}

            {!hasValidAvatar && (
              <div
                className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full border-2 border-[#0c1018] bg-emerald-500 text-slate-950 shadow-md"
                title="Verified Attendee"
              >
                <Sparkles className="size-3.5 fill-current" />
              </div>
            )}
          </div>

          {}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white border border-white/15 font-bold">
                {roleLabel(role)}
              </span>
              {user?.tenantSlug && (
                <span className="rounded-md bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-stone-300 border border-white/10 font-semibold">
                  {user.tenantSlug}
                </span>
              )}
              <span className="font-mono text-xs text-stone-400 font-medium">ID: {memberId}</span>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {displayName}
                </h1>
                {profile.pronouns && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-stone-300">
                    {profile.pronouns}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 font-mono text-xs text-stone-400 mt-1">
                <Mail className="size-3.5 text-stone-400" />
                {user?.email}
              </p>
            </div>

            {}
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300 pt-0.5">
              {profile.phone && (
                <span className="flex items-center gap-1 font-mono text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                  <Phone className="size-3 text-emerald-400" />
                  {profile.phone}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                  <MapPin className="size-3 text-stone-400" />
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {}
        {}
        {}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          {}
          <button
            type="button"
            onClick={onOpenDigitalPass}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 p-3.5 pl-4.5 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:border-white/25 active:scale-[0.98] cursor-pointer"
          >
            <div className="text-left space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Gate Ready
              </div>
              <div className="flex items-center gap-1 font-display text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                <span>Digital Pass</span>
                <ArrowUpRight className="size-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="font-mono text-[10px] text-stone-400">Tap to present QR at gate</p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-white group-hover:text-stone-950">
              <QrCode className="size-5" />
            </div>
          </button>

          {}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onStartEditing}
              className="h-8.5 rounded-xl border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/15 hover:text-white"
            >
              <Pencil className="mr-1.5 size-3.5 text-stone-300" /> Edit Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8.5 rounded-xl text-xs font-semibold text-stone-400 hover:bg-red-500/15 hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="size-3.5 sm:mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {}
      <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-white">Profile Readiness: {percentage}%</span>
            <span className="text-stone-400">({completedCount} of {items.length} completed)</span>
          </div>

          <div className="h-2 w-full sm:w-64 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {items.map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10.5px] transition-colors ${
                item.done
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'bg-white/5 text-stone-400 border border-white/10'
              }`}
            >
              {item.done ? (
                <CheckCircle2 className="size-3 text-emerald-400" />
              ) : (
                <CircleDashed className="size-3 text-stone-500" />
              )}
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
