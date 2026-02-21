const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderId,
      orderNumber, 
      totalAmount, 
      customerName, 
      customerEmail, 
      customerAddress,
      productName,
      productPrice,
      quantity,
      productId 
    } = req.body;

    // Validasi input
    if (!orderNumber || !totalAmount || !customerEmail) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap' 
      });
    }

    // Konfigurasi Midtrans
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

    // Parameter transaksi
    const parameter = {
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
        phone: "081234567890",
        billing_address: {
          address: customerAddress || 'Jakarta',
          city: "Jakarta",
          postal_code: "12345",
          country_code: "IDN"
        }
      },
      item_details: [{
        id: productId || "TICKET-001",
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
      ],
      callbacks: {
        finish: `${req.headers.origin}/payment-success/${orderId}`,
        error: `${req.headers.origin}/payment/${orderId}`,
        pending: `${req.headers.origin}/payment/${orderId}`
      }
    };

    console.log('Sending to Midtrans:', JSON.stringify(parameter, null, 2));

    // Panggil API Midtrans
    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      parameter,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + base64ServerKey,
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    console.log('Midtrans response:', response.data);

    // Return success response
    return res.status(200).json({
      token: response.data.token,
      redirect_url: response.data.redirect_url,
      transaction_id: response.data.transaction_id
    });

  } catch (error) {
    console.error('Midtrans API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Return error response
    return res.status(500).json({ 
      error: error.response?.data?.error_message || error.message 
    });
  }
};
