'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Ticket, Menu, X, LogOut, User, LayoutDashboard, Wallet } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/events', label: 'Semua Event' },
  ];

  return (
    <header
      className={clsx(
        'fixed top-0 w-full z-50 transition-all duration-300',
        scrolled
          ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-brand-600 rounded-xl group-hover:bg-brand-500 transition-colors duration-200">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              Ticket<span className="text-brand-400">Flow</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm font-medium transition-colors duration-200',
                  pathname === link.href
                    ? 'text-brand-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {user.role === 'organizer' && (
                  <Link href="/dashboard" className="btn-secondary text-sm py-2 px-4">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {user.role === 'pengunjung' && (
                  <Link href="/my-tickets" className="btn-secondary text-sm py-2 px-4">
                    <Ticket className="w-4 h-4" />
                    Tiket Saya
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">{user.nama}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                  Masuk
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-white py-2 px-2 rounded-lg hover:bg-white/5 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/my-tickets" className="btn-secondary text-sm" onClick={() => setMobileOpen(false)}>
                      Tiket Saya
                    </Link>
                    <button onClick={logout} className="btn-secondary text-sm text-red-400">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary text-sm" onClick={() => setMobileOpen(false)}>
                      Masuk
                    </Link>
                    <Link href="/register" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                      Daftar Gratis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
