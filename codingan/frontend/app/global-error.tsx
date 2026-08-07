'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))] font-sans antialiased min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center space-y-4 border-red-500/30">
          <h2 className="text-xl font-bold text-red-500">Global Error Detected</h2>
          <p className="text-xs text-[hsl(var(--text-secondary))]">
            {error.message || 'Terjadi kesalahan sistem.'}
          </p>
          <button
            onClick={() => reset()}
            className="btn-primary w-full py-2 text-xs font-bold"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
