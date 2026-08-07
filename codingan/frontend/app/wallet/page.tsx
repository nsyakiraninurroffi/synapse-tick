'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletAPI, paymentAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Nfc, CreditCard, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  jumlah: number;
  tipeTransaksi: string;
  metodePembayaran: string;
  referenceId: string;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<number>(0);
  const [nfcUid, setNfcUid] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState<string>('50000');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const [balRes, trxRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions({ limit: 10 }),
      ]);
      setBalance(Number(balRes.data.data.saldo));
      setNfcUid(balRes.data.data.nfcUid || null);
      setTransactions(trxRes.data.data);
    } catch {
      toast.error('Gagal mengambil data wallet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchWallet();
  }, [isAuthenticated, router]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val < 10000) {
      toast.error('Minimum top-up Rp 10.000');
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentAPI.topUp({ amount: val, metodePembayaran: 'qris' });
      toast.success(res.data.message || 'Top-up berhasil!');
      setTopUpOpen(false);
      fetchWallet();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Top-up gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [20000, 50000, 100000, 250000, 500000];

  return (
    <div className="pt-20 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <span className="section-label mb-2">Cashless Event</span>
        <h1 className="text-3xl font-black text-[hsl(var(--text-primary))]">E-Wallet Saya</h1>
        <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Saldo terintegrasi untuk transaksi booth vendor F&B di lokasi event</p>
      </div>

      {/* Main Balance Card */}
      <div className="card-gradient p-6 sm:p-8 relative overflow-hidden shadow-card-dark border-2 border-brand-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
              <Wallet className="w-4 h-4 text-brand-400" />
              <span>TOTAL SALDO TERSEDIA</span>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Rp {balance.toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-gray-300">
              <Nfc className="w-4 h-4 text-emerald-400" />
              <span>NFC Tag UID: {nfcUid || 'Belum terhubung'}</span>
            </div>
          </div>

          <button
            onClick={() => setTopUpOpen(true)}
            className="btn-primary btn-lg shadow-glow w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" /> Isi Saldo / Top-Up
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Riwayat Transaksi</h2>
          <button onClick={fetchWallet} className="btn-ghost btn-sm text-[hsl(var(--text-muted))]">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[hsl(var(--text-muted))]">Memuat transaksi...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[hsl(var(--text-muted))]">Belum ada riwayat transaksi.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((trx) => {
              const isSuccess = trx.status === 'success';
              const isTopUp = trx.tipeTransaksi === 'topup_wallet';

              return (
                <div
                  key={trx.id}
                  className="p-4 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-secondary))] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isTopUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent-500/10 text-accent-500'
                    }`}>
                      {isTopUp ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[hsl(var(--text-primary))] capitalize">
                        {trx.tipeTransaksi.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))] font-mono">Ref: {trx.referenceId}</p>
                      <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">
                        {format(new Date(trx.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-black ${isTopUp ? 'text-emerald-500' : 'text-[hsl(var(--text-primary))]'}`}>
                      {isTopUp ? '+' : '-'} Rp {Number(trx.jumlah).toLocaleString('id-ID')}
                    </p>
                    <span className={isSuccess ? 'badge-success text-[10px] mt-1' : 'badge-warning text-[10px] mt-1'}>
                      {trx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      <Modal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} title="Top-Up Saldo E-Wallet" size="md">
        <form onSubmit={handleTopUp} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[hsl(var(--text-secondary))]">Pilih Nominal Top-Up</label>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    amount === amt.toString()
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-[hsl(var(--border-color))] hover:bg-[hsl(var(--bg-secondary))] text-[hsl(var(--text-primary))]'
                  }`}
                >
                  Rp {amt.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[hsl(var(--text-secondary))]">Atau Masukkan Nominal Custom</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-bold text-[hsl(var(--text-muted))]">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="input-field pl-12"
                min={10000}
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 font-bold shadow-glow">
              {submitting ? 'Memproses...' : 'Konfirmasi Top-Up (Instant Credit)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
