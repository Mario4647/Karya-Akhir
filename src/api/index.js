const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL || 'https://karya-akhir.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

    // Validasi input
    if (!orderNumber || !totalAmount || !customerEmail) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    // Konfigurasi Midtrans
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

    const axios = require('axios');
    
    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: totalAmount
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: "081234567890",
        billing_address: {
          address: customerAddress,
          city: "Jakarta",
          postal_code: "12345",
          country_code: "IDN"
        }
      },
      item_details: [{
        id: productId || "TICKET-001",
        price: productPrice,
        quantity: quantity,
        name: productName
      }],
      enabled_payments: [
        "credit_card", "mandiri_clickpay", "bca_klikbca", "bca_klikpay",
        "bri_epay", "echannel", "permata_va", "bca_va", "bni_va", "bri_va",
        "cimb_va", "other_va", "gopay", "shopeepay", "qris"
      ],
      callbacks: {
        finish: `${req.headers.origin}/payment-success/${orderId}`,
        error: `${req.headers.origin}/payment/${orderId}`,
        pending: `${req.headers.origin}/payment/${orderId}`
      }
    };

    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      parameter,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + base64ServerKey
        }
      }
    );

    return res.status(200).json({
      token: response.data.token,
      redirect_url: response.data.redirect_url,
      transaction_id: response.data.transaction_id
    });

  } catch (error) {
    console.error('Midtrans API Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: error.response?.data?.error_message || error.message 
    });
  }
});

// Route health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Export untuk Vercel (WAJIB)
module.exports = app;
