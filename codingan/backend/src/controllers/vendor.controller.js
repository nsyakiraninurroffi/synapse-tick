const prisma = require('../config/prisma');

// POST /api/vendors/pay - Process vendor payment (scan wallet QR/NFC)
const processBoothPayment = async (req, res) => {
  const { walletIdentifier, nominal, keterangan } = req.body;
  const vendorUserId = req.user.id;

  if (!walletIdentifier || !nominal) {
    return res.status(400).json({ success: false, message: 'walletIdentifier dan nominal diperlukan.' });
  }

  if (parseFloat(nominal) < 1000) {
    return res.status(400).json({ success: false, message: 'Minimum transaksi adalah Rp 1.000.' });
  }

  try {
    // Find vendor by current user
    const vendor = await prisma.vendor.findFirst({
      where: { ownerId: vendorUserId },
    });

    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Anda tidak terdaftar sebagai vendor.' });
    }

    // Find wallet by userId or nfcUid
    const wallet = await prisma.wallet.findFirst({
      where: {
        OR: [
          { nfcUid: walletIdentifier },
          { userId: walletIdentifier },
        ],
      },
      include: { user: { select: { nama: true, email: true } } },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet tidak ditemukan.' });
    }

    // Check sufficient balance
    const currentSaldo = parseFloat(wallet.saldo.toString());
    const amount = parseFloat(nominal);

    if (currentSaldo < amount) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi. Saldo tersedia: Rp ${currentSaldo.toLocaleString('id-ID')}.`,
      });
    }

    // Deduct wallet balance and create transaction
    const [updatedWallet, boothTrx] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { saldo: { decrement: amount } },
      }),
      prisma.boothTransaction.create({
        data: {
          vendorId: vendor.id,
          walletId: wallet.id,
          nominal: amount,
          status: 'success',
          keterangan: keterangan || 'Pembelian di booth',
        },
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} berhasil dari ${wallet.user.nama}.`,
      data: {
        transactionId: boothTrx.id,
        nominal: amount,
        saldoSebelum: currentSaldo,
        saldoSesudah: parseFloat(updatedWallet.saldo.toString()),
        holder: wallet.user.nama,
        vendor: vendor.namaBooth,
        waktu: boothTrx.waktu,
      },
    });
  } catch (error) {
    console.error('ProcessBoothPayment error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/vendors/transactions - Vendor transaction history
const getVendorTransactions = async (req, res) => {
  const vendorUserId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const vendor = await prisma.vendor.findFirst({ where: { ownerId: vendorUserId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Anda tidak terdaftar sebagai vendor.' });
    }

    const [transactions, total, totalRevenue] = await Promise.all([
      prisma.boothTransaction.findMany({
        where: { vendorId: vendor.id },
        skip,
        take: parseInt(limit),
        orderBy: { waktu: 'desc' },
        include: { wallet: { include: { user: { select: { nama: true } } } } },
      }),
      prisma.boothTransaction.count({ where: { vendorId: vendor.id } }),
      prisma.boothTransaction.aggregate({
        where: { vendorId: vendor.id, status: 'success' },
        _sum: { nominal: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        vendor: { id: vendor.id, namaBooth: vendor.namaBooth },
        totalRevenue: parseFloat(totalRevenue._sum.nominal?.toString() || '0'),
        transactions,
      },
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetVendorTransactions error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/vendors/event/:eventId - Get all vendors for an event
const getVendorsByEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    const vendors = await prisma.vendor.findMany({
      where: { eventId },
      include: {
        owner: { select: { nama: true, email: true } },
        _count: { select: { boothTransactions: true } },
      },
    });
    return res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('GetVendorsByEvent error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/vendors/register - Register as vendor for an event
const registerVendor = async (req, res) => {
  const { eventId, namaBooth } = req.body;
  const userId = req.user.id;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    const vendor = await prisma.vendor.create({
      data: { eventId, ownerId: userId, namaBooth },
    });

    return res.status(201).json({ success: true, message: 'Booth berhasil didaftarkan!', data: vendor });
  } catch (error) {
    console.error('RegisterVendor error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { processBoothPayment, getVendorTransactions, getVendorsByEvent, registerVendor };
