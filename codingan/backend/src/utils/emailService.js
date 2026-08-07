const nodemailer = require('nodemailer');
const { format } = require('date-fns');

// =============================================
//  TICKETFLOW — EMAIL SERVICE (Nodemailer)
//  SMTP: Gmail App Password or any SMTP provider
// =============================================

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Format currency to IDR
 */
const formatRupiah = (amount) =>
  `Rp ${Number(amount).toLocaleString('id-ID')}`;

/**
 * Generate Google Calendar link from event data
 */
const generateCalendarLink = (event) => {
  const startDate = new Date(event.tanggal);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours

  const formatDate = (d) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.namaEvent,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: `Tiket Event: ${event.namaEvent}\nDibeli via TicketFlow`,
    location: event.lokasi,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Build premium HTML email template for ticket receipt
 */
const buildReceiptHTML = ({ ticket, event, seat, user }) => {
  const eventDate = new Date(event.tanggal);
  const formattedDate = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const calendarLink = generateCalendarLink(event);
  const ticketPageLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${ticket.id}`;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Ticket Konfirmasi — TicketFlow</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0F172A; color: #F1F5F9; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { text-align: center; padding: 32px 0 24px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #6366F1, #4F46E5); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 22px; font-weight: 900; background: linear-gradient(90deg, #818CF8, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-badge { display: inline-block; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #818CF8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 100px; margin-bottom: 16px; }
    .title { font-size: 28px; font-weight: 900; color: #F1F5F9; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #94A3B8; }
    /* Ticket Card */
    .ticket-card { background: linear-gradient(135deg, #1E1B4B 0%, #1E293B 100%); border: 1px solid rgba(99,102,241,0.3); border-radius: 24px; overflow: hidden; margin: 24px 0; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .ticket-header { background: linear-gradient(135deg, #312e81, #1e1b4b); padding: 28px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .event-name { font-size: 22px; font-weight: 900; color: white; margin-bottom: 4px; }
    .organizer { font-size: 12px; color: rgba(255,255,255,0.5); }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34D399; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 100px; margin-top: 12px; }
    .ticket-body { padding: 28px 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-item label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748B; margin-bottom: 4px; }
    .info-item .value { font-size: 15px; font-weight: 700; color: #F1F5F9; }
    .info-item .value.accent { color: #818CF8; }
    .info-item .value.price { font-size: 18px; font-weight: 900; color: #818CF8; }
    .divider { border: none; border-top: 1px dashed rgba(255,255,255,0.1); margin: 20px 0; }
    .meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #94A3B8; }
    .meta-icon { width: 16px; height: 16px; flex-shrink: 0; }
    /* CTA Buttons */
    .cta-section { padding: 0 32px 32px; }
    .btn-primary { display: block; text-align: center; background: linear-gradient(135deg, #6366F1, #4F46E5); color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 16px 24px; border-radius: 14px; margin-bottom: 12px; }
    .btn-calendar { display: block; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #94A3B8; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 24px; border-radius: 14px; }
    /* Ticket Footer */
    .ticket-footer { background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    .ticket-id { font-family: monospace; font-size: 10px; color: #475569; }
    .security-note { font-size: 10px; color: #475569; }
    /* Footer email */
    .email-footer { text-align: center; padding: 24px 0; }
    .email-footer p { font-size: 12px; color: #475569; margin-bottom: 4px; }
    .email-footer a { color: #6366F1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Logo Header -->
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
          </svg>
        </div>
        <span class="logo-text">TicketFlow</span>
      </div>
      <div style="margin-top: 32px;">
        <span class="hero-badge">✅ Pembayaran Dikonfirmasi</span>
        <h1 class="title">Tiket Kamu Sudah Siap!</h1>
        <p class="subtitle">Hei, <strong style="color:#F1F5F9;">${user.nama}</strong> — pembelian tiketmu berhasil dikonfirmasi. Selamat! 🎉</p>
      </div>
    </div>

    <!-- Main Ticket Card -->
    <div class="ticket-card">
      <!-- Header -->
      <div class="ticket-header">
        <p class="organizer">Organized by ${event.organizer?.nama || 'TicketFlow'}</p>
        <h2 class="event-name">${event.namaEvent}</h2>
        <span class="status-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          TIKET AKTIF — LUNAS
        </span>
      </div>

      <!-- Body -->
      <div class="ticket-body">
        <div class="info-grid">
          <div class="info-item">
            <label>Kategori Tiket</label>
            <span class="value accent">${seat.kategori}</span>
          </div>
          <div class="info-item">
            <label>Harga</label>
            <span class="value price">${formatRupiah(seat.harga)}</span>
          </div>
          <div class="info-item">
            <label>Nama Pemegang</label>
            <span class="value">${user.nama}</span>
          </div>
          <div class="info-item">
            <label>Email</label>
            <span class="value" style="font-size:13px;">${user.email}</span>
          </div>
        </div>

        <hr class="divider" />

        <div class="meta-row">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${formattedDate} · ${formattedTime} WIB
        </div>
        <div class="meta-row">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${event.lokasi}
        </div>
        <div class="meta-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
          </svg>
          <span style="font-size:11px; color:#475569; font-family: monospace;">ID: ${ticket.id}</span>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="cta-section">
        <a href="${ticketPageLink}" class="btn-primary">
          🎫 Lihat E-Ticket & QR Code
        </a>
        <a href="${calendarLink}" class="btn-calendar">
          📅 Tambahkan ke Google Calendar
        </a>
      </div>

      <!-- Footer -->
      <div class="ticket-footer">
        <span class="ticket-id">TICKETFLOW-SECURE-ENTRY</span>
        <span class="security-note">🔐 QR AES-256 Encrypted</span>
      </div>
    </div>

    <!-- Email Footer -->
    <div class="email-footer">
      <p>Email ini dikirim secara otomatis oleh <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">TicketFlow</a>.</p>
      <p>Jangan balas email ini. Untuk bantuan, hubungi <a href="mailto:support@ticketflow.id">support@ticketflow.id</a></p>
      <p style="margin-top: 12px;">© 2025 TicketFlow — Platform Tiket Event Premium</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send ticket receipt email after successful payment
 * @param {Object} params - { ticket, event, seat, user }
 */
const sendTicketReceipt = async ({ ticket, event, seat, user }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[EmailService] Gmail credentials not configured. Skipping email send.');
    return { success: false, reason: 'credentials_missing' };
  }

  try {
    const transporter = createTransporter();
    const html = buildReceiptHTML({ ticket, event, seat, user });

    const info = await transporter.sendMail({
      from: `"TicketFlow" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: `🎫 Tiket Kamu Sudah Siap! — ${event.namaEvent}`,
      html,
    });

    console.log(`[EmailService] Receipt sent to ${user.email} — MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Failed to send receipt:', error.message);
    return { success: false, reason: error.message };
  }
};

module.exports = { sendTicketReceipt, generateCalendarLink };
