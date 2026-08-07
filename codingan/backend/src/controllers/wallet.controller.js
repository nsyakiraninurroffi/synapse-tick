const prisma = require('../config/prisma');

// GET /api/wallet/balance - Get wallet balance
const getBalance = async (req, res) => {
  const userId = req.user.id;
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        boothTransactions: {
          orderBy: { waktu: 'desc' },
          take: 10,
          include: { vendor: { select: { namaBooth: true } } },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet tidak ditemukan.' });
    }

    return res.json({ success: true, data: wallet });
  } catch (error) {
    console.error('GetBalance error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/wallet/transactions - Get wallet transaction history
const getWalletTransactions = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet tidak ditemukan.' });
    }

    const [transactions, total] = await Promise.all([
      prisma.boothTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: parseInt(limit),
        orderBy: { waktu: 'desc' },
        include: { vendor: { select: { namaBooth: true, event: { select: { namaEvent: true } } } } },
      }),
      prisma.boothTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return res.json({
      success: true,
      data: transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetWalletTransactions error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/wallet/nfc - Update NFC UID
const updateNfcUid = async (req, res) => {
  const { nfcUid } = req.body;
  const userId = req.user.id;

  try {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: { nfcUid },
    });
    return res.json({ success: true, message: 'NFC UID berhasil diperbarui.', data: wallet });
  } catch (error) {
    console.error('UpdateNfcUid error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getBalance, getWalletTransactions, updateNfcUid };
