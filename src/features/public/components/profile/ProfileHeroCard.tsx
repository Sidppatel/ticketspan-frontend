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
  Radio,
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
    ? `TS-${user.usersId.slice(0, 6).toUpperCase()}`
    : 'Universal Pass';

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f131d] text-white shadow-2xl p-6 sm:p-8">
      {/* Ambient Gradient Glows */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-blue-600/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side: Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Ring & Upload Overlay */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative size-24 sm:size-28 cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-[#161c2b] shadow-xl transition-transform duration-200 group-hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Upload profile picture"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center !font-sans text-3xl font-bold text-amber-400">
                  {(profile.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              )}

              {/* Hover Camera Overlay */}
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-amber-400" />
                ) : (
                  <>
                    <Camera className="size-6 text-white" />
                    <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white font-bold">
                      Change
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
              onChange={(e) => onAvatarUpload(e.target.files?.[0])}
            />

            <div
              className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full border-2 border-[#0f131d] bg-amber-400 text-slate-950 shadow-md"
              title="Verified Attendee"
            >
              <Sparkles className="size-3.5 fill-current" />
            </div>
          </div>

          {/* Identity Information */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="voltage" className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold">
                {roleLabel(role)}
              </Badge>
              {user?.tenantSlug && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-slate-300 border border-white/10 font-bold">
                  {user.tenantSlug}
                </span>
              )}
              <span className="font-mono text-xs text-slate-400 font-semibold">ID: {memberId}</span>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="!font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {displayName}
                </h1>
                {profile.pronouns && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-amber-300">
                    {profile.pronouns}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 font-mono text-xs text-slate-400 mt-0.5">
                <Mail className="size-3.5 text-amber-400" />
                {user?.email}
              </p>
            </div>

            {/* Contact Chips */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
              {profile.phone && (
                <span className="flex items-center gap-1 font-mono text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                  <Phone className="size-3 text-emerald-400" />
                  {profile.phone}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                  <MapPin className="size-3 text-amber-400" />
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Gate-Ready Pass Action & Profile Controls */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          {/* Universal Pass Hero Button */}
          <button
            type="button"
            onClick={onOpenDigitalPass}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-[#181f30] to-[#121624] p-3 pl-4 shadow-lg shadow-amber-500/5 transition-all duration-200 hover:border-amber-400 hover:shadow-amber-500/20 active:scale-[0.98]"
          >
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                <Radio className="size-3 animate-pulse" /> Gate Ready
              </div>
              <span className="!font-sans text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                Universal Pass <ArrowUpRight className="size-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-md transition-transform duration-200 group-hover:scale-105">
              <QrCode className="size-5" />
            </div>
          </button>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onStartEditing}
              className="h-9 rounded-xl border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Pencil className="mr-1.5 size-3.5 text-amber-400" /> Edit Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-9 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/15 hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom: Profile Readiness Progress Bar & Milestones */}
      <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-white">Profile Readiness: {percentage}%</span>
            <span className="text-slate-400">({completedCount} of {items.length} completed)</span>
          </div>

          <div className="h-2 w-full sm:w-64 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Milestone Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {items.map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10.5px] transition-colors ${
                item.done
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}
            >
              {item.done ? (
                <CheckCircle2 className="size-3 text-emerald-400" />
              ) : (
                <CircleDashed className="size-3 text-slate-500" />
              )}
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
