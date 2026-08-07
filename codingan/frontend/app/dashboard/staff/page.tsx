'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gateAPI, eventAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  ScanLine, CheckCircle, XCircle, AlertTriangle, RefreshCw, Wifi, WifiOff,
  Users, Shield, ChevronDown, Clock, Zap, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import clsx from 'clsx';

/* ── Types ── */
type ScanResult = 'idle' | 'scanning' | 'granted' | 'denied' | 'already_used' | 'error';

interface ScanLog {
  id: string;
  time: string;
  holder: string;
  kategori: string;
  result: ScanResult;
  message: string;
}

/* ── Scan Result Card ── */
function ScanResultCard({ result, data, onReset }: {
  result: ScanResult;
  data: { holder?: string; kategori?: string; message?: string } | null;
  onReset: () => void;
}) {
  const config: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
    granted: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'AKSES DIBERIKAN' },
    denied: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'AKSES DITOLAK' },
    already_used: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'SUDAH CHECK-IN' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'ERROR' },
  };

  if (result === 'idle' || result === 'scanning') return null;

  const c = config[result] || config.error;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`card p-6 ${c.border} border-2 ${c.bg} space-y-4 text-center`}
    >
      <div className="flex justify-center">
        <div className={`w-20 h-20 rounded-full ${c.bg} border ${c.border} flex items-center justify-center relative`}>
          <Icon className={`w-10 h-10 ${c.color}`} />
          {result === 'granted' && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" />
          )}
        </div>
      </div>
      <h3 className={`text-2xl font-black ${c.color} tracking-wider`}>{c.label}</h3>
      {data?.holder && (
        <div className="space-y-1">
          <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{data.holder}</p>
          {data.kategori && <span className="badge-info text-xs">{data.kategori}</span>}
        </div>
      )}
      {data?.message && (
        <p className="text-sm text-[hsl(var(--text-secondary))]">{data.message}</p>
      )}
      <button onClick={onReset} className="btn-secondary btn-sm mx-auto mt-2">
        <RotateCcw className="w-4 h-4" /> Scan Berikutnya
      </button>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function StaffDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [resultData, setResultData] = useState<any>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [todayStats, setTodayStats] = useState({ total: 0, success: 0, failed: 0 });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'staff' && user?.role !== 'organizer') {
      toast.error('Akses khusus Staff Gate.');
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Auto-focus input for barcode scanner
  useEffect(() => {
    inputRef.current?.focus();
  }, [scanResult]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setScanResult('scanning');
    setResultData(null);

    try {
      const res = await gateAPI.verify(qrInput.trim());
      const d = res.data.data;

      setScanResult('granted');
      setResultData({ holder: d.holder, kategori: d.kategori, message: res.data.message });
      setTodayStats(p => ({ ...p, total: p.total + 1, success: p.success + 1 }));
      addLog(d.holder || 'Unknown', d.kategori || '', 'granted', res.data.message);
    } catch (err: any) {
      const gateResult = err.response?.data?.gateResult;
      const message = err.response?.data?.message || 'Scan gagal.';

      if (gateResult === 'ALREADY_USED') {
        setScanResult('already_used');
        setTodayStats(p => ({ ...p, total: p.total + 1, failed: p.failed + 1 }));
      } else {
        setScanResult('denied');
        setTodayStats(p => ({ ...p, total: p.total + 1, failed: p.failed + 1 }));
      }
      setResultData({ message });
      addLog('—', '', gateResult === 'ALREADY_USED' ? 'already_used' : 'denied', message);
    }

    setQrInput('');
  };

  const addLog = (holder: string, kategori: string, result: ScanResult, message: string) => {
    setScanLogs(prev => [{
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('id-ID'),
      holder, kategori, result, message,
    }, ...prev].slice(0, 50));
  };

  const resetScan = () => {
    setScanResult('idle');
    setResultData(null);
    inputRef.current?.focus();
  };

  return (
    <div className="pt-20 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="section-label mb-2">
            <Shield className="w-3.5 h-3.5" /> Gate Scanner
          </span>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))] mt-2">Gate Check-In</h1>
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
            Scan QR code tiket pengunjung untuk verifikasi masuk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx(
            'badge text-xs',
            isOnline ? 'badge-success' : 'badge-error'
          )}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Today Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-[hsl(var(--text-primary))] tabular-nums">{todayStats.total}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Total Scan</p>
        </div>
        <div className="card p-4 text-center border-emerald-500/20">
          <p className="text-2xl font-black text-emerald-500 tabular-nums">{todayStats.success}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Berhasil</p>
        </div>
        <div className="card p-4 text-center border-red-500/20">
          <p className="text-2xl font-black text-red-500 tabular-nums">{todayStats.failed}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Ditolak</p>
        </div>
      </div>

      {/* ── Scanner Input ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-[hsl(var(--text-secondary))]">
          <ScanLine className="w-5 h-5 text-brand-500" />
          <h2 className="text-base font-bold">Scan QR Code</h2>
        </div>

        <form onSubmit={handleScan} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Arahkan scanner atau paste QR token..."
              className="input-field pr-12 font-mono text-xs"
              autoFocus
              autoComplete="off"
            />
            {scanResult === 'scanning' && (
              <RefreshCw className="w-4 h-4 animate-spin text-brand-500 absolute right-4 top-1/2 -translate-y-1/2" />
            )}
          </div>
          <button
            type="submit"
            disabled={scanResult === 'scanning' || !qrInput.trim()}
            className="btn-primary btn-sm whitespace-nowrap"
          >
            <Zap className="w-4 h-4" /> Verifikasi
          </button>
        </form>

        <p className="text-[11px] text-[hsl(var(--text-muted))]">
          💡 Gunakan USB barcode scanner atau paste QR token manual. Hasil langsung tampil di bawah.
        </p>
      </div>

      {/* ── Scan Result ── */}
      <AnimatePresence mode="wait">
        <ScanResultCard result={scanResult} data={resultData} onReset={resetScan} />
      </AnimatePresence>

      {/* ── Scan History ── */}
      {scanLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              Riwayat Scan Hari Ini
            </h3>
            <span className="badge-neutral text-xs">{scanLogs.length} scan</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {scanLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-[hsl(var(--bg-secondary))]">
                {log.result === 'granted' && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                {log.result === 'denied' && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                {log.result === 'already_used' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                {log.result === 'error' && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{log.holder}</p>
                  <p className="text-[11px] text-[hsl(var(--text-muted))] truncate">{log.message}</p>
                </div>
                <span className="text-[11px] text-[hsl(var(--text-muted))] font-mono flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
