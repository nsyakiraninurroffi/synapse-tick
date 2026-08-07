const prisma = require('../config/prisma');
const { generateDynamicQRToken } = require('../utils/crypto.utils');
const { sendTicketReceipt } = require('../utils/emailService');
const { createSnapTransaction, verifyNotification, checkTransactionStatus } = require('../utils/midtrans');

// ── Helper: process successful payment ──
const processSuccessPayment = async (transaction) => {
  if (transaction.expiredAt && new Date() > transaction.expiredAt) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'failed' },
    });
    await prisma.ticket.updateMany({
      where: { userId: transaction.userId, eventId: transaction.eventId, status: 'booking' },
      data: { status: 'expired' },
    });
    throw new Error('EXPIRED');
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'success' },
  });

  let updatedTickets = [];

  if (transaction.tipeTransaksi === 'beli_tiket') {
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: transaction.userId,
        eventId: transaction.eventId,
        status: 'booking',
      },
    });

    for (const ticket of tickets) {
      const newQrToken = generateDynamicQRToken(ticket.id, transaction.userId, transaction.eventId);
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'lunas', qrToken: newQrToken },
        include: {
          event: { select: { id: true, namaEvent: true, lokasi: true, tanggal: true } },
          seat: { select: { kategori: true, harga: true } },
        },
      });
      updatedTickets.push(updated);
    }

    // Update promo code usage if applied
    if (transaction.promoCodeId) {
      await prisma.promoCode.update({
        where: { id: transaction.promoCodeId },
        data: { terpakai: { increment: 1 } },
      });
    }
  } else if (transaction.tipeTransaksi === 'topup_wallet') {
    await prisma.wallet.upsert({
      where: { userId: transaction.userId },
      update: { saldo: { increment: transaction.jumlah } },
      create: { userId: transaction.userId, saldo: transaction.jumlah },
    });
  }

  return updatedTickets;
};

// ── POST /api/payment/create-snap — Generate Midtrans Snap Token ──
const createSnap = async (req, res) => {
  const { referenceId } = req.body;

  if (!referenceId) {
    return res.status(400).json({ success: false, message: 'referenceId diperlukan.' });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { referenceId },
      include: {
        user: { select: { nama: true, email: true, noHp: true } },
        event: { select: { namaEvent: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    if (transaction.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Transaksi sudah diproses: ${transaction.status}` });
    }

    // If snap token already exists, return it
    if (transaction.snapToken) {
      return res.json({
        success: true,
        data: {
          snapToken: transaction.snapToken,
          snapUrl: transaction.snapUrl,
          referenceId,
        },
      });
    }

    const totalBayar = parseFloat(transaction.totalBayar || transaction.jumlah);

    // Get ticket details for item_details
    const tickets = await prisma.ticket.findMany({
      where: { userId: transaction.userId, eventId: transaction.eventId, status: 'booking' },
      include: { seat: { select: { kategori: true, harga: true } } },
    });

    const items = tickets.map((t, i) => ({
      id: `ticket-${i + 1}`,
      name: `${transaction.event?.namaEvent || 'Event'} - ${t.seat.kategori}`,
      price: parseFloat(t.seat.harga),
      quantity: 1,
    }));

    // Add discount as negative item if applicable
    const diskon = parseFloat(transaction.diskon || 0);
    if (diskon > 0) {
      items.push({
        id: 'discount',
        name: 'Diskon Promo',
        price: -diskon,
        quantity: 1,
      });
    }

    const snapResult = await createSnapTransaction({
      orderId: referenceId,
      grossAmount: totalBayar,
      customer: {
        name: transaction.user.nama,
        email: transaction.user.email,
        phone: transaction.user.noHp || '',
      },
      items,
      eventName: transaction.event?.namaEvent || '',
    });

    // Save snap token to transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        snapToken: snapResult.token,
        snapUrl: snapResult.redirect_url,
      },
    });

    return res.json({
      success: true,
      data: {
        snapToken: snapResult.token,
        snapUrl: snapResult.redirect_url,
        referenceId,
      },
    });
  } catch (error) {
    console.error('CreateSnap error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal membuat pembayaran.' });
  }
};

// ── POST /api/payment/midtrans-notification — Webhook from Midtrans ──
const midtransNotification = async (req, res) => {
  try {
    const verified = await verifyNotification(req.body);
    const { orderId, transactionStatus, fraudStatus } = verified;

    const transaction = await prisma.transaction.findUnique({ where: { referenceId: orderId } });
    if (!transaction) {
      console.warn(`[Midtrans Webhook] Transaction not found: ${orderId}`);
      return res.status(200).json({ success: true }); // Always return 200 to Midtrans
    }

    if (transaction.status !== 'pending') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Determine action based on Midtrans status
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        try {
          const updatedTickets = await processSuccessPayment(transaction);

          // Send email receipt async
          if (updatedTickets.length > 0 && transaction.tipeTransaksi === 'beli_tiket') {
            setImmediate(async () => {
              try {
                const user = await prisma.user.findUnique({
                  where: { id: transaction.userId },
                  select: { id: true, nama: true, email: true },
                });
                if (user) {
                  for (const ticket of updatedTickets) {
                    await sendTicketReceipt({ ticket: { id: ticket.id }, event: ticket.event, seat: ticket.seat, user });
                  }
                }
              } catch (emailErr) {
                console.error('[Email] Failed:', emailErr.message);
              }
            });
          }

          console.log(`[Midtrans] Payment SUCCESS: ${orderId} (${verified.paymentType})`);
        } catch (err) {
          if (err.message === 'EXPIRED') {
            console.warn(`[Midtrans] Transaction expired: ${orderId}`);
          } else {
            throw err;
          }
        }
      }
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      await prisma.transaction.update({ where: { referenceId: orderId }, data: { status: 'failed' } });
      await prisma.ticket.updateMany({
        where: { userId: transaction.userId, eventId: transaction.eventId, status: 'booking' },
        data: { status: 'expired' },
      });
      console.log(`[Midtrans] Payment FAILED: ${orderId} (${transactionStatus})`);
    }
    // 'pending' status = do nothing, wait for settlement

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error);
    return res.status(200).json({ success: true }); // Always 200 for Midtrans
  }
};

// ── POST /api/payment/callback — Legacy webhook (keep for backward compat) ──
const paymentCallback = async (req, res) => {
  const { referenceId, status } = req.body;

  const webhookSecret = req.headers['x-webhook-secret'];
  if (process.env.NODE_ENV === 'production' && webhookSecret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized webhook.' });
  }

  if (!referenceId || !status) {
    return res.status(400).json({ success: false, message: 'referenceId dan status diperlukan.' });
  }

  try {
    const transaction = await prisma.transaction.findUnique({ where: { referenceId } });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }
    if (transaction.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Transaksi sudah: ${transaction.status}` });
    }

    if (status === 'success') {
      try {
        const updatedTickets = await processSuccessPayment(transaction);
        return res.json({ success: true, message: 'Pembayaran berhasil.', data: { referenceId, ticketsUpdated: updatedTickets.length } });
      } catch (err) {
        if (err.message === 'EXPIRED') return res.status(400).json({ success: false, message: 'Transaksi kadaluarsa.' });
        throw err;
      }
    } else if (status === 'failed') {
      await prisma.transaction.update({ where: { referenceId }, data: { status: 'failed' } });
      await prisma.ticket.updateMany({
        where: { userId: transaction.userId, eventId: transaction.eventId, status: 'booking' },
        data: { status: 'expired' },
      });
      return res.json({ success: true, message: 'Pembayaran gagal.' });
    }

    return res.status(400).json({ success: false, message: 'Status tidak valid.' });
  } catch (error) {
    console.error('PaymentCallback error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ── POST /api/payment/mock-success — Dev-only ──
const mockPaymentSuccess = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Endpoint ini hanya untuk testing.' });
  }

  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ success: false, message: 'referenceId diperlukan.' });

  try {
    const transaction = await prisma.transaction.findUnique({ where: { referenceId } });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    if (transaction.status !== 'pending') return res.status(409).json({ success: false, message: `Sudah diproses: ${transaction.status}` });

    try {
      const updatedTickets = await processSuccessPayment(transaction);

      // Send email receipt async
      if (updatedTickets.length > 0) {
        setImmediate(async () => {
          try {
            const user = await prisma.user.findUnique({
              where: { id: transaction.userId },
              select: { id: true, nama: true, email: true },
            });
            if (user) {
              for (const ticket of updatedTickets) {
                await sendTicketReceipt({ ticket: { id: ticket.id }, event: ticket.event, seat: ticket.seat, user });
              }
            }
          } catch (emailErr) {
            console.error('[Email] Failed:', emailErr.message);
          }
        });
      }

      return res.json({
        success: true,
        message: 'Simulasi pembayaran berhasil! Tiket aktif.',
        data: { referenceId, status: 'success', tickets: updatedTickets.map(t => ({ id: t.id, status: t.status })) },
      });
    } catch (err) {
      if (err.message === 'EXPIRED') return res.status(400).json({ success: false, message: 'Transaksi kadaluarsa.' });
      throw err;
    }
  } catch (error) {
    console.error('MockPaymentSuccess error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ── GET /api/payment/status/:referenceId ──
const checkPaymentStatus = async (req, res) => {
  const { referenceId } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { referenceId },
      include: { user: { select: { id: true, nama: true, email: true } } },
    });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    if (transaction.userId !== req.user.id && req.user.role !== 'organizer') {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    // Auto-expire check
    if (transaction.expiredAt && new Date() > transaction.expiredAt && transaction.status === 'pending') {
      await prisma.transaction.update({ where: { referenceId }, data: { status: 'failed' } });
      await prisma.ticket.updateMany({
        where: { userId: transaction.userId, eventId: transaction.eventId, status: 'booking' },
        data: { status: 'expired' },
      });
      return res.json({ success: true, data: { ...transaction, status: 'failed' } });
    }

    return res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('CheckPaymentStatus error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ── POST /api/payment/topup ──
const topUpWallet = async (req, res) => {
  const { amount, metodePembayaran = 'qris' } = req.body;
  const userId = req.user.id;

  if (!amount || parseFloat(amount) < 10000) {
    return res.status(400).json({ success: false, message: 'Minimum top-up Rp 10.000.' });
  }

  try {
    const { v4: uuidv4 } = require('uuid');
    const referenceId = `TOPUP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const parsedAmount = parseFloat(amount);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        jumlah: parsedAmount,
        totalBayar: parsedAmount,
        metodePembayaran,
        status: 'pending',
        tipeTransaksi: 'topup_wallet',
        referenceId,
        expiredAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Dev mode: instant credit
    if (process.env.NODE_ENV === 'development') {
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'success' } });
      await prisma.wallet.upsert({
        where: { userId },
        update: { saldo: { increment: parsedAmount } },
        create: { userId, saldo: parsedAmount },
      });
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      return res.status(201).json({
        success: true,
        message: `Top-up Rp ${parsedAmount.toLocaleString('id-ID')} berhasil! (Dev Mode)`,
        data: { referenceId, jumlah: parsedAmount, newBalance: wallet.saldo },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Permintaan top-up dibuat.',
      data: { referenceId, jumlah: parsedAmount, metodePembayaran, expiredAt: transaction.expiredAt },
    });
  } catch (error) {
    console.error('TopUpWallet error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = {
  createSnap,
  midtransNotification,
  paymentCallback,
  mockPaymentSuccess,
  checkPaymentStatus,
  topUpWallet,
};
