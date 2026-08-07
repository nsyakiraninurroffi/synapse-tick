'use client';

import Link from 'next/link';
import { Ticket, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 pt-20 pb-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md card p-8 space-y-6 shadow-card-dark border-brand-500/20"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-500 shadow-glow-sm">
          <Ticket className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="badge-warning text-xs">Error 404</span>
          <h1 className="text-3xl font-black text-[hsl(var(--text-primary))]">Halaman Tidak Ditemukan</h1>
          <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
            Halaman atau event yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link href="/" className="btn-primary w-full justify-center">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <Link href="/events" className="btn-ghost w-full justify-center text-xs">
            <Search className="w-3.5 h-3.5" /> Jelajahi Event Lain
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
