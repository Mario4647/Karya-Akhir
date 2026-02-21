// api/midtrans.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya allow POST
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
      quantity 
    } = req.body;

    // Validasi lengkap
    const missingFields = [];
    if (!orderNumber) missingFields.push('orderNumber');
    if (!totalAmount) missingFields.push('totalAmount');
    if (!customerName) missingFields.push('customerName');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!customerAddress) missingFields.push('customerAddress');
    if (!productName) missingFields.push('productName');
    if (!productPrice) missingFields.push('productPrice');
    if (!quantity) missingFields.push('quantity');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        missingFields: missingFields,
        received: req.body
      });
    }

    console.log('📤 Sending to Midtrans with data:', {
      orderNumber,
      totalAmount,
      customerName,
      customerEmail,
      productName,
      quantity
    });

    const serverKey = 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU';
    const base64Key = Buffer.from(serverKey + ':').toString('base64');

    // Parameter lengkap untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: parseInt(totalAmount)
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: "081234567890",
        billing_address: {
          first_name: customerName,
          email: customerEmail,
          address: customerAddress,
          city: "Jakarta",
          postal_code: "12345",
          country_code: "IDN"
        }
      },
      item_details: [{
        id: "TICKET-001",
        price: parseInt(productPrice),
        quantity: parseInt(quantity),
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
      ]
    };

    console.log('📦 Parameter:', JSON.stringify(parameter, null, 2));

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64Key,
        'Accept': 'application/json'
      },
      body: JSON.stringify(parameter)
    });

    const responseText = await response.text();
    console.log('📥 Raw Midtrans Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse Midtrans response:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from Midtrans',
        raw: responseText.substring(0, 200)
      });
    }

    if (!response.ok) {
      console.error('❌ Midtrans error response:', data);
      return res.status(response.status).json({ 
        error: data.error_message || data.status_message || 'Gagal membuat transaksi',
        details: data
      });
    }

    console.log('✅ Midtrans success:', data);
    return res.status(200).json({
      token: data.token,
      redirect_url: data.redirect_url,
      transaction_id: data.transaction_id
    });

  } catch (error) {
    console.error('❌ Midtrans API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
