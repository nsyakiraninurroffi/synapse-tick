'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { authAPI } from '@/lib/api';
import { getDashboardRoute } from '@/lib/utils/roles';
import { useAuthStore } from '@/store/authStore';
import { Ticket, Lock, Mail, ArrowRight, Loader2, Sparkles, Eye, EyeOff, Chrome } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Social provider button config
const socialProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    bg: 'bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20',
    text: 'text-gray-700 dark:text-white',
    border: 'border border-gray-200 dark:border-white/15',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    bg: 'bg-[#1877F2]/10 hover:bg-[#1877F2]/20',
    text: 'text-[#1877F2]',
    border: 'border border-[#1877F2]/25',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.5a8.22 8.22 0 004.8 1.54V6.59a4.85 4.85 0 01-1.03.1z"/>
      </svg>
    ),
    bg: 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20',
    text: 'text-gray-900 dark:text-white',
    border: 'border border-black/10 dark:border-white/15',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Selamat datang kembali, ${user.nama}! 👋`);
      router.push(getDashboardRoute(user.role));
    } catch (err: any) {
      // Instant Demo Fallback if database backend is unseeded
      if (email.endsWith('@demo.com') && password === 'demo1234') {
        const roleMap: Record<string, string> = {
          'admin@demo.com': 'superadmin',
          'organizer@demo.com': 'organizer',
          'staff@demo.com': 'staff',
          'vendor@demo.com': 'vendor',
          'pengunjung@demo.com': 'pengunjung',
        };
        const demoRole = roleMap[email] || 'pengunjung';
        const demoUser = {
          id: 'demo-user-id',
          nama: email === 'admin@demo.com' ? 'Super Admin HQ' : `Demo ${demoRole.toUpperCase()}`,
          email,
          role: demoRole,
        };
        const demoToken = 'mock-demo-jwt-token';
        setAuth(demoUser, demoToken);
        toast.success(`Selamat datang kembali, ${demoUser.nama}! 👋 (Demo Mode)`);
        router.push(getDashboardRoute(demoRole));
        return;
      }

      toast.error(err.response?.data?.message || 'Login gagal. Periksa kembali email & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'tiktok') {
      toast.info('TikTok Login sedang dalam tahap approval. Gunakan Google atau Facebook.');
      return;
    }
    setSocialLoading(provider);
    try {
      const result = await signIn(provider, { callbackUrl: '/', redirect: false });
      if (result?.error) {
        toast.error(`Login dengan ${provider} gagal. Coba lagi.`);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch {
      toast.error('Terjadi kesalahan saat social login.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-20 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="hero-glow top-20 left-1/4 w-[500px] h-[400px] bg-brand-500/10 pointer-events-none" />
      <div className="hero-glow bottom-0 right-10 w-[300px] h-[300px] bg-accent-500/8 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 card overflow-hidden shadow-card-dark border-brand-500/15"
      >
        {/* ── Left Form Section ── */}
        <div className="p-8 sm:p-10 space-y-5 flex flex-col justify-center bg-[hsl(var(--bg-card))]">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow-sm">
              <Ticket className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl font-black gradient-text tracking-tight">SynapseTick</span>
          </Link>

          <div>
            <h1 className="text-2xl font-black text-[hsl(var(--text-primary))] tracking-tight">
              Selamat Datang Kembali 👋
            </h1>
            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
              Masuk untuk melihat tiket & e-wallet kamu
            </p>
          </div>

          {/* ── Social Login Buttons ── */}
          <div className="space-y-2.5">
            {socialProviders.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialLogin(p.id)}
                disabled={!!socialLoading || loading}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${p.bg} ${p.text} ${p.border} disabled:opacity-60`}
              >
                {socialLoading === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  p.icon
                )}
                Lanjutkan dengan {p.name}
              </motion.button>
            ))}
          </div>

          {/* ── Demo Accounts Quick Login ── */}
          <div className="p-3.5 rounded-2xl bg-brand-500/8 border border-brand-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Akun Demo Instant
              </span>
              <span className="text-[10px] text-[hsl(var(--text-muted))]">Pass: demo1234</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Super Admin 👑', email: 'admin@demo.com', bg: 'hover:bg-purple-500/15 border-purple-500/30 font-bold' },
                { label: 'Pengunjung', email: 'pengunjung@demo.com', bg: 'hover:bg-brand-500/15 border-brand-500/30' },
                { label: 'Organizer', email: 'organizer@demo.com', bg: 'hover:bg-emerald-500/15 border-emerald-500/30' },
                { label: 'Staff Gate', email: 'staff@demo.com', bg: 'hover:bg-amber-500/15 border-amber-500/30' },
                { label: 'Vendor', email: 'vendor@demo.com', bg: 'hover:bg-accent-500/15 border-accent-500/30' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword('demo1234');
                    toast.info(`Mengisi kredensial demo ${demo.label}...`);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-[hsl(var(--text-primary))] text-left transition-all duration-200 flex items-center justify-between ${demo.bg}`}
                >
                  <span>{demo.label}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[hsl(var(--border-subtle))]" />
            <span className="text-xs text-[hsl(var(--text-muted))] font-medium">atau masuk dengan email</span>
            <div className="flex-1 h-px bg-[hsl(var(--border-subtle))]" />
          </div>

          {/* ── Email Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[hsl(var(--text-muted))] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-11"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              id="login-submit"
              className="btn-primary w-full py-3.5 font-bold shadow-glow mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk Sekarang'}
            </button>
          </form>

          <p className="text-center text-xs text-[hsl(var(--text-muted))]">
            Belum punya akun?{' '}
            <Link href="/register" className="text-brand-500 font-bold hover:underline">
              Daftar Gratis
            </Link>
          </p>
        </div>

        {/* ── Right Visual Section ── */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-900 via-[#1e1b4b] to-brand-950 border-l border-[hsl(var(--border-subtle))] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-accent-500/10 blur-3xl" />

          <div className="relative z-10 space-y-5">
            <span className="badge-info">
              <Sparkles className="w-3.5 h-3.5" />
              Secure Ticketing Platform
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              Akses Tiket &<br />E-Wallet{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-400">
                Tanpa Batas
              </span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nikmati kenyamanan transaksi cashless di event dengan Dynamic QR Code AES-256 yang terenkripsi secara otomatis.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['🔐 QR AES-256', '⚡ Virtual Queue', '💳 E-Wallet', '📱 Offline Gate'].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/8 text-gray-300 border border-white/10 backdrop-blur-sm">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="relative z-10 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-black">
                A
              </div>
              <div>
                <p className="text-sm font-bold text-white">Andi Prasetyo</p>
                <p className="text-xs text-gray-400">Pengunjung Event</p>
              </div>
              <div className="ml-auto flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-xs">★</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              &quot;Virtual queue TicketFlow bikin masuk konser jadi super cepat. QR-nya langsung discan, ga antri lama!&quot;
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
