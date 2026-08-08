/**
 * Role-based redirect utility
 * Maps user roles to their appropriate dashboard/landing pages
 */

export type UserRole = 'pengunjung' | 'organizer' | 'staff' | 'vendor' | 'superadmin';

/** After login/register, redirect user to their role-specific page */
export function getDashboardRoute(role: UserRole | string): string {
  const routes: Record<string, string> = {
    pengunjung: '/my-tickets',
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
    superadmin: '/dashboard/admin',
  };
  return routes[role] || '/';
}

/** After register specifically, first-time experience */
export function getPostRegisterRoute(role: UserRole | string): string {
  const routes: Record<string, string> = {
    pengunjung: '/events',          // Jelajahi event pertama kali
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
    superadmin: '/dashboard/admin',
  };
  return routes[role] || '/';
}

/** Role display labels (Indonesian) */
export function getRoleLabel(role: UserRole | string): string {
  const labels: Record<string, string> = {
    pengunjung: 'Pengunjung',
    organizer: 'Organizer',
    staff: 'Staff Gate',
    vendor: 'Vendor',
    superadmin: 'Super Admin',
  };
  return labels[role] || role;
}

/** Role badge colors for UI */
export function getRoleBadgeClass(role: UserRole | string): string {
  const classes: Record<string, string> = {
    pengunjung: 'badge-info',
    organizer: 'badge-success',
    staff: 'badge-warning',
    vendor: 'badge-neutral',
    superadmin: 'badge-info',
  };
  return classes[role] || 'badge-neutral';
}
