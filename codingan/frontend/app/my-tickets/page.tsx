'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Ticket, Calendar, MapPin, QrCode, ArrowRight, ShieldCheck, Clock, CheckCircle2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkeletonTicket } from '@/components/ui/Skeleton';
import clsx from 'clsx';
import { toast } from 'sonner';

interface TicketItem {
  id: string;
  status: string;
  qrToken: string;
  createdAt: string;
  event: {
    id: string;
    namaEvent: string;
    lokasi: string;
    tanggal: string;
    logoUrl: string;
  };
  seat: {
    kategori: string;
    harga: number;
  };
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchTickets = async () => {
      try {
        const res = await ticketAPI.getMyTickets();
        setTickets(res.data.data);
      } catch {
        toast.error('Gagal mengambil daftar tiket.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAuthenticated, router]);

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'active') return t.status === 'lunas' || t.status === 'booking';
    if (activeTab === 'used') return t.status === 'check_in' || t.status === 'expired';
    return true;
  });

  return (
    <div className="pt-20 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="section-label mb-2">Dompet Tiket</span>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))]">Tiket Saya</h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Kelola dan tampilkan E-Ticket event Anda di sini</p>
        </div>

        <Link href="/events" className="btn-primary btn-sm self-start sm:self-auto">
          + Cari Event Baru
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 card w-fit mb-8">
        {[
          { id: 'all', label: 'Semua Tiket' },
          { id: 'active', label: 'Aktif' },
          { id: 'used', label: 'Selesai / Expired' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'px-4 py-2 text-xs font-bold rounded-xl transition-all',
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonTicket key={i} />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-500">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))]">Belum Ada Tiket</h3>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Anda belum memiliki tiket di kategori ini.</p>
          </div>
          <Link href="/" className="btn-primary btn-sm inline-flex">
            Jelajahi Event Terdekat
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t, idx) => {
            const isPaid = t.status === 'lunas';
            const isCheckedIn = t.status === 'check_in';
            const isBooking = t.status === 'booking';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <div className="card-hover p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group">
                  <div className="flex items-center gap-4">
                    {/* Event Logo Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-800 border overflow-hidden flex-shrink-0 relative">
                      {t.event.logoUrl ? (
                        <img src={t.event.logoUrl} alt={t.event.namaEvent} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-900/50">
                          <Ticket className="w-8 h-8 text-brand-400 opacity-60" />
                        </div>
                      )}
                    </div>

                    {/* Ticket Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-info text-[10px]">{t.seat.kategori}</span>
                        {isCheckedIn ? (
                          <span className="badge-neutral text-[10px]"><CheckCircle2 className="w-3 h-3" /> Check-in</span>
                        ) : isPaid ? (
                          <span className="badge-success text-[10px]"><ShieldCheck className="w-3 h-3" /> Aktif</span>
                        ) : isBooking ? (
                          <span className="badge-warning text-[10px]"><Clock className="w-3 h-3" /> Menunggu Bayar</span>
                        ) : (
                          <span className="badge-error text-[10px]">Expired</span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--text-primary))] group-hover:text-brand-500 transition-colors line-clamp-1">
                        {t.event.namaEvent}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--text-muted))]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                          {format(new Date(t.event.tanggal), 'd MMM yyyy, HH:mm', { locale: id })} WIB
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-accent-500" />
                          {t.event.lokasi}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[hsl(var(--border-subtle))]">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[hsl(var(--text-muted))]">Harga Tiket</p>
                      <p className="text-sm font-bold text-[hsl(var(--text-primary))]">
                        Rp {Number(t.seat.harga).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <Link href={`/tickets/${t.id}`} className="btn-primary btn-sm flex-shrink-0">
                      <QrCode className="w-4 h-4" /> Lihat QR
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
