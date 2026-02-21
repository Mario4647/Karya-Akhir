const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Midtrans transaction
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
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        details: { orderNumber, totalAmount, customerEmail }
      });
    }

    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64Key = Buffer.from(serverKey + ':').toString('base64');

    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: parseInt(totalAmount)
      },
      credit_card: { secure: true },
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
        "credit_card", "mandiri_clickpay", "bca_klikbca",
        "bca_klikpay", "bri_epay", "echannel", "permata_va",
        "bca_va", "bni_va", "bri_va", "cimb_va", "other_va",
        "gopay", "shopeepay", "qris"
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
          'Authorization': 'Basic ' + base64Key,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    res.status(200).json({
      token: response.data.token,
      redirect_url: response.data.redirect_url,
      transaction_id: response.data.transaction_id
    });

  } catch (error) {
    console.error('Midtrans Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Kirim error message yang jelas
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error_message || error.message || 'Terjadi kesalahan pada server'
    });
  }
});

module.exports = app;
