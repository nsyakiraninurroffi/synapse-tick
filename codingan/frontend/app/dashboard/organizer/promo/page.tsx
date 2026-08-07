'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { promoAPI, eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Tag, Plus, Trash2, Calendar, CheckCircle2, AlertCircle, RefreshCw,
  Gift, Percent, DollarSign, ArrowLeft, Loader2, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PromoManagerPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [kode, setKode] = useState('');
  const [diskon, setDiskon] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [kuota, setKuota] = useState('');
  const [berlakuSampai, setBerlakuSampai] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch organizer events
  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'organizer') { toast.error('Akses khusus organizer.'); router.push('/'); return; }

    eventAPI.getMyEvents()
      .then((res) => {
        const evts = res.data.data;
        setEvents(evts);
        if (evts.length > 0) setSelectedEventId(evts[0].id);
      })
      .catch(() => toast.error('Gagal mengambil daftar event.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  // Fetch promo codes for selected event
  const fetchPromos = async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await promoAPI.getByEvent(eventId);
      setPromos(res.data.data);
    } catch {
      toast.error('Gagal mengambil kode promo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) fetchPromos(selectedEventId);
  }, [selectedEventId]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !kode || !diskon || !kuota || !berlakuSampai) {
      toast.error('Semua field wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await promoAPI.create({
        eventId: selectedEventId,
        kode,
        diskon: Number(diskon),
        isPercentage,
        kuota: Number(kuota),
        berlakuSampai,
      });
      toast.success(`Kode promo "${kode.toUpperCase()}" berhasil dibuat! 🎉`);
      setKode('');
      setDiskon('');
      setKuota('');
      setBerlakuSampai('');
      setShowForm(false);
      fetchPromos(selectedEventId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat kode promo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (promoId: string, kodePromo: string) => {
    if (!confirm(`Hapus kode promo "${kodePromo}"?`)) return;
    try {
      await promoAPI.delete(promoId);
      toast.success(`Kode promo "${kodePromo}" berhasil dihapus.`);
      fetchPromos(selectedEventId);
    } catch {
      toast.error('Gagal menghapus kode promo.');
    }
  };

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/organizer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))] flex items-center gap-2.5">
            <Gift className="w-8 h-8 text-emerald-500" /> Kelola Kode Promo
          </h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
            Buat voucher dan diskon khusus untuk menarik lebih banyak pembeli tiket
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => fetchPromos(selectedEventId)} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm shadow-glow">
            <Plus className="w-4 h-4" /> {showForm ? 'Tutup Form' : 'Buat Promo Baru'}
          </button>
        </div>
      </div>

      {/* Event Selection Bar */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[hsl(var(--bg-card))] border-brand-500/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Pilih Event Target</p>
            <p className="text-sm font-bold text-[hsl(var(--text-primary))]">Kelola diskon khusus event</p>
          </div>
        </div>

        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input-field sm:w-80 py-2 text-sm font-bold"
        >
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.namaEvent} ({format(new Date(evt.tanggal), 'dd MMM yyyy')})
            </option>
          ))}
        </select>
      </div>

      {/* Collapsible Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleCreatePromo}
          className="card p-6 space-y-5 border-emerald-500/30 bg-emerald-500/5"
        >
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> Buat Kode Promo Baru
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase">Kode Promo</label>
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="CONTOH: HEMAT50"
                className="input-field font-mono font-bold uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase">Tipe & Besar Diskon</label>
              <div className="flex gap-2">
                <select
                  value={isPercentage ? 'percent' : 'flat'}
                  onChange={(e) => setIsPercentage(e.target.value === 'percent')}
                  className="input-field w-28 text-xs font-bold"
                >
                  <option value="percent">% Persen</option>
                  <option value="flat">Rp Nominal</option>
                </select>
                <input
                  type="number"
                  value={diskon}
                  onChange={(e) => setDiskon(e.target.value)}
                  placeholder={isPercentage ? '20' : '50000'}
                  className="input-field flex-1"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase">Kuota Penggunaan</label>
              <input
                type="number"
                value={kuota}
                onChange={(e) => setKuota(e.target.value)}
                placeholder="100"
                className="input-field"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase">Berlaku Sampai</label>
              <input
                type="date"
                value={berlakuSampai}
                onChange={(e) => setBerlakuSampai(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost btn-sm">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm shadow-glow">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kode Promo'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Promo List Table */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Daftar Kode Promo Active</h2>
          <span className="badge-info text-xs">{promos.length} promo</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[hsl(var(--text-muted))] space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
            <p>Memuat data kode promo...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="p-12 text-center text-sm text-[hsl(var(--text-muted))] space-y-2">
            <Tag className="w-10 h-10 mx-auto text-[hsl(var(--text-muted))] opacity-40" />
            <p>Belum ada kode promo untuk event ini.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary btn-sm inline-flex">Buat Kode Promo Pertama</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-xs font-bold uppercase">
                  <th className="py-3 px-4">Kode Promo</th>
                  <th className="py-3 px-4">Diskon</th>
                  <th className="py-3 px-4">Kuota Terpakai</th>
                  <th className="py-3 px-4">Berlaku Sampai</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {promos.map((p) => {
                  const isExpired = new Date() > new Date(p.berlakuSampai);
                  const isExhausted = p.terpakai >= p.kuota;
                  return (
                    <tr key={p.id} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {p.kode}
                      </td>
                      <td className="py-4 px-4 font-bold text-[hsl(var(--text-primary))]">
                        {p.isPercentage ? `${p.diskon}%` : `Rp ${Number(p.diskon).toLocaleString('id-ID')}`}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <span className="font-bold text-[hsl(var(--text-primary))]">{p.terpakai}</span> / {p.kuota} terpakai
                      </td>
                      <td className="py-4 px-4 text-xs text-[hsl(var(--text-secondary))]">
                        {format(new Date(p.berlakuSampai), 'dd MMM yyyy', { locale: localeId })}
                      </td>
                      <td className="py-4 px-4">
                        {isExpired ? (
                          <span className="badge-error text-[10px]">Kadaluarsa</span>
                        ) : isExhausted ? (
                          <span className="badge-warning text-[10px]">Kuota Habis</span>
                        ) : (
                          <span className="badge-success text-[10px]">Aktif</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => handleDeletePromo(p.id, p.kode)} className="btn-ghost btn-sm text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
