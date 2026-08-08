'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Layers, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface SeatZone {
  id: string;
  kategori: string;
  harga: number;
  kuota: number;
  terjual?: number;
  tersedia: number;
  deskripsi?: string;
  benefits?: string[];
  warna?: string;
}

interface FloorPlanProps {
  seats: any[];
  selectedSeatId?: string;
  onSelectSeat: (seat: any) => void;
}

const zoneColorMap: Record<string, { bg: string; border: string; badge: string; glow: string }> = {
  vvip: {
    bg: 'bg-purple-600/20 hover:bg-purple-600/30',
    border: 'border-purple-500/50',
    badge: 'bg-purple-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  },
  vip: {
    bg: 'bg-amber-600/20 hover:bg-amber-600/30',
    border: 'border-amber-500/50',
    badge: 'bg-amber-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
  festival: {
    bg: 'bg-emerald-600/20 hover:bg-emerald-600/30',
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  },
  tribun: {
    bg: 'bg-blue-600/20 hover:bg-blue-600/30',
    border: 'border-blue-500/50',
    badge: 'bg-blue-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
  default: {
    bg: 'bg-indigo-600/20 hover:bg-indigo-600/30',
    border: 'border-indigo-500/50',
    badge: 'bg-indigo-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]',
  },
};

function getZoneStyle(kategoriName: string) {
  const name = kategoriName.toLowerCase();
  if (name.includes('vvip')) return zoneColorMap.vvip;
  if (name.includes('vip')) return zoneColorMap.vip;
  if (name.includes('fest')) return zoneColorMap.festival;
  if (name.includes('tribun')) return zoneColorMap.tribun;
  return zoneColorMap.default;
}

export function FloorPlan({ seats, selectedSeatId, onSelectSeat }: FloorPlanProps) {
  if (!seats || seats.length === 0) return null;

  return (
    <div className="card p-6 border border-[hsl(var(--border-subtle))] space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[hsl(var(--text-primary))]">
              Visual Denah Panggung & Zona Kursi
            </h3>
            <p className="text-xs text-[hsl(var(--text-muted))]">
              Klik pada zona layout untuk memilih jenis tiket secara interaktif
            </p>
          </div>
        </div>
        <span className="badge-info text-xs">
          <Sparkles className="w-3.5 h-3.5" /> Interactive 2D Venue Layout
        </span>
      </div>

      {/* ── Floor Plan Graphic Area ── */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-subtle))] overflow-hidden space-y-8">
        {/* Background Grid Accent */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ── STAGE / PANGGUNG UTAMA ── */}
        <div className="relative z-10 mx-auto max-w-md text-center py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-500 to-accent-600 text-white font-black text-xs tracking-widest uppercase shadow-glow-sm flex items-center justify-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          ✨ PANGGUNG UTAMA / MAIN STAGE ✨
        </div>

        {/* ── STAGE SOUND & LIGHTING ARC ── */}
        <div className="w-3/4 mx-auto h-3 border-t-2 border-dashed border-brand-500/40 rounded-t-full opacity-60" />

        {/* ── SEATING ZONES LAYOUT GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {seats.map((seat) => {
            const isSelected = seat.id === selectedSeatId;
            const isSoldOut = seat.tersedia <= 0;
            const style = getZoneStyle(seat.kategori);

            return (
              <motion.button
                key={seat.id}
                whileHover={{ scale: isSoldOut ? 1 : 1.02 }}
                whileTap={{ scale: isSoldOut ? 1 : 0.98 }}
                onClick={() => !isSoldOut && onSelectSeat(seat)}
                disabled={isSoldOut}
                className={clsx(
                  'relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-32 group',
                  style.bg,
                  style.border,
                  isSelected && `${style.glow} border-2 ring-2 ring-brand-500/40 scale-[1.02] bg-brand-500/20`,
                  isSoldOut && 'opacity-40 cursor-not-allowed grayscale'
                )}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between w-full">
                  <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider', style.badge)}>
                    {seat.kategori}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-brand-400 fill-brand-500/20" />
                  )}
                </div>

                {/* Info */}
                <div className="mt-2">
                  <p className="text-xs font-bold text-[hsl(var(--text-primary))] group-hover:text-brand-400 transition-colors">
                    Rp {Number(seat.harga).toLocaleString('id-ID')}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--text-muted))] mt-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {isSoldOut ? (
                        <span className="text-red-500 font-bold">HABIS</span>
                      ) : (
                        <span>Tersedia: <strong>{seat.tersedia}</strong></span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Bottom zone indicator bar */}
                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-auto">
                  <div
                    className="h-full bg-current transition-all"
                    style={{ width: `${Math.min(100, (seat.tersedia / (seat.kuota || 1)) * 100)}%` }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-[hsl(var(--border-subtle))] flex items-center justify-center gap-6 flex-wrap text-xs text-[hsl(var(--text-muted))]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Zona VVIP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Zona VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Festival / Standing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Tribun / Seated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
