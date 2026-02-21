const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Konfigurasi CORS yang lebih spesifik
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://karya-akhir.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Route health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Route untuk membuat transaksi Midtrans
app.post('/api/midtrans', async (req, res) => {
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

    // Log request
    console.log('Received payment request:', {
      orderNumber,
      totalAmount,
      customerEmail
    });

    // Validasi input
    if (!orderNumber || !totalAmount || !customerEmail) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        required: ['orderNumber', 'totalAmount', 'customerEmail']
      });
    }

    // Konfigurasi Midtrans
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

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

    console.log('Sending to Midtrans...');

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
        timeout: 30000
      }
    );

    console.log('Midtrans response success');

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

    return res.status(500).json({ 
      error: error.response?.data?.error_message || error.message 
    });
  }
});

// Handle 404 untuk API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export untuk Vercel
module.exports = app;
