// ============================================
// EMAIL SERVICE DENGAN EMAILJS - VERSION RINGKAS
// Ukuran HTML diperkecil agar tidak melebihi 50KB
// ============================================

// Konfigurasi EmailJS dengan credentials Anda
const EMAILJS_CONFIG = {
  serviceId: 'service_2x3byo7',
  templateId: 'template_nd1w82s',
  userId: 'JNo-bH0_yGFORzjSu',
  accessToken: 'NNNVKNALkpATC5Y3Kfxlc'
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
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Template HTML RINGKAS untuk email pending (ukuran kecil)
const getPendingEmailHTML = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #e5e7eb; border-radius: 4px; box-shadow: 8px 8px 0 0 rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #4a90e2, #357abd); padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0; font-size:24px;">🎫 SMARETA EVENTS</h1>
        <p style="margin:5px 0 0; opacity:0.9;">Konfirmasi Pesanan #${data.orderNumber}</p>
      </div>
      <div style="padding: 20px;">
        <h2>Halo, ${data.customerName}!</h2>
        <p>Terima kasih telah memesan. Selesaikan pembayaran sebelum batas waktu.</p>
        
        <div style="background: #fee2e2; border: 2px solid #fecaca; border-radius: 4px; padding: 15px; text-align: center; margin: 15px 0;">
          <div style="font-size: 28px; font-weight: bold; color: #dc2626; font-family: monospace;">${data.countdown}</div>
          <div style="margin-top:5px; color:#7f1d1d;">${data.formattedExpiry}</div>
        </div>
        
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 4px; padding: 15px; margin: 15px 0;">
          <h3 style="margin:0 0 10px; border-bottom:2px solid #cbd5e1; padding-bottom:5px;">📋 Detail Pesanan</h3>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">Produk</td><td style="font-weight:600; text-align:right;">${data.productName}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">Jumlah</td><td style="font-weight:600; text-align:right;">${data.quantity} tiket</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">Total</td><td style="font-size:20px; font-weight:bold; color:#4a90e2; text-align:right;">${data.formattedAmount}</td></tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${data.paymentLink}" style="display:inline-block; background:#4a90e2; color:white; text-decoration:none; padding:12px 30px; border:2px solid #357abd; border-radius:4px; font-weight:bold; box-shadow:4px 4px 0 0 rgba(0,0,0,0.2);">💳 BAYAR SEKARANG</a>
        </div>
        
        <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 4px; padding: 10px; text-align: center; color: #92400e; font-size:12px;">
          ⚠️ Pesanan akan otomatis dibatalkan jika tidak dibayar sebelum batas waktu
        </div>
      </div>
      <div style="background: #f1f5f9; border-top:2px solid #cbd5e1; padding:15px; text-align:center; font-size:12px; color:#64748b;">
        <p>© 2025 Smareta Events. Email dikirim otomatis.</p>
      </div>
    </div>
  `;
};

// Template HTML RINGKAS untuk email sukses
const getSuccessEmailHTML = (data) => {
  const ticketCodesHTML = data.ticketCodes && data.ticketCodes.length > 0
    ? data.ticketCodes.map(code => `<div style="font-family:monospace; background:#f1f5f9; padding:8px; border:1px dashed #0284c7; border-radius:4px; margin:5px 0;">${code}</div>`).join('')
    : '<p>Tidak ada kode tiket</p>';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #86efac; border-radius: 4px; box-shadow: 8px 8px 0 0 rgba(34,197,94,0.2);">
      <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; text-align: center; color: white;">
        <h1 style="margin:0; font-size:24px;">✅ PEMBAYARAN BERHASIL</h1>
      </div>
      <div style="padding: 20px;">
        <div style="background: #dcfce7; border:2px solid #86efac; border-radius:50px; padding:8px 15px; display:inline-block; color:#166534; font-weight:bold; margin-bottom:15px;">🎉 Terima kasih!</div>
        
        <h2>Halo, ${data.customerName}!</h2>
        <p>Berikut tiket Anda untuk ${data.productName}:</p>
        
        <div style="background: #f0f9ff; border:2px solid #bae6fd; border-radius:4px; padding:15px; margin:15px 0;">
          <h3 style="margin:0 0 10px;">🎟️ Tiket</h3>
          ${ticketCodesHTML}
        </div>
        
        <div style="background: #f8fafc; border:2px solid #e2e8f0; border-radius:4px; padding:15px;">
          <h3 style="margin:0 0 10px;">📅 Detail Event</h3>
          <p><strong>Tanggal:</strong> ${data.eventDate}</p>
          <p><strong>Lokasi:</strong> ${data.eventLocation}</p>
        </div>
      </div>
      <div style="background: #f1f5f9; border-top:2px solid #cbd5e1; padding:15px; text-align:center; font-size:12px;">
        <p>© 2025 Smareta Events</p>
      </div>
    </div>
  `;
};

/**
 * Kirim email menggunakan EmailJS
 */
export const sendEmail = async (type, data) => {
  try {
    await loadEmailJSScript();
    
    if (!data.email) {
      throw new Error('Email penerima tidak valid');
    }

    console.log(`📧 Sending ${type} email to:`, data.email);
    
    // Pilih template HTML berdasarkan tipe email
    const htmlContent = type === 'paymentPending' 
      ? getPendingEmailHTML(data)
      : getSuccessEmailHTML(data);
    
    // Siapkan template params - HANYA field yang diperlukan
    const templateParams = {
      email: data.email,
      customer_name: data.customerName,
      order_id: data.orderNumber,
      product_name: data.productName,
      quantity: data.quantity.toString(),
      total_amount: data.formattedAmount,
      expiry_time: data.formattedExpiry || '',
      countdown: data.countdown || '',
      payment_link: data.paymentLink || '',
      ticket_codes: data.ticketCodes ? data.ticketCodes.join(', ') : '',
      event_date: data.eventDate || '',
      event_location: data.eventLocation || '',
      reply_to: 'kazupiee.seraa@gmail.com'
    };
    
    console.log('📧 Template params size:', JSON.stringify(templateParams).length, 'bytes');
    
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
  const expiryDate = order.payment_expiry ? new Date(order.payment_expiry) : new Date();
  const now = new Date();
  const timeLeft = Math.max(0, Math.floor((expiryDate - now) / 1000));
  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(order.total_amount || 0);
  
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
    customerName: order.customer_name || 'Customer',
    orderNumber: order.order_number || 'N/A',
    productName: order.product_name || 'Product',
    quantity: order.quantity || 1,
    formattedAmount,
    formattedExpiry,
    countdown: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    paymentLink: `https://smaretaevents.biz.id/payment/${order.id}`,
    ticketCodes: tickets.map(t => t.ticket_code).slice(0, 5), // Batasi 5 tiket
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
