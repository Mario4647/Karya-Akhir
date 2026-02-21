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

    // Konfigurasi Midtrans Sandbox
    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

    // Prepare item details
    const itemDetails = [{
      id: productId || 'TICKET-001',
      name: productName || 'Concert Ticket',
      price: parseInt(productPrice) || 0,
      quantity: parseInt(quantity) || 1
    }];

    // Prepare customer details
    const customerDetails = {
      first_name: customerName || 'Customer',
      email: customerEmail || 'customer@example.com',
      phone: '',
      billing_address: {
        address: customerAddress || ''
      }
    };

    // Prepare transaction details
    const transactionDetails = {
      order_id: orderNumber || `ORDER-${Date.now()}`,
      gross_amount: parseInt(totalAmount) || 0
    };

    console.log('Sending to Midtrans:', {
      transaction_details: transactionDetails,
      item_details: itemDetails,
      customer_details: customerDetails
    });

    // Call Midtrans API Sandbox
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
          finish: `${req.headers.origin}/payment-success/${orderId}`,
          error: `${req.headers.origin}/payment/${orderId}`,
          pending: `${req.headers.origin}/payment/${orderId}`
        },
        expiry: {
          duration: 60,
          unit: 'minutes'
        }
      })
    });

    const data = await response.json();
    console.log('Midtrans Response:', data);

    if (!response.ok) {
      throw new Error(data.error_message || data.status_message || 'Failed to create transaction');
    }

    return res.status(200).json({
      token: data.token,
      redirect_url: data.redirect_url,
      transaction_id: data.transaction_id
    });
  } catch (error) {
    console.error('Midtrans API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
