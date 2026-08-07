'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Terjadi Kesalahan</h2>
        <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
          {error.message || 'Sistem mengalami kendala sementara. Silakan coba lagi.'}
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={() => reset()} className="btn-primary flex-1 btn-sm flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
          <Link href="/" className="btn-secondary flex-1 btn-sm flex items-center justify-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
