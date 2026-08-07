const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create Users
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@ticketing.com' },
    update: {},
    create: {
      nama: 'Java Festival Production',
      email: 'organizer@ticketing.com',
      password: hashedPassword,
      role: 'organizer',
      noHp: '081234567890',
    },
  });

  const pengunjung = await prisma.user.upsert({
    where: { email: 'pengunjung@ticketing.com' },
    update: {},
    create: {
      nama: 'Budi Santoso',
      email: 'pengunjung@ticketing.com',
      password: hashedPassword,
      role: 'pengunjung',
      noHp: '089876543210',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@ticketing.com' },
    update: {},
    create: {
      nama: 'Gate Staff Manager',
      email: 'staff@ticketing.com',
      password: hashedPassword,
      role: 'staff',
      noHp: '081122334455',
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@ticketing.com' },
    update: {},
    create: {
      nama: 'Warung Kopi Nusantara',
      email: 'vendor@ticketing.com',
      password: hashedPassword,
      role: 'vendor',
      noHp: '085566778899',
    },
  });

  // Create Wallet for pengunjung
  await prisma.wallet.upsert({
    where: { userId: pengunjung.id },
    update: {},
    create: {
      userId: pengunjung.id,
      saldo: 500000,
      nfcUid: 'NFC_DEMO_001',
    },
  });

  // 2. Create Events across categories
  // 🎵 Event 1: Konser (Java Jazz 2026)
  const event1 = await prisma.event.upsert({
    where: { id: 'event-demo-001' },
    update: {},
    create: {
      id: 'event-demo-001',
      organizerId: organizer.id,
      namaEvent: 'Java Jazz Festival 2026',
      lokasi: 'JIExpo Kemayoran, Jakarta Pusat',
      tanggal: new Date('2026-05-15T18:00:00Z'),
      jamBuka: '15:00',
      jamTutup: '23:30',
      kapasitas: 15000,
      kategoriEvent: 'konser',
      seatingType: 'zone',
      logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
      deskripsi: 'Festival musik jazz tahunan terbesar di Indonesia. Menghadirkan musisi kelas dunia dan lokal unggulan dalam 10 panggung megah.',
      syaratKetentuan: 'Wajib membawa E-KTP. Dilarang membawa makanan & minuman dari luar. Usia minimal 12 tahun.',
      minAge: 12,
      maxTicketPerUser: 4,
      isPublished: true,
    },
  });

  // 🎤 Event 2: Seminar (TEDxJakarta 2026)
  const event2 = await prisma.event.upsert({
    where: { id: 'event-demo-002' },
    update: {},
    create: {
      id: 'event-demo-002',
      organizerId: organizer.id,
      namaEvent: 'TEDxJakarta 2026: Reshaping Future',
      lokasi: 'Taman Ismail Marzuki, Jakarta Pusat',
      tanggal: new Date('2026-06-20T09:00:00Z'),
      jamBuka: '08:00',
      jamTutup: '17:00',
      kapasitas: 1200,
      kategoriEvent: 'seminar',
      seatingType: 'numbered',
      logoUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      deskripsi: 'Konferensi inspiratif dengan 12 pembicara lintas bidang dari sains, teknologi, seni hingga perubahan sosial.',
      syaratKetentuan: 'Registrasi ulang di lokasi dimulai pukul 08.00 WIB. Sudah termasuk makan siang & e-certificate.',
      minAge: 15,
      maxTicketPerUser: 2,
      isPublished: true,
    },
  });

  // 🎪 Event 3: Festival (We The Fest 2026)
  const event3 = await prisma.event.upsert({
    where: { id: 'event-demo-003' },
    update: {},
    create: {
      id: 'event-demo-003',
      organizerId: organizer.id,
      namaEvent: 'We The Fest 2026 (3-Day Pass)',
      lokasi: 'GBK Sports Complex, Senayan, Jakarta',
      tanggal: new Date('2026-07-24T14:00:00Z'),
      jamBuka: '13:00',
      jamTutup: '01:00',
      kapasitas: 25000,
      kategoriEvent: 'festival',
      seatingType: 'zone',
      logoUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
      deskripsi: 'Festival musim panas 3 hari yang menggabungkan musik, seni, mode, dan kuliner terdepan.',
      syaratKetentuan: 'Wristband wajib dipakai selama 3 hari. Pembayaran di venue 100% cashless via TicketFlow NFC Wallet.',
      minAge: 18,
      maxTicketPerUser: 4,
      isPublished: true,
    },
  });

  // 🎭 Event 4: Theater (Teater Koma: Sampek Engtay)
  const event4 = await prisma.event.upsert({
    where: { id: 'event-demo-004' },
    update: {},
    create: {
      id: 'event-demo-004',
      organizerId: organizer.id,
      namaEvent: 'Teater Koma: Lakon Sampek Engtay',
      lokasi: 'Gedung Kesenian Jakarta, Pasar Baru',
      tanggal: new Date('2026-08-10T19:30:00Z'),
      jamBuka: '18:30',
      jamTutup: '22:00',
      kapasitas: 800,
      kategoriEvent: 'theater',
      seatingType: 'numbered',
      logoUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&q=80',
      deskripsi: 'Karya legendaris Teater Koma yang penuh komedi, kritik sosial, dan drama percintaan yang abadi.',
      syaratKetentuan: 'Pintu auditorium ditutup tepat pukul 19.30 WIB. Penonton terlambat baru bisa masuk saat jeda babak.',
      minAge: 10,
      maxTicketPerUser: 6,
      isPublished: true,
    },
  });

  // ⚽ Event 5: Olahraga (Derby Indonesia)
  const event5 = await prisma.event.upsert({
    where: { id: 'event-demo-005' },
    update: {},
    create: {
      id: 'event-demo-005',
      organizerId: organizer.id,
      namaEvent: 'Big Match: Persija Jakarta vs Persib Bandung',
      lokasi: 'Stadion Utama Gelora Bung Karno, Jakarta',
      tanggal: new Date('2026-09-05T15:30:00Z'),
      jamBuka: '12:00',
      jamTutup: '18:30',
      kapasitas: 60000,
      kategoriEvent: 'olahraga',
      seatingType: 'zone',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80',
      deskripsi: 'Pertandingan laga klasik sepak bola Indonesia dalam perburuan gelar juara liga.',
      syaratKetentuan: 'Verifikasi identitas ketat di ring 1. Dilarang membawa suar, flare, laser, dan benda tajam.',
      minAge: 6,
      maxTicketPerUser: 2,
      isPublished: true,
    },
  });

  // 🎨 Event 6: Exhibition (Art Jakarta 2026)
  const event6 = await prisma.event.upsert({
    where: { id: 'event-demo-006' },
    update: {},
    create: {
      id: 'event-demo-006',
      organizerId: organizer.id,
      namaEvent: 'Art Jakarta 2026: Contemporary Art Fair',
      lokasi: 'Hutan Kota Plataran, GBK, Jakarta',
      tanggal: new Date('2026-10-12T10:00:00Z'),
      jamBuka: '10:00',
      jamTutup: '21:00',
      kapasitas: 5000,
      kategoriEvent: 'exhibition',
      seatingType: 'timed_entry',
      logoUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200&q=80',
      deskripsi: 'Pameran seni rupa kontemporer internasional yang menghadirkan galeri terkemuka dari Asia Pasifik.',
      syaratKetentuan: 'Tiket berlaku sesuai slot jam masuk yang dipilih. Dilarang menggunakan kamera pro & blitz.',
      minAge: 0,
      maxTicketPerUser: 5,
      isPublished: true,
    },
  });

  // 3. Create Seats & Zones with Benefits
  await prisma.seat.deleteMany({
    where: { eventId: { in: [event1.id, event2.id, event3.id, event4.id, event5.id, event6.id] } }
  });

  // Seats for Event 1 (Java Jazz)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event1.id,
        kategori: 'VVIP Front Stage',
        harga: 3500000,
        kuota: 200,
        deskripsi: 'Baris paling depan panggung utama + akses VIP Lounge',
        benefits: JSON.stringify(['Akses VIP Lounge & Open Bar', 'Meet & Greet dengan Musisi Utama', 'Exclusive Merchandise Pack', 'Parkir Khusus VVIP']),
        warna: '#8B5CF6',
        sortOrder: 1,
      },
      {
        eventId: event1.id,
        kategori: 'VIP Center',
        harga: 1750000,
        kuota: 800,
        deskripsi: 'Area duduk tengah beratap dengan visibilitas sempurna',
        benefits: JSON.stringify(['Fast Track Entry Gate', 'Free Official T-Shirt', 'Tempat Duduk Bernomor']),
        warna: '#3B82F6',
        sortOrder: 2,
      },
      {
        eventId: event1.id,
        kategori: 'Festival Daily Pass',
        harga: 650000,
        kuota: 14000,
        deskripsi: 'Akses ke seluruh 10 panggung festival (Standing)',
        benefits: JSON.stringify(['Akses All Stages (Standing)', 'E-Wallet Cashless Ready']),
        warna: '#10B981',
        sortOrder: 3,
      },
    ],
  });

  // Seats for Event 2 (TEDxJakarta)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event2.id,
        kategori: 'Patron (Row A-D)',
        harga: 750000,
        kuota: 200,
        deskripsi: 'Tempat duduk baris depan + dinner bersama speaker',
        benefits: JSON.stringify(['VIP Speaker Dinner Pass', 'Hardcover TEDx Journal', 'Front Row Seating']),
        warna: '#EC4899',
        sortOrder: 1,
      },
      {
        eventId: event2.id,
        kategori: 'General Delegate',
        harga: 350000,
        kuota: 1000,
        deskripsi: 'Akses penuh ke semua sesi talk & networking area',
        benefits: JSON.stringify(['Networking Lunch Included', 'Goodie Bag & Certificate']),
        warna: '#6366F1',
        sortOrder: 2,
      },
    ],
  });

  // Seats for Event 3 (We The Fest)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event3.id,
        kategori: 'GA 3-Day Pass',
        harga: 2100000,
        kuota: 20000,
        deskripsi: 'Tiket terusan 3 hari penuh untuk semua area umum',
        benefits: JSON.stringify(['3 Days Unlimited Access', 'Express Re-Entry']),
        warna: '#F59E0B',
        sortOrder: 1,
      },
      {
        eventId: event3.id,
        kategori: 'VIB 3-Day Pass (Very Important Banana)',
        harga: 4200000,
        kuota: 5000,
        deskripsi: 'Pengalaman VIP terbaik dengan viewing deck khusus',
        benefits: JSON.stringify(['Elevated Viewing Deck', 'Private Air-Conditioned Restroom', 'Dedicated Bar & Food Stall', 'VIB Fast Track Entry']),
        warna: '#8B5CF6',
        sortOrder: 2,
      },
    ],
  });

  // Seats for Event 4 (Teater Koma)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event4.id,
        kategori: 'VIP Utama',
        harga: 450000,
        kuota: 200,
        deskripsi: 'Kursi baris tengah bawah (Stalls Row 1-5)',
        benefits: JSON.stringify(['Buku Program Eksklusif', 'Foto bersama Pemain setelah pertunjukan']),
        warna: '#EF4444',
        sortOrder: 1,
      },
      {
        eventId: event4.id,
        kategori: 'Kelas 1 (Stalls)',
        harga: 250000,
        kuota: 400,
        deskripsi: 'Kursi lantai bawah (Stalls Row 6-15)',
        benefits: JSON.stringify(['Buku Program Regular']),
        warna: '#3B82F6',
        sortOrder: 2,
      },
      {
        eventId: event4.id,
        kategori: 'Balkon',
        harga: 150000,
        kuota: 200,
        deskripsi: 'Kursi lantai atas Balkon',
        benefits: JSON.stringify(['Pemandangan Luas Seluruh Panggung']),
        warna: '#6B7280',
        sortOrder: 3,
      },
    ],
  });

  // Seats for Event 5 (Derby Sepakbola)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event5.id,
        kategori: 'VIP Barat (VVIP Box)',
        harga: 750000,
        kuota: 2000,
        deskripsi: 'Tribun Barat ber-AC dengan kursi empuk & snacks',
        benefits: JSON.stringify(['Buffet Refreshments', 'AC Lounge Access', 'Padding Leather Seats']),
        warna: '#F59E0B',
        sortOrder: 1,
      },
      {
        eventId: event5.id,
        kategori: 'Kategori 1 (Timur)',
        harga: 250000,
        kuota: 18000,
        deskripsi: 'Tribun Timur sisi panjang lapangan',
        benefits: JSON.stringify(['Tempat Duduk Single Seat']),
        warna: '#10B981',
        sortOrder: 2,
      },
      {
        eventId: event5.id,
        kategori: 'Tribun Utara / Selatan',
        harga: 125000,
        kuota: 40000,
        deskripsi: 'Tribun di belakang gawang',
        benefits: JSON.stringify(['Atmosfer Supporter Sejati']),
        warna: '#6366F1',
        sortOrder: 3,
      },
    ],
  });

  // Seats for Event 6 (Art Jakarta)
  await prisma.seat.createMany({
    data: [
      {
        eventId: event6.id,
        kategori: 'Sesi Pagi (10.00 - 15.00)',
        harga: 125000,
        kuota: 2500,
        deskripsi: 'Slot waktu kunjungan pagi - siang hari',
        benefits: JSON.stringify(['Guide Catalog Digital', 'Akses Pameran Sesi Pagi']),
        warna: '#06B6D4',
        sortOrder: 1,
      },
      {
        eventId: event6.id,
        kategori: 'Sesi Sore (15.00 - 21.00)',
        harga: 150000,
        kuota: 2500,
        deskripsi: 'Slot waktu kunjungan sore - malam hari',
        benefits: JSON.stringify(['Guide Catalog Digital', 'Akses Art Talk & Performance']),
        warna: '#8B5CF6',
        sortOrder: 2,
      },
    ],
  });

  // 4. Create Promo Codes
  await prisma.promoCode.deleteMany({
    where: { eventId: { in: [event1.id, event2.id, event3.id] } }
  });

  await prisma.promoCode.createMany({
    data: [
      {
        eventId: event1.id,
        kode: 'EARLYBIRD',
        diskon: 20, // 20%
        isPercentage: true,
        kuota: 100,
        terpakai: 12,
        berlakuSampai: new Date('2026-05-01T23:59:59Z'),
        isActive: true,
      },
      {
        eventId: event1.id,
        kode: 'JAZZLOVER',
        diskon: 100000, // Rp 100.000
        isPercentage: false,
        kuota: 50,
        terpakai: 5,
        berlakuSampai: new Date('2026-05-14T23:59:59Z'),
        isActive: true,
      },
      {
        eventId: event2.id,
        kode: 'STUDENT50',
        diskon: 50000,
        isPercentage: false,
        kuota: 200,
        terpakai: 40,
        berlakuSampai: new Date('2026-06-19T23:59:59Z'),
        isActive: true,
      },
    ],
  });

  // 5. Create Vendor Booth
  await prisma.vendor.create({
    data: {
      eventId: event1.id,
      ownerId: vendorUser.id,
      namaBooth: 'Warung Kopi Nusantara & Snacks',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('📋 Test accounts:');
  console.log('   Organizer: organizer@ticketing.com / password123');
  console.log('   Pengunjung: pengunjung@ticketing.com / password123');
  console.log('   Staff: staff@ticketing.com / password123');
  console.log('   Vendor: vendor@ticketing.com / password123');
  console.log('🎟️ Active Promo Codes: EARLYBIRD (20% off), JAZZLOVER (Rp100rb off), STUDENT50 (Rp50rb off)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
