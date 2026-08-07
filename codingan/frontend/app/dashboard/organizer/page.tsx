'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsAPI, eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  TrendingUp, Ticket, DollarSign, Plus, RefreshCw, Calendar,
  CheckCircle, Eye, EyeOff, BarChart3, Users, ArrowRight, Gift
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkeletonStatCard } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

/* ── Types ── */
interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalCheckIns: number;
}

/* ── KPI Card ── */
function KPICard({ icon: Icon, label, value, sub, color, bg, delay = 0 }: {
  icon: any; label: string; value: string; sub: string; color: string; bg: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5 space-y-2 group hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center justify-between text-[hsl(var(--text-muted))]">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-[hsl(var(--text-primary))] tabular-nums">{value}</p>
      <p className="text-[11px] text-[hsl(var(--text-muted))]">{sub}</p>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function OrganizerDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashRes, eventRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        eventAPI.getMyEvents(),
      ]);
      setStats(dashRes.data.data);
      setEvents(eventRes.data.data);
    } catch {
      toast.error('Gagal mengambil data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'organizer') { toast.error('Akses khusus organizer.'); router.push('/'); return; }
    fetchData();
  }, [isAuthenticated, user, router]);

  const handleTogglePublish = async (eventId: string) => {
    try {
      await eventAPI.togglePublish(eventId);
      toast.success('Status event diperbarui.');
      fetchData();
    } catch {
      toast.error('Gagal mengubah status.');
    }
  };

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="section-label mb-2">Organizer Hub</span>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))] mt-2">Dashboard Organizer</h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
            Pantau penjualan tiket dan performa event secara real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link href="/events/create" className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Buat Event Baru
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard icon={DollarSign} label="Total Pendapatan" color="text-emerald-500" bg="bg-emerald-500/10"
          value={`Rp ${Number(stats?.totalRevenue || 0).toLocaleString('id-ID')}`}
          sub="Real-time dari penjualan tiket" delay={0} />
        <KPICard icon={Ticket} label="Tiket Terjual" color="text-brand-500" bg="bg-brand-500/10"
          value={(stats?.totalTicketsSold || 0).toLocaleString('id-ID')}
          sub="Total dari semua event aktif" delay={0.05} />
        <KPICard icon={CheckCircle} label="Gate Check-Ins" color="text-accent-500" bg="bg-accent-500/10"
          value={(stats?.totalCheckIns || 0).toLocaleString('id-ID')}
          sub="Tersinkronisasi real-time" delay={0.1} />
        <KPICard icon={Calendar} label="Total Event" color="text-purple-500" bg="bg-purple-500/10"
          value={String(events.length)}
          sub="Event terdaftar di platform" delay={0.15} />
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/events/create" className="card p-5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-3 rounded-2xl bg-brand-500/10"><Plus className="w-5 h-5 text-brand-500" /></div>
          <div>
            <p className="font-bold text-[hsl(var(--text-primary))] group-hover:text-brand-500 transition-colors">Buat Event Baru</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">Wizard 3 langkah mudah</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[hsl(var(--text-muted))] ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href={events.length > 0 ? `/dashboard/organizer/analytics/${events[0].id}` : '/dashboard/organizer'} className="card p-5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-3 rounded-2xl bg-accent-500/10"><BarChart3 className="w-5 h-5 text-accent-500" /></div>
          <div>
            <p className="font-bold text-[hsl(var(--text-primary))] group-hover:text-accent-500 transition-colors">Analytics Detail</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">Grafik penjualan lengkap</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[hsl(var(--text-muted))] ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/dashboard/organizer/promo" className="card p-5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-3 rounded-2xl bg-emerald-500/10"><Gift className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <p className="font-bold text-[hsl(var(--text-primary))] group-hover:text-emerald-500 transition-colors">Kelola Promo</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">Buat kode diskon event</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[hsl(var(--text-muted))] ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ── Events Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Daftar Event Saya</h2>
          <span className="badge-neutral text-xs">{events.length} event</span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-sm text-[hsl(var(--text-muted))] space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-[hsl(var(--text-muted))] opacity-40" />
            <p>Anda belum membuat event apapun.</p>
            <Link href="/events/create" className="btn-primary btn-sm inline-flex">Buat Event Pertama</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-xs font-bold uppercase">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Terjual</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {events.map((evt: any) => (
                  <tr key={evt.id} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                    <td className="py-4 px-4 font-bold text-[hsl(var(--text-primary))]">
                      <Link href={`/event/${evt.id}`} className="hover:text-brand-500 transition-colors">
                        {evt.namaEvent}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className="badge-info text-[10px]">{evt.kategoriEvent || 'konser'}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-[hsl(var(--text-secondary))]">
                      {format(new Date(evt.tanggal), 'd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono font-bold text-[hsl(var(--text-primary))]">
                      {evt._count?.tickets || 0} tiket
                    </td>
                    <td className="py-4 px-4">
                      {evt.isPublished
                        ? <span className="badge-success text-[10px]">Published</span>
                        : <span className="badge-neutral text-[10px]">Draft</span>
                      }
                    </td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                      <Link href={`/dashboard/organizer/analytics/${evt.id}`} className="btn-secondary btn-sm text-xs py-1 px-2.5">
                        <BarChart3 className="w-3.5 h-3.5" /> Analytics
                      </Link>
                      <button onClick={() => handleTogglePublish(evt.id)} className="btn-ghost btn-sm text-xs py-1 px-2.5">
                        {evt.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {evt.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
