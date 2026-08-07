'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Calendar, MapPin, Users, Ticket, Plus, Trash2, ArrowLeft,
  Image as ImageIcon, AlignLeft, Sparkles, CheckCircle2, Loader2, DollarSign, Layers,
  Clock, Shield, Tag, Music, Mic2, Star, Film, Trophy, Palette, Check, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import clsx from 'clsx';

interface SeatInput {
  kategori: string;
  harga: string;
  kuota: string;
  deskripsi: string;
  benefits: string[];
  warna: string;
}

const categories = [
  { value: 'konser', label: 'Konser Musik', icon: Music, desc: 'Panggung musik, festival band & penyanyi' },
  { value: 'seminar', label: 'Seminar / Talk', icon: Mic2, desc: 'Konferensi, workshop & edukasi' },
  { value: 'festival', label: 'Festival', icon: Star, desc: 'Festival seni, kuliner, & fashion' },
  { value: 'theater', label: 'Teater & Drama', icon: Film, desc: 'Pertunjukan seni peran & drama' },
  { value: 'olahraga', label: 'Olahraga', icon: Trophy, desc: 'Pertandingan liga & kompetisi' },
  { value: 'exhibition', label: 'Exhibition', icon: Palette, desc: 'Pameran art gallery & expo' },
];

const seatingTypes = [
  { value: 'zone', label: 'Zona / Area', desc: 'VVIP, VIP, Reguler, Tribune' },
  { value: 'numbered', label: 'Tempat Duduk Bernomor', desc: 'Row A Seat 1-20' },
  { value: 'general', label: 'Free Seating / Standing', desc: 'Bebas memilih tempat' },
  { value: 'timed_entry', label: 'Slot Sesi Waktu', desc: 'Sesi Pagi, Sesi Sore' },
];

const defaultWarna = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

