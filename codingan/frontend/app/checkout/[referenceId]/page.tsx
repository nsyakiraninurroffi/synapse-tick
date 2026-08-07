'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { paymentAPI } from '@/lib/api';
import MidtransCheckout from '@/components/payment/MidtransCheckout';
import CountdownTimer from '@/components/ui/CountdownTimer';
import {
  Ticket, Calendar, MapPin, ArrowLeft, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, Loader2, Sparkles, Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const { referenceId } = useParams();
  const router = useRouter();

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await paymentAPI.checkStatus(referenceId as string);
      const data = res.data.data;
      setTransaction(data);

      if (data.status === 'success') {
        router.push(`/my-tickets`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transaksi tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [referenceId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-[hsl(var(--text-secondary))]">Memuat detail pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-[hsl(var(--text-primary))]">Transaksi Tidak Ditemukan</h2>
          <p className="text-xs text-[hsl(var(--text-secondary))]">{error || 'ID Transaksi tidak valid.'}</p>
          <Link href="/events" className="btn-primary btn-sm inline-flex">
            Kembali ke Event
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = transaction.status === 'failed' || (transaction.expiredAt && new Date() > new Date(transaction.expiredAt));

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header Back Link */}
      <Link href="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Event
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Order Summary (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[hsl(var(--border-subtle))]">
              <span className="badge-info text-xs"><Sparkles className="w-3.5 h-3.5" /> Summary Ringkasan Pesanan</span>
              <span className="text-xs font-mono font-bold text-[hsl(var(--text-muted))]">#{transaction.referenceId}</span>
            </div>

            {/* Event Header */}
            {transaction.event && (
              <div className="flex gap-4">
                {transaction.event.logoUrl ? (
                  <img src={transaction.event.logoUrl} alt={transaction.event.namaEvent} className="w-20 h-20 rounded-xl object-cover border border-[hsl(var(--border-color))]" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                    <Ticket className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[hsl(var(--text-primary))] leading-snug">{transaction.event.namaEvent}</h3>
                  <div className="space-y-1 mt-2 text-xs text-[hsl(var(--text-secondary))]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{format(new Date(transaction.event.tanggal), 'EEEE, d MMMM yyyy · HH:mm', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent-500" />
                      <span>{transaction.event.lokasi}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-[hsl(var(--border-subtle))] text-xs">
              <div className="flex justify-between text-[hsl(var(--text-secondary))]">
                <span>Subtotal Tiket</span>
                <span className="font-semibold text-[hsl(var(--text-primary))]">Rp {Number(transaction.jumlah).toLocaleString('id-ID')}</span>
              </div>
              {Number(transaction.diskon) > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Diskon Promo</span>
                  <span className="font-bold">- Rp {Number(transaction.diskon).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[hsl(var(--text-primary))] pt-3 border-t border-[hsl(var(--border-subtle))]">
                <span>Total Pembayaran</span>
                <span className="gradient-text text-base">Rp {Number(transaction.totalBayar || transaction.jumlah).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Countdown & Instructions */}
          {!isExpired && transaction.expiredAt && (
            <div className="card p-5 bg-gradient-to-r from-amber-500/10 via-brand-500/5 to-transparent border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-500 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-[hsl(var(--text-primary))]">Batas Waktu Pembayaran</p>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">Selesaikan transaksi sebelum tiket hangus</p>
                </div>
              </div>
              <CountdownTimer expiresAt={transaction.expiredAt} />
            </div>
          )}
        </div>

        {/* Right Column: Midtrans Payment Widget (2 cols) */}
        <div className="md:col-span-2">
          {isExpired ? (
            <div className="card p-8 text-center space-y-3 border-red-500/20 bg-red-500/5">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-[hsl(var(--text-primary))]">Pembayaran Kadaluarsa</h3>
              <p className="text-xs text-[hsl(var(--text-secondary))]">Batas waktu pembayaran 15 menit telah habis. Tiket telah dilepas kembali.</p>
              <Link href="/events" className="btn-primary btn-sm inline-flex">Pesan Ulang Tiket</Link>
            </div>
          ) : (
            <MidtransCheckout
              referenceId={transaction.referenceId}
              totalBayar={Number(transaction.totalBayar || transaction.jumlah)}
              onSuccess={() => router.push('/my-tickets')}
              onPending={() => fetchStatus()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
