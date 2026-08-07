const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

// GET /api/events — List all published events (with category filter)
const getAllEvents = async (req, res) => {
  const { page = 1, limit = 10, search = '', kategori = '' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { namaEvent: { contains: search } },
          { lokasi: { contains: search } },
        ],
      }),
      ...(kategori && { kategoriEvent: kategori }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { tanggal: 'asc' },
        include: {
          organizer: { select: { id: true, nama: true, email: true } },
          seats: {
            select: { id: true, kategori: true, harga: true, kuota: true, deskripsi: true, benefits: true, warna: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { tickets: { where: { status: { in: ['lunas', 'check_in'] } } } } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return res.json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetAllEvents error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/events/:id — Event detail
const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, nama: true, email: true } },
        seats: {
          select: {
            id: true, kategori: true, harga: true, kuota: true,
            deskripsi: true, benefits: true, warna: true, sortOrder: true,
            _count: { select: { tickets: { where: { status: { in: ['booking', 'lunas', 'check_in'] } } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        vendors: {
          select: { id: true, namaBooth: true, owner: { select: { nama: true } } },
        },
        _count: { select: { promoCodes: { where: { isActive: true, berlakuSampai: { gte: new Date() } } } } },
      },
    });

    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });

    // Enrich seats with availability + parsed benefits
    const seatsWithAvailability = event.seats.map((seat) => ({
      ...seat,
      terjual: seat._count.tickets,
      tersedia: seat.kuota - seat._count.tickets,
      benefits: seat.benefits ? JSON.parse(seat.benefits) : [],
    }));

    return res.json({
      success: true,
      data: {
        ...event,
        seats: seatsWithAvailability,
        hasActivePromo: event._count.promoCodes > 0,
      },
    });
  } catch (error) {
    console.error('GetEventById error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/events — Create event (Organizer only)
const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const {
    namaEvent, lokasi, tanggal, kapasitas, logoUrl, bannerUrl, deskripsi, seats,
    kategoriEvent, seatingType, jamBuka, jamTutup, syaratKetentuan, minAge, maxTicketPerUser,
  } = req.body;

  try {
    const event = await prisma.event.create({
      data: {
        organizerId: req.user.id,
        namaEvent,
        lokasi,
        tanggal: new Date(tanggal),
        kapasitas: parseInt(kapasitas),
        logoUrl,
        bannerUrl,
        deskripsi,
        kategoriEvent: kategoriEvent || 'konser',
        seatingType: seatingType || 'zone',
        jamBuka,
        jamTutup,
        syaratKetentuan,
        minAge: minAge ? parseInt(minAge) : null,
        maxTicketPerUser: maxTicketPerUser ? parseInt(maxTicketPerUser) : 4,
        isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true,
        seats: seats && seats.length > 0
          ? {
              create: seats.map((s, index) => ({
                kategori: s.kategori,
                harga: parseFloat(s.harga),
                kuota: parseInt(s.kuota),
                deskripsi: s.deskripsi || null,
                benefits: s.benefits ? JSON.stringify(s.benefits) : null,
                warna: s.warna || null,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: { seats: { orderBy: { sortOrder: 'asc' } } },
    });

    return res.status(201).json({ success: true, message: 'Event berhasil dibuat!', data: event });
  } catch (error) {
    console.error('CreateEvent error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    namaEvent, lokasi, tanggal, kapasitas, logoUrl, bannerUrl, deskripsi, isPublished,
    kategoriEvent, seatingType, jamBuka, jamTutup, syaratKetentuan, minAge, maxTicketPerUser,
  } = req.body;

  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.organizerId !== req.user.id && req.user.role !== 'organizer') {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(namaEvent && { namaEvent }),
        ...(lokasi && { lokasi }),
        ...(tanggal && { tanggal: new Date(tanggal) }),
        ...(kapasitas !== undefined && { kapasitas: parseInt(kapasitas) }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(isPublished !== undefined && { isPublished }),
        ...(kategoriEvent && { kategoriEvent }),
        ...(seatingType && { seatingType }),
        ...(jamBuka !== undefined && { jamBuka }),
        ...(jamTutup !== undefined && { jamTutup }),
        ...(syaratKetentuan !== undefined && { syaratKetentuan }),
        ...(minAge !== undefined && { minAge: minAge ? parseInt(minAge) : null }),
        ...(maxTicketPerUser !== undefined && { maxTicketPerUser: parseInt(maxTicketPerUser) }),
      },
      include: { seats: { orderBy: { sortOrder: 'asc' } } },
    });

    return res.json({ success: true, message: 'Event berhasil diperbarui!', data: updated });
  } catch (error) {
    console.error('UpdateEvent error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    await prisma.event.delete({ where: { id } });
    return res.json({ success: true, message: 'Event berhasil dihapus.' });
  } catch (error) {
    console.error('DeleteEvent error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/events/my
const getMyEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        seats: { orderBy: { sortOrder: 'asc' } },
        _count: {
          select: {
            tickets: { where: { status: { in: ['lunas', 'check_in'] } } },
            promoCodes: true,
          },
        },
      },
    });
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('GetMyEvents error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/events/:id/publish
const togglePublish = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    if (event.organizerId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak.' });

    const updated = await prisma.event.update({
      where: { id },
      data: { isPublished: !event.isPublished },
    });

    return res.json({
      success: true,
      message: `Event berhasil ${updated.isPublished ? 'dipublikasikan' : 'disembunyikan'}.`,
      data: updated,
    });
  } catch (error) {
    console.error('TogglePublish error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, getMyEvents, togglePublish };
