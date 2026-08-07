import Link from 'next/link';
import { Ticket, Mail, MapPin, Phone, Github, Twitter, Instagram } from 'lucide-react';

const footerLinks = {
  platform: [
    { label: 'Jelajahi Event', href: '/events' },
    { label: 'Tiket Saya', href: '/my-tickets' },
    { label: 'E-Wallet', href: '/wallet' },
    { label: 'Daftar Gratis', href: '/register' },
  ],
  organizer: [
    { label: 'Dashboard Organizer', href: '/dashboard/organizer' },
    { label: 'Buat Event', href: '/events/create' },
    { label: 'Gate Scanner', href: '/dashboard/staff' },
    { label: 'Vendor Panel', href: '/dashboard/vendor' },
  ],
  support: [
    { label: 'Pusat Bantuan', href: '#' },
    { label: 'Syarat & Ketentuan', href: '#' },
    { label: 'Kebijakan Privasi', href: '#' },
    { label: 'Hubungi Kami', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-secondary))]">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow-sm group-hover:shadow-glow transition-all">
                <Ticket className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-black gradient-text tracking-tight">TicketFlow</span>
            </Link>
            <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed max-w-xs">
              Platform SaaS Ticketing #1 Indonesia. Beli tiket event, kelola booth vendor, dan scan gate — semua dalam satu ekosistem cashless.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Github, href: '#', label: 'GitHub' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))] hover:text-brand-500 hover:border-brand-500/30 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[hsl(var(--text-secondary))] hover:text-brand-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organizer Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">Untuk Organizer</h4>
            <ul className="space-y-2.5">
              {footerLinks.organizer.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[hsl(var(--text-secondary))] hover:text-brand-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">Bantuan</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[hsl(var(--text-secondary))] hover:text-brand-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[hsl(var(--border-subtle))] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[hsl(var(--text-muted))]">
            © {new Date().getFullYear()} TicketFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))]">
              <Mail className="w-3.5 h-3.5" /> support@ticketflow.id
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))]">
              <MapPin className="w-3.5 h-3.5" /> Jakarta, Indonesia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
