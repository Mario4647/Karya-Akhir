// api/midtrans.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderNumber, 
      totalAmount, 
      customerEmail,
      customerName,
      productName,
      productPrice,
      quantity 
    } = req.body;

    // Validasi input
    if (!orderNumber || !totalAmount || !customerEmail) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        received: { orderNumber, totalAmount, customerEmail }
      });
    }

    // Konfigurasi Midtrans
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64Key = Buffer.from(serverKey + ':').toString('base64');

    console.log('📤 Sending to Midtrans:', {
      orderNumber,
      totalAmount,
      customerEmail
    });

    // Panggil API Midtrans
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64Key,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderNumber,
          gross_amount: parseInt(totalAmount)
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: customerName || 'Customer',
          email: customerEmail,
          phone: "081234567890"
        },
        item_details: [{
          id: "TICKET-001",
          price: parseInt(productPrice) || 0,
          quantity: parseInt(quantity) || 1,
          name: productName || 'Concert Ticket'
        }],
        enabled_payments: [
          "credit_card",
          "mandiri_clickpay",
          "bca_klikbca",
          "bca_klikpay",
          "bri_epay",
          "echannel",
          "permata_va",
          "bca_va",
          "bni_va",
          "bri_va",
          "cimb_va",
          "other_va",
          "gopay",
          "shopeepay",
          "qris"
        ]
      })
    });

    const data = await response.json();
    console.log('✅ Midtrans response:', data);

    if (!response.ok) {
      throw new Error(data.error_message || data.status_message || 'Gagal membuat transaksi');
    }

    // Return success response
    res.status(200).json({
      token: data.token,
      redirect_url: data.redirect_url,
      transaction_id: data.transaction_id
    });

  } catch (error) {
    console.error('❌ Midtrans Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
