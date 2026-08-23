import { useRef } from 'react';
import { roleLabel } from '@/shared/roles';
import { Badge } from '@/shared/ui/badge';
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
} from 'lucide-react';
import type { UserProfile } from '@/shared/proto/auth';
import type { ProfileInput } from '@/features/auth/services/authService';

interface ProfileHeroCardProps {
  user: UserProfile | null;
  role: number;
  profile: ProfileInput;
  uploading: boolean;
  onAvatarUpload: (file: File | undefined) => void;
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
  onOpenDigitalPass,
  onStartEditing,
  onLogout,
  interestsCount,
}: ProfileHeroCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Attendee Profile';

  // Calculate profile completeness score
  const items = [
    { label: 'Name added', done: Boolean(profile.firstName && profile.lastName) },
    { label: 'Avatar set', done: Boolean(user?.avatarUrl) },
    { label: 'Phone registered', done: Boolean(profile.phone) },
    { label: 'Address provided', done: Boolean(profile.addressLine && profile.city) },
    { label: 'Bio / Notes', done: Boolean(profile.bio || profile.pronouns) },
    { label: 'Interests curated', done: interestsCount > 0 },
  ];
  const completedCount = items.filter((i) => i.done).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  const memberId = user?.usersId
    ? `ID: TS-${user.usersId.slice(0, 6).toUpperCase()}`
    : 'Universal ID';

  return (
    <div className="rounded-[2.25rem] bg-black/5 p-2 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
      <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] bg-stage text-on-stage shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Ambient Radial Mesh Lighting */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 size-[380px] rounded-full bg-brand/20 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 size-[380px] rounded-full bg-voltage/15 blur-[100px]"
          aria-hidden="true"
        />

        {/* Geometric Texture Grid */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Left Block: Avatar & Core Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Interactive Avatar with Double Ring */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative size-24 sm:size-28 shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-stage-elevated bg-stage-elevated shadow-xl transition-transform duration-200 group-hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
                aria-label="Upload profile picture"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center font-display text-3xl font-bold text-brand-accent">
                    {(profile.firstName[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}

                {/* Hover Camera Overlay */}
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                  {uploading ? (
                    <Loader2 className="size-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="size-6 text-white" />
                      <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white">Change</span>
                    </>
                  )}
                </span>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatarUpload(e.target.files?.[0])}
              />

              <div
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-stage bg-brand text-brand-ink shadow-md"
                title="Verified Universal Account"
              >
                <Sparkles className="size-4" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="voltage" className="font-mono text-[10.5px] uppercase tracking-wider">
                  {roleLabel(role)}
                </Badge>
                {user?.tenantSlug ? (
                  <Badge variant="neutral" className="bg-white/10 text-white border-white/20 font-mono text-[10.5px]">
                    {user.tenantSlug}
                  </Badge>
                ) : null}
                <span className="font-mono text-xs text-on-stage-soft/70">{memberId}</span>
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    {displayName}
                  </h1>
                  {profile.pronouns && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-voltage font-medium">
                      {profile.pronouns}
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-2 font-mono text-xs text-on-stage-soft mt-1">
                  <Mail className="size-3.5 text-voltage" />
                  {user?.email}
                </p>
              </div>

              {/* Contact Snapshot Snippets */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-on-stage-soft/80 pt-1">
                {profile.phone ? (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="size-3 text-emerald-400" />
                    {profile.phone}
                  </span>
                ) : null}
                {profile.city ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-brand-accent" />
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Block: Digital Pass CTA & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Digital Pass Button with Button-in-Button Architecture */}
            <button
              type="button"
              onClick={onOpenDigitalPass}
              className="group relative flex items-center justify-between gap-4 rounded-full border border-white/20 bg-white/10 py-2.5 pl-5 pr-2.5 backdrop-blur-md transition-all duration-300 hover:border-voltage/50 hover:bg-white/15 active:scale-[0.98] shadow-lg"
            >
              <div className="text-left">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-voltage">Gate Ready</span>
                <span className="block font-display text-sm font-semibold text-white">Universal Pass</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6 shadow-md">
                <QrCode className="size-4" />
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onStartEditing}
                className="h-9 rounded-full border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/15 hover:text-white"
              >
                <Pencil className="mr-1.5 size-3.5" /> Edit details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="h-9 rounded-full text-xs text-on-stage-soft hover:bg-red-500/20 hover:text-red-300"
                title="Sign out of account"
              >
                <LogOut className="size-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Completeness Meter */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-white">
                  Profile Readiness: {percentage}%
                </span>
                <span className="font-mono text-[11px] text-on-stage-soft/70">
                  ({completedCount} of {items.length} completed)
                </span>
              </div>
              <div className="h-1.5 w-full sm:w-64 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-voltage transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Checklist Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {items.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] transition-colors ${
                    item.done
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-on-stage-soft/60 border border-white/10'
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-3 text-emerald-400" />
                  ) : (
                    <CircleDashed className="size-3 text-on-stage-soft/50" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
