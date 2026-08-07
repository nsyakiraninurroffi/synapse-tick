/**
 * Role-based redirect utility
 * Maps user roles to their appropriate dashboard/landing pages
 */

export type UserRole = 'pengunjung' | 'organizer' | 'staff' | 'vendor';

/** After login/register, redirect user to their role-specific page */
export function getDashboardRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    pengunjung: '/my-tickets',
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
  };
  return routes[role] || '/';
}

/** After register specifically, first-time experience */
export function getPostRegisterRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    pengunjung: '/events',          // Jelajahi event pertama kali
    organizer: '/dashboard/organizer',
    staff: '/dashboard/staff',
    vendor: '/dashboard/vendor',
  };
  return routes[role] || '/';
}

/** Role display labels (Indonesian) */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    pengunjung: 'Pengunjung',
    organizer: 'Organizer',
    staff: 'Staff Gate',
    vendor: 'Vendor',
  };
  return labels[role] || role;
}

/** Role badge colors for UI */
export function getRoleBadgeClass(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    pengunjung: 'badge-info',
    organizer: 'badge-success',
    staff: 'badge-warning',
    vendor: 'badge-neutral',
  };
  return classes[role] || 'badge-neutral';
}
