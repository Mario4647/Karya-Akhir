const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check - WAJIB ADA untuk testing
app.get('/api/health', (req, res) => {
  console.log('✅ Health check accessed');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Midtrans transaction
app.post('/api/midtrans', async (req, res) => {
  console.log('📩 Midtrans request received');
  
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
        required: ['orderNumber', 'totalAmount', 'customerEmail']
      });
    }

    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64Key = Buffer.from(serverKey + ':').toString('base64');

    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: parseInt(totalAmount)
      },
      customer_details: {
        first_name: customerName || 'Customer',
        email: customerEmail
      },
      item_details: [{
        id: "TICKET-001",
        price: parseInt(productPrice) || 0,
        quantity: parseInt(quantity) || 1,
        name: productName || 'Concert Ticket'
      }]
    };

    console.log('📤 Sending to Midtrans:', JSON.stringify(parameter));

    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      parameter,
      {
        headers: {
          'Authorization': 'Basic ' + base64Key,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Midtrans response received');
    res.status(200).json(response.data);

  } catch (error) {
    console.error('❌ Midtrans error:', error.message);
    res.status(500).json({ 
      error: error.response?.data?.error_message || error.message 
    });
  }
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
