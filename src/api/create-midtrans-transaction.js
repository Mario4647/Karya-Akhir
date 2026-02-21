// api/create-midtrans-transaction.js
const Midtrans = require('midtrans-client');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderId, 
      orderNumber, 
      amount, 
      customerName, 
      customerEmail, 
      customerPhone,
      items 
    } = req.body;

    // Buat Snap API instance dengan Server Key
    let snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: 'Mid-server-GO01WdWzdlBnf8IVAP_IQ7BU',
      clientKey: 'Mid-client-PKxh7PoyLs2QwsBh'
    });

    let parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: amount
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
        price: item.price,
        quantity: item.quantity,
        name: item.name
      })),
      callbacks: {
        finish: `${req.headers.origin}/payment-success/${orderId}`,
        error: `${req.headers.origin}/payment/${orderId}`,
        pending: `${req.headers.origin}/payment/${orderId}`
      }
    };

    // Buat transaksi
    const transaction = await snap.createTransaction(parameter);
    
    res.status(200).json({
      success: true,
      snap_token: transaction.token,
      transaction_id: transaction.transaction_id,
      redirect_url: transaction.redirect_url
    });

  } catch (error) {
    console.error('Midtrans error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal membuat transaksi'
    });
  }
}
