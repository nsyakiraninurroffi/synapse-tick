'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';
import {
  Wallet, Building2, ArrowDownRight, Clock, CheckCircle2, AlertCircle,
  TrendingUp, CreditCard, ShieldCheck, ArrowLeft, RefreshCw, Send, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface WithdrawalRecord {
  id: string;
  nominal: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  notes?: string;
}

const BANK_OPTIONS = [
  { id: 'bca', name: 'Bank Central Asia (BCA)', logo: '🏦 BCA' },
  { id: 'mandiri', name: 'Bank Mandiri', logo: '🏦 Mandiri' },
  { id: 'bri', name: 'Bank Rakyat Indonesia (BRI)', logo: '🏦 BRI' },
  { id: 'bni', name: 'Bank Negara Indonesia (BNI)', logo: '🏦 BNI' },
  { id: 'jago', name: 'Bank Jago', logo: '🏦 Jago' },
];

export default function OrganizerWithdrawalPage() {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);

  // Form State
  const [amountInput, setAmountInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('bca');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getDashboard();
      const overview = res.data?.data?.overview || {};
      const rev = Number(overview.totalRevenue || 0);
      setTotalRevenue(rev);

      // Load saved withdrawal history from localStorage
      const savedHistory = localStorage.getItem('organizer_withdrawals');
      let records: WithdrawalRecord[] = [];
      if (savedHistory) {
        records = JSON.parse(savedHistory);
      } else {
        // Initial demo records
        records = [
          {
            id: 'WD-8821',
            nominal: 5000000,
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '8830192811',
            accountName: 'Organizer Pro Indonesia',
            status: 'completed',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            notes: 'Transfer sukses via RTGS',
          },
        ];
        localStorage.setItem('organizer_withdrawals', JSON.stringify(records));
      }

      setHistory(records);

      const pendingSum = records
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.nominal, 0);
      const completedSum = records
        .filter((r) => r.status === 'completed' || r.status === 'approved')
        .reduce((sum, r) => sum + r.nominal, 0);

      setPendingWithdrawal(pendingSum);
      setWithdrawnAmount(completedSum);
      setAvailableBalance(Math.max(0, rev - completedSum - pendingSum));
    } catch {
      toast.error('Gagal memuat saldo organizer.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = Number(amountInput);

    if (!nominal || nominal < 100000) {
      toast.error('Minimal penarikan dana adalah Rp 100.000');
      return;
    }

    if (nominal > availableBalance) {
      toast.error('Nominal melebihi saldo tersedia yang dapat ditarik.');
      return;
    }

    if (!accountNumber || !accountName) {
      toast.error('Lengkapi nomor dan nama pemilik rekening bank.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const bankObj = BANK_OPTIONS.find((b) => b.id === selectedBank);
      const newRecord: WithdrawalRecord = {
        id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
        nominal,
        bankName: bankObj ? bankObj.name : selectedBank,
        accountNumber,
        accountName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: 'Permohonan penarikan sedang diverifikasi Admin',
      };

      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('organizer_withdrawals', JSON.stringify(updatedHistory));

      setAvailableBalance((prev) => prev - nominal);
      setPendingWithdrawal((prev) => prev + nominal);

      setAmountInput('');
      setSubmitting(false);
      toast.success(`Pengajuan penarikan Rp ${nominal.toLocaleString('id-ID')} berhasil dibuat!`);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-[hsl(var(--text-muted))]">Memuat data saldo & penarikan dana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[hsl(var(--border-subtle))] pb-6">
        <div>
          <Link
            href="/dashboard/organizer"
            className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-brand-500 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-[hsl(var(--text-primary))] flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-500" /> Pencairan Dana Organizer
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--text-secondary))] mt-1">
            Tarik hasil penjualan tiket event Anda secara otomatis ke rekening bank resmi Anda
          </p>
        </div>
        <span className="badge-success py-1.5 px-3 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" /> Verifikasi Otomatis Super Admin
        </span>
      </div>

      {/* ── Balance Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Omset Event */}
        <div className="card p-5 border border-brand-500/20 bg-brand-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Total Pendapatan Tiket</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-brand-500">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Kotor sebelum potongan pencairan</p>
        </div>

        {/* Saldo Dapat Ditarik */}
        <div className="card p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Saldo Siap Ditarik</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">
            Rp {availableBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">Bisa ditarik ke rekening kapan saja</p>
        </div>

        {/* Sedang Diproses */}
        <div className="card p-5 border border-amber-500/20 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Sedang Diproses</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">
            Rp {pendingWithdrawal.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Menunggu persetujuan admin</p>
        </div>

        {/* Total Sudah Dicairkan */}
        <div className="card p-5 border border-blue-500/20 bg-blue-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Sudah Dicairkan</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-500">
            Rp {withdrawnAmount.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Telah ditransfer ke rekening</p>
        </div>
      </div>

      {/* ── Main Content Grid: Form + History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Request Payout — Left 1 Col */}
        <div className="lg:col-span-1 card p-6 border border-[hsl(var(--border-subtle))] space-y-5">
          <div className="border-b border-[hsl(var(--border-subtle))] pb-4">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-500" /> Form Tarik Dana
            </h2>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
              Pengajuan akan diproses maksimal 1x24 jam kerja.
            </p>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Nominal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">
                Nominal Penarikan (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-[hsl(var(--text-muted))]">Rp</span>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Contoh: 1000000"
                  className="input-field pl-11 font-mono font-bold"
                  min={100000}
                  max={availableBalance}
                  required
                />
              </div>
              <div className="flex justify-between text-[11px] text-[hsl(var(--text-muted))]">
                <span>Min: Rp 100.000</span>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(availableBalance))}
                  className="text-brand-500 font-bold hover:underline"
                >
                  Tarik Semua
                </button>
              </div>
            </div>

            {/* Bank Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">
                Pilih Bank Tujuan
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="input-field font-medium text-sm"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">
                Nomor Rekening
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 8830192811"
                className="input-field font-mono"
                required
              />
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[hsl(var(--text-primary))] uppercase tracking-wider">
                Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Sesuai buku tabungan"
                className="input-field"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || availableBalance < 100000}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-glow"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Ajukan Penarikan Sekarang
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table — Right 2 Cols */}
        <div className="lg:col-span-2 card p-6 border border-[hsl(var(--border-subtle))] space-y-4">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border-subtle))] pb-4">
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" /> Riwayat Penarikan Dana
            </h2>
            <span className="text-xs text-[hsl(var(--text-muted))]">
              Total: <strong>{history.length}</strong> Transaksi
            </span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-[hsl(var(--text-muted))]">
              <AlertCircle className="w-10 h-10 mx-auto text-[hsl(var(--text-muted))]" />
              <p className="font-bold text-sm">Belum Ada Riwayat Penarikan</p>
              <p className="text-xs">Gunakan form di samping untuk mengajukan penarikan pertama Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">ID Transaksi</th>
                    <th className="py-3 px-2">Bank & Rekening</th>
                    <th className="py-3 px-2">Nominal</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-brand-400">{item.id}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-[hsl(var(--text-primary))]">{item.bankName}</p>
                        <p className="text-[11px] text-[hsl(var(--text-muted))]">
                          {item.accountNumber} a.n {item.accountName}
                        </p>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-emerald-400">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-2">
                        {item.status === 'completed' && (
                          <span className="badge-success text-[10px] py-0.5 px-2">
                            <CheckCircle2 className="w-3 h-3" /> DICAIRKAN
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="badge-warning text-[10px] py-0.5 px-2">
                            <Clock className="w-3 h-3" /> MENUNGGU ADMIN
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="badge-info text-[10px] py-0.5 px-2">
                            <CheckCircle2 className="w-3 h-3" /> DISETUJUI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-[hsl(var(--text-muted))]">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
