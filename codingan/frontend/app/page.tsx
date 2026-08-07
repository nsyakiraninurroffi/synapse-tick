'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { eventAPI } from '@/lib/api';
import {
  MapPin, Calendar, Users, ArrowRight, Ticket, Zap, Shield, Clock,
  Sparkles, Search, CheckCircle2, TrendingUp, Star, Music, Mic2, Film,
  Trophy, Palette, CreditCard, ScanLine, Quote, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SkeletonEventCard } from '@/components/ui/Skeleton';

/* ── Types ── */
interface Event {
  id: string;
  namaEvent: string;
  lokasi: string;
  tanggal: string;
  kapasitas: number;
  logoUrl: string;
  deskripsi: string;
  kategoriEvent?: string;
  seats: Array<{ kategori: string; harga: number; kuota: number; terjual?: number; tersedia?: number }>;
  _count: { tickets: number };
}

/* ── Category Filter ── */
const categories = [
  { label: 'Semua', icon: Sparkles, value: '' },
  { label: 'Konser', icon: Music, value: 'konser', emoji: '🎵' },
  { label: 'Seminar', icon: Mic2, value: 'seminar', emoji: '🎤' },
  { label: 'Festival', icon: Star, value: 'festival', emoji: '🎪' },
  { label: 'Teater', icon: Film, value: 'theater', emoji: '🎭' },
  { label: 'Olahraga', icon: Trophy, value: 'olahraga', emoji: '⚽' },
  { label: 'Exhibition', icon: Palette, value: 'exhibition', emoji: '🎨' },
];