export default function CreateEventPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Step 1: Info Utama & Kategori
  const [namaEvent, setNamaEvent] = useState('');
  const [kategoriEvent, setKategoriEvent] = useState('konser');
  const [lokasi, setLokasi] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [jamBuka, setJamBuka] = useState('18:00');
  const [jamTutup, setJamTutup] = useState('23:00');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  // Form Step 2: Seating & Kategori Tiket
  const [seatingType, setSeatingType] = useState('zone');
  const [kapasitas, setKapasitas] = useState('500');
  const [seats, setSeats] = useState<SeatInput[]>([
    { kategori: 'VIP Front Zone', harga: '750000', kuota: '100', deskripsi: 'Akses baris depan + lounge', benefits: ['Fast Track Entry', 'Free Merchandise'], warna: '#8B5CF6' },
    { kategori: 'Reguler Festival', harga: '300000', kuota: '400', deskripsi: 'Area festival standing', benefits: ['E-Wallet Ready'], warna: '#3B82F6' },
  ]);

  // Form Step 3: Syarat & Batasan
  const [syaratKetentuan, setSyaratKetentuan] = useState('Wajib membawa kartu identitas sah. Dilarang membawa makanan dari luar.');
  const [minAge, setMinAge] = useState('12');
  const [maxTicketPerUser, setMaxTicketPerUser] = useState('4');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'organizer') {
      toast.error('Akses khusus Event Organizer.');
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const addSeatCategory = () => {
    const colorIndex = seats.length % defaultWarna.length;
    setSeats([...seats, { kategori: 'Kategori Baru', harga: '150000', kuota: '50', deskripsi: '', benefits: ['Akses Standar'], warna: defaultWarna[colorIndex] }]);
  };

  const removeSeatCategory = (index: number) => {
    if (seats.length <= 1) {
      toast.error('Event harus memiliki minimal 1 kategori tiket.');
      return;
    }
    setSeats(seats.filter((_, i) => i !== index));
  };

  const updateSeat = (index: number, field: keyof SeatInput, value: any) => {
    const newSeats = [...seats];
    newSeats[index][field] = value;
    setSeats(newSeats);

    const totalKuota = newSeats.reduce((sum, s) => sum + (parseInt(s.kuota) || 0), 0);
    setKapasitas(totalKuota.toString());
  };

  const addBenefitToSeat = (seatIndex: number, benefitText: string) => {
    if (!benefitText.trim()) return;
    const newSeats = [...seats];
    newSeats[seatIndex].benefits.push(benefitText.trim());
    setSeats(newSeats);
  };

  const removeBenefitFromSeat = (seatIndex: number, benefitIndex: number) => {
    const newSeats = [...seats];
    newSeats[seatIndex].benefits.splice(benefitIndex, 1);
    setSeats(newSeats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaEvent || !lokasi || !tanggal) {
      toast.error('Nama event, lokasi, dan tanggal wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await eventAPI.create({
        namaEvent,
        lokasi,
        tanggal,
        jamBuka,
        jamTutup,
        kapasitas: parseInt(kapasitas),
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        bannerUrl: bannerUrl || logoUrl,
        deskripsi,
        kategoriEvent,
        seatingType,
        syaratKetentuan,
        minAge: minAge ? parseInt(minAge) : null,
        maxTicketPerUser: parseInt(maxTicketPerUser),
        seats,
      });

      toast.success('Event berhasil diterbitkan! 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-glow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[hsl(var(--text-primary))]">Buat Event Baru</h1>
            <p className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">Rancang event impian Anda dan mulai jualan tiket dalam 3 menit</p>
          </div>
        </div>
      </div>

      {/* Wizard Progress Steps */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[
          { num: 1, title: '1. Info & Kategori' },
          { num: 2, title: '2. Zona & Tiket' },
          { num: 3, title: '3. Syarat & Publikasi' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as any)}
            className={clsx(
              'py-3 px-4 rounded-xl text-xs font-bold transition-all text-center border',
              step === s.num
                ? 'bg-brand-600 text-white border-brand-500 shadow-glow-sm'
                : step > s.num
                ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                : 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]'
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Info & Kategori */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" /> Informasi Utama & Kategori Event
            </h3>

            {/* Kategori Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider block">Kategori Event</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const isSelected = kategoriEvent === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setKategoriEvent(c.value)}
                      className={clsx(
                        'p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2',
                        isSelected
                          ? 'border-brand-500 bg-brand-500/15 shadow-glow-sm text-brand-400'
                          : 'border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-secondary))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                      )}
                    >
                      <Icon className="w-5 h-5 text-brand-500" />
                      <div>
                        <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{c.label}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] line-clamp-1">{c.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Nama Event</label>
                <input
                  type="text"
                  value={namaEvent}
                  onChange={(e) => setNamaEvent(e.target.value)}
                  placeholder="Contoh: Java Jazz Festival 2026"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Lokasi Venue</label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: JIExpo Kemayoran, Jakarta"
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Tanggal Event</label>
                  <input
                    type="datetime-local"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Jam Buka Entry</label>
                  <input type="text" value={jamBuka} onChange={(e) => setJamBuka(e.target.value)} placeholder="18:00" className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Jam Selesai</label>
                  <input type="text" value={jamTutup} onChange={(e) => setJamTutup(e.target.value)} placeholder="23:00" className="input-field" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">URL Gambar Poster/Banner</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-xxx"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Deskripsi Event</label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan daya tarik event Anda, susunan artis, atau fasilitas..."
                  className="input-field py-3 resize-none"
                />
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3.5 font-bold shadow-glow flex items-center justify-center gap-2">
              Lanjut ke Pengaturan Zona & Tiket <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Seating & Kategori Tiket */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" /> Model Seating & Kategori Tiket
            </h3>

            {/* Seating Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider block">Model Penataan Tempat</label>
              <div className="grid grid-cols-2 gap-3">
                {seatingTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSeatingType(t.value)}
                    className={clsx(
                      'p-3.5 rounded-xl border text-left transition-all',
                      seatingType === t.value
                        ? 'border-brand-500 bg-brand-500/15 text-brand-400 font-bold'
                        : 'border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-secondary))] text-[hsl(var(--text-muted))]'
                    )}
                  >
                    <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{t.label}</p>
                    <p className="text-[10px] text-[hsl(var(--text-muted))]">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Seat Category Builder */}
            <div className="space-y-4 pt-4 border-t border-[hsl(var(--border-subtle))]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[hsl(var(--text-primary))]">Kategori Tiket & Zona (Total Kuota: {kapasitas})</h4>
                  <p className="text-xs text-[hsl(var(--text-muted))]">Atur harga, kuota, dan fasilitas eksklusif per zona</p>
                </div>
                <button type="button" onClick={addSeatCategory} className="btn-secondary btn-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Tambah Zona
                </button>
              </div>

              {seats.map((seat, index) => (
                <div key={index} className="p-5 rounded-2xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-color))] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge-info text-xs">Zona #{index + 1}</span>
                    <button type="button" onClick={() => removeSeatCategory(index)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={seat.kategori}
                      onChange={(e) => updateSeat(index, 'kategori', e.target.value)}
                      placeholder="Nama Zona (VVIP, Reguler)"
                      className="input-field text-xs"
                      required
                    />
                    <input
                      type="number"
                      value={seat.harga}
                      onChange={(e) => updateSeat(index, 'harga', e.target.value)}
                      placeholder="Harga (Rp)"
                      className="input-field text-xs"
                      required
                    />
                    <input
                      type="number"
                      value={seat.kuota}
                      onChange={(e) => updateSeat(index, 'kuota', e.target.value)}
                      placeholder="Kuota Tiket"
                      className="input-field text-xs"
                      required
                    />
                  </div>

                  <input
                    type="text"
                    value={seat.deskripsi}
                    onChange={(e) => updateSeat(index, 'deskripsi', e.target.value)}
                    placeholder="Deskripsi zona (contoh: Baris depan panggung utama)"
                    className="input-field text-xs"
                  />

                  {/* Benefits chips */}
                  <div>
                    <p className="text-[11px] font-bold text-[hsl(var(--text-secondary))] mb-1.5">Fasilitas & Bonus Zona</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {seat.benefits.map((b, bIdx) => (
                        <span key={bIdx} className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-gray-300">
                          <Check className="w-3 h-3 text-emerald-400" /> {b}
                          <button type="button" onClick={() => removeBenefitFromSeat(index, bIdx)} className="hover:text-red-400 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tambah fasilitas (contoh: Free T-Shirt)..."
                        className="input-field py-1.5 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addBenefitToSeat(index, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 font-bold">Kembali</button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 py-3 font-bold shadow-glow">Lanjut ke Step Akhir</button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Syarat & Publikasi */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" /> Syarat Ketentuan & Batasan Tiket
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Usia Minimal Penonton</label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="18"
                    className="input-field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Maks. Tiket Per Akun</label>
                  <input
                    type="number"
                    value={maxTicketPerUser}
                    onChange={(e) => setMaxTicketPerUser(e.target.value)}
                    placeholder="4"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Syarat & Ketentuan Masuk Venue</label>
                <textarea
                  rows={4}
                  value={syaratKetentuan}
                  onChange={(e) => setSyaratKetentuan(e.target.value)}
                  placeholder="Tuliskan aturan masuk, larangan barang, atau protokol..."
                  className="input-field py-3 resize-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-[hsl(var(--text-secondary))] space-y-1">
              <p className="font-bold text-brand-400">✨ Event Langsung Dipublikasikan</p>
              <p>Setelah diterbitkan, pengunjung dapat langsung mencari dan membeli tiket via Midtrans Payment Gateway.</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3.5 font-bold">Kembali</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5 font-bold shadow-glow">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Terbitkan Event Sekarang 🚀'}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
