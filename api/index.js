const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Midtrans transaction
app.post('/api/midtrans', async (req, res) => {
  try {
    const { orderNumber, totalAmount, customerEmail } = req.body;
    
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64Key = Buffer.from(serverKey + ':').toString('base64');

    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: totalAmount
        },
        customer_details: { email: customerEmail }
      },
      {
        headers: {
          'Authorization': 'Basic ' + base64Key,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
