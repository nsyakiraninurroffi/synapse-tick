const prisma = require('../config/prisma');

// GET /api/analytics/dashboard - Organizer dashboard overview
const getOrganizerDashboard = async (req, res) => {
  const organizerId = req.user.id;

  try {
    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        seats: true,
        _count: {
          select: {
            tickets: { where: { status: { in: ['lunas', 'check_in'] } } },
          },
        },
      },
    });

    // Calculate totals
    const totalEvents = events.length;
    const publishedEvents = events.filter((e) => e.isPublished).length;
    const totalTicketsSold = events.reduce((sum, e) => sum + e._count.tickets, 0);

    // Calculate total revenue from transactions
    const revenue = await prisma.transaction.aggregate({
      where: {
        event: { organizerId },
        status: 'success',
        tipeTransaksi: 'beli_tiket',
      },
      _sum: { jumlah: true },
    });

    // Per-event analytics
    const eventAnalytics = events.map((event) => {
      const totalCapacity = event.seats.reduce((sum, s) => sum + s.kuota, 0);
      const soldTickets = event._count.tickets;
      return {
        id: event.id,
        namaEvent: event.namaEvent,
        tanggal: event.tanggal,
        isPublished: event.isPublished,
        totalCapacity,
        soldTickets,
        availableTickets: totalCapacity - soldTickets,
        occupancyRate: totalCapacity > 0 ? ((soldTickets / totalCapacity) * 100).toFixed(1) : 0,
      };
    });

    // Recent check-ins
    const recentCheckIns = await prisma.ticket.findMany({
      where: {
        event: { organizerId },
        status: 'check_in',
      },
      orderBy: { checkInAt: 'desc' },
      take: 10,
      include: {
        user: { select: { nama: true, email: true } },
        event: { select: { namaEvent: true } },
        seat: { select: { kategori: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          publishedEvents,
          totalTicketsSold,
          totalRevenue: parseFloat(revenue._sum.jumlah?.toString() || '0'),
        },
        eventAnalytics,
        recentCheckIns,
      },
    });
  } catch (error) {
    console.error('GetOrganizerDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/analytics/events/:eventId - Detailed event analytics
const getEventAnalytics = async (req, res) => {
  const { eventId } = req.params;
  const organizerId = req.user.id;

  try {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: {
        seats: {
          include: {
            _count: { select: { tickets: { where: { status: { in: ['lunas', 'check_in'] } } } } },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    // Ticket status breakdown
    const ticketStatusBreakdown = await prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId },
      _count: { status: true },
    });

    // Revenue per seat category
    const revenuePerCategory = await Promise.all(
      event.seats.map(async (seat) => {
        const soldTickets = seat._count.tickets;
        return {
          kategori: seat.kategori,
          harga: parseFloat(seat.harga.toString()),
          kuota: seat.kuota,
          terjual: soldTickets,
          tersedia: seat.kuota - soldTickets,
          revenue: parseFloat(seat.harga.toString()) * soldTickets,
        };
      })
    );

    // Check-in timeline (hourly)
    const checkIns = await prisma.ticket.findMany({
      where: { eventId, status: 'check_in' },
      select: { checkInAt: true },
      orderBy: { checkInAt: 'asc' },
    });

    // Vendor revenue for this event
    const vendorRevenue = await prisma.boothTransaction.aggregate({
      where: { vendor: { eventId }, status: 'success' },
      _sum: { nominal: true },
    });

    return res.json({
      success: true,
      data: {
        event: { id: event.id, namaEvent: event.namaEvent, tanggal: event.tanggal },
        ticketStatusBreakdown,
        revenuePerCategory,
        totalRevenue: revenuePerCategory.reduce((sum, c) => sum + c.revenue, 0),
        vendorRevenue: parseFloat(vendorRevenue._sum.nominal?.toString() || '0'),
        checkInCount: checkIns.length,
        checkInTimeline: checkIns.map((c) => c.checkInAt),
      },
    });
  } catch (error) {
    console.error('GetEventAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getOrganizerDashboard, getEventAnalytics };
