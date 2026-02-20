// api/midtrans.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
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

    // Konfigurasi Midtrans
    const serverKey = 'Mid-server-a8kJipjOZM3iVYukLNS2VrPz';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

    // Prepare item details
    const itemDetails = [{
      id: productId,
      name: productName,
      price: productPrice,
      quantity: quantity
    }];

    // Prepare customer details
    const customerDetails = {
      first_name: customerName,
      email: customerEmail,
      billing_address: {
        address: customerAddress
      }
    };

    // Prepare transaction details
    const transactionDetails = {
      order_id: orderNumber,
      gross_amount: totalAmount
    };

    // Call Midtrans API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64ServerKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        transaction_details: transactionDetails,
        item_details: itemDetails,
        customer_details: customerDetails,
        credit_card: {
          secure: true
        },
        callbacks: {
          finish: `${req.headers.origin}/payment-success/${req.body.orderId}`,
          error: `${req.headers.origin}/payment/${req.body.orderId}`,
          pending: `${req.headers.origin}/payment/${req.body.orderId}`
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to create transaction');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Midtrans API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
