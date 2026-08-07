'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketAPI } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket, Calendar, MapPin, ShieldCheck, RefreshCw, Download, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Sparkles, ExternalLink, CalendarPlus,
  Share2, Apple
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface TicketDetail {
  id: string;
  qrToken: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    namaEvent: string;
    lokasi: string;
    tanggal: string;
    logoUrl: string;
    organizer: { nama: string };
  };
  seat: {
    kategori: string;
    harga: number;
  };
  user: {
    nama: string;
    email: string;
  };
}

/**
 * Generate a Google Calendar link for the event
 */
function buildCalendarLink(event: TicketDetail['event'], seatKategori: string): string {
  const startDate = new Date(event.tanggal);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3h

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.namaEvent,
    dates: `${fmt(startDate)}/${fmt(endDate)}`,
    details: `🎫 Tiket ${seatKategori} — Dibeli via TicketFlow\nOrganizer: ${event.organizer.nama}`,
    location: event.lokasi,
    sf: 'true',
    output: 'xml',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate downloadable .ics file for Apple Calendar / Outlook
 */
function downloadICS(event: TicketDetail['event'], ticketId: string, seatKategori: string) {
  const startDate = new Date(event.tanggal);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const now = fmt(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TicketFlow//Event//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:ticketflow-${ticketId}@ticketflow.id`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${event.namaEvent}`,
    `DESCRIPTION:Tiket ${seatKategori} | Organizer: ${event.organizer.nama} | TicketFlow`,
    `LOCATION:${event.lokasi}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.namaEvent.replace(/\s+/g, '_')}_Ticket.ics`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('File kalender (.ics) berhasil diunduh!');
}

export default function TicketDetailPage() {
  const { id: ticketId } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrRefreshTimer, setQrRefreshTimer] = useState(30);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await ticketAPI.getById(ticketId as string);
      setTicket(res.data.data);
    } catch {
      toast.error('Tiket tidak ditemukan.');
      router.push('/my-tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // QR auto-refresh every 30 seconds (AES-256 dynamic token)
  useEffect(() => {
    if (!ticket || ticket.status !== 'lunas') return;
    const interval = setInterval(async () => {
      setQrRefreshTimer((prev) => {
        if (prev <= 1) {
          ticketAPI.refreshQr(ticket.id).then((res) => {
            if (res.data?.data?.qrToken) {
              setTicket((old) => old ? { ...old, qrToken: res.data.data.qrToken } : old);
            }
          }).catch(() => {});
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.status]);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `E-Ticket ${ticket?.event.namaEvent}`,
        text: `Lihat e-tiket saya untuk ${ticket?.event.namaEvent}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link tiket disalin!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <RefreshCw className="w-12 h-12 text-brand-500/20" />
            <RefreshCw className="w-12 h-12 text-brand-500 animate-spin absolute inset-0" />
          </div>
          <p className="text-sm text-[hsl(var(--text-muted))] font-medium">Memuat E-Ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const isPaid = ticket.status === 'lunas';
  const isCheckedIn = ticket.status === 'check_in';
  const isActive = isPaid || isCheckedIn;

  const calendarLink = isActive ? buildCalendarLink(ticket.event, ticket.seat.kategori) : null;
  const eventDate = new Date(ticket.event.tanggal);

  return (
    <div className="pt-20 pb-20 max-w-3xl mx-auto px-4">
      {/* ── Top Actions Bar ── */}
      <div className="flex items-center justify-between mb-6 print:hidden gap-3 flex-wrap">
        <Link
          href="/my-tickets"
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Tiket Saya
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="btn-ghost btn-sm">
            <Share2 className="w-4 h-4" /> Bagikan
          </button>
          <button onClick={handlePrint} className="btn-secondary btn-sm">
            <Download className="w-4 h-4" /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* ── Main E-Ticket Card ── */}
      <motion.div
        ref={printRef}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-3xl border-2 shadow-card-dark"
        style={{
          borderColor: isActive ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.3)',
          background: 'hsl(var(--bg-card))',
        }}
      >
        {/* ── Event Banner ── */}
        {ticket.event.logoUrl && (
          <div className="relative h-36 overflow-hidden">
            <img
              src={ticket.event.logoUrl}
              alt={ticket.event.namaEvent}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--bg-card))] via-black/40 to-transparent" />
          </div>
        )}

        {/* ── Ticket Header ── */}
        <div
          className="relative p-6 sm:p-8 border-b border-[hsl(var(--border-subtle))]"
          style={{
            background: ticket.event.logoUrl
              ? undefined
              : 'linear-gradient(135deg, hsl(239 55% 15%), hsl(222 47% 10%))',
          }}
        >
          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 overflow-hidden rounded-t-3xl pointer-events-none">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)',
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/15 text-brand-400 border border-brand-500/25 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> OFFICIAL E-TICKET
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[hsl(var(--text-primary))] leading-tight">
                {ticket.event.namaEvent}
              </h1>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
                Organized by {ticket.event.organizer.nama}
              </p>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              {isCheckedIn ? (
                <span className="badge-info text-xs py-1.5 px-3">
                  <CheckCircle2 className="w-4 h-4" /> SUDAH CHECK-IN
                </span>
              ) : isPaid ? (
                <span className="badge-success text-xs py-1.5 px-3">
                  <ShieldCheck className="w-4 h-4" /> TIKET AKTIF
                </span>
              ) : (
                <span className="badge-warning text-xs py-1.5 px-3">
                  <AlertTriangle className="w-4 h-4" /> MENUNGGU PEMBAYARAN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Ticket Body ── */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Info Details — Left 2 cols */}
          <div className="md:col-span-2 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">Kategori Tiket</p>
                <p className="font-extrabold text-base text-brand-600 dark:text-brand-400">{ticket.seat.kategori}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">Harga</p>
                <p className="font-bold text-base text-[hsl(var(--text-primary))]">
                  Rp {Number(ticket.seat.harga).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">Nama Pemegang</p>
                <p className="font-bold text-sm text-[hsl(var(--text-primary))]">{ticket.user.nama}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-bold">ID Tiket</p>
                <p className="font-mono text-[11px] text-[hsl(var(--text-muted))]">{ticket.id.substring(0, 14)}…</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[hsl(var(--border-subtle))]">
              <div className="flex items-center gap-2.5 text-sm text-[hsl(var(--text-secondary))]">
                <div className="p-1.5 rounded-lg bg-brand-500/10">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <span className="font-medium">
                  {format(eventDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[hsl(var(--text-secondary))]">
                <div className="p-1.5 rounded-lg bg-brand-500/10">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <span className="font-medium">{format(eventDate, 'HH:mm')} WIB</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[hsl(var(--text-secondary))]">
                <div className="p-1.5 rounded-lg bg-accent-500/10">
                  <MapPin className="w-3.5 h-3.5 text-accent-500" />
                </div>
                <span className="font-medium">{ticket.event.lokasi}</span>
              </div>
            </div>
          </div>

          {/* QR Code — Right 1 col */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-white border-2 border-[hsl(var(--border-subtle))] shadow-inner text-center w-full">
              {isActive ? (
                <>
                  <div className="p-2 bg-white rounded-xl mb-2">
                    <QRCodeSVG
                      value={ticket.qrToken || ticket.id}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-mono">
                    <RefreshCw className="w-3 h-3 text-brand-500 animate-spin" />
                    <span>Refresh in {qrRefreshTimer}s</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">🔐 AES-256 Encrypted</p>
                </>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-bold text-amber-500 text-sm">QR Belum Aktif</p>
                  <p className="text-xs text-gray-400">Muncul setelah pembayaran dikonfirmasi.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Add to Calendar Section ── */}
        {isActive && calendarLink && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 print:hidden">
            <div className="p-4 rounded-2xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-subtle))] space-y-3">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-bold text-[hsl(var(--text-primary))]">
                  Tambahkan ke Kalender
                </p>
                <span className="badge-success text-[10px] ml-auto">Gratis!</span>
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))]">
                Jangan sampai lupa eventnya — tambahkan ke kalender sekarang!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Google Calendar */}
                <a
                  href={calendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="add-to-google-calendar"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/15 border border-gray-200 dark:border-white/15 text-gray-700 dark:text-white transition-all"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Calendar
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                </a>

                {/* Apple / ICS Download */}
                <button
                  onClick={() => downloadICS(ticket.event, ticket.id, ticket.seat.kategori)}
                  id="download-ics"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/8 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-gray-800 dark:text-gray-200 transition-all"
                >
                  <Apple className="w-4 h-4 flex-shrink-0" />
                  Apple Calendar
                  <Download className="w-3.5 h-3.5 ml-auto opacity-50" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Ticket Stub Footer ── */}
        <div className="px-6 sm:px-8 py-4 bg-[hsl(var(--bg-secondary))] border-t border-dashed border-[hsl(var(--border-color))] flex items-center justify-between text-xs text-[hsl(var(--text-muted))]">
          <span>Tunjukkan QR Code ini di Gate Masuk Event</span>
          <span className="font-mono text-[10px]">TICKETFLOW-SECURE-ENTRY</span>
        </div>
      </motion.div>
    </div>
  );
}
