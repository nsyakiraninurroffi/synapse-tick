const prisma = require('../config/prisma');

// POST /api/promo — Create promo code (organizer only)
const createPromo = async (req, res) => {
  const { eventId, kode, diskon, isPercentage = false, kuota, berlakuSampai } = req.body;

  if (!eventId || !kode || !diskon || !kuota || !berlakuSampai) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
  }

  try {
    // Verify organizer owns the event
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak membuat promo untuk event ini.' });
    }

    // Check duplicate code
    const existing = await prisma.promoCode.findUnique({ where: { kode: kode.toUpperCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Kode promo sudah digunakan.' });
    }

    const promo = await prisma.promoCode.create({
      data: {
        eventId,
        kode: kode.toUpperCase(),
        diskon: parseFloat(diskon),
        isPercentage: Boolean(isPercentage),
        kuota: parseInt(kuota),
        berlakuSampai: new Date(berlakuSampai),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Kode promo berhasil dibuat!',
      data: promo,
    });
  } catch (error) {
    console.error('CreatePromo error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/promo/validate — Validate promo code
const validatePromo = async (req, res) => {
  const { kode, eventId, totalHarga } = req.body;

  if (!kode || !eventId) {
    return res.status(400).json({ success: false, message: 'Kode promo dan eventId diperlukan.' });
  }

  try {
    const promo = await prisma.promoCode.findUnique({ where: { kode: kode.toUpperCase() } });

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Kode promo tidak ditemukan.' });
    }

    // Validate event match
    if (promo.eventId !== eventId) {
      return res.status(400).json({ success: false, message: 'Kode promo tidak berlaku untuk event ini.' });
    }

    // Check expiry
    if (new Date() > promo.berlakuSampai) {
      return res.status(400).json({ success: false, message: 'Kode promo sudah kadaluarsa.' });
    }

    // Check quota
    if (promo.terpakai >= promo.kuota) {
      return res.status(400).json({ success: false, message: 'Kuota kode promo sudah habis.' });
    }

    // Check active
    if (!promo.isActive) {
      return res.status(400).json({ success: false, message: 'Kode promo tidak aktif.' });
    }

    // Calculate discount
    let discountAmount = 0;
    const total = parseFloat(totalHarga || 0);

    if (promo.isPercentage) {
      discountAmount = total * (parseFloat(promo.diskon) / 100);
    } else {
      discountAmount = parseFloat(promo.diskon);
    }

    // Cap discount to total price
    discountAmount = Math.min(discountAmount, total);

    return res.json({
      success: true,
      message: 'Kode promo valid!',
      data: {
        id: promo.id,
        kode: promo.kode,
        diskon: parseFloat(promo.diskon),
        isPercentage: promo.isPercentage,
        discountAmount: Math.round(discountAmount),
        finalPrice: Math.max(0, Math.round(total - discountAmount)),
        sisaKuota: promo.kuota - promo.terpakai,
      },
    });
  } catch (error) {
    console.error('ValidatePromo error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/promo/event/:eventId — Get promo codes for event (organizer only)
const getPromosByEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const promos = await prisma.promoCode.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: promos });
  } catch (error) {
    console.error('GetPromosByEvent error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/promo/:id — Delete promo code (organizer only)
const deletePromo = async (req, res) => {
  const { id } = req.params;

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!promo) return res.status(404).json({ success: false, message: 'Promo tidak ditemukan.' });
    if (promo.event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    await prisma.promoCode.delete({ where: { id } });
    return res.json({ success: true, message: 'Promo berhasil dihapus.' });
  } catch (error) {
    console.error('DeletePromo error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { createPromo, validatePromo, getPromosByEvent, deletePromo };
