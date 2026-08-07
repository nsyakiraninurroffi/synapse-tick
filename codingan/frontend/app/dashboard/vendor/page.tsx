'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { vendorAPI, eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Store, DollarSign, CreditCard, Clock, Users, ArrowRight,
  Loader2, CheckCircle, Package, RefreshCw, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import clsx from 'clsx';

/* ── Main Page ── */
export default function VendorDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Payment form
  const [walletId, setWalletId] = useState('');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [paying, setPaying] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);

  // Transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Booth registration
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [boothName, setBoothName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'vendor') {
      toast.error('Akses khusus Vendor.');
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [trxRes, eventRes] = await Promise.allSettled([
        vendorAPI.getTransactions(),
        eventAPI.getAll(),
      ]);

      if (trxRes.status === 'fulfilled') {
        const d = trxRes.value.data.data;
        setVendorInfo(d.vendor);
        setTotalRevenue(d.totalRevenue || 0);
        setTransactions(d.transactions || []);
      }

      if (eventRes.status === 'fulfilled') {
        setEvents(eventRes.value.data.data || []);
      }
    } catch {
      // Vendor might not be registered to any booth yet
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId || !nominal) {
      toast.error('Wallet ID dan nominal wajib diisi.');
      return;
    }
    if (parseFloat(nominal) < 1000) {
      toast.error('Minimum transaksi Rp 1.000.');
      return;
    }

    setPaying(true);
    try {
      const res = await vendorAPI.pay({
        walletIdentifier: walletId,
        nominal: parseFloat(nominal),
        keterangan: keterangan || 'Pembelian di booth',
      });
      setLastPayment(res.data.data);
      toast.success(res.data.message);
      setWalletId('');
      setNominal('');
      setKeterangan('');
      fetchData(); // Refresh transactions
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Pembayaran gagal.');
    } finally {
      setPaying(false);
    }
  };

  const handleRegisterBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !boothName) {
      toast.error('Pilih event dan isi nama booth.');
      return;
    }

    setRegistering(true);
    try {
      await vendorAPI.register({ eventId: selectedEvent, namaBooth: boothName });
      toast.success('Booth berhasil didaftarkan!');
      setShowRegister(false);
      setBoothName('');
      setSelectedEvent('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mendaftar booth.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="section-label mb-2">
            <Store className="w-3.5 h-3.5" /> Vendor Panel
          </span>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))] mt-2">Dashboard Vendor</h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
            {vendorInfo ? `Booth: ${vendorInfo.namaBooth}` : 'Kelola booth dan transaksi merchant Anda'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowRegister(!showRegister)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Daftar Booth
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5 text-center">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))] tabular-nums">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Total Pendapatan</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5 text-center">
          <div className="p-2.5 rounded-xl bg-brand-500/10 w-fit mx-auto mb-2">
            <Package className="w-5 h-5 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))] tabular-nums">{transactions.length}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Total Transaksi</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 text-center">
          <div className="p-2.5 rounded-xl bg-accent-500/10 w-fit mx-auto mb-2">
            <Store className="w-5 h-5 text-accent-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">{vendorInfo?.namaBooth || '—'}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Nama Booth</p>
        </motion.div>
      </div>

      {/* ── Register Booth Form ── */}
      {showRegister && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-6 space-y-4 border-brand-500/20"
        >
          <h3 className="text-base font-bold text-[hsl(var(--text-primary))]">Daftarkan Booth ke Event</h3>
          <form onSubmit={handleRegisterBooth} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Pilih Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="input-field mt-1"
              >
                <option value="">— Pilih event —</option>
                {events.map((evt: any) => (
                  <option key={evt.id} value={evt.id}>{evt.namaEvent}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Nama Booth</label>
              <input
                type="text"
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                placeholder="cth: Warung Sate Madura, Merchandise Official"
                className="input-field mt-1"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={registering} className="btn-primary btn-sm">
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Daftarkan
              </button>
              <button type="button" onClick={() => setShowRegister(false)} className="btn-ghost btn-sm">Batal</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ── Payment Form ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500" />
          <h2 className="text-base font-bold text-[hsl(var(--text-primary))]">Terima Pembayaran</h2>
        </div>
        <p className="text-xs text-[hsl(var(--text-muted))]">
          Scan NFC wristband atau masukkan Wallet ID pelanggan untuk proses pembayaran cashless.
        </p>

        <form onSubmit={handlePayment} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Wallet ID / NFC UID</label>
              <input
                type="text"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="Scan atau paste ID..."
                className="input-field mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Nominal (Rp)</label>
              <input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="cth: 25000"
                className="input-field mt-1 font-mono"
                min="1000"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Keterangan (Opsional)</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="cth: 2x Nasi Goreng, 1x Es Teh"
              className="input-field mt-1"
            />
          </div>
          <button type="submit" disabled={paying} className="btn-primary w-full py-3 font-bold">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Proses Pembayaran
          </button>
        </form>

        {/* Last payment success */}
        {lastPayment && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1"
          >
            <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Pembayaran Berhasil!
            </p>
            <p className="text-xs text-[hsl(var(--text-secondary))]">
              <strong>Rp {lastPayment.nominal?.toLocaleString('id-ID')}</strong> dari {lastPayment.holder} •
              Saldo tersisa: Rp {lastPayment.saldoSesudah?.toLocaleString('id-ID')}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Transaction History ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[hsl(var(--text-muted))]" />
            Riwayat Transaksi
          </h3>
          <span className="badge-neutral text-xs">{transactions.length} transaksi</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-[hsl(var(--text-muted))] space-y-2">
            <Package className="w-8 h-8 mx-auto opacity-40" />
            <p>Belum ada transaksi.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.map((trx: any) => (
              <div key={trx.id} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-[hsl(var(--bg-secondary))]">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">
                    {trx.wallet?.user?.nama || 'Unknown'}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">
                    {trx.keterangan || 'Pembelian di booth'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-500 tabular-nums">
                    +Rp {parseFloat(trx.nominal).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--text-muted))]">
                    {new Date(trx.waktu).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
