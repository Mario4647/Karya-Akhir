// ============================================
// EMAIL SERVICE DENGAN EMAILJS
// Credentials Anda sudah dimasukkan
// ============================================

// Konfigurasi EmailJS dengan credentials Anda
const EMAILJS_CONFIG = {
  serviceId: 'service_2x3byo7', // Service ID Gmail Anda
  templateId: 'template_payment_confirmation', // Buat template ini di dashboard EmailJS
  userId: 'JNo-bH0_yGFORzjSu', // Public Key Anda
  accessToken: 'NNNVKNALkpATC5Y3Kfxlc' // Private Key Anda
};

// Template email HTML langsung di code
const EMAIL_TEMPLATES = {
  paymentPending: (data) => ({
    to_email: data.to,
    to_name: data.customerName,
    from_name: 'Smareta Events',
    reply_to: 'noreply@smaretaevents.biz.id',
    order_number: data.orderNumber,
    product_name: data.productName,
    quantity: data.quantity,
    total_amount: data.formattedAmount,
    expiry_time: data.formattedExpiry,
    countdown: data.countdown,
    payment_link: `https://smaretaevents.biz.id/payment/${data.orderId}`,
    
    // HTML email langsung di sini
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #faf7f2;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 4px;
            box-shadow: 10px 10px 0px 0px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #4a90e2, #357abd);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 2px solid #1e4b6e;
          }
          .header h1 {
            color: white;
            font-size: 32px;
            margin: 0;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.2);
          }
          .content {
            padding: 30px;
          }
          .timer {
            background: #fee2e2;
            border: 2px solid #fecaca;
            border-radius: 4px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 6px 6px 0px 0px rgba(239,68,68,0.25);
          }
          .timer .value {
            font-size: 36px;
            font-weight: bold;
            color: #dc2626;
            font-family: monospace;
          }
          .order-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #64748b;
            font-weight: 500;
          }
          .value {
            color: #0f172a;
            font-weight: 600;
          }
          .highlight {
            color: #4a90e2;
            font-size: 24px;
            font-weight: 800;
          }
          .button {
            display: inline-block;
            background: #4a90e2;
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border: 2px solid #357abd;
            border-radius: 4px;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.25);
            margin: 20px 0;
          }
          .footer {
            background: #f1f5f9;
            border-top: 2px solid #cbd5e1;
            padding: 20px;
            text-align: center;
            color: #64748b;
          }
          .warning {
            background: #fffbeb;
            border: 2px solid #fcd34d;
            border-radius: 4px;
            padding: 15px;
            margin-top: 20px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 SMARETA EVENTS</h1>
          </div>
          <div class="content">
            <h2>Halo, ${data.customerName}!</h2>
            <p>Terima kasih telah melakukan pemesanan. Selesaikan pembayaran sebelum batas waktu.</p>
            
            <div class="timer">
              <div style="margin-bottom:10px">⏰ BATAS WAKTU</div>
              <div class="value">${data.countdown}</div>
              <div style="margin-top:10px">${data.formattedExpiry}</div>
            </div>
            
            <div class="order-card">
              <h3 style="margin-top:0">📋 Detail Pesanan #${data.orderNumber}</h3>
              <div class="info-row">
                <span class="label">Produk</span>
                <span class="value">${data.productName}</span>
              </div>
              <div class="info-row">
                <span class="label">Jumlah</span>
                <span class="value">${data.quantity} tiket</span>
              </div>
              <div class="info-row">
                <span class="label">Total</span>
                <span class="value highlight">${data.formattedAmount}</span>
              </div>
            </div>
            
            <div style="text-align:center">
              <a href="${data.payment_link}" class="button">
                💳 BAYAR SEKARANG
              </a>
            </div>
            
            <div class="warning">
              ⚠️ Pesanan akan otomatis dibatalkan jika tidak dibayar sebelum batas waktu
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Smareta Events. All rights reserved.</p>
            <p>Email ini dikirim otomatis, mohon tidak membalas.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  paymentSuccess: (data) => ({
    to_email: data.to,
    to_name: data.customerName,
    from_name: 'Smareta Events',
    reply_to: 'noreply@smaretaevents.biz.id',
    order_number: data.orderNumber,
    product_name: data.productName,
    quantity: data.quantity,
    total_amount: data.formattedAmount,
    ticket_codes: data.ticketCodes.join(', '),
    event_date: data.eventDate,
    event_location: data.eventLocation,
    
    html_content: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f0fdf4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border: 2px solid #86efac;
            border-radius: 4px;
            box-shadow: 10px 10px 0px 0px rgba(34,197,94,0.3);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 2px solid #15803d;
          }
          .header h1 {
            color: white;
            font-size: 32px;
            margin: 0;
          }
          .content {
            padding: 30px;
          }
          .success-badge {
            background: #dcfce7;
            border: 2px solid #86efac;
            border-radius: 50px;
            padding: 10px 20px;
            display: inline-block;
            color: #166534;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .ticket-card {
            background: #f0f9ff;
            border: 2px solid #bae6fd;
            border-radius: 4px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 4px 4px 0px 0px rgba(14,165,233,0.2);
          }
          .ticket-code {
            font-family: monospace;
            font-size: 18px;
            background: white;
            padding: 8px 12px;
            border: 1px dashed #0284c7;
            border-radius: 4px;
            color: #0369a1;
          }
          .footer {
            background: #f1f5f9;
            border-top: 2px solid #cbd5e1;
            padding: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ PEMBAYARAN BERHASIL</h1>
          </div>
          <div class="content">
            <div class="success-badge">
              🎉 Terima kasih! Pembayaran Anda telah dikonfirmasi
            </div>
            
            <h2>Halo, ${data.customerName}!</h2>
            <p>Berikut adalah detail tiket Anda:</p>
            
            <div class="ticket-card">
              <h3 style="margin-top:0">🎟️ ${data.productName}</h3>
              <p><strong>Jumlah:</strong> ${data.quantity} tiket</p>
              <p><strong>Total:</strong> ${data.formattedAmount}</p>
              <p><strong>Kode Tiket:</strong></p>
              ${data.ticketCodes.map(code => 
                `<div class="ticket-code">${code}</div>`
              ).join('<br>')}
            </div>
            
            <div class="ticket-card">
              <h3 style="margin-top:0">📅 Detail Event</h3>
              <p><strong>Tanggal:</strong> ${data.eventDate}</p>
              <p><strong>Lokasi:</strong> ${data.eventLocation}</p>
            </div>
            
            <p style="text-align:center; margin-top:30px">
              <strong>Simpan email ini sebagai bukti pembelian Anda.</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Smareta Events</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
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
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Kirim email menggunakan EmailJS
 */
export const sendEmail = async (type, data) => {
  try {
    await loadEmailJSScript();
    
    const templateData = EMAIL_TEMPLATES[type](data);
    
    // Kirim via EmailJS
    const response = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      type === 'paymentPending' ? 'template_pending' : 'template_success', // Buat template ini di dashboard
      templateData,
      EMAILJS_CONFIG.userId
    );
    
    return {
      success: true,
      message: 'Email berhasil dikirim',
      data: response
    };
  } catch (error) {
    console.error('EmailJS error:', error);
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
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
    quantity: order.quantity,
    formattedAmount,
    formattedExpiry,
    countdown: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    orderId: order.id,
    ticketCodes: tickets.map(t => t.ticket_code),
    eventDate: products?.event_date ? new Date(products.event_date).toLocaleDateString('id-ID') : '-',
    eventLocation: products?.event_location || '-'
  };
};

export default {
  sendEmail,
  formatEmailData
};
