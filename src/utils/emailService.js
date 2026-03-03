// ============================================
// EMAIL SERVICE DENGAN EMAILJS
// Template ID sudah dimasukkan
// DISESUAIKAN DENGAN VARIABLE DI DASHBOARD: {{email}}
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

/**
 * Kirim email menggunakan EmailJS
 * SESUAIKAN DENGAN VARIABLE DI DASHBOARD: {{email}}, {{order_id}}, dll
 */
export const sendEmail = async (type, data) => {
  try {
    await loadEmailJSScript();
    
    // Validasi email penerima
    if (!data.email || data.email.trim() === '') {
      throw new Error('Alamat email penerima tidak boleh kosong');
    }
    
    console.log('📧 Preparing email data:', {
      email: data.email,
      customerName: data.customerName,
      orderNumber: data.orderNumber
    });
    
    // Siapkan template params SESUAI DENGAN DASHBOARD
    const templateParams = {
      // SESUAIKAN: Di dashboard menggunakan {{email}} bukan {{to_email}}
      email: data.email,
      customer_name: data.customerName,
      order_id: data.orderNumber,
      product_name: data.productName,
      quantity: data.quantity.toString(),
      total_amount: data.formattedAmount,
      expiry_time: data.formattedExpiry,
      countdown: data.countdown,
      payment_link: `https://smaretaevents.biz.id/payment/${data.orderId}`,
      // Untuk email sukses
      ticket_codes: data.ticketCodes ? data.ticketCodes.join(', ') : '',
      event_date: data.eventDate || '',
      event_location: data.eventLocation || '',
      // Tambahan untuk reply-to
      reply_to: 'kazupiee.seraa@gmail.com' // Dari dashboard
    };
    
    console.log('📧 Sending email with template params:', templateParams);
    
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
 * Format data untuk email pending
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
    // SESUAIKAN: Gunakan 'email' bukan 'to'
    email: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
    quantity: order.quantity,
    formattedAmount,
    formattedExpiry,
    countdown: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    orderId: order.id,
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
