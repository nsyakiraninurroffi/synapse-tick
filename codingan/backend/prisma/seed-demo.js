/**
 * 🌱 Seed Script — Demo Accounts
 * 
 * Creates 4 demo users (pengunjung, organizer, staff, vendor)
 * with known credentials for easy testing.
 * 
 * Usage: node prisma/seed-demo.js
 * 
 * Login credentials (all passwords: demo1234):
 *   - pengunjung@demo.com  (Pengunjung)
 *   - organizer@demo.com   (Organizer)
 *   - staff@demo.com       (Staff Gate)
 *   - vendor@demo.com      (Vendor)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

const demoUsers = [
  {
    nama: 'Demo Pengunjung',
    email: 'pengunjung@demo.com',
    role: 'pengunjung',
    noHp: '081200000001',
  },
  {
    nama: 'Demo Organizer',
    email: 'organizer@demo.com',
    role: 'organizer',
    noHp: '081200000002',
  },
  {
    nama: 'Demo Staff Gate',
    email: 'staff@demo.com',
    role: 'staff',
    noHp: '081200000003',
  },
  {
    nama: 'Demo Vendor',
    email: 'vendor@demo.com',
    role: 'vendor',
    noHp: '081200000004',
  },
];

async function main() {
  console.log('🌱 Starting demo seed...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const userData of demoUsers) {
    // Upsert: update if exists, create if not
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        nama: userData.nama,
        password: hashedPassword,
        role: userData.role,
        noHp: userData.noHp,
      },
      create: {
        nama: userData.nama,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        noHp: userData.noHp,
      },
    });

    console.log(`  ✅ ${user.role.padEnd(12)} → ${user.email} (${user.nama})`);

    // Auto-create wallet for pengunjung & vendor
    if (['pengunjung', 'vendor'].includes(user.role)) {
      const existingWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!existingWallet) {
        await prisma.wallet.create({
          data: { userId: user.id, saldo: 500000 }, // Rp 500.000 demo balance
        });
        console.log(`     💰 Wallet created (Rp 500.000 saldo demo)`);
      } else {
        // Reset saldo to 500k for demo
        await prisma.wallet.update({
          where: { userId: user.id },
          data: { saldo: 500000 },
        });
        console.log(`     💰 Wallet reset (Rp 500.000 saldo demo)`);
      }
    }
  }

  // Create a demo event by the organizer
  const organizer = await prisma.user.findUnique({ where: { email: 'organizer@demo.com' } });
  if (organizer) {
    const existingEvent = await prisma.event.findFirst({
      where: { organizerId: organizer.id, namaEvent: 'Demo Konser Musik Nusantara' },
    });

    if (!existingEvent) {
      const event = await prisma.event.create({
        data: {
          organizerId: organizer.id,
          namaEvent: 'Demo Konser Musik Nusantara',
          lokasi: 'Gelora Bung Karno, Jakarta',
          tanggal: new Date('2025-12-31T19:00:00'),
          kapasitas: 5000,
          deskripsi: 'Konser musik terbesar akhir tahun! Nikmati penampilan artis-artis top Indonesia dalam satu malam yang tak terlupakan. Lengkap dengan food court, merchandise booth, dan berbagai aktivitas seru.',
          isPublished: true,
          kategoriEvent: 'konser',
          seatingType: 'zone',
          jamBuka: '17:00',
          jamTutup: '23:00',
          maxTicketPerUser: 4,
          syaratKetentuan: 'Minimal usia 17 tahun. Dilarang membawa makanan dan minuman dari luar. Tiket yang sudah dibeli tidak dapat dikembalikan.',
          seats: {
            create: [
              { kategori: 'VVIP', harga: 1500000, kuota: 200, deskripsi: 'Akses backstage meet & greet', benefits: '["Meet & Greet","Free Merchandise","Priority Entrance","Front Row"]', warna: '#8B5CF6', sortOrder: 1 },
              { kategori: 'VIP', harga: 750000, kuota: 800, deskripsi: 'Area depan panggung', benefits: '["Free Merchandise","Priority Entrance"]', warna: '#3B82F6', sortOrder: 2 },
              { kategori: 'Festival', harga: 350000, kuota: 2000, deskripsi: 'Area standing berdiri', benefits: '["Free Drink Voucher"]', warna: '#10B981', sortOrder: 3 },
              { kategori: 'Tribune', harga: 150000, kuota: 2000, deskripsi: 'Tempat duduk tribune', warna: '#F59E0B', sortOrder: 4 },
            ],
          },
        },
      });

      console.log(`\n  🎪 Demo event created: "${event.namaEvent}"`);
      console.log(`     📍 ${event.lokasi}`);
      console.log(`     🎫 4 zona tiket (VVIP/VIP/Festival/Tribune)`);

      // Register vendor booth to this event
      const vendorUser = await prisma.user.findUnique({ where: { email: 'vendor@demo.com' } });
      if (vendorUser) {
        const existingVendor = await prisma.vendor.findFirst({
          where: { ownerId: vendorUser.id, eventId: event.id },
        });
        if (!existingVendor) {
          await prisma.vendor.create({
            data: {
              eventId: event.id,
              ownerId: vendorUser.id,
              namaBooth: 'Warung Demo Nusantara',
            },
          });
          console.log(`\n  🏪 Vendor booth registered: "Warung Demo Nusantara"`);
        }
      }
    } else {
      console.log(`\n  🎪 Demo event already exists, skipping...`);
    }
  }

  console.log('\n' + '='.repeat(55));
  console.log('  🎉 DEMO SEED COMPLETE!');
  console.log('='.repeat(55));
  console.log('\n  Login credentials (password untuk semua: demo1234):');
  console.log('  ┌─────────────────────────┬──────────────┐');
  console.log('  │ Email                   │ Role         │');
  console.log('  ├─────────────────────────┼──────────────┤');
  console.log('  │ pengunjung@demo.com     │ Pengunjung   │');
  console.log('  │ organizer@demo.com      │ Organizer    │');
  console.log('  │ staff@demo.com          │ Staff Gate   │');
  console.log('  │ vendor@demo.com         │ Vendor       │');
  console.log('  └─────────────────────────┴──────────────┘');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
