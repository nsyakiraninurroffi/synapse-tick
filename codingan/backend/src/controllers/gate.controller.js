const prisma = require('../config/prisma');
const { decryptQRToken } = require('../utils/crypto.utils');

// POST /api/gate/verify - Verify QR Code at Gate (Online mode)
const verifyGate = async (req, res) => {
  const { qrToken } = req.body;
  const staffId = req.user.id;

  if (!qrToken) {
    return res.status(400).json({ success: false, message: 'QR Token diperlukan.' });
  }

  try {
    // Decrypt the AES-256 QR token
    const payload = decryptQRToken(qrToken);

    if (!payload || !payload.ticketId || payload.type !== 'GATE_ACCESS') {
      return res.status(400).json({
        success: false,
        gateResult: 'INVALID',
        message: 'QR Code tidak valid atau sudah kadaluarsa.',
      });
    }

    const { ticketId, userId, eventId } = payload;

    // Atomic update to prevent race conditions (double check-in)
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        userId: userId,
        status: 'lunas',
      },
      data: {
        status: 'check_in',
        checkInAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      // Update failed, find the ticket to determine why
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          gateResult: 'NOT_FOUND',
          message: 'Tiket tidak ditemukan dalam database.',
        });
      }

      if (ticket.userId !== userId) {
        return res.status(400).json({
          success: false,
          gateResult: 'INVALID',
          message: 'Data tiket tidak cocok.',
        });
      }

      if (ticket.status === 'check_in') {
        return res.status(409).json({
          success: false,
          gateResult: 'ALREADY_USED',
          message: `Tiket sudah digunakan untuk check-in pada ${ticket.checkInAt?.toLocaleString('id-ID')}.`,
          data: ticket,
        });
      }

      if (ticket.status === 'expired') {
        return res.status(400).json({
          success: false,
          gateResult: 'EXPIRED',
          message: 'Tiket sudah kadaluarsa.',
          data: ticket,
        });
      }

      return res.status(400).json({
        success: false,
        gateResult: 'INVALID_STATUS',
        message: `Status tiket tidak valid: ${ticket.status}.`,
        data: ticket,
      });
    }

    // SUCCESS: Fetch the updated ticket details to return
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, nama: true, email: true } },
        event: { select: { namaEvent: true, lokasi: true } },
        seat: { select: { kategori: true } },
      },
    });

    return res.json({
      success: true,
      gateResult: 'GRANTED',
      message: `✅ Akses diberikan! Selamat datang, ${updatedTicket.user.nama}!`,
      data: {
        ticketId: updatedTicket.id,
        holder: updatedTicket.user.nama,
        event: updatedTicket.event.namaEvent,
        kategori: updatedTicket.seat.kategori,
        checkInAt: updatedTicket.checkInAt,
      },
    });
  } catch (error) {
    console.error('VerifyGate error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/gate/sync - Sync offline check-in logs
const syncOfflineLogs = async (req, res) => {
  const { offlineLogs } = req.body;

  if (!offlineLogs || !Array.isArray(offlineLogs)) {
    return res.status(400).json({ success: false, message: 'offlineLogs harus berupa array.' });
  }

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    for (const log of offlineLogs) {
      const { ticketId, checkInAt } = log;

      try {
        const updateResult = await prisma.ticket.updateMany({
          where: { id: ticketId, status: 'lunas' },
          data: { status: 'check_in', checkInAt: new Date(checkInAt) },
        });

        if (updateResult.count === 0) {
          // If it failed, let's find out why
          const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
          
          if (!ticket) {
            results.failed++;
            results.details.push({ ticketId, status: 'NOT_FOUND' });
            continue;
          }

          if (ticket.status === 'check_in') {
            results.skipped++;
            results.details.push({ ticketId, status: 'ALREADY_SYNCED' });
            continue;
          }

          results.failed++;
          results.details.push({ ticketId, status: 'INVALID_STATUS', ticketStatus: ticket.status });
          continue;
        }

        results.success++;
        results.details.push({ ticketId, status: 'SYNCED' });
      } catch (err) {
        results.failed++;
        results.details.push({ ticketId, status: 'ERROR', error: err.message });
      }
    }

    return res.json({
      success: true,
      message: `Sinkronisasi selesai: ${results.success} berhasil, ${results.failed} gagal, ${results.skipped} dilewati.`,
      data: results,
    });
  } catch (error) {
    console.error('SyncOfflineLogs error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/gate/download/:eventId - Pre-download valid tickets for offline use
const downloadEventTickets = async (req, res) => {
  const { eventId } = req.params;

  try {
    const tickets = await prisma.ticket.findMany({
      where: { eventId, status: 'lunas' },
      // FIX: Added eventId: true so offline tickets have complete schema for SQLite
      select: { id: true, qrToken: true, userId: true, eventId: true, status: true },
    });

    return res.json({
      success: true,
      message: `${tickets.length} tiket berhasil diunduh untuk mode offline.`,
      data: tickets,
      downloadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DownloadEventTickets error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { verifyGate, syncOfflineLogs, downloadEventTickets };
