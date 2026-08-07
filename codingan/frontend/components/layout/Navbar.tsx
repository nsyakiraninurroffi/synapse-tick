'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { getDashboardRoute, getRoleLabel } from '@/lib/utils/roles';
import {
  Ticket, Sun, Moon, Menu, X, LogOut, LayoutDashboard,
  CreditCard, Zap, ChevronDown, Bell, Home, CalendarDays,
  Settings, Shield, Store, ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from '@/components/layout/NotificationCenter';
import clsx from 'clsx';
import { toast } from 'sonner';

/* ── Nav links (public + auth-gated) ── */
const navLinks = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/events', label: 'Event', icon: CalendarDays },
  { href: '/my-tickets', label: 'Tiket Saya', icon: Ticket, requireAuth: true, roles: ['pengunjung'] },
  { href: '/wallet', label: 'E-Wallet', icon: CreditCard, requireAuth: true, roles: ['pengunjung'] },
];

/* ── Role-specific dashboard menu items ── */
function getRoleDashboardItems(role: string) {
  switch (role) {
    case 'organizer':
      return [
        { href: '/dashboard/organizer', label: 'Dashboard Organizer', icon: LayoutDashboard, color: 'text-brand-500' },
        { href: '/events/create', label: 'Buat Event', icon: CalendarDays, color: 'text-emerald-500' },
      ];
    case 'staff':
      return [
        { href: '/dashboard/staff', label: 'Gate Scanner', icon: ScanLine, color: 'text-amber-500' },
      ];
    case 'vendor':
      return [
        { href: '/dashboard/vendor', label: 'Dashboard Vendor', icon: Store, color: 'text-accent-500' },
      ];
    default: // pengunjung
      return [
        { href: '/my-tickets', label: 'Tiket Saya', icon: Ticket, color: 'text-emerald-500' },
        { href: '/wallet', label: 'E-Wallet', icon: CreditCard, color: 'text-amber-500' },
      ];
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout, loadFromStorage } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Berhasil logout. Sampai jumpa! 👋');
    router.push('/');
  };

  /* Filter nav links by auth & role */
  const filteredLinks = navLinks.filter(l => {
    if (l.requireAuth && !isAuthenticated) return false;
    if (l.roles && user?.role && !l.roles.includes(user.role)) return false;
    return true;
  });

  const userInitial = user?.nama?.charAt(0).toUpperCase() || 'U';
  const dashboardItems = user?.role ? getRoleDashboardItems(user.role) : [];

  return (
    <>
      {/* ── Floating Navbar ── */}
      <header className={clsx('fixed top-0 left-0 right-0 z-50 transition-all duration-500', scrolled ? 'py-2' : 'py-3')}>
        <div className={clsx('max-w-7xl mx-auto px-4 sm:px-6 transition-all duration-500', scrolled ? 'lg:px-6' : 'lg:px-8')}>
          <div className={clsx(
            'flex items-center justify-between h-14 px-4 sm:px-5 transition-all duration-500',
            scrolled
              ? 'rounded-2xl bg-[hsl(var(--bg-card)/0.88)] backdrop-blur-2xl border border-[hsl(var(--border-subtle))] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
              : 'rounded-none bg-transparent border-transparent'
          )}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-glow-sm group-hover:shadow-glow bg-gradient-to-br from-brand-500 to-brand-700">
                <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-black gradient-text tracking-tight">SynapseTick</span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-secondary))]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-brand-600/10 dark:bg-brand-500/12"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}

              {/* Dashboard quick link for non-pengunjung */}
              {isAuthenticated && user?.role && user.role !== 'pengunjung' && (
                <Link
                  href={getDashboardRoute(user.role)}
                  className={clsx(
                    'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    pathname.startsWith('/dashboard')
                      ? 'text-brand-600 dark:text-brand-400 font-semibold bg-brand-600/10 dark:bg-brand-500/12'
                      : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-secondary))]'
                  )}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  id="theme-toggle"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-secondary))] transition-all duration-200"
                  title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ scale: 0.6, rotate: -30, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.6, rotate: 30, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              )}

              {/* Notification Center */}
              {isAuthenticated && <NotificationCenter />}

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="relative ml-1">
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[hsl(var(--bg-secondary))] transition-all duration-200 border border-transparent hover:border-[hsl(var(--border-subtle))]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-black shadow-glow-sm">
                      {userInitial}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{user?.nama?.split(' ')[0]}</p>
                      <p className="text-[10px] text-[hsl(var(--text-muted))] capitalize mt-0.5">{user?.role ? getRoleLabel(user.role) : ''}</p>
                    </div>
                    <ChevronDown className={clsx('w-3.5 h-3.5 text-[hsl(var(--text-muted))] transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 top-full mt-2 w-56 card p-1.5 z-50 shadow-card-dark"
                        >
                          {/* User info */}
                          <div className="px-3 py-2.5 border-b border-[hsl(var(--border-subtle))] mb-1">
                            <p className="text-sm font-bold text-[hsl(var(--text-primary))] truncate">{user?.nama}</p>
                            <p className="text-xs text-[hsl(var(--text-muted))] truncate">{user?.email}</p>
                          </div>

                          {/* Role-specific dashboard items */}
                          {dashboardItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors"
                            >
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                              {item.label}
                            </Link>
                          ))}

                          {/* Common items for all roles */}
                          {user?.role !== 'pengunjung' && (
                            <>
                              <Link href="/my-tickets" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
                                <Ticket className="w-4 h-4 text-emerald-500" /> Tiket Saya
                              </Link>
                              <Link href="/wallet" onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
                                <CreditCard className="w-4 h-4 text-amber-500" /> E-Wallet
                              </Link>
                            </>
                          )}

                          <div className="my-1 border-t border-[hsl(var(--border-subtle))]" />
                          <button
                            onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Keluar
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-secondary))] transition-all duration-200">
                    Masuk
                  </Link>
                  <Link href="/register" className="btn-primary btn-sm shadow-glow-sm">
                    <Zap className="w-3.5 h-3.5" /> Daftar Gratis
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[hsl(var(--bg-secondary))] transition-colors text-[hsl(var(--text-primary))]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mobileOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu Sheet ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[hsl(var(--bg-card))] border-l border-[hsl(var(--border-color))] md:hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border-subtle))]">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-black gradient-text">TicketFlow</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--bg-secondary))] text-[hsl(var(--text-muted))]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Section */}
              {isAuthenticated && (
                <div className="p-4 m-4 mb-0 rounded-xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-subtle))]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-black">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[hsl(var(--text-primary))]">{user?.nama}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))]">{user?.role ? getRoleLabel(user.role) : ''}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {filteredLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-brand-600/10 text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:text-[hsl(var(--text-primary))]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Role-specific mobile items */}
                {isAuthenticated && dashboardItems.length > 0 && (
                  <>
                    <div className="pt-2 pb-1 px-4">
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">Dashboard</p>
                    </div>
                    {dashboardItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                          pathname === item.href
                            ? 'bg-brand-600/10 text-brand-600 dark:text-brand-400 font-bold'
                            : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:text-[hsl(var(--text-primary))]'
                        )}
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-[hsl(var(--border-subtle))] space-y-2">
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--bg-secondary))] transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                  </button>
                )}
                {isAuthenticated ? (
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center">Masuk</Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                      <Zap className="w-4 h-4" /> Daftar Gratis
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
