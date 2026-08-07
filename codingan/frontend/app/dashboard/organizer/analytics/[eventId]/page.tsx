'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { analyticsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  BarChart3, DollarSign, Ticket, CheckCircle2, Store, ArrowLeft,
  RefreshCw, Users, Calendar, TrendingUp, Sparkles, Clock, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DetailedAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await analyticsAPI.getEventAnalytics(eventId);
      setData(res.data.data);
    } catch {
      toast.error('Gagal mengambil analytics event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'organizer') { toast.error('Akses khusus organizer.'); router.push('/'); return; }
    fetchAnalytics();
  }, [eventId, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-500" />
        <p className="text-sm text-[hsl(var(--text-muted))]">Memuat data analytics detail...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-lg font-bold text-[hsl(var(--text-primary))]">Data analytics tidak ditemukan.</p>
        <Link href="/dashboard/organizer" className="btn-primary btn-sm inline-flex">Kembali ke Dashboard</Link>
      </div>
    );
  }

  const { event, revenuePerCategory, totalRevenue, vendorRevenue, checkInCount, checkInTimeline } = data;
  const totalSoldTickets = revenuePerCategory.reduce((sum: number, c: any) => sum + c.terjual, 0);
  const totalCapacity = revenuePerCategory.reduce((sum: number, c: any) => sum + c.kuota, 0);

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/organizer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))] flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-brand-500" /> Analytics Detail: {event.namaEvent}
          </h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" />
            {format(new Date(event.tanggal), 'dd MMMM yyyy · HH:mm', { locale: localeId })}
          </p>
        </div>

        <button onClick={fetchAnalytics} className="btn-secondary btn-sm">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 space-y-2 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Pendapatan Tiket</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">
            Rp {Number(totalRevenue || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))]">Dari {totalSoldTickets} tiket terjual</p>
        </div>

        <div className="card p-5 space-y-2 border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Pendapatan Vendor</span>
            <Store className="w-5 h-5 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">
            Rp {Number(vendorRevenue || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))]">Total transaksi booth makanan/merch</p>
        </div>

        <div className="card p-5 space-y-2 border-accent-500/20 bg-accent-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Tiket Terjual</span>
            <Ticket className="w-5 h-5 text-accent-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">
            {totalSoldTickets} <span className="text-sm font-normal text-[hsl(var(--text-muted))]">/ {totalCapacity}</span>
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))]">
            {totalCapacity > 0 ? ((totalSoldTickets / totalCapacity) * 100).toFixed(1) : 0}% Okupansi Terisi
          </p>
        </div>

        <div className="card p-5 space-y-2 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Gate Check-Ins</span>
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">
            {checkInCount} <span className="text-sm font-normal text-[hsl(var(--text-muted))]">penonton</span>
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))]">
            {totalSoldTickets > 0 ? ((checkInCount / totalSoldTickets) * 100).toFixed(1) : 0}% Sudah masuk venue
          </p>
        </div>
      </div>

      {/* Zone Category Breakdown Table */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
          <Ticket className="w-5 h-5 text-brand-500" /> Breakdown Per Kategori Zona Tiket
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-xs font-bold uppercase">
                <th className="py-3 px-4">Kategori Zona</th>
                <th className="py-3 px-4">Harga Satuan</th>
                <th className="py-3 px-4">Kuota Total</th>
                <th className="py-3 px-4">Terjual</th>
                <th className="py-3 px-4">Tersedia</th>
                <th className="py-3 px-4 text-right">Subtotal Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
              {revenuePerCategory.map((cat: any) => {
                const occupancy = cat.kuota > 0 ? (cat.terjual / cat.kuota) * 100 : 0;
                return (
                  <tr key={cat.kategori} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                    <td className="py-4 px-4 font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-brand-500" />
                      {cat.kategori}
                    </td>
                    <td className="py-4 px-4">
                      Rp {Number(cat.harga).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 font-mono">{cat.kuota}</td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-500">{cat.terjual}</span>
                        <div className="w-24 h-1.5 rounded-full bg-[hsl(var(--bg-secondary))] overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(occupancy, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-[hsl(var(--text-muted))]">{cat.tersedia}</td>
                    <td className="py-4 px-4 text-right font-bold font-mono text-emerald-500">
                      Rp {Number(cat.revenue).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-in Timeline Log */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Log Check-in Penonton
        </h2>

        {checkInTimeline.length === 0 ? (
          <div className="p-8 text-center text-sm text-[hsl(var(--text-muted))]">
            Belum ada penonton yang melakukan check-in di gate.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {checkInTimeline.map((timeStr: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-[hsl(var(--bg-secondary))] flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[hsl(var(--text-primary))] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Penonton Check-in #{idx + 1}
                </span>
                <span className="text-[hsl(var(--text-muted))] font-mono">
                  {format(new Date(timeStr), 'dd MMM yyyy · HH:mm:ss', { locale: localeId })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
