# 🎟️ TicketFlow — SaaS Ticketing, Gate Access Control & Cashless Ecosystem

<div align="center">

![TicketFlow Banner](https://picsum.photos/seed/ticketflow/900/200)

**Platform SaaS Ticketing Event Modern dengan Teknologi Cashless NFC/QR, Gate Access Control, dan Virtual Queue**

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=nodedotjs)](https://nodejs.org)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://prisma.io)
[![Database](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql)](https://mysql.com)
[![Cache](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis)](https://redis.io)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=nextdotjs)](https://nextjs.org)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter-02569B?logo=flutter)](https://flutter.dev)

</div>

---

## 📋 Daftar Isi

- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Fitur Utama](#-fitur-utama)
- [Prasyarat](#-prasyarat)
- [Langkah 1: Setup Backend](#-langkah-1-setup-backend--database)
- [Langkah 2: Setup Frontend](#-langkah-2-setup-frontend-nextjs)
- [Langkah 3: Setup Mobile](#-langkah-3-setup-mobile-flutter)
- [API Documentation](#-api-documentation)
- [Akun Demo](#-akun-demo)
- [Alur Sistem](#-alur-sistem)

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    TICKETFLOW ECOSYSTEM                  │
├──────────────────┬──────────────────┬───────────────────┤
│  Frontend Web    │   Backend API    │   Mobile App      │
│  Next.js 14      │  Node.js Express │   Flutter         │
│  Tailwind CSS    │  Prisma ORM      │   Offline-First   │
│  Port: 3000      │  Port: 3001      │   iOS & Android   │
├──────────────────┴──────────────────┴───────────────────┤
│                    DATA LAYER                           │
│  MySQL (ticketing_saas_db) │ Redis (Lock + Queue)       │
│                            │ SQLite (Mobile Offline)    │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Backend** | Node.js + Express.js | 18+ / 4.x |
| **ORM** | Prisma | 5.x |
| **Database** | MySQL | 8.x |
| **Cache & Queue** | Redis (ioredis) | 7.x |
| **Auth** | JWT (jsonwebtoken) | - |
| **Encryption** | AES-256 (crypto-js) | - |
| **Frontend** | Next.js App Router | 14.x |
| **Styling** | Tailwind CSS | 3.x |
| **State** | Zustand | 4.x |
| **Mobile** | Flutter | 3.19+ |
| **Local DB** | SQLite (sqflite) | - |

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Auth JWT** | Register/Login dengan JWT, role-based (pengunjung, organizer, staff, vendor) |
| 🎟️ **Ticketing** | Beli tiket maks. 2/user, Redis Distributed Lock 5 menit anti-overselling |
| ⚡ **Virtual Queue** | Redis Sorted Set untuk antrian saat traffic puncak |
| 📱 **Dynamic QR** | QR Code dienkripsi AES-256, unik per tiket |
| 🚪 **Gate Access** | Scan QR online/offline, validasi real-time atau cache SQLite |
| 📡 **Offline-First** | Gate scanner Flutter bekerja tanpa internet, sync otomatis |
| 💳 **Cashless Wallet** | E-Wallet dengan saldo, top-up VA, dan transaksi F&B di booth |
| 📊 **Analytics** | Dashboard organizer: revenue, occupancy, check-in timeline |
| 🏪 **Vendor Booth** | POS kasir vendor scan QR wallet pengunjung untuk pembayaran |

---

## 📦 Prasyarat

Pastikan software berikut sudah terinstall:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MySQL** v8+ → [mysql.com](https://mysql.com) atau XAMPP/Laragon
- **Redis** → [redis.io/download](https://redis.io/download) atau [Memurai (Windows)](https://www.memurai.com)
- **Flutter SDK** v3.19+ → [flutter.dev/get-started](https://flutter.dev/get-started)
- **Git** → [git-scm.com](https://git-scm.com)

---

## 🚀 Langkah 1: Setup Backend & Database

### 1.1 Install Dependencies

```bash
cd codingan/backend
npm install
```

### 1.2 Konfigurasi Environment

File `.env` sudah dibuat secara otomatis. Sesuaikan jika perlu:

```env
# codingan/backend/.env
DATABASE_URL="mysql://root:@localhost:3306/ticketing_saas_db"
JWT_SECRET="ticketing_saas_super_secret_jwt_key_2024_change_in_production"
JWT_EXPIRES_IN="7d"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""
PORT=3001
NODE_ENV="development"
AES_SECRET_KEY="ticketing_aes_256_secret_key_32ch"
FRONTEND_URL="http://localhost:3000"
```

### 1.3 Buat Database MySQL

Buka MySQL client (phpMyAdmin / MySQL Workbench / CLI):

```sql
CREATE DATABASE ticketing_saas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.4 Jalankan Prisma Migration

```bash
# Generate Prisma Client
npm run prisma:generate

# Buat tabel (migration)
npm run prisma:migrate

# Isi data awal (seed)
npm run prisma:seed
```

### 1.5 Jalankan Backend Server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

✅ Backend berjalan di: **http://localhost:3001**  
✅ Health check: **http://localhost:3001/health**

### 1.6 Prisma Studio (GUI Database)

```bash
npm run prisma:studio
```
Akses di: http://localhost:5555

---

## 🌐 Langkah 2: Setup Frontend (Next.js)

### 2.1 Install Dependencies

```bash
cd codingan/frontend
npm install
```

### 2.2 Konfigurasi Environment

```env
# codingan/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2.3 Jalankan Frontend

```bash
npm run dev
```

✅ Frontend berjalan di: **http://localhost:3000**

### Halaman yang Tersedia

| URL | Deskripsi |
|-----|-----------|
| `/` | Landing page + katalog event |
| `/events` | Semua event (grid/list, search, pagination) |
| `/event/[id]` | Detail event + pilih tiket + booking |
| `/my-tickets` | Tiket saya + tampilan QR Code |
| `/checkout` | (redirect dari event detail) |
| `/dashboard` | Dashboard organizer (analytics, event table) |
| `/dashboard/create-event` | Form buat event baru |
| `/wallet` | E-Wallet (saldo, top-up, histori) |
| `/login` | Login |
| `/register` | Registrasi (pilih role) |

---

## 📱 Langkah 3: Setup Mobile (Flutter)

### 3.1 Install Flutter Dependencies

```bash
cd codingan/mobile
flutter pub get
```

### 3.2 Buat Folder Assets

```bash
mkdir -p assets/images assets/lottie
```

### 3.3 Konfigurasi URL Backend

Edit file `lib/constants/api_constants.dart`:

```dart
// Untuk Android Emulator (localhost backend)
const String baseUrl = 'http://10.0.2.2:3001/api';

// Untuk iOS Simulator
const String baseUrl = 'http://localhost:3001/api';

// Untuk Device Fisik (ganti dengan IP lokal Anda)
const String baseUrl = 'http://192.168.1.x:3001/api';
```

### 3.4 Konfigurasi Android (Izin Kamera & Internet)

Tambahkan di `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.NFC"/>
```

### 3.5 Jalankan Mobile App

```bash
# Cek device yang tersedia
flutter devices

# Jalankan di emulator/device
flutter run

# Build APK debug
flutter build apk --debug
```

### Layar Aplikasi Mobile

| Screen | Role | Deskripsi |
|--------|------|-----------|
| `LoginScreen` | Semua | Login dengan email & password |
| `HomeScreen` | Semua | Navigasi berbasis role |
| `GateScannerScreen` | Staff / Organizer | Scan QR, online/offline mode |
| `VendorBoothScreen` | Vendor | Kasir F&B, scan wallet, histori |
| `_ProfileScreen` | Semua | Info profil + logout |

---

## 📚 API Documentation

### Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | ❌ | Registrasi akun baru |
| POST | `/api/auth/login` | ❌ | Login, dapat JWT token |
| GET | `/api/auth/me` | ✅ | Data user yang login |
| PUT | `/api/auth/profile` | ✅ | Update profil |

### Events

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/api/events` | ❌ | - | List event (search, pagination) |
| GET | `/api/events/:id` | ❌ | - | Detail event + ketersediaan seat |
| GET | `/api/events/my` | ✅ | organizer | Event milik organizer |
| POST | `/api/events` | ✅ | organizer | Buat event baru |
| PUT | `/api/events/:id` | ✅ | organizer | Update event |
| DELETE | `/api/events/:id` | ✅ | organizer | Hapus event |
| PATCH | `/api/events/:id/publish` | ✅ | organizer | Toggle publish |

### Tickets

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/api/tickets/book` | ✅ | pengunjung | Beli tiket (Redis Lock) |
| GET | `/api/tickets/my` | ✅ | - | Tiket milik saya |
| GET | `/api/tickets/:id` | ✅ | - | Detail tiket + QR |
| GET | `/api/tickets/queue/:eventId` | ✅ | - | Posisi antrian virtual |

### Payment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/payment/callback` | ❌ | Webhook payment gateway |
| POST | `/api/payment/mock-success` | ❌ | Simulasi bayar (dev only) |
| GET | `/api/payment/status/:ref` | ✅ | Cek status pembayaran |
| POST | `/api/payment/topup` | ✅ | Top-up e-wallet |

### Gate

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/api/gate/verify` | ✅ | staff, organizer | Verifikasi QR AES-256 |
| POST | `/api/gate/sync` | ✅ | staff, organizer | Sync log offline check-in |
| GET | `/api/gate/download/:eventId` | ✅ | staff, organizer | Unduh tiket untuk offline |

### Vendor & Wallet

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| POST | `/api/vendors/pay` | ✅ | vendor | Proses pembayaran booth |
| GET | `/api/vendors/transactions` | ✅ | vendor | Histori transaksi vendor |
| GET | `/api/wallet/balance` | ✅ | - | Saldo wallet |
| GET | `/api/wallet/transactions` | ✅ | - | Histori transaksi wallet |

### Analytics

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| GET | `/api/analytics/dashboard` | ✅ | organizer | Overview dashboard |
| GET | `/api/analytics/events/:id` | ✅ | organizer | Analitik per event |

---

## 👤 Akun Demo

Setelah menjalankan `npm run prisma:seed`:

| Role | Email | Password |
|------|-------|----------|
| **Organizer** | organizer@ticketing.com | password123 |
| **Pengunjung** | pengunjung@ticketing.com | password123 |
| **Gate Staff** | staff@ticketing.com | password123 |
| **Vendor** | vendor@ticketing.com | password123 |

---

## 🔄 Alur Sistem

### Alur Pembelian Tiket

```
Pengunjung → Pilih Event → Masuk Virtual Queue (Redis)
→ Acquire Redis Distributed Lock (5 menit)
→ Cek Ketersediaan Seat → Buat Transaksi (pending)
→ Generate QR Token (AES-256) → Notifikasi Pembayaran
→ [Payment Gateway Callback] → Update status "lunas"
→ QR Code aktif di app
```

### Alur Gate Scan (Offline-First)

```
Gate Staff Scan QR
│
├─ [Online] → POST /api/gate/verify
│              → Decrypt AES-256 token
│              → Validasi tiket di database
│              → Update status "check_in"
│              → Return GRANTED/DENIED
│
└─ [Offline] → Decrypt AES-256 lokal
               → Cari di SQLite cache
               → Mark lokal "check_in"
               → Simpan ke offline_checkin_logs
               → [Saat online kembali] → POST /api/gate/sync
```

### Alur Pembayaran Booth

```
Vendor scan QR Wallet pengunjung
→ Input nominal & keterangan
→ POST /api/vendors/pay
→ Cek saldo wallet
→ Deduct saldo (atomic DB transaction)
→ Buat BoothTransaction record
→ Return sukses + saldo baru
```

---

## 🔧 Troubleshooting

### Redis tidak bisa konek

```bash
# Windows - Jalankan Redis
# Install Memurai: https://www.memurai.com/
# atau via WSL:
wsl redis-server

# Cek status
redis-cli ping
# Output: PONG
```

### Prisma migration error

```bash
# Reset database
npx prisma migrate reset

# Re-generate
npx prisma generate
npx prisma migrate dev
```

### Flutter build error

```bash
flutter clean
flutter pub get
flutter run
```

### Port sudah dipakai

```bash
# Cek port 3001 (backend)
netstat -ano | findstr :3001
# Kill process
taskkill /PID <PID> /F

# Cek port 3000 (frontend)
netstat -ano | findstr :3000
```

---

## 🗂️ Struktur Folder

```
codingan/
├── backend/                    # Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (8 entitas)
│   │   └── seed.js             # Data awal demo
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.js       # Prisma singleton
│   │   │   └── redis.js        # Redis + Distributed Lock + Virtual Queue
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── ticket.controller.js   # Redis Lock, max 2 tiket
│   │   │   ├── payment.controller.js  # Webhook + mock
│   │   │   ├── gate.controller.js     # AES-256 verify + offline sync
│   │   │   ├── wallet.controller.js
│   │   │   ├── vendor.controller.js
│   │   │   └── analytics.controller.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js     # JWT + RBAC
│   │   ├── routes/                    # 8 route files
│   │   ├── utils/
│   │   │   └── crypto.utils.js        # AES-256 QR token
│   │   └── server.js                  # Entry point
│   ├── .env
│   └── package.json
│
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Landing + event catalog
│   │   ├── events/page.tsx     # Semua event
│   │   ├── event/[id]/page.tsx # Detail + booking
│   │   ├── my-tickets/page.tsx # Tiket + QR modal
│   │   ├── dashboard/page.tsx  # Organizer analytics
│   │   ├── dashboard/create-event/page.tsx
│   │   ├── wallet/page.tsx     # E-Wallet
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── globals.css         # Dark glassmorphism theme
│   │   └── layout.tsx
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/api.ts              # Axios API client
│   ├── store/authStore.ts      # Zustand auth state
│   └── package.json
│
└── mobile/                     # Flutter
    ├── lib/
    │   ├── main.dart            # Entry + MultiProvider
    │   ├── theme/app_theme.dart
    │   ├── constants/api_constants.dart
    │   ├── providers/
    │   │   ├── auth_provider.dart         # JWT + SecureStorage
    │   │   └── connectivity_provider.dart
    │   ├── services/
    │   │   ├── local_database.dart        # SQLite Offline-First
    │   │   └── crypto_service.dart        # AES-256 decrypt
    │   └── screens/
    │       ├── login_screen.dart
    │       ├── home_screen.dart           # Role-based navigation
    │       ├── gate_scanner_screen.dart   # QR scan + offline sync
    │       └── vendor_booth_screen.dart   # Kasir F&B
    └── pubspec.yaml
```

---

## 🔒 Keamanan

- **JWT** dengan expiry 7 hari, stored di localStorage (web) / SecureStorage (mobile)  
- **AES-256** untuk enkripsi QR token (dynamic, unique per tiket)  
- **Redis Distributed Lock** mencegah race condition saat pembelian tiket bersamaan  
- **Rate Limiting** 200 request/15 menit per IP di semua endpoint API  
- **Role-based Access Control** (RBAC) di setiap endpoint  
- **Helmet.js** untuk security headers  
- **Input Validation** menggunakan express-validator  

---

<div align="center">

**Dibuat dengan ❤️ untuk ekosistem event Indonesia**

</div>
