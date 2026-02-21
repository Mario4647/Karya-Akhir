export default async function handler(req, res) {
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

    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64ServerKey = Buffer.from(serverKey + ':').toString('base64');

    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: totalAmount
      },
      credit_card: {
        secure: true
      },
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

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64ServerKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify(parameter)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || data.status_message || 'Failed to create transaction');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Midtrans API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
