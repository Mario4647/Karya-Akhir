// api/send-payment-email.js
import { Resend } from 'resend';

// Inisialisasi Resend dengan API Key Anda
const resend = new Resend('re_UmhoJDrN_41bbrsDozPwrEgTEpLH5cwKQ');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      to,
      orderNumber,
      customerName,
      totalAmount,
      expiryTime,
      productName,
      quantity,
      orderId
    } = req.body;

    // Validasi input
    if (!to || !orderNumber || !customerName || !totalAmount) {
      return res.status(400).json({ 
        error: 'Data email tidak lengkap',
        received: { to, orderNumber, customerName, totalAmount }
      });
    }

    // Format tanggal kadaluarsa
    const expiryDate = new Date(expiryTime);
    const formattedExpiry = expiryDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format waktu countdown
    const timeLeft = Math.max(0, Math.floor((expiryDate - new Date()) / 1000));
    const hours = Math.floor(timeLeft / 3600);
    const mins = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;
    const countdown = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Format harga
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(totalAmount);

    // Desain email HTML dengan gaya Neo Brutalizm LENGKAP
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Konfirmasi Pembayaran - TicketConcert</title>
        <style>
          /* Reset styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf7f2;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          
          /* Container utama */
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            box-shadow: 10px 10px 0px 0px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          
          /* Header dengan gradient */
          .header {
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 2px solid #1e4b6e;
            position: relative;
            overflow: hidden;
          }
          
          /* Decorative icons di header */
          .header::before {
            content: "🎫 🎵 🎸 🎤 🎭 🎪";
            position: absolute;
            top: 10px;
            left: 0;
            right: 0;
            font-size: 24px;
            opacity: 0.1;
            white-space: nowrap;
            animation: slide 20s linear infinite;
          }
          
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .header h1 {
            margin: 0;
            color: white;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -0.5px;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.2);
            position: relative;
          }
          
          .header p {
            margin: 15px 0 0;
            color: rgba(255,255,255,0.95);
            font-size: 18px;
            font-weight: 500;
            position: relative;
          }
          
          /* Content area */
          .content {
            padding: 40px 30px;
          }
          
          /* Salam pembuka */
          .greeting {
            margin-bottom: 30px;
          }
          
          .greeting h2 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .greeting p {
            color: #4b5563;
            font-size: 16px;
          }
          
          /* Timer card - merah dengan shadow */
          .timer-card {
            background-color: #fee2e2;
            border: 2px solid #fecaca;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 6px 6px 0px 0px rgba(239,68,68,0.25);
          }
          
          .timer-card .timer-label {
            font-size: 14px;
            color: #991b1b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          
          .timer-card .timer-value {
            font-size: 42px;
            font-weight: 800;
            color: #dc2626;
            font-family: 'Courier New', monospace;
            line-height: 1.2;
            margin-bottom: 5px;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
          }
          
          .timer-card .timer-date {
            font-size: 14px;
            color: #7f1d1d;
            font-weight: 500;
          }
          
          /* Order card */
          .order-card {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 4px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.1);
          }
          
          .order-card h3 {
            margin: 0 0 20px;
            color: #0f172a;
            font-size: 20px;
            font-weight: 700;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .order-card h3 i {
            font-size: 24px;
          }
          
          /* Info rows */
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
          }
          
          .info-value {
            color: #0f172a;
            font-weight: 600;
            font-size: 15px;
          }
          
          .info-value.highlight {
            color: #4a90e2;
            font-size: 20px;
            font-weight: 800;
          }
          
          .info-value.mono {
            font-family: 'Courier New', monospace;
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
          }
          
          /* Product list */
          .product-list {
            margin-top: 15px;
          }
          
          .product-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px dashed #cbd5e1;
          }
          
          .product-item:last-child {
            border-bottom: none;
          }
          
          .product-name {
            font-weight: 600;
            color: #0f172a;
          }
          
          .product-price {
            color: #4a90e2;
            font-weight: 700;
          }
          
          /* Button container */
          .button-container {
            text-align: center;
            margin: 35px 0 25px;
          }
          
          /* Button dengan style Neo Brutalizm */
          .button {
            display: inline-block;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            padding: 16px 48px;
            border: 2px solid #357abd;
            border-radius: 4px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 8px 8px 0px 0px rgba(0,0,0,0.25);
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }
          
          .button::before {
            content: "💰 🎫 🎵 🎸";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            opacity: 0.1;
            transform: translateY(100%);
            transition: transform 0.3s ease;
          }
          
          .button:hover {
            background-color: #357abd;
            transform: translate(4px, 4px);
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.25);
          }
          
          .button:hover::before {
            transform: translateY(0);
          }
          
          /* Link container */
          .link-container {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 4px;
          }
          
          .link-container small {
            color: #64748b;
            font-size: 13px;
            display: block;
            margin-bottom: 8px;
          }
          
          .link-container .link {
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-size: 13px;
            color: #0f172a;
            word-break: break-all;
          }
          
          /* Warning message */
          .warning {
            background-color: #fffbeb;
            border: 2px solid #fcd34d;
            border-radius: 4px;
            padding: 15px;
            margin: 25px 0 0;
            text-align: center;
            box-shadow: 4px 4px 0px 0px rgba(252,211,77,0.3);
          }
          
          .warning p {
            color: #92400e;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          /* Footer */
          .footer {
            background-color: #f1f5f9;
            border-top: 2px solid #cbd5e1;
            padding: 25px;
            text-align: center;
          }
          
          .footer p {
            color: #64748b;
            font-size: 13px;
            margin: 5px 0;
          }
          
          .footer .copyright {
            font-weight: 600;
            color: #475569;
            margin-top: 10px;
          }
          
          /* Decorative elements */
          .decorative-line {
            height: 4px;
            background: linear-gradient(90deg, #4a90e2, #f59e0b, #ef4444, #4a90e2);
            margin: 20px 0;
          }
          
          /* Responsive */
          @media (max-width: 480px) {
            .container {
              margin: 0;
            }
            
            .header h1 {
              font-size: 28px;
            }
            
            .timer-card .timer-value {
              font-size: 32px;
            }
            
            .button {
              padding: 14px 32px;
              font-size: 16px;
            }
            
            .info-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🎫 TICKETCONCERT</h1>
            <p>Konfirmasi Pesanan #${orderNumber}</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <div class="greeting">
              <h2>Halo, ${customerName}! 👋</h2>
              <p>Terima kasih telah melakukan pemesanan di TicketConcert. Kami telah menerima pesanan Anda dan menunggu pembayaran.</p>
            </div>
            
            <!-- Timer Card -->
            <div class="timer-card">
              <div class="timer-label">⏰ BATAS WAKTU PEMBAYARAN</div>
              <div class="timer-value">${countdown}</div>
              <div class="timer-date">${formattedExpiry}</div>
            </div>
            
            <!-- Order Details Card -->
            <div class="order-card">
              <h3>📋 DETAIL PESANAN</h3>
              
              <div class="info-row">
                <span class="info-label">No. Pesanan</span>
                <span class="info-value mono">${orderNumber}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Produk</span>
                <span class="info-value">${productName}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Jumlah Tiket</span>
                <span class="info-value">${quantity} tiket</span>
              </div>
              
              <div class="decorative-line"></div>
              
              <div class="info-row">
                <span class="info-label">Total Pembayaran</span>
                <span class="info-value highlight">${formattedAmount}</span>
              </div>
            </div>
            
            <!-- Customer Details Card -->
            <div class="order-card">
              <h3>👤 DATA PEMESAN</h3>
              
              <div class="info-row">
                <span class="info-label">Nama Lengkap</span>
                <span class="info-value">${customerName}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${to}</span>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL || 'https://karya-akhir.vercel.app'}/payment/${orderId}" class="button">
                💳 BAYAR SEKARANG
              </a>
            </div>
            
            <!-- Manual Link -->
            <div class="link-container">
              <small>Atau salin link berikut ke browser Anda:</small>
              <div class="link">
                ${process.env.FRONTEND_URL || 'https://karya-akhir.vercel.app'}/payment/${orderId}
              </div>
            </div>
            
            <!-- Warning -->
            <div class="warning">
              <p>
                <span>⚠️</span>
                Pesanan akan otomatis dibatalkan jika tidak dibayar sebelum batas waktu
                <span>⚠️</span>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p>Jika Anda memerlukan bantuan, hubungi support@ticketconcert.com</p>
            <div class="decorative-line" style="margin: 15px 0;"></div>
            <p class="copyright">© 2025 TicketConcert. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Kirim email menggunakan Resend
    const { data, error } = await resend.emails.send({
      from: 'TicketConcert <onboarding@resend.dev>', // Untuk testing, gunakan domain resend.dev
      to: [to],
      subject: `🛒 Konfirmasi Pembayaran #${orderNumber}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message || 'Gagal mengirim email',
        details: error
      });
    }

    console.log('✅ Email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Email berhasil dikirim',
      data 
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Gagal mengirim email'
    });
  }
}
