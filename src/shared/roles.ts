export const Roles = {
  Attendee: 0,
  Admin: 1,
  Staff: 2,
  SubTenant: 3,
  EventManager: 4,
  Developer: 99,
} as const;

export type RoleValue = (typeof Roles)[keyof typeof Roles];

export type Portal = 'public' | 'admin' | 'staff' | 'developer';

export function isDeveloper(role: number): boolean {
  return role === Roles.Developer;
}

export function isStaff(role: number): boolean {
  return role === Roles.Staff;
}

export function canAccessAdmin(role: number): boolean {
  return role === Roles.Admin || role === Roles.SubTenant || role === Roles.EventManager;
}

export function isSubTenant(role: number): boolean {
  return role === Roles.SubTenant;
}

export function isEventManager(role: number): boolean {
  return role === Roles.EventManager;
}

export function canManageTenantSettings(role: number): boolean {
  return role === Roles.Admin;
}

export function homePathForRole(role: number): string {
  if (isDeveloper(role)) {
    return '/';
  }
  if (isEventManager(role)) {
    return '/events';
  }
  if (canAccessAdmin(role)) {
    return '/';
  }
  if (isStaff(role)) {
    return '/staff';
  }
  return '/hub';
}

export function roleLabel(role: number): string {
  switch (role) {
    case Roles.Attendee:
      return 'Attendee';
    case Roles.Admin:
      return 'Admin';
    case Roles.Staff:
      return 'Staff';
    case Roles.SubTenant:
      return 'Sub-Tenant';
    case Roles.EventManager:
      return 'Event Manager';
    case Roles.Developer:
      return 'Developer';
    default:
      return 'Unknown';
  }
}
