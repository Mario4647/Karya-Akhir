const midtransClient = require('midtrans-client');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Konfigurasi Midtrans
const snap = new midtransClient.Snap({
  isProduction: false, // Ubah ke true untuk production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderId, orderNumber, amount, customerName, customerEmail, items } = req.body;

    // Buat parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: orderNumber,
        gross_amount: amount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail
      },
      item_details: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    // Dapatkan Snap token
    const transaction = await snap.createTransaction(parameter);
    
    // Simpan transaction_id ke database
    await supabase
      .from('orders')
      .update({ 
        midtrans_transaction_id: transaction.transaction_id 
      })
      .eq('id', orderId);

    res.status(200).json({
      snap_token: transaction.token,
      snap_redirect_url: transaction.redirect_url
    });
  } catch (error) {
    console.error('Midtrans error:', error);
    res.status(500).json({ error: error.message });
  }
}
