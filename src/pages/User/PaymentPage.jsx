import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiCreditCard,
  BiTimer,
  BiX,
  BiCheck,
  BiError,
  BiCopy,
  BiArrowBack,
  BiMoney,
  BiWallet,
  BiBank,
  BiQr,
  BiCheckCircle,
  BiXCircle
} from 'react-icons/bi'

const PaymentPage = () => {
  const [order, setOrder] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')
  const [snapToken, setSnapToken] = useState(null)
  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrder()
    loadMidtransScript()
  }, [orderId])

  useEffect(() => {
    if (order && order.payment_expiry) {
      const expiryTime = new Date(order.payment_expiry).getTime()
      const now = new Date().getTime()
      const initialTimeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000))
      setTimeLeft(initialTimeLeft)

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            cancelExpiredOrder()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [order])

  const loadMidtransScript = () => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', 'YOUR_MIDTRANS_CLIENT_KEY') // Ganti dengan client key Midtrans Anda
    document.body.appendChild(script)
  }

  const fetchOrder = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (*),
        order_buyers (*)
      `)
      .eq('id', orderId)
      .single()

    if (!error && data) {
      setOrder(data)
    }
    setLoading(false)
  }

  const cancelExpiredOrder = async () => {
    if (order && order.status === 'pending') {
      await supabase
        .from('orders')
        .update({ status: 'expired' })
        .eq('id', order.id)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancelOrder = async () => {
    if (window.confirm('Yakin ingin membatalkan pesanan?')) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
      navigate('/')
    }
  }

  const handlePayOrder = () => {
    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    if (!selectedPayment) {
      setError('Pilih metode pembayaran terlebih dahulu')
      return
    }

    setProcessingPayment(true)
    setError('')

    try {
      // Panggil API Midtrans untuk mendapatkan Snap Token
      const response = await fetch('/api/create-midtrans-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          amount: order.total_amount,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          items: [{
            id: order.product_id,
            name: order.product_name,
            price: order.product_price,
            quantity: order.quantity
          }]
        })
      })

      const data = await response.json()

      if (data.snap_token) {
        setSnapToken(data.snap_token)
        
        // Buka Snap popup
        window.snap.pay(data.snap_token, {
          onSuccess: async (result) => {
            await handlePaymentSuccess(result)
          },
          onPending: (result) => {
            console.log('Payment pending:', result)
          },
          onError: (result) => {
            console.error('Payment error:', result)
            setError('Pembayaran gagal, silakan coba lagi')
          },
          onClose: () => {
            setSnapToken(null)
          }
        })
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setError('Gagal memproses pembayaran')
    } finally {
      setProcessingPayment(false)
      setShowPaymentModal(false)
    }
  }

  const handlePaymentSuccess = async (result) => {
    try {
      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_method: result.payment_type,
          payment_details: result,
          midtrans_transaction_id: result.transaction_id,
          midtrans_transaction_status: result.transaction_status,
          midtrans_payment_type: result.payment_type
        })
        .eq('id', order.id)

      // Send success email (implementasikan sesuai kebutuhan)
      await sendSuccessEmail()

      navigate(`/payment-success/${order.id}`)
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const sendSuccessEmail = async () => {
    // Implementasi pengiriman email sukses
    // Bisa menggunakan Supabase Edge Functions atau service email lainnya
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Kode berhasil disalin!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700">Pesanan tidak ditemukan</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (order.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {order.status === 'paid' ? (
              <>
                <BiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Pesanan Sudah Dibayar</h2>
                <p className="text-gray-600 mt-2">Pesanan Anda sudah dalam status LUNAS</p>
              </>
            ) : order.status === 'cancelled' ? (
              <>
                <BiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Pesanan Dibatalkan</h2>
                <p className="text-gray-600 mt-2">Pesanan Anda telah dibatalkan</p>
              </>
            ) : (
              <>
                <BiTimer className="text-6xl text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Pesanan Kadaluarsa</h2>
                <p className="text-gray-600 mt-2">Waktu pembayaran telah habis</p>
              </>
            )}
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Timer */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BiTimer className="text-3xl text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Sisa Waktu Pembayaran</p>
                <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Batas waktu: {new Date(order.payment_expiry).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Pesanan</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Nomor Pesanan</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-800">{order.order_number}</span>
                <button
                  onClick={() => copyToClipboard(order.order_number)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <BiCopy />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-gray-700">Produk</p>
              <div className="flex justify-between text-sm">
                <span>{order.product_name}</span>
                <span>{order.quantity} x Rp {order.product_price.toLocaleString()}</span>
              </div>
            </div>

            {order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Promo</span>
                <span>- Rp {order.promo_discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-blue-600">Rp {order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer Data */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Data Pemesan</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{order.customer_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama</p>
              <p className="font-medium text-gray-800">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alamat</p>
              <p className="font-medium text-gray-800">{order.customer_address}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleCancelOrder}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <BiX className="text-xl" />
            <span>Batalkan Pesanan</span>
          </button>
          <button
            onClick={handlePayOrder}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <BiCreditCard className="text-xl" />
            <span>Bayar Pesanan</span>
          </button>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Pilih Metode Pembayaran</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setSelectedPayment('credit_card')}
                  className={`w-full p-4 border rounded-xl flex items-center space-x-3 transition-all ${
                    selectedPayment === 'credit_card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <BiCreditCard className={`text-2xl ${selectedPayment === 'credit_card' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">Kartu Kredit/Debit</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, JCB</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPayment('bank_transfer')}
                  className={`w-full p-4 border rounded-xl flex items-center space-x-3 transition-all ${
                    selectedPayment === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <BiBank className={`text-2xl ${selectedPayment === 'bank_transfer' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">Transfer Bank</p>
                    <p className="text-sm text-gray-500">BCA, Mandiri, BNI, BRI</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPayment('gopay')}
                  className={`w-full p-4 border rounded-xl flex items-center space-x-3 transition-all ${
                    selectedPayment === 'gopay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <BiWallet className={`text-2xl ${selectedPayment === 'gopay' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">GoPay</p>
                    <p className="text-sm text-gray-500">Dompet digital Gojek</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPayment('qris')}
                  className={`w-full p-4 border rounded-xl flex items-center space-x-3 transition-all ${
                    selectedPayment === 'qris'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <BiQr className={`text-2xl ${selectedPayment === 'qris' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">QRIS</p>
                    <p className="text-sm text-gray-500">Scan QR code</p>
                  </div>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center space-x-1">
                  <BiError />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={processPayment}
                  disabled={!selectedPayment || processingPayment}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
                >
                  {processingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentPage
