const prisma = require('../config/prisma');
const { acquireLock, releaseLock, addToQueue, getQueuePosition, removeFromQueue, getQueueLength } = require('../config/redis');
const { generateDynamicQRToken } = require('../utils/crypto.utils');
const { v4: uuidv4 } = require('uuid');

// POST /api/tickets/book — Book ticket with Redis Lock + Promo Code + Dynamic Max
const bookTicket = async (req, res) => {
  const { seatId, quantity = 1, metodePembayaran = 'midtrans', promoCode } = req.body;
  const userId = req.user.id;

  if (!seatId) {
    return res.status(400).json({ success: false, message: 'seatId wajib diisi.' });
  }

  const lockKey = `seat_lock:${seatId}`;
  let lockValue = null;

  try {
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
      include: { event: true },
    });

    if (!seat) return res.status(404).json({ success: false, message: 'Kategori tiket tidak ditemukan.' });
    if (!seat.event.isPublished) return res.status(400).json({ success: false, message: 'Event belum tersedia.' });

    // Dynamic max ticket from event config
    const maxTicket = seat.event.maxTicketPerUser || 4;

    if (quantity < 1 || quantity > maxTicket) {
      return res.status(400).json({ success: false, message: `Jumlah tiket harus antara 1-${maxTicket}.` });
    }

    // Check minimum age if set
    // (In production, you'd verify age from user profile)

    // Auto-expire old booking tickets
    await prisma.ticket.updateMany({
      where: {
        userId,
        status: 'booking',
        createdAt: { lt: new Date(Date.now() - 15 * 60 * 1000) }, // 15 min timeout (was 5)
      },
      data: { status: 'expired' },
    });

    const existingTickets = await prisma.ticket.count({
      where: {
        userId,
        eventId: seat.eventId,
        status: { in: ['booking', 'lunas', 'check_in'] },
      },
    });

    if (existingTickets + quantity > maxTicket) {
      return res.status(400).json({
        success: false,
        message: `Anda sudah memiliki ${existingTickets} tiket aktif. Maksimal ${maxTicket} tiket per user per event.`,
      });
    }

    // Virtual Queue
    const queueName = `event_queue:${seat.eventId}`;
    const queueLen = await getQueueLength(queueName);

    if (queueLen > 10) {
      await addToQueue(queueName, userId);
      const queuePosition = await getQueuePosition(queueName, userId);
      if (queuePosition > 1) {
        return res.status(202).json({
          success: false,
          inQueue: true,
          message: `Anda berada di antrian ke-${queuePosition}. Mohon tunggu.`,
          data: { queuePosition, estimatedWaitSeconds: (queuePosition - 1) * 3 },
        });
      }
    }

    // Acquire seat lock
    lockValue = await acquireLock(lockKey, 300);
    if (!lockValue) {
      return res.status(409).json({ success: false, message: 'Tiket sedang diproses. Coba lagi.' });
    }

    // Check availability
    const soldCount = await prisma.ticket.count({
      where: { seatId, status: { in: ['booking', 'lunas', 'check_in'] } },
    });

    const available = seat.kuota - soldCount;
    if (available < quantity) {
      return res.status(400).json({
        success: false,
        message: available === 0 ? 'Tiket sudah habis.' : `Hanya tersisa ${available} tiket.`,
      });
    }

    // Calculate pricing
    const basePrice = parseFloat(seat.harga.toString());
    const totalAmount = basePrice * quantity;
    let discountAmount = 0;
    let promoCodeId = null;

    // Validate promo code if provided
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { kode: promoCode.toUpperCase() } });
      if (promo && promo.eventId === seat.eventId && promo.isActive &&
          new Date() <= promo.berlakuSampai && promo.terpakai < promo.kuota) {
        if (promo.isPercentage) {
          discountAmount = totalAmount * (parseFloat(promo.diskon) / 100);
        } else {
          discountAmount = parseFloat(promo.diskon);
        }
        discountAmount = Math.min(discountAmount, totalAmount);
        promoCodeId = promo.id;
      }
    }

    const totalBayar = Math.max(0, Math.round(totalAmount - discountAmount));
    const referenceId = `TRX-${uuidv4().substring(0, 8).toUpperCase()}`;
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        eventId: seat.eventId,
        jumlah: totalAmount,
        diskon: discountAmount,
        totalBayar,
        metodePembayaran,
        status: 'pending',
        tipeTransaksi: 'beli_tiket',
        referenceId,
        promoCodeId,
        expiredAt,
      },
    });

    // Create tickets
    const createdTickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = await prisma.ticket.create({
        data: { eventId: seat.eventId, userId, seatId, qrToken: '', status: 'booking' },
      });
      createdTickets.push(ticket);
    }

    await removeFromQueue(queueName, userId);
    await releaseLock(lockKey, lockValue);
    lockValue = null;

    return res.status(201).json({
      success: true,
      message: 'Tiket berhasil dipesan! Selesaikan pembayaran dalam 15 menit.',
      data: {
        transaction: {
          id: transaction.id,
          referenceId,
          jumlah: totalAmount,
          diskon: discountAmount,
          totalBayar,
          metodePembayaran,
          expiredAt: expiredAt.toISOString(),
          status: 'pending',
        },
        tickets: createdTickets.map(t => ({ id: t.id, status: t.status })),
        seat: {
          kategori: seat.kategori,
          harga: basePrice,
          deskripsi: seat.deskripsi,
          benefits: seat.benefits ? JSON.parse(seat.benefits) : [],
        },
      },
    });
  } catch (error) {
    console.error('BookTicket error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan server.' });
  } finally {
    if (lockValue) await releaseLock(lockKey, lockValue).catch(() => {});
  }
};

// GET /api/tickets/my
const getMyTickets = async (req, res) => {
  const userId = req.user.id;
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true, namaEvent: true, lokasi: true, tanggal: true, logoUrl: true,
            kategoriEvent: true, seatingType: true, jamBuka: true, jamTutup: true,
          },
        },
        seat: { select: { kategori: true, harga: true, deskripsi: true, benefits: true, warna: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse benefits JSON
    const ticketsWithParsedBenefits = tickets.map(t => ({
      ...t,
      seat: { ...t.seat, benefits: t.seat.benefits ? JSON.parse(t.seat.benefits) : [] },
    }));

    return res.json({ success: true, data: ticketsWithParsedBenefits });
  } catch (error) {
    console.error('GetMyTickets error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/tickets/:id
const getTicketById = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true, namaEvent: true, lokasi: true, tanggal: true,
            logoUrl: true, deskripsi: true, kapasitas: true,
            kategoriEvent: true, seatingType: true, jamBuka: true, jamTutup: true,
            syaratKetentuan: true, minAge: true,
            organizer: { select: { nama: true } },
          },
        },
        seat: { select: { kategori: true, harga: true, deskripsi: true, benefits: true, warna: true } },
        user: { select: { id: true, nama: true, email: true } },
      },
    });

    if (!ticket) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
    if (ticket.userId !== req.user.id && !['staff', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    // Parse benefits
    ticket.seat.benefits = ticket.seat.benefits ? JSON.parse(ticket.seat.benefits) : [];

    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('GetTicketById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/tickets/:id/refresh-qr — Dynamic 30s QR
const refreshQrToken = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
    if (ticket.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (ticket.status !== 'lunas') return res.status(400).json({ success: false, message: 'Tiket belum lunas.' });

    const newQrToken = generateDynamicQRToken(ticket.id, ticket.userId, ticket.eventId);
    await prisma.ticket.update({ where: { id: ticket.id }, data: { qrToken: newQrToken } });

    return res.json({
      success: true,
      data: { qrToken: newQrToken, expiresAt: new Date(Date.now() + 30000).toISOString() },
    });
  } catch (error) {
    console.error('RefreshQrToken error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/tickets/queue/:eventId
const checkQueuePosition = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;
  try {
    const queueName = `event_queue:${eventId}`;
    const position = await getQueuePosition(queueName, userId);
    const totalInQueue = await getQueueLength(queueName);

    return res.json({
      success: true,
      data: {
        inQueue: position !== null && position > 0,
        position,
        totalInQueue,
        estimatedWaitSeconds: position ? (position - 1) * 3 : 0,
      },
    });
  } catch (error) {
    console.error('CheckQueuePosition error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { bookTicket, getMyTickets, getTicketById, refreshQrToken, checkQueuePosition };
