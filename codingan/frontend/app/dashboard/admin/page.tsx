'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { analyticsAPI } from '@/lib/api';
import {
  ShieldAlert, TrendingUp, Users, Building2, Ticket, CheckCircle2,
  XCircle, Clock, Search, RefreshCw, DollarSign, Filter, Lock, Unlock, Zap, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import clsx from 'clsx';

interface PayoutRequest {
  id: string;
  organizerName: string;
  organizerEmail: string;
  nominal: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
}

interface TenantUser {
  id: string;
  nama: string;
  email: string;
  role: 'superadmin' | 'organizer' | 'staff' | 'vendor' | 'pengunjung';
  status: 'active' | 'suspended';
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [totalGmv, setTotalGmv] = useState(0);
  const [saasFeeRevenue, setSaasFeeRevenue] = useState(0);

  // Withdrawal Requests State
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Users Management State
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<TenantUser[]>([
    { id: 'u-1', nama: 'Promotor Soundwave', email: 'organizer@demo.com', role: 'organizer', status: 'active', createdAt: '2026-01-15' },
    { id: 'u-2', nama: 'Gate Staff Gelora', email: 'staff@demo.com', role: 'staff', status: 'active', createdAt: '2026-02-01' },
    { id: 'u-3', nama: 'F&B Booth Merchant', email: 'vendor@demo.com', role: 'vendor', status: 'active', createdAt: '2026-02-10' },
    { id: 'u-4', nama: 'Nesya Kirani', email: 'pengunjung@demo.com', role: 'pengunjung', status: 'active', createdAt: '2026-03-01' },
    { id: 'u-5', nama: 'Super Admin HQ', email: 'admin@synapsetick.id', role: 'superadmin', status: 'active', createdAt: '2026-01-01' },
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getDashboard();
      const overview = res.data?.data?.overview || {};
      const rev = Number(overview.totalRevenue || 128500000);
      setTotalGmv(rev);
      setSaasFeeRevenue(rev * 0.05); // 5% SaaS commission platform fee

      // Load saved withdrawals
      const savedWithdrawals = localStorage.getItem('organizer_withdrawals');
      let records: PayoutRequest[] = [];
      if (savedWithdrawals) {
        records = JSON.parse(savedWithdrawals);
      } else {
        records = [
          {
            id: 'WD-9012',
            organizerName: 'Soundwave Indonesia',
            organizerEmail: 'organizer@demo.com',
            nominal: 5000000,
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '8830192811',
            accountName: 'Soundwave Official',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'WD-8821',
            organizerName: 'Festaria Promotor',
            organizerEmail: 'festaria@event.com',
            nominal: 12500000,
            bankName: 'Bank Mandiri',
            accountNumber: '14200192830',
            accountName: 'PT Festaria Indonesia',
            status: 'completed',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ];
        localStorage.setItem('organizer_withdrawals', JSON.stringify(records));
      }
      setPayouts(records);
    } catch {
      toast.error('Gagal memuat data Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = (payoutId: string) => {
    const updated = payouts.map((p) => (p.id === payoutId ? { ...p, status: 'completed' as const } : p));
    setPayouts(updated);
    localStorage.setItem('organizer_withdrawals', JSON.stringify(updated));
    toast.success(`Pencairan dana ${payoutId} berhasil disetujui & ditransfer!`);
  };

  const handleRejectPayout = (payoutId: string) => {
    const updated = payouts.map((p) => (p.id === payoutId ? { ...p, status: 'rejected' as const } : p));
    setPayouts(updated);
    localStorage.setItem('organizer_withdrawals', JSON.stringify(updated));
    toast.error(`Pencairan dana ${payoutId} telah ditolak.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          toast.info(`Status akun ${u.nama} diubah menjadi ${nextStatus.toUpperCase()}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-[hsl(var(--text-muted))]">Memuat Super Admin Governance Panel...</p>
        </div>
      </div>
    );
  }

  const filteredPayouts = payouts.filter((p) => {
    if (filterStatus === 'pending') return p.status === 'pending';
    if (filterStatus === 'completed') return p.status === 'completed';
    return true;
  });

  const filteredUsers = users.filter(
    (u) =>
      u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[hsl(var(--border-subtle))] pb-6">
        <div>
          <span className="badge-info text-xs mb-2 inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> PLATFORM OWNER PANEL
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[hsl(var(--text-primary))] flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-brand-500" /> Super Admin Governance
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--text-secondary))] mt-1">
            Pengawasan penuh transaksi SaaS, persetujuan penarikan dana organizer, dan manajemen tenant
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* ── SaaS Performance KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total GMV */}
        <div className="card p-5 border border-brand-500/20 bg-brand-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Total GMV Platform</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-[hsl(var(--text-primary))]">
            Rp {totalGmv.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Total penjualan tiket nasional</p>
        </div>

        {/* 5% SaaS Commission */}
        <div className="card p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Pendapatan Komisi SaaS (5%)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">
            Rp {saasFeeRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">Net profit platform SynapseTick</p>
        </div>

        {/* Pending Payout Requests */}
        <div className="card p-5 border border-amber-500/20 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Antrean Payout Organizer</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">
            {payouts.filter((p) => p.status === 'pending').length} Pengajuan
          </p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Membutuhkan konfirmasi admin</p>
        </div>

        {/* Total Organizers */}
        <div className="card p-5 border border-purple-500/20 bg-purple-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--text-muted))] font-bold uppercase">
            <span>Total User & Tenant</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-400">{users.length} Akun Terdaftar</p>
          <p className="text-[11px] text-[hsl(var(--text-muted))]">Multi-Tenant 5 Role Active</p>
        </div>
      </div>

      {/* ── SECTION 1: Organizer Payout Approval Center ── */}
      <div className="card p-6 border border-[hsl(var(--border-subtle))] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Persetujuan Penarikan Uang Organizer
            </h2>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
              Verifikasi dan proses penarikan saldo omset event dari organizer ke rekening bank mereka
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[hsl(var(--bg-secondary))] rounded-xl border border-[hsl(var(--border-subtle))]">
            {(['all', 'pending', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={clsx(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize',
                  filterStatus === st
                    ? 'bg-brand-600 text-white shadow-glow-sm'
                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                )}
              >
                {st === 'all' ? 'Semua' : st === 'pending' ? 'Pending' : 'Selesai'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">
                <th className="py-3 px-2">Ref ID</th>
                <th className="py-3 px-2">Organizer</th>
                <th className="py-3 px-2">Bank & Rekening</th>
                <th className="py-3 px-2">Nominal Payout</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
              {filteredPayouts.map((item) => (
                <tr key={item.id} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                  <td className="py-3 px-2 font-mono font-bold text-brand-400">{item.id}</td>
                  <td className="py-3 px-2">
                    <p className="font-bold text-[hsl(var(--text-primary))]">{item.organizerName}</p>
                    <p className="text-[11px] text-[hsl(var(--text-muted))]">{item.organizerEmail}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-bold text-[hsl(var(--text-primary))]">{item.bankName}</p>
                    <p className="text-[11px] text-[hsl(var(--text-muted))]">
                      {item.accountNumber} a.n {item.accountName}
                    </p>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-emerald-400">
                    Rp {Number(item.nominal).toLocaleString('id-ID')}
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
                    {item.status === 'rejected' && (
                      <span className="badge-error text-[10px] py-0.5 px-2">
                        <XCircle className="w-3 h-3" /> DITOLAK
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right space-x-1.5">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprovePayout(item.id)}
                          className="btn-primary py-1 px-3 text-[11px] font-bold"
                        >
                          Approve & Transfer
                        </button>
                        <button
                          onClick={() => handleRejectPayout(item.id)}
                          className="btn-ghost py-1 px-2 text-[11px] font-bold text-red-400 hover:text-red-300"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-[hsl(var(--text-muted))] italic">Proses Selesai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 2: User & Tenant Management Table ── */}
      <div className="card p-6 border border-[hsl(var(--border-subtle))] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" /> Manajemen Tenant & Pengguna
            </h2>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
              Pantau status keaktifan akun Pengunjung, Organizer, Staff Gate, dan Vendor Booth
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[hsl(var(--text-muted))]" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Cari nama, email, atau role..."
              className="input-field pl-9 py-2 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">
                <th className="py-3 px-2">Nama Pengguna</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Status Akun</th>
                <th className="py-3 px-2 text-right">Kontrol Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[hsl(var(--bg-secondary))] transition-colors">
                  <td className="py-3 px-2 font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-black text-xs">
                      {u.nama.charAt(0)}
                    </div>
                    {u.nama}
                  </td>
                  <td className="py-3 px-2 text-[hsl(var(--text-muted))]">{u.email}</td>
                  <td className="py-3 px-2 uppercase font-bold text-[10px]">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full',
                        u.role === 'superadmin' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                        u.role === 'organizer' && 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
                        u.role === 'staff' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                        u.role === 'vendor' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                        u.role === 'pengunjung' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {u.status === 'active' ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {u.role !== 'superadmin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={clsx(
                          'px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ml-auto',
                          u.status === 'active'
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        )}
                      >
                        {u.status === 'active' ? (
                          <>
                            <Lock className="w-3 h-3" /> Suspend
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" /> Aktifkan
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
