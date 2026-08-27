import { useEffect } from 'react';
import { useAuthStore } from '@/shared/auth/store';
import { Roles } from '@/shared/roles';
import { loadProfile } from '@/features/auth/services/authService';

let lastProfileFetchTime = 0;

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clear = useAuthStore((state) => state.clear);

  const isAuthenticated = Boolean(accessToken);
  const role = user?.role ?? Roles.Attendee;

  useEffect(() => {
    if (!isAuthenticated) return;
    const now = Date.now();
    const isMissingName = !user?.firstName && !user?.lastName;

    if (isMissingName || now - lastProfileFetchTime > 60000) {
      lastProfileFetchTime = now;
      loadProfile().catch(() => {});
    }
  }, [isAuthenticated, user?.firstName, user?.lastName]);

  return {
    user,
    role,
    isAuthenticated,
    tenantsId: user?.tenantsId ?? null,
    tenantSlug: user?.tenantSlug ?? '',
    logout: clear,
  };
}
