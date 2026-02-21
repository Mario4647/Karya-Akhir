// api/create-midtrans-transaction.js
const Midtrans = require('midtrans-client');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const body = req.body;
    console.log('Received body:', body);

    const { 
      orderId, 
      orderNumber, 
      amount, 
      customerName, 
      customerEmail, 
      customerPhone,
      items 
    } = body;

    // Validasi required fields
    if (!orderNumber || !amount || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Buat Snap API instance dengan Server Key
    let snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU',
      clientKey: 'Mid-client-PKxh7PoyLs2QwsBh'
    });

    let parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: parseInt(amount)
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: customerPhone || "081234567890"
      },
      item_details: items.map(item => ({
        id: item.id,
        price: parseInt(item.price),
        quantity: parseInt(item.quantity),
        name: item.name
      })),
      callbacks: {
        finish: `${req.headers.origin}/payment-success/${orderId}`,
        error: `${req.headers.origin}/payment/${orderId}`,
        pending: `${req.headers.origin}/payment/${orderId}`
      }
    };

    console.log('Midtrans parameter:', JSON.stringify(parameter, null, 2));

    // Buat transaksi
    const transaction = await snap.createTransaction(parameter);
    console.log('Midtrans response:', transaction);
    
    // Pastikan response dikembalikan sebagai JSON
    res.status(200).json({
      success: true,
      snap_token: transaction.token,
      transaction_id: transaction.transaction_id,
      redirect_url: transaction.redirect_url
    });

  } catch (error) {
    console.error('Midtrans error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    // Kirim error response sebagai JSON
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal membuat transaksi',
      details: error.response?.data || null
    });
  }
}
