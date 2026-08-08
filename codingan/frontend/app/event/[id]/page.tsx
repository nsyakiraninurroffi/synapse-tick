'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventAPI, promoAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCheckout } from '@/lib/hooks/useCheckout';
import { VenueMap } from '@/components/ui/VenueMap';
import { FloorPlan } from '@/components/ui/FloorPlan';
import {
  MapPin, Calendar, Users, Ticket, Clock, Shield, Minus, Plus,
  CheckCircle, AlertCircle, Loader2, ArrowLeft, Zap, Lock, Tag,
  Info, Sparkles, Check, Music, Mic2, Star, Film, Trophy, Palette, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Seat {
  id: string;
  kategori: string;
  harga: number;
  kuota: number;
  terjual: number;
  tersedia: number;
  deskripsi?: string;
  benefits?: string[];
  warna?: string;
}

interface Event {
  id: string;
  namaEvent: string;
  lokasi: string;
  tanggal: string;
  kapasitas: number;
  logoUrl: string;
  bannerUrl?: string;
  deskripsi: string;
  kategoriEvent?: string;
  seatingType?: string;
  jamBuka?: string;
  jamTutup?: string;
  syaratKetentuan?: string;
  minAge?: number;
  maxTicketPerUser?: number;
  seats: Seat[];
  organizer: { nama: string; email: string };
  hasActivePromo?: boolean;
}

const categoryBadgeMap: Record<string, { label: string; icon: any; color: string }> = {
  konser: { label: 'Konser Musik 🎵', icon: Music, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  seminar: { label: 'Seminar & Talk 🎤', icon: Mic2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  festival: { label: 'Festival 🎪', icon: Star, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  theater: { label: 'Teater & Drama 🎭', icon: Film, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  olahraga: { label: 'Olahraga ⚽', icon: Trophy, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  exhibition: { label: 'Exhibition 🎨', icon: Palette, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
};

export default function EventDetailPage() {
  const { id: eventId } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const checkout = useCheckout(eventId as string);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getById(eventId as string);
        const eventData = res.data.data;
        setEvent(eventData);
        if (eventData.seats && eventData.seats.length > 0) {
          const available = eventData.seats.find((s: Seat) => s.tersedia > 0);
          setSelectedSeat(available || null);
        }
      } catch {
        toast.error('Event tidak ditemukan.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, router]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !selectedSeat) {
      toast.error('Masukkan kode promo terlebih dahulu.');
      return;
    }
    setValidatingPromo(true);
    try {
      const subtotal = Number(selectedSeat.harga) * quantity;
      const res = await promoAPI.validate({
        kode: promoCodeInput.trim(),
        eventId: eventId as string,
        totalHarga: subtotal,
      });
      setAppliedPromo(res.data.data);
      toast.success(`Promo "${res.data.data.kode}" berhasil dipasang! Diskon Rp ${res.data.data.discountAmount.toLocaleString('id-ID')}`);
    } catch (err: any) {
      setAppliedPromo(null);
      toast.error(err.response?.data?.message || 'Kode promo tidak valid.');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleBook = () => {
    if (!selectedSeat) {
      toast.error('Pilih kategori tiket terlebih dahulu.');
      return;
    }
    checkout.book(selectedSeat.id, quantity, appliedPromo?.kode);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-[hsl(var(--text-muted))] font-medium">Memuat detail event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const rawSubtotal = selectedSeat ? Number(selectedSeat.harga) * quantity : 0;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalPrice = Math.max(0, rawSubtotal - discountAmount);
  const maxAllowed = event.maxTicketPerUser || 4;

  const categoryBadge = categoryBadgeMap[event.kategoriEvent || 'konser'] || categoryBadgeMap.konser;

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Hero, Details, Seat Zones, Venue Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Banner */}
          <div className="relative h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-card border border-[hsl(var(--border-subtle))]">
            <img
              src={event.bannerUrl || event.logoUrl}
              alt={event.namaEvent}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--bg-card))] via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${categoryBadge.color}`}>
                {categoryBadge.label}
              </span>
              {event.minAge && (
                <span className="badge-warning text-xs font-bold">
                  {event.minAge}+ Only
                </span>
              )}
            </div>
          </div>

          {/* Event Header Info */}
          <div className="card p-6 sm:p-8 space-y-6">
            <div>
              <span className="section-label mb-2">Detail Event</span>
              <h1 className="text-2xl sm:text-4xl font-black text-[hsl(var(--text-primary))] mt-1 leading-tight">{event.namaEvent}</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-subtle))]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">Waktu & Tanggal</p>
                  <p className="text-sm font-bold text-[hsl(var(--text-primary))] mt-0.5">
                    {format(new Date(event.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-secondary))]">
                    {event.jamBuka && event.jamTutup ? `${event.jamBuka} - ${event.jamTutup} WIB` : `${format(new Date(event.tanggal), 'HH:mm')} WIB`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">Lokasi Venue</p>
                  <p className="text-sm font-bold text-[hsl(var(--text-primary))] mt-0.5">{event.lokasi}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">Kapasitas</p>
                  <p className="text-sm font-bold text-[hsl(var(--text-primary))] mt-0.5">{event.kapasitas.toLocaleString('id-ID')} orang</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">Organizer</p>
                  <p className="text-sm font-bold text-[hsl(var(--text-primary))] mt-0.5">{event.organizer.nama}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.deskripsi && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[hsl(var(--text-primary))]">Deskripsi Event</h3>
                <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-line">
                  {event.deskripsi}
                </p>
              </div>
            )}

            {/* Terms & Conditions */}
            {event.syaratKetentuan && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Syarat & Ketentuan
                </h4>
                <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-line">
                  {event.syaratKetentuan}
                </p>
              </div>
            )}
          </div>

          {/* Visual 2D Venue Seating Map */}
          {event.seats && event.seats.length > 0 && (
            <FloorPlan
              seats={event.seats}
              selectedSeatId={selectedSeat?.id}
              onSelectSeat={(seat) => {
                setSelectedSeat(seat);
                setQuantity(1);
              }}
            />
          )}

          {/* Seat Categories & Zone Selector */}
          <div className="card p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Pilih Zona / Kategori Tiket</h2>
              <p className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">Pilih tempat atau zona yang sesuai dengan keinginan Anda</p>
            </div>

            <div className="space-y-4">
              {event.seats.map((seat) => {
                const isSelected = selectedSeat?.id === seat.id;
                const isSoldOut = seat.tersedia <= 0;

                return (
                  <div
                    key={seat.id}
                    onClick={() => !isSoldOut && setSelectedSeat(seat)}
                    className={clsx(
                      'p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3',
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 shadow-glow-sm'
                        : !isSoldOut
                        ? 'border-[hsl(var(--border-color))] hover:border-brand-500/50 hover:bg-[hsl(var(--bg-secondary))]'
                        : 'border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-secondary))] opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {seat.warna && (
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: seat.warna }} />
                        )}
                        <span className="font-bold text-lg text-[hsl(var(--text-primary))]">{seat.kategori}</span>
                        {isSoldOut ? (
                          <span className="badge-error text-[10px]">Habis</span>
                        ) : seat.tersedia <= 10 ? (
                          <span className="badge-warning text-[10px]">Tersisa {seat.tersedia}</span>
                        ) : (
                          <span className="badge-success text-[10px]">Tersedia ({seat.tersedia})</span>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
                          Rp {Number(seat.harga).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {seat.deskripsi && (
                      <p className="text-xs text-[hsl(var(--text-secondary))]">{seat.deskripsi}</p>
                    )}

                    {/* Zone Benefits Checklist */}
                    {seat.benefits && seat.benefits.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2 border-t border-[hsl(var(--border-subtle))]">
                        {seat.benefits.map((b, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--text-secondary))] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                            <Check className="w-3 h-3 text-emerald-400" /> {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaflet OpenStreetMap */}
          <div className="card p-6 sm:p-8">
            <VenueMap address={event.lokasi} venueName={event.namaEvent} />
          </div>
        </div>

        {/* Right 1 Col: Order Summary & Checkout Action */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Ringkasan Pemesanan</h2>

              {/* Selected Seat Box */}
              {selectedSeat ? (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 space-y-1">
                  <p className="text-xs text-[hsl(var(--text-muted))]">Zona Dipilih</p>
                  <p className="font-bold text-base text-[hsl(var(--text-primary))]">{selectedSeat.kategori}</p>
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    Rp {Number(selectedSeat.harga).toLocaleString('id-ID')} / tiket
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[hsl(var(--border-color))] text-center text-xs text-[hsl(var(--text-muted))]">
                  Silakan pilih zona tiket terlebih dahulu
                </div>
              )}

              {/* Quantity Counter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[hsl(var(--text-secondary))] block">
                  Jumlah Tiket (Maks. {maxAllowed} per user)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || checkout.step !== 'idle'}
                    className="w-10 h-10 rounded-xl border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-secondary))] flex items-center justify-center font-bold text-[hsl(var(--text-primary))] hover:bg-brand-500 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black text-[hsl(var(--text-primary))] w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                    disabled={quantity >= maxAllowed || checkout.step !== 'idle'}
                    className="w-10 h-10 rounded-xl border border-[hsl(var(--border-color))] bg-[hsl(var(--bg-secondary))] flex items-center justify-center font-bold text-[hsl(var(--text-primary))] hover:bg-brand-500 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Promo Code Input Box */}
              <div className="space-y-2 pt-2 border-t border-[hsl(var(--border-subtle))]">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-brand-500" /> Kode Promo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: EARLYBIRD"
                    className="input-field py-2 text-xs uppercase tracking-wider flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoCodeInput.trim()}
                    className="btn-secondary btn-sm whitespace-nowrap text-xs"
                  >
                    {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pasang'}
                  </button>
                </div>
                {appliedPromo && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                    <span>Diskon <strong>{appliedPromo.kode}</strong>: -Rp {appliedPromo.discountAmount.toLocaleString('id-ID')}</span>
                    <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-[hsl(var(--border-subtle))] space-y-2 text-xs">
                <div className="flex justify-between text-[hsl(var(--text-secondary))]">
                  <span>Subtotal ({quantity} tiket)</span>
                  <span>Rp {rawSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Diskon Promo</span>
                    <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-[hsl(var(--border-subtle))] font-bold">
                  <span className="text-[hsl(var(--text-primary))]">Total Bayar</span>
                  <span className="text-2xl font-black gradient-text">
                    Rp {finalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBook}
                disabled={checkout.isProcessing || !selectedSeat}
                className="btn-primary w-full py-4 text-base font-bold shadow-glow flex items-center justify-center gap-2"
              >
                {checkout.isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengalihkan ke Checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Lanjut ke Pembayaran Midtrans
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-[hsl(var(--text-muted))]">
                  <Link href="/login" className="text-brand-500 font-bold hover:underline">Masuk</Link> untuk pesan tiket
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
