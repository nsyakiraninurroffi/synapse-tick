const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const crypto = require('crypto');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, nama: user.nama },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    return res.status(422).json({ success: false, message: errorMsg, errors: errors.array() });
  }

  const { nama, email, password, role } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const assignedRole = role || 'pengunjung';

    const user = await prisma.user.create({
      data: {
        nama: nama.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
      },
      select: { id: true, nama: true, email: true, role: true, createdAt: true },
    });

    // Auto-create wallet for pengunjung & vendor
    let wallet = null;
    if (['pengunjung', 'vendor'].includes(user.role)) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id, saldo: 0 },
        select: { id: true, saldo: true, nfcUid: true },
      });
    }

    const token = generateToken(user);
    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        user: { ...user, wallet },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat registrasi.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    return res.status(422).json({ success: false, message: errorMsg, errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        wallet: { select: { id: true, saldo: true, nfcUid: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login berhasil!',
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, nama: true, email: true, role: true, createdAt: true,
        wallet: { select: { id: true, saldo: true, nfcUid: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { nama } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { nama },
      select: { id: true, nama: true, email: true, role: true },
    });
    return res.json({ success: true, message: 'Profil berhasil diperbarui.', data: user });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/auth/social-login
// Called by NextAuth signIn callback to sync OAuth user with our DB
const socialLogin = async (req, res) => {
  const { provider, providerId, email, nama, avatar } = req.body;

  if (!provider || !email) {
    return res.status(400).json({ success: false, message: 'provider dan email wajib diisi.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Try find existing user by email
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { wallet: { select: { id: true, saldo: true, nfcUid: true } } },
    });

    if (!user) {
      // Auto-register new user from social provider
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          nama: nama || email.split('@')[0],
          email: normalizedEmail,
          password: hashedPassword,
          role: 'pengunjung',
          // Store provider info if schema supports it, else just create user
        },
        include: { wallet: { select: { id: true, saldo: true, nfcUid: true } } },
      });

      // Auto-create wallet for new social user
      if (!user.wallet) {
        await prisma.wallet.create({
          data: { userId: user.id, saldo: 0 },
        });
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { wallet: { select: { id: true, saldo: true, nfcUid: true } } },
        });
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    return res.json({
      success: true,
      message: user ? 'Login sosial berhasil.' : 'Registrasi via sosial berhasil.',
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    console.error('SocialLogin error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat social login.' });
  }
};

module.exports = { register, login, getMe, updateProfile, socialLogin };