/* ── Animated Counter ── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1800;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref} className="tabular-nums">{count.toLocaleString('id-ID')}{suffix}</span>;
}

/* ── Event Card ── */
function EventCard({ event, index }: { event: Event; index: number }) {
  const minPrice = event.seats.length > 0 ? Math.min(...event.seats.map((s) => Number(s.harga))) : 0;
  const totalSold = event._count?.tickets || 0;
  const totalCapacity = event.seats.reduce((sum, s) => sum + Number(s.kuota), 0);
  const occupancy = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
  const isSellingFast = occupancy > 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={`/event/${event.id}`} className="block h-full">
        <div className="card-hover overflow-hidden h-full flex flex-col card-3d">
          {/* Image */}
          <div className="relative h-52 bg-[hsl(var(--bg-secondary))] overflow-hidden flex-shrink-0">
            {event.logoUrl ? (
              <img src={event.logoUrl} alt={event.namaEvent}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/40 via-[hsl(var(--bg-secondary))] to-accent-900/20">
                <Ticket className="w-16 h-16 text-brand-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--bg-card))] via-transparent to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="absolute top-3 right-3">
              <span className="badge-info text-[11px] font-bold backdrop-blur-md shadow-lg border-brand-500/30">
                {minPrice === 0 ? 'GRATIS' : `Rp ${(minPrice / 1000).toFixed(0)}K`}
              </span>
            </div>
            {isSellingFast && (
              <div className="absolute top-3 left-3">
                <span className="badge-error text-[11px] animate-pulse">🔥 Hampir Habis</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-base font-bold text-[hsl(var(--text-primary))] mb-3 line-clamp-2 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors leading-snug">
              {event.namaEvent}
            </h3>
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--text-secondary))]">
                <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="truncate">{format(new Date(event.tanggal), 'd MMM yyyy · HH:mm', { locale: id })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--text-secondary))]">
                <MapPin className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                <span className="line-clamp-1">{event.lokasi}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-[hsl(var(--text-muted))] mb-1.5">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalSold.toLocaleString('id-ID')} terjual</span>
                <span className={occupancy > 80 ? 'text-red-500 font-bold' : occupancy > 50 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                  {(100 - occupancy).toFixed(0)}% tersisa
                </span>
              </div>
              <div className="progress-bar h-1.5">
                <div
                  className={`progress-fill ${occupancy > 80 ? 'bg-gradient-to-r from-red-500 to-red-400' : occupancy > 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border-subtle))]">
              <div className="flex gap-1 flex-wrap">
                {event.seats.slice(0, 2).map((seat) => (
                  <span key={seat.kategori} className="badge-neutral text-[10px] py-0.5">{seat.kategori}</span>
                ))}
              </div>
              <span className="text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                Beli Tiket <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Feature Data ── */
const features = [
  { icon: Zap, title: 'Virtual Queue System', desc: 'Antrian cerdas berbasis Redis menangani jutaan request tanpa crash.', color: 'text-brand-500', bg: 'bg-brand-500/8 border-brand-500/15' },
  { icon: Shield, title: 'Dynamic QR AES-256', desc: 'Tiket dienkripsi AES-256, refresh otomatis setiap 30 detik untuk anti-duplikasi.', color: 'text-accent-500', bg: 'bg-accent-500/8 border-accent-500/15' },
  { icon: CreditCard, title: 'Cashless E-Wallet', desc: 'Dompet digital terintegrasi untuk transaksi cepat di booth vendor.', color: 'text-emerald-500', bg: 'bg-emerald-500/8 border-emerald-500/15' },
  { icon: ScanLine, title: 'Offline Gate Scanner', desc: 'Gate check-in tetap berjalan tanpa internet, sinkron otomatis saat online.', color: 'text-amber-500', bg: 'bg-amber-500/8 border-amber-500/15' },
];

/* ── How It Works Steps ── */
const howItWorks = [
  { step: '01', title: 'Pilih Event', desc: 'Jelajahi ratusan event menarik. Filter berdasarkan kategori, lokasi, dan tanggal.', icon: Search },
  { step: '02', title: 'Pilih Zona & Bayar', desc: 'Pilih zona tiket (VVIP, VIP, Reguler) dan bayar instan melalui payment gateway.', icon: CreditCard },
  { step: '03', title: 'Tunjukkan QR Code', desc: 'Tiket digital dengan QR terenkripsi. Tunjukkan di gate untuk akses instan.', icon: ScanLine },
];

/* ── Testimonials ── */
const testimonials = [
  { name: 'Anisa Rahma', role: 'Pengunjung Konser', text: 'Beli tiket di TicketFlow super cepat! QR code langsung muncul, tinggal scan di gate. Anti ribet!', rating: 5 },
  { name: 'Budi Santoso', role: 'Event Organizer', text: 'Dashboard analytics-nya keren banget. Real-time tracking penjualan tiket bikin planning jadi mudah.', rating: 5 },
  { name: 'Citra Dewi', role: 'Staff Gate', text: 'Scanner offline-first sangat membantu saat jaringan di venue tidak stabil. Tetap bisa check-in!', rating: 5 },
];

/* ── Stats ── */
const stats = [
  { val: 10000, suffix: '+', label: 'Tiket Terjual', icon: TrendingUp },
  { val: 9999, suffix: '%', label: 'Uptime Server', icon: CheckCircle2 },
  { val: 300, suffix: 'ms', label: 'Scan Speed', icon: Zap },
];

/* ══════════ MAIN PAGE ══════════ */
export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const fetchEvents = async (q = '', cat = '') => {
    setLoading(true);
    try {
      const res = await eventAPI.getAll({ search: q, kategori: cat, limit: 6 });
      setEvents(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchEvents(search, activeCategory); };
  const handleCategory = (val: string) => { setActiveCategory(val); fetchEvents(search, val); };

  return (
    <div className="pt-16 pb-8 overflow-x-hidden">

      {/* ══════ HERO SECTION ══════ */}
      <section className="relative pt-14 pb-28 md:pt-20 md:pb-36">
        <div className="hero-glow top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/12 pointer-events-none" />
        <div className="hero-glow top-32 right-0 w-[350px] h-[350px] bg-accent-500/8 pointer-events-none" />
        <div className="hero-glow bottom-0 left-0 w-[250px] h-[250px] bg-emerald-500/5 pointer-events-none" />

        {/* Floating decorations */}
        <div className="absolute top-20 right-[15%] hidden lg:block animate-float-delayed pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/10 border border-brand-500/20 flex items-center justify-center backdrop-blur-sm">
            <Ticket className="w-6 h-6 text-brand-500/60" />
          </div>
        </div>
        <div className="absolute top-40 left-[8%] hidden lg:block animate-float pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center backdrop-blur-sm">
            <Music className="w-5 h-5 text-accent-500/60" />
          </div>
        </div>
        <div className="absolute bottom-20 right-[10%] hidden lg:block animate-float-slow pointer-events-none">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm">
            <Star className="w-5 h-5 text-emerald-500/50" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 section-label mb-7 shadow-glow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform SaaS Ticketing #1 Indonesia</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[hsl(var(--text-primary))] mb-6 leading-[1.05] text-balance">
            Event Impian Kamu,{' '}
            <span className="text-shimmer">Tanpa Hambatan</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-[hsl(var(--text-secondary))] max-w-2xl mx-auto mb-10 leading-relaxed">
            Pesan tiket konser, festival, dan seminar favoritmu secara instan.
            Cashless, aman, dan mudah — semua dalam satu platform.
          </motion.p>

          {/* Search Bar */}
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-2 p-2 card shadow-card-hover border-brand-500/25 rounded-2xl">
              <Search className="w-5 h-5 text-[hsl(var(--text-muted))] ml-3 flex-shrink-0" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event, konser, festival, seminar..."
                className="flex-1 bg-transparent px-2 py-2 text-sm text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-muted))] outline-none" />
              <button type="submit" className="btn-primary py-2.5 px-6 rounded-xl text-sm font-bold flex-shrink-0 shadow-glow-sm">
                Cari
              </button>
            </div>
          </motion.form>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/events" className="btn-primary btn-lg w-full sm:w-auto shadow-glow">
              <Ticket className="w-5 h-5" /> Jelajahi Semua Event
            </Link>
            <Link href="/register" className="btn-secondary btn-lg w-full sm:w-auto group">
              Buat Event Sendiri
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16 pt-8 border-t border-[hsl(var(--border-subtle))]">
            {stats.map(({ val, suffix, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black gradient-text">
                  <AnimatedCounter target={val} suffix={suffix} />
                </p>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1 font-medium">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════ EVENTS SECTION ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="section-label text-[11px] mb-2 inline-flex">🔥 Hot Events</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[hsl(var(--text-primary))] mt-1">Event Populer</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Temukan pengalaman yang tak terlupakan</p>
          </div>
          <Link href="/events" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-600 dark:text-brand-400 hover:gap-2.5 transition-all duration-200">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {categories.map(({ label, icon: Icon, value, emoji }) => (
            <button key={value} onClick={() => handleCategory(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeCategory === value
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'bg-[hsl(var(--bg-secondary))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] border border-[hsl(var(--border-subtle))]'
              }`}>
              {emoji ? <span>{emoji}</span> : <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonEventCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="card p-16 text-center space-y-3">
            <Ticket className="w-14 h-14 text-[hsl(var(--text-muted))] mx-auto opacity-50" />
            <p className="text-[hsl(var(--text-secondary))] font-semibold">Tidak ada event ditemukan.</p>
            <button onClick={() => { setSearch(''); setActiveCategory(''); fetchEvents('', ''); }} className="btn-ghost btn-sm mx-auto">
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => <EventCard key={event.id} event={event} index={index} />)}
          </div>
        )}
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-4">🎯 Mudah & Cepat</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[hsl(var(--text-primary))] mt-2 text-balance leading-tight">
            Bagaimana Cara{' '}<span className="gradient-text">Kerjanya?</span>
          </h2>
          <p className="text-sm sm:text-base text-[hsl(var(--text-secondary))] mt-4">
            Tiga langkah mudah dari memilih event sampai masuk ke venue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="relative group"
            >
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+60px)] w-[calc(100%-60px)] h-px bg-gradient-to-r from-brand-500/30 to-transparent" />
              )}
              <div className="card p-8 text-center hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-5xl font-black text-brand-500/8">{item.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-7 h-7 text-brand-500" />
                </div>
                <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] mb-2">{item.title}</h3>
                <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-4">⚡ Teknologi Terdepan</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[hsl(var(--text-primary))] mt-2 text-balance leading-tight">
            Mengapa Memilih{' '}<span className="gradient-text">SynapseTick?</span>
          </h2>
          <p className="text-sm sm:text-base text-[hsl(var(--text-secondary))] mt-4">
            Infrastruktur enterprise — dirancang untuk skala besar, keamanan tinggi, dan pengalaman terbaik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`card p-6 border flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300 group ${f.bg}`}>
              <div className={`w-12 h-12 rounded-2xl bg-[hsl(var(--bg-card))] border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 ${f.color} border-[hsl(var(--border-subtle))]`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[hsl(var(--text-primary))] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-label mb-4">💬 Testimoni</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[hsl(var(--text-primary))] mt-2 text-balance leading-tight">
            Kata Mereka Tentang{' '}<span className="gradient-text">SynapseTick</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card p-6 space-y-4 hover:-translate-y-1 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              {/* Quote */}
              <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>
              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[hsl(var(--border-subtle))]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-black">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[hsl(var(--text-primary))]">{t.name}</p>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ CTA BANNER ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="card-gradient p-10 md:p-16 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left max-w-xl">
              <span className="badge-info mb-4">Untuk Organizer & Promotor</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight text-balance">
                Siap Selenggarakan<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-400">Event Bintang Lima?</span>
              </h2>
              <p className="text-gray-300 mt-3 leading-relaxed text-sm sm:text-base">
                Analytics real-time, gate scanning offline, integrasi merchant, dan laporan finansial otomatis — semua dalam satu platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/register" className="btn-primary btn-lg shadow-glow inline-flex whitespace-nowrap">
                Daftar Sebagai Organizer <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/events" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white border border-white/20 hover:bg-white/10 transition-all">
                Lihat Event
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
