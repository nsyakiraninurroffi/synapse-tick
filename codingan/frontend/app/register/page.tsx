'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { authAPI } from '@/lib/api';
import { getPostRegisterRoute } from '@/lib/utils/roles';
import { useAuthStore } from '@/store/authStore';
import {
  Ticket, Lock, Mail, User, Phone, ArrowRight, Loader2, Sparkles,
  ShieldCheck, Eye, EyeOff, CheckCircle, Building2, Users, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// Role descriptions
const roles = [
  { id: 'pengunjung', label: 'Pengunjung', icon: Users, desc: 'Beli tiket & nikmati event' },
  { id: 'organizer', label: 'Organizer', icon: Building2, desc: 'Buat & kelola event' },
  { id: 'staff', label: 'Staff Gate', icon: ShieldCheck, desc: 'Scan & verifikasi tiket' },
  { id: 'vendor', label: 'Vendor', icon: Briefcase, desc: 'Kelola booth & merchant' },
] as const;

// Social providers (Quick login for register too)
const socialProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [noHp, setNoHp] = useState('');
  const [role, setRole] = useState<'pengunjung' | 'organizer' | 'staff' | 'vendor'>('pengunjung');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !password) {
      toast.error('Nama, email, dan kata sandi wajib diisi.');
      return;
    }
    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({ nama, email, password, noHp, role });
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Selamat datang, ${user.nama}! Akun berhasil dibuat 🎉`);
      router.push(getPostRegisterRoute(role));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: string) => {
    setSocialLoading(provider);
    try {
      const result = await signIn(provider, { callbackUrl: '/', redirect: false });
      if (result?.error) toast.error(`Daftar dengan ${provider} gagal.`);
      else if (result?.url) router.push(result.url);
    } catch {
      toast.error('Terjadi kesalahan.');
    } finally {
      setSocialLoading(null);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'][passwordStrength];

  return (
    <div className="min-h-screen pt-16 pb-20 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="hero-glow top-10 left-1/4 w-[500px] h-[400px] bg-brand-500/8 pointer-events-none" />
      <div className="hero-glow bottom-0 right-0 w-[300px] h-[300px] bg-accent-500/6 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-5 card overflow-hidden shadow-card-dark border-brand-500/15"
      >
        {/* ── Left Visual Panel (2 cols) ── */}
        <div className="hidden md:flex md:col-span-2 flex-col justify-between p-10 bg-gradient-to-br from-brand-950 via-[#0f0b30] to-[#12082a] border-r border-[hsl(var(--border-subtle))] relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-0 w-48 h-48 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow-sm">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">TicketFlow</span>
            </Link>

            <span className="badge-info mb-4"><Sparkles className="w-3.5 h-3.5" /> Bergabung Gratis</span>
            <h2 className="text-2xl font-black text-white leading-snug mt-2">
              Mulai Pengalaman<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-400">Ticketing Modern</span>
            </h2>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Daftar dalam 60 detik. Dapatkan akses langsung ke tiket event konser, festival, dan seminar.
            </p>

            {/* Feature checklist */}
            <div className="mt-8 space-y-3">
              {[
                'E-Wallet cashless terintegrasi',
                'QR Tiket terenkripsi AES-256',
                'Notifikasi event via email & app',
                'Dashboard organizer real-time',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User count social proof */}
          <div className="relative z-10 flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex -space-x-2">
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={l} className="w-7 h-7 rounded-full border-2 border-[#0f0b30] bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-black" style={{ zIndex: 4 - i }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-white">10,000+ Pengguna</p>
              <p className="text-[10px] text-gray-400">sudah bergabung minggu ini</p>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel (3 cols) ── */}
        <div className="md:col-span-3 p-8 sm:p-10 flex flex-col justify-center space-y-5 bg-[hsl(var(--bg-card))]">
          {/* Mobile logo */}
          <Link href="/" className="md:hidden inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow-sm">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="text-lg font-black gradient-text">TicketFlow</span>
          </Link>

          <div>
            <h1 className="text-2xl font-black text-[hsl(var(--text-primary))]">Buat Akun Baru</h1>
            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">Pilih tipe akun dan isi formulir di bawah</p>
          </div>

          {/* Social Quick Register */}
          <div className="flex gap-2">
            {socialProviders.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSocialRegister(p.id)}
                disabled={!!socialLoading || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-secondary))] hover:border-brand-500/30 transition-all disabled:opacity-50"
              >
                {socialLoading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.icon}
                <span className="text-[hsl(var(--text-secondary))]">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[hsl(var(--border-subtle))]" />
            <span className="text-xs text-[hsl(var(--text-muted))]">atau daftar dengan email</span>
            <div className="flex-1 h-px bg-[hsl(var(--border-subtle))]" />
          </div>

          {/* Role Selector */}
          <div>
            <p className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-2">Tipe Akun</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] font-bold transition-all duration-200 border text-center',
                      isSelected
                        ? 'bg-brand-600/12 text-brand-600 dark:text-brand-400 border-brand-500/40 shadow-glow-sm'
                        : 'text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border-color))] hover:text-[hsl(var(--text-secondary))]'
                    )}
                  >
                    <Icon className={clsx('w-4 h-4', isSelected ? 'text-brand-500' : 'text-[hsl(var(--text-muted))]')} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Anda" className="input-field pl-10" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">No. WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="08123456789" className="input-field pl-10" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="input-field pl-10" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input-field pl-10 pr-11"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password Strength */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={clsx('h-1 flex-1 rounded-full transition-all duration-300', passwordStrength >= level ? strengthColor : 'bg-[hsl(var(--border-color))]')} />
                    ))}
                  </div>
                  <p className={clsx('text-[11px] font-medium', passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-500')}>
                    Kekuatan: {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !!socialLoading} id="register-submit" className="btn-primary w-full py-3.5 font-bold shadow-glow mt-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Buat Akun <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[hsl(var(--text-muted))]">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-brand-500 font-bold hover:underline">Masuk di sini</Link>
          </p>

          <p className="text-center text-[10px] text-[hsl(var(--text-muted))] leading-relaxed">
            Dengan mendaftar, kamu menyetujui{' '}
            <Link href="/terms" className="underline hover:text-[hsl(var(--text-secondary))]">Syarat & Ketentuan</Link>
            {' '}dan{' '}
            <Link href="/privacy" className="underline hover:text-[hsl(var(--text-secondary))]">Kebijakan Privasi</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
