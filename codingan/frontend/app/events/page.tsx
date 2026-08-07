'use client';

import { useEffect, useState } from 'react';
import { eventAPI } from '@/lib/api';
import Link from 'next/link';
import { MapPin, Calendar, Users, ArrowRight, Ticket, Search, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { SkeletonEventCard } from '@/components/ui/Skeleton';

interface Event {
  id: string;
  namaEvent: string;
  lokasi: string;
  tanggal: string;
  kapasitas: number;
  logoUrl: string;
  deskripsi: string;
  seats: Array<{ kategori: string; harga: number; kuota: number }>;
  _count: { tickets: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchEvents = async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await eventAPI.getAll({ search: q, page: p, limit: 9 });
      setEvents(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(search, page);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents(search, 1);
  };

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="py-8 text-center max-w-2xl mx-auto space-y-3">
        <span className="section-label">Jelajahi Event</span>
        <h1 className="text-3xl sm:text-5xl font-black text-[hsl(var(--text-primary))]">
          Semua <span className="gradient-text">Event & Konser</span>
        </h1>
        <p className="text-sm sm:text-base text-[hsl(var(--text-secondary))]">
          Temukan konser musik, festival, eksibisi, dan seminar terbaik di seluruh Indonesia
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama event, lokasi, atau promotor..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-6 text-sm font-bold flex-shrink-0">Cari</button>
        </form>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 card self-start flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-xl transition-all',
              viewMode === 'grid' ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-xl transition-all',
              viewMode === 'list' ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Counter */}
      {!loading && (
        <p className="text-xs text-[hsl(var(--text-muted))]">
          Menampilkan <span className="font-bold text-[hsl(var(--text-primary))]">{events.length}</span> dari{' '}
          <span className="font-bold text-[hsl(var(--text-primary))]">{pagination.total}</span> event aktif
        </p>
      )}

      {/* Events List / Grid */}
      {loading ? (
        <div className={clsx(
          'gap-6',
          viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col space-y-3'
        )}>
          {[...Array(6)].map((_, i) => <SkeletonEventCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-[hsl(var(--text-muted))] mx-auto" />
          <p className="text-base font-bold text-[hsl(var(--text-primary))]">Tidak Ada Event Ditemukan</p>
          <p className="text-xs text-[hsl(var(--text-muted))]">Coba cari dengan kata kunci kota atau kategori lain.</p>
          <button onClick={() => { setSearch(''); fetchEvents('', 1); }} className="btn-ghost btn-sm">Reset Filter</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => {
            const minPrice = event.seats.length > 0 ? Math.min(...event.seats.map((s) => Number(s.harga))) : 0;
            const totalSold = event._count?.tickets || 0;
            const totalCap = event.seats.reduce((sum, s) => sum + Number(s.kuota), 0);
            const occupancy = totalCap > 0 ? (totalSold / totalCap) * 100 : 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link href={`/event/${event.id}`} className="group block h-full">
                  <div className="card-hover overflow-hidden h-full flex flex-col justify-between group">
                    <div>
                      <div className="relative h-48 bg-surface-800 overflow-hidden">
                        {event.logoUrl ? (
                          <img src={event.logoUrl} alt={event.namaEvent} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-900/40">
                            <Ticket className="w-12 h-12 text-brand-500/40" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 badge-info font-bold backdrop-blur-md">
                          Mulai Rp {minPrice.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <h3 className="font-bold text-lg text-[hsl(var(--text-primary))] line-clamp-1 group-hover:text-brand-500 transition-colors">
                          {event.namaEvent}
                        </h3>
                        <div className="space-y-1.5 text-xs text-[hsl(var(--text-secondary))]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            {format(new Date(event.tanggal), 'EEEE, d MMM yyyy', { locale: id })}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-accent-500 flex-shrink-0" />
                            <span className="line-clamp-1">{event.lokasi}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="progress-bar">
                            <div className={`progress-fill ${occupancy > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(occupancy, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between border-t border-[hsl(var(--border-subtle))] pt-3 mt-auto">
                      <span className="text-xs text-[hsl(var(--text-muted))]">{occupancy.toFixed(0)}% terjual</span>
                      <span className="text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                        Beli Tiket <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {events.map((event, idx) => {
            const minPrice = event.seats.length > 0 ? Math.min(...event.seats.map((s) => Number(s.harga))) : 0;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <Link href={`/event/${event.id}`} className="group block">
                  <div className="card-hover p-4 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-800 border flex-shrink-0">
                      {event.logoUrl ? (
                        <img src={event.logoUrl} alt={event.namaEvent} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-900/40">
                          <Ticket className="w-8 h-8 text-brand-500/40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[hsl(var(--text-primary))] group-hover:text-brand-500 transition-colors truncate">
                        {event.namaEvent}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--text-secondary))] mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-500" />
                          {format(new Date(event.tanggal), 'd MMM yyyy', { locale: id })}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent-500" />
                          <span className="truncate">{event.lokasi}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-brand-600 dark:text-brand-400">Rp {minPrice.toLocaleString('id-ID')}</p>
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-bold flex items-center justify-end gap-1 mt-1">
                        Pesan <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            ← Sebelumnya
          </button>

          <div className="flex gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={clsx(
                  'w-8 h-8 rounded-xl text-xs font-bold transition-all',
                  page === i + 1
                    ? 'bg-brand-600 text-white shadow-glow-sm'
                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}
