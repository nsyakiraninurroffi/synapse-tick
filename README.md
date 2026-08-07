# 🎟️ TicketFlow SaaS — Full-Stack Event Ticketing & Cashless Platform

![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black.svg)
![Express](https://img.shields.io/badge/Express.js-4.x-green.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.x-cyan.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)

Platform SaaS **E-Ticketing & Management Event** berbasis Multi-Tenant dengan enkripsi tiket **Dynamic QR AES-256**, sistem **Offline-First Gate Scanner**, serta **E-Wallet Cashless** untuk booth vendor.

---

## 📁 Struktur Folder Project

```
Project Ticketing SaaS/
├── DOCS/                               ← Dokumen Perancangan System Design (Tugas 1)
│   └── PERANCANGAN_APLIKASI_TICKETING.md
└── codingan/
    ├── backend/                        ← Node.js + Express.js + Prisma ORM API
    ├── frontend/                       ← Next.js 14 Web Application (All Roles)
    └── mobile/                         ← Flutter Native App (Android/iOS Scanner & NFC)
```

---

## 👥 5 Peran Pengguna (Roles)

1. **Super Admin**: Pemilik platform SaaS, pengawasan transaksi & pencairan dana (*Withdrawal*).
2. **Pengunjung**: Beli tiket online, diskon voucher promo, E-Wallet cashless, & QR Tiket.
3. **Organizer**: Buat event baru, atur zona & harga tiket, buat kode promo, & analytics detail.
4. **Staff Gate**: Scan QR tiket di pintu masuk venue (Mendukung mode Online & Offline-First).
5. **Vendor**: Terima pembayaran cashless dari penonton & kelola pendapatan booth.

---

## 🚀 Cara Menjalankan Project

### 1. Backend API (Terminal 1)
```bash
cd codingan/backend
npm install
npx prisma db push
node prisma/seed-demo.js    # Seed akun demo
npm run dev                 # Berjalan di http://localhost:3001
```

### 2. Frontend Web App (Terminal 2)
```bash
cd codingan/frontend
npm install
npm run dev                 # Berjalan di http://localhost:3000
```

---

## 🔑 Akun Demo Instant (Password: `demo1234`)

- **Pengunjung**: `pengunjung@demo.com`
- **Organizer**: `organizer@demo.com`
- **Staff Gate**: `staff@demo.com`
- **Vendor**: `vendor@demo.com`

---

## 📄 Lisensi
Hak Cipta © 2026 TicketFlow SaaS. Dikembangkan untuk Tugas Perancangan & Inisiasi Project Git.
