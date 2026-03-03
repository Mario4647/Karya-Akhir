// ============================================
// EMAIL SERVICE DENGAN EMAILJS
// Desain Neo Brutalizm yang menarik
// ============================================

// Konfigurasi EmailJS dengan credentials Anda
const EMAILJS_CONFIG = {
  serviceId: 'service_2x3byo7', // Service ID Gmail Anda
  templateId: 'template_nd1w82s', // Template ID yang Anda buat
  userId: 'JNo-bH0_yGFORzjSu', // Public Key Anda
  accessToken: 'NNNVKNALkpATC5Y3Kfxlc' // Private Key Anda
};

/**
 * Load EmailJS script
 */
const loadEmailJSScript = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      window.emailjs.init(EMAILJS_CONFIG.userId);
      console.log('✅ EmailJS initialized');
      resolve();
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load EmailJS script:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
};

// Template HTML untuk email pending dengan desain Neo Brutalizm
const getPendingEmailHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Konfirmasi Pesanan - Smareta Events</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          padding: 40px 30px;
          text-align: center;
          border-bottom: 2px solid #1e4b6e;
          position: relative;
          overflow: hidden;
        }
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
        .content {
          padding: 40px 30px;
        }
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
        .poster-thumbnail {
          display: flex;
          align-items: center;
          gap: 15px;
          background-color: #f1f5f9;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
        }
        .poster-thumbnail img {
          width: 80px;
          height: 80px;
          object-fit: contain; /* Ubah dari cover ke contain agar tidak terpotong */
          border-radius: 4px;
          border: 1px solid #94a3b8;
          background-color: white;
        }
        .poster-thumbnail div {
          flex: 1;
        }
        .poster-thumbnail h4 {
          color: #0f172a;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .poster-thumbnail p {
          color: #64748b;
          font-size: 13px;
        }
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
        .button-container {
          text-align: center;
          margin: 35px 0 25px;
        }
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
        .decorative-line {
          height: 4px;
          background: linear-gradient(90deg, #4a90e2, #f59e0b, #ef4444, #4a90e2);
          margin: 20px 0;
        }
        @media (max-width: 480px) {
          .container { margin: 0; }
          .header h1 { font-size: 28px; }
          .timer-card .timer-value { font-size: 32px; }
          .button { padding: 14px 32px; font-size: 16px; }
          .poster-thumbnail { flex-direction: column; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 SMARETA EVENTS</h1>
          <p>Konfirmasi Pesanan #${data.orderNumber}</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            <h2>Halo, ${data.customerName}! 👋</h2>
            <p>Terima kasih telah melakukan pemesanan di Smareta Events. Kami telah menerima pesanan Anda dan menunggu pembayaran.</p>
          </div>
          
          <div class="timer-card">
            <div class="timer-label">⏰ BATAS WAKTU PEMBAYARAN</div>
            <div class="timer-value">${data.countdown}</div>
            <div class="timer-date">${data.formattedExpiry}</div>
          </div>
          
          <!-- Poster thumbnail dengan object-fit: contain -->
          <div class="poster-thumbnail">
            <img src="${data.posterUrl || 'https://via.placeholder.com/80x80/4a90e2/ffffff?text=EVENT'}" alt="Event Poster" />
            <div>
              <h4>${data.productName}</h4>
              <p>${data.quantity} tiket • ${data.formattedAmount}</p>
            </div>
          </div>
          
          <div class="order-card">
            <h3>📋 DETAIL PESANAN</h3>
            
            <div class="info-row">
              <span class="info-label">No. Pesanan</span>
              <span class="info-value mono">${data.orderNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Produk</span>
              <span class="info-value">${data.productName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Jumlah Tiket</span>
              <span class="info-value">${data.quantity} tiket</span>
            </div>
            
            <div class="decorative-line"></div>
            
            <div class="info-row">
              <span class="info-label">Total Pembayaran</span>
              <span class="info-value highlight">${data.formattedAmount}</span>
            </div>
          </div>
          
          <div class="order-card">
            <h3>👤 DATA PEMESAN</h3>
            
            <div class="info-row">
              <span class="info-label">Nama Lengkap</span>
              <span class="info-value">${data.customerName}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${data.email}</span>
            </div>
          </div>
          
          <div class="button-container">
            <a href="${data.paymentLink}" class="button">
              💳 BAYAR SEKARANG
            </a>
          </div>
          
          <div class="link-container">
            <small>Atau salin link berikut ke browser Anda:</small>
            <div class="link">
              ${data.paymentLink}
            </div>
          </div>
          
          <div class="warning">
            <p>
              <span>⚠️</span>
              Pesanan akan otomatis dibatalkan jika tidak dibayar sebelum batas waktu
              <span>⚠️</span>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          <p>Jika Anda memerlukan bantuan, hubungi support@smaretaevents.biz.id</p>
          <div class="decorative-line" style="margin: 15px 0;"></div>
          <p class="copyright">© 2025 Smareta Events. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template HTML untuk email sukses dengan desain Neo Brutalizm
const getSuccessEmailHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pembayaran Sukses - Smareta Events</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f0fdf4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 2px solid #86efac;
          border-radius: 4px;
          box-shadow: 12px 12px 0px 0px rgba(34,197,94,0.3);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          padding: 40px 30px;
          text-align: center;
          border-bottom: 2px solid #15803d;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: "✅ 🎉 🎫 🎵 🎸";
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
        .content {
          padding: 40px 30px;
        }
        .success-badge {
          background-color: #dcfce7;
          border: 2px solid #86efac;
          border-radius: 50px;
          padding: 10px 20px;
          display: inline-block;
          color: #166534;
          font-weight: bold;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0px 0px rgba(34,197,94,0.2);
        }
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
        .poster-thumbnail {
          display: flex;
          align-items: center;
          gap: 15px;
          background-color: #f1f5f9;
          border: 2px solid #cbd5e1;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
        }
        .poster-thumbnail img {
          width: 80px;
          height: 80px;
          object-fit: contain; /* Ubah dari cover ke contain agar tidak terpotong */
          border-radius: 4px;
          border: 1px solid #94a3b8;
          background-color: white;
        }
        .poster-thumbnail div {
          flex: 1;
        }
        .poster-thumbnail h4 {
          color: #0f172a;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .poster-thumbnail p {
          color: #64748b;
          font-size: 13px;
        }
        .ticket-card {
          background-color: #f0f9ff;
          border: 2px solid #bae6fd;
          border-radius: 4px;
          padding: 20px;
          margin: 15px 0;
          box-shadow: 6px 6px 0px 0px rgba(14,165,233,0.2);
        }
        .ticket-card h3 {
          margin: 0 0 15px;
          color: #0369a1;
          font-weight: 700;
          border-bottom: 2px solid #7dd3fc;
          padding-bottom: 10px;
        }
        .ticket-code {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          background: white;
          padding: 12px 16px;
          border: 2px solid #0284c7;
          border-radius: 4px;
          color: #0369a1;
          margin: 10px 0;
          box-shadow: 3px 3px 0px 0px rgba(2,132,199,0.3);
          text-align: center;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .qr-placeholder {
          background: repeating-linear-gradient(
            45deg,
            #000,
            #000 4px,
            #fff 4px,
            #fff 8px
          );
          width: 100px;
          height: 100px;
          margin: 10px auto;
          border: 2px solid #000;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
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
        .button-container {
          text-align: center;
          margin: 35px 0 25px;
        }
        .button {
          display: inline-block;
          background-color: #22c55e;
          color: white;
          text-decoration: none;
          padding: 16px 48px;
          border: 2px solid #16a34a;
          border-radius: 4px;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 8px 8px 0px 0px rgba(0,0,0,0.25);
          transition: all 0.2s ease;
        }
        .button:hover {
          background-color: #16a34a;
          transform: translate(4px, 4px);
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.25);
        }
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
        @media (max-width: 480px) {
          .container { margin: 0; }
          .header h1 { font-size: 28px; }
          .poster-thumbnail { flex-direction: column; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ PEMBAYARAN BERHASIL</h1>
          <p>Pesanan #${data.orderNumber}</p>
        </div>
        
        <div class="content">
          <div style="text-align: center;">
            <div class="success-badge">
              🎉 Terima kasih! Pembayaran Anda telah dikonfirmasi
            </div>
          </div>
          
          <div class="greeting">
            <h2>Halo, ${data.customerName}!</h2>
            <p>Berikut adalah detail tiket Anda untuk acara ${data.productName}.</p>
          </div>
          
          <!-- Poster thumbnail -->
          <div class="poster-thumbnail">
            <img src="${data.posterUrl || 'https://via.placeholder.com/80x80/4a90e2/ffffff?text=EVENT'}" alt="Event Poster" />
            <div>
              <h4>${data.productName}</h4>
              <p>${data.quantity} tiket • ${data.formattedAmount}</p>
            </div>
          </div>
          
          <div class="ticket-card">
            <h3>🎟️ TIKET ANDA</h3>
            ${data.ticketCodes.map(code => `
              <div class="ticket-code">
                ${code}
              </div>
            `).join('')}
            <!-- QR Code placeholder dengan efek garis-garis -->
            <div style="display: flex; justify-content: center; margin-top: 20px;">
              <div class="qr-placeholder"></div>
            </div>
            <p style="text-align: center; color: #64748b; margin-top: 10px; font-size: 12px;">
              * QR Code akan tersedia di aplikasi
            </p>
          </div>
          
          <div class="ticket-card">
            <h3>📅 DETAIL EVENT</h3>
            <div class="info-row">
              <span class="info-label">Tanggal</span>
              <span class="info-value">${data.eventDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lokasi</span>
              <span class="info-value">${data.eventLocation}</span>
            </div>
          </div>
          
          <div class="button-container">
            <a href="https://smaretaevents.biz.id/my-orders" class="button">
              📱 LIHAT PESANAN SAYA
            </a>
          </div>
          
          <p style="text-align: center; color: #4b5563; margin-top: 30px; font-style: italic;">
            <strong>Simpan email ini sebagai bukti pembelian Anda.</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
          <p>© 2025 Smareta Events. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Kirim email menggunakan EmailJS
 */
export const sendEmail = async (type, data) => {
  try {
    await loadEmailJSScript();
    
    // Validasi email penerima
    if (!data.email || data.email.trim() === '') {
      throw new Error('Alamat email penerima tidak boleh kosong');
    }
    
    console.log('📧 Preparing email data for:', data.email);
    
    // Pilih template HTML berdasarkan tipe email
    const htmlContent = type === 'paymentPending' 
      ? getPendingEmailHTML(data)
      : getSuccessEmailHTML(data);
    
    // Siapkan template params sesuai dengan dashboard
    const templateParams = {
      email: data.email,
      customer_name: data.customerName,
      order_id: data.orderNumber,
      product_name: data.productName,
      quantity: data.quantity.toString(),
      total_amount: data.formattedAmount,
      expiry_time: data.formattedExpiry,
      countdown: data.countdown,
      payment_link: `https://smaretaevents.biz.id/payment/${data.orderId}`,
      poster_url: data.posterUrl || 'https://via.placeholder.com/80x80/4a90e2/ffffff?text=EVENT',
      html_content: htmlContent,
      // Untuk email sukses
      ticket_codes: data.ticketCodes ? data.ticketCodes.join(', ') : '',
      event_date: data.eventDate || '',
      event_location: data.eventLocation || '',
      // Reply-to dari dashboard
      reply_to: 'kazupiee.seraa@gmail.com'
    };
    
    console.log('📧 Sending email...');
    
    // Kirim via EmailJS
    const response = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.userId
    );
    
    console.log('✅ Email sent successfully:', response);
    
    return {
      success: true,
      message: 'Email berhasil dikirim',
      data: response
    };
  } catch (error) {
    console.error('❌ EmailJS error:', error);
    return {
      success: false,
      error: error.text || error.message || 'Gagal mengirim email'
    };
  }
};

/**
 * Format data untuk email
 */
export const formatEmailData = (order, products, tickets = []) => {
  const expiryDate = new Date(order.payment_expiry);
  const now = new Date();
  const timeLeft = Math.max(0, Math.floor((expiryDate - now) / 1000));
  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(order.total_amount);
  
  const formattedExpiry = expiryDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    email: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
    quantity: order.quantity,
    formattedAmount,
    formattedExpiry,
    countdown: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    orderId: order.id,
    posterUrl: products?.image_data || products?.poster_url || '',
    ticketCodes: tickets.map(t => t.ticket_code),
    eventDate: products?.event_date ? new Date(products.event_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '-',
    eventLocation: products?.event_location || '-'
  };
};

export default {
  sendEmail,
  formatEmailData
};
