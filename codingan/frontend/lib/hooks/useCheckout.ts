'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ticketAPI, paymentAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

type CheckoutStep = 'idle' | 'booking' | 'payment' | 'success' | 'expired';

interface BookingResult {
  transaction: {
    id: string;
    referenceId: string;
    jumlah: number;
    expiredAt: string;
    status: string;
  };
  tickets: Array<{ id: string; status: string }>;
  paymentInstruction: string;
  lockExpiresAt: string;
}

export function useCheckout(eventId: string) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<CheckoutStep>('idle');
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const book = useCallback(async (seatId: string, quantity: number, promoCode?: string) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu.');
      router.push('/login');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setStep('booking');

    try {
      const res = await ticketAPI.book({ seatId, quantity, promoCode, metodePembayaran: 'midtrans' });
      const data = res.data;

      if (data.inQueue) {
        toast.info(data.message || 'Anda berada dalam antrian. Mohon tunggu.');
        setStep('idle');
        return;
      }

      if (data.success && data.data) {
        setBookingResult(data.data);
        toast.success('Tiket berhasil dipesan! Mengalihkan ke pembayaran...');
        // Redirect directly to dedicated checkout page
        router.push(`/checkout/${data.data.transaction.referenceId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat pemesanan.';
      setError(msg);
      setStep('idle');
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, router]);

  const simulatePayment = useCallback(async () => {
    if (!bookingResult?.transaction?.referenceId) return;

    setIsProcessing(true);
    try {
      const res = await paymentAPI.mockSuccess(bookingResult.transaction.referenceId);
      if (res.data.success) {
        setStep('success');
        toast.success('Pembayaran berhasil! Tiket Anda sudah aktif.', { duration: 5000 });
        // Redirect to first ticket
        const firstTicket = res.data.data?.tickets?.[0];
        if (firstTicket?.id) {
          setTimeout(() => router.push(`/tickets/${firstTicket.id}`), 1500);
        } else {
          setTimeout(() => router.push('/my-tickets'), 1500);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Pembayaran gagal.';
      toast.error(msg);
      if (msg.includes('kadaluarsa')) setStep('expired');
    } finally {
      setIsProcessing(false);
    }
  }, [bookingResult, router]);

  const handleExpire = useCallback(() => {
    setStep('expired');
    toast.warning('Waktu pembayaran habis. Silakan pesan ulang.');
  }, []);

  const reset = useCallback(() => {
    setStep('idle');
    setBookingResult(null);
    setError(null);
    setQrisData(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  return {
    step,
    bookingResult,
    qrisData,
    error,
    isProcessing,
    book,
    simulatePayment,
    handleExpire,
    reset,
  };
}
