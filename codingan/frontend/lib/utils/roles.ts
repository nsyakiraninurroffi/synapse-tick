/**
 * Role-based redirect utility
 * Maps user roles to their appropriate dashboard/landing pages
 */

export type UserRole = 'pengunjung' | 'organizer' | 'staff' | 'vendor' | 'superadmin' | 'admin';

/** After login/register, redirect user to their role-specific page */
export function getDashboardRoute(role: UserRole | string): string {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('admin') || normalized === 'superadmin') {
    return '/dashboard/admin';
  }
  const routes: Record<string, string> = {
    pengunjung: '/my-tickets',
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
    superadmin: '/dashboard/admin',
    admin: '/dashboard/admin',
  };
  return routes[normalized] || '/';
}

/** After register specifically, first-time experience */
export function getPostRegisterRoute(role: UserRole | string): string {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('admin') || normalized === 'superadmin') {
    return '/dashboard/admin';
  }
  const routes: Record<string, string> = {
    pengunjung: '/events',          // Jelajahi event pertama kali
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
    superadmin: '/dashboard/admin',
    admin: '/dashboard/admin',
  };
  return routes[normalized] || '/';
}

/** Role display labels (Indonesian) */
export function getRoleLabel(role: UserRole | string): string {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('admin')) return 'Super Admin';
  const labels: Record<string, string> = {
    pengunjung: 'Pengunjung',
    organizer: 'Organizer',
    staff: 'Staff Gate',
    vendor: 'Vendor',
    superadmin: 'Super Admin',
    admin: 'Super Admin',
  };
  return labels[normalized] || role;
}

/** Role badge colors for UI */
export function getRoleBadgeClass(role: UserRole | string): string {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('admin')) return 'badge-info';
  const classes: Record<string, string> = {
    pengunjung: 'badge-info',
    organizer: 'badge-success',
    staff: 'badge-warning',
    vendor: 'badge-neutral',
    superadmin: 'badge-info',
    admin: 'badge-info',
  };
  return classes[normalized] || 'badge-neutral';
}
