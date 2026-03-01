// api/send-payment-email.js
import nodemailer from 'nodemailer';

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
        error: 'Data email tidak lengkap' 
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

    // Format harga
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(totalAmount);

    // Konfigurasi SMTP dengan email langsung
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kazupiee.seraa@gmail.com',
        pass: '@kazuya4647'
      }
    });

    // Desain email HTML dengan gaya Neo Brutalizm
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf7f2;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            box-shadow: 8px 8px 0px 0px rgba(0,0,0,0.15);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #1e4b6e;
          }
          .header h1 {
            margin: 0;
            color: white;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0;
            color: rgba(255,255,255,0.9);
            font-size: 16px;
          }
          .content {
            padding: 30px 20px;
          }
          .order-card {
            background-color: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
          }
          .order-card h3 {
            margin: 0 0 15px;
            color: #1f2937;
            font-size: 18px;
            font-weight: bold;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #d1d5db;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #6b7280;
            font-size: 14px;
          }
          .info-value {
            color: #1f2937;
            font-weight: 500;
            font-size: 14px;
          }
          .highlight {
            color: #4a90e2;
            font-weight: bold;
            font-size: 18px;
          }
          .timer-card {
            background-color: #fee2e2;
            border: 2px solid #fecaca;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 4px 4px 0px 0px rgba(239,68,68,0.2);
          }
          .timer-card p {
            margin: 5px 0;
            color: #991b1b;
          }
          .timer-card .timer {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            font-family: monospace;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border: 2px solid #357abd;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.25);
            transition: all 0.2s;
          }
          .button:hover {
            background-color: #357abd;
            transform: translate(2px, 2px);
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.25);
          }
          .footer {
            background-color: #f3f4f6;
            border-top: 2px solid #e5e7eb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .product-list {
            margin-top: 15px;
          }
          .product-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #d1d5db;
          }
          .product-item:last-child {
            border-bottom: none;
          }
          .icon-decorative {
            position: absolute;
            opacity: 0.1;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 TicketConcert</h1>
            <p>Konfirmasi Pesanan Anda</p>
          </div>
          
          <div class="content">
            <h2 style="margin-top: 0; color: #1f2937;">Halo, ${customerName}!</h2>
            <p style="color: #4b5563;">Terima kasih telah melakukan pemesanan. Silakan selesaikan pembayaran Anda sebelum batas waktu yang ditentukan.</p>
            
            <div class="timer-card">
              <p>⏰ Batas Waktu Pembayaran</p>
              <p class="timer">${expiryDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</p>
              <p style="font-size: 14px;">${formattedExpiry}</p>
            </div>
            
            <div class="order-card">
              <h3>📋 Detail Pesanan</h3>
              <div class="info-row">
                <span class="info-label">No. Pesanan</span>
                <span class="info-value" style="font-family: monospace;">${orderNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Produk</span>
                <span class="info-value">${productName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Jumlah Tiket</span>
                <span class="info-value">${quantity} tiket</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Pembayaran</span>
                <span class="info-value highlight">${formattedAmount}</span>
              </div>
            </div>
            
            <div class="order-card">
              <h3>👤 Data Pemesan</h3>
              <div class="info-row">
                <span class="info-label">Nama</span>
                <span class="info-value">${customerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${to}</span>
              </div>
            </div>
            
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL || 'https://karya-akhir.vercel.app'}/payment/${orderId}" class="button">
                💳 Bayar Sekarang
              </a>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
              <small>Atau salin link berikut ke browser Anda:</small><br>
              <span style="font-family: monospace; background-color: #f3f4f6; padding: 5px; border-radius: 4px;">
                ${process.env.FRONTEND_URL || 'https://karya-akhir.vercel.app'}/payment/${orderId}
              </span>
            </p>
            
            <p style="color: #ef4444; font-size: 13px; text-align: center; margin-top: 30px;">
              ⚠️ Pesanan akan otomatis dibatalkan jika tidak dibayar sebelum batas waktu.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 TicketConcert. All rights reserved.</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Kirim email
    const mailOptions = {
      from: '"TicketConcert" <kazupiee.seraa@gmail.com>',
      to: to,
      subject: `🛒 Konfirmasi Pesanan #${orderNumber}`,
      html: htmlContent
    };

    console.log('Sending email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: error.message || 'Gagal mengirim email',
      details: error.toString()
    });
  }
}
