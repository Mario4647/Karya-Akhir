const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
