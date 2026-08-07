'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SeatInput {
  kategori: string;
  harga: string;
  kuota: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaEvent: '',
    lokasi: '',
    tanggal: '',
    kapasitas: '',
    logoUrl: '',
    deskripsi: '',
  });
  const [seats, setSeats] = useState<SeatInput[]>([
    { kategori: 'VIP', harga: '', kuota: '' },
    { kategori: 'Reguler', harga: '', kuota: '' },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSeatChange = (index: number, field: keyof SeatInput, value: string) => {
    const newSeats = [...seats];
    newSeats[index] = { ...newSeats[index], [field]: value };
    setSeats(newSeats);
  };

  const addSeat = () => {
    setSeats([...seats, { kategori: '', harga: '', kuota: '' }]);
  };

  const removeSeat = (index: number) => {
    setSeats(seats.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seats.length === 0) {
      toast.error('Tambahkan minimal 1 kategori tiket.');
      return;
    }
    setLoading(true);
    try {
      const res = await eventAPI.create({ ...formData, seats });
      toast.success('Event berhasil dibuat!');
      router.push(`/dashboard`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>

      <h1 className="text-3xl font-black text-white mb-8">Buat Event Baru</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">Informasi Event</h2>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Nama Event *</label>
            <input
              type="text"
              name="namaEvent"
              value={formData.namaEvent}
              onChange={handleChange}
              required
              placeholder="Contoh: Java Jazz Festival 2025"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Lokasi *</label>
            <input
              type="text"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              required
              placeholder="Contoh: Jakarta International Expo"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tanggal & Waktu *</label>
              <input
                type="datetime-local"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Total Kapasitas *</label>
              <input
                type="number"
                name="kapasitas"
                value={formData.kapasitas}
                onChange={handleChange}
                required
                min="1"
                placeholder="Contoh: 5000"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">URL Logo/Banner</label>
            <input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Deskripsi Event</label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              rows={4}
              placeholder="Ceritakan tentang event Anda..."
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Seat Categories */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h2 className="text-lg font-bold text-white">Kategori Tiket</h2>
            <button type="button" onClick={addSeat} className="btn-secondary py-1.5 px-3 text-sm">
              <PlusCircle className="w-4 h-4" /> Tambah Kategori
            </button>
          </div>

          <div className="space-y-4">
            {seats.map((seat, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Kategori #{index + 1}</span>
                  {seats.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSeat(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Kategori</label>
                    <input
                      type="text"
                      value={seat.kategori}
                      onChange={(e) => handleSeatChange(index, 'kategori', e.target.value)}
                      required
                      placeholder="VIP / Reguler"
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={seat.harga}
                      onChange={(e) => handleSeatChange(index, 'harga', e.target.value)}
                      required
                      min="0"
                      placeholder="500000"
                      className="input-field py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Kuota</label>
                    <input
                      type="number"
                      value={seat.kuota}
                      onChange={(e) => handleSeatChange(index, 'kuota', e.target.value)}
                      required
                      min="1"
                      placeholder="1000"
                      className="input-field py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Membuat Event...</>
          ) : (
            <><PlusCircle className="w-5 h-5" /> Buat Event</>
          )}
        </button>
      </form>
    </div>
  );
}
