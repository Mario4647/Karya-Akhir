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
  BiArrowBack,
  BiCheckCircle,
  BiXCircle,
  BiCopy,
  BiRefresh
} from 'react-icons/bi'
import axios from 'axios'

// Konfigurasi Midtrans Sandbox
const MIDTRANS_CLIENT_KEY = 'Mid-client-PKxh7PoyLs2QwsBh'

const PaymentPage = () => {
  const [order, setOrder] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')
  const [snapLoaded, setSnapLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const { orderId } = useParams()
  const navigate = useNavigate()

  // Load Midtrans script
  useEffect(() => {
    loadMidtransScript()
  }, [])

  // Fetch order data
  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Timer for payment expiry
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
    // Cek apakah script sudah ada
    if (document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]')) {
      console.log('Midtrans script already loaded')
      setSnapLoaded(true)
      return
    }
    
    console.log('Loading Midtrans script...')
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY)
    
    script.onload = () => {
      console.log('Midtrans script loaded successfully')
      setSnapLoaded(true)
    }
    
    script.onerror = (err) => {
      console.error('Failed to load Midtrans script:', err)
      setError('Gagal memuat metode pembayaran. Silakan refresh halaman.')
    }
    
    document.body.appendChild(script)
  }

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      
      if (!data) {
        throw new Error('Pesanan tidak ditemukan')
      }
      
      console.log('Order fetched:', data)
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Gagal memuat data pesanan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelExpiredOrder = async () => {
    if (order && order.status === 'pending') {
      try {
        await supabase
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', order.id)
      } catch (error) {
        console.error('Error cancelling expired order:', error)
      }
    }
  }

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00'
    
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancelOrder = async () => {
    if (window.confirm('Yakin ingin membatalkan pesanan?')) {
      try {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id)
        navigate('/concerts')
      } catch (error) {
        console.error('Error cancelling order:', error)
        alert('Gagal membatalkan pesanan: ' + error.message)
      }
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Fungsi untuk membuat transaksi di backend API
  const createTransaction = async () => {
    setProcessingPayment(true)
    setError('')

    try {
      console.log('Mengirim request ke API...')
      
      // Cek koneksi ke API dulu
      try {
        const testResponse = await axios.get('/api/test', { timeout: 5000 })
        console.log('API test response:', testResponse.data)
      } catch (testError) {
        console.warn('API test failed:', testError.message)
        // Lanjutkan saja, mungkin endpoint test tidak ada
      }
      
      // Siapkan data untuk dikirim
      const requestData = {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: parseInt(order.total_amount),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone || "081234567890",
        items: [{
          id: order.product_id || 'TICKET-001',
          name: order.products?.name || 'Tiket Konser',
          price: parseInt(order.product_price),
          quantity: parseInt(order.quantity)
        }]
      }
      
      console.log('Request data:', requestData)

      // Panggil API endpoint
      const response = await axios.post('/api/create-midtrans-transaction', requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 detik timeout
      })

      console.log('API Response:', response.data)

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal membuat transaksi')
      }

      // Simpan snap_token ke database
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          snap_token: response.data.snap_token,
          midtrans_transaction_id: response.data.transaction_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error updating order with snap_token:', updateError)
        // Lanjutkan saja, yang penting snap_token sudah didapat
      }

      // Langsung buka Snap dengan token yang didapat
      openSnapPayment(response.data.snap_token)

    } catch (error) {
      console.error('Error creating transaction:', error)
      
      let errorMessage = 'Gagal membuat transaksi: '
      
      if (error.response) {
        // Server merespon dengan status code error
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        errorMessage += error.response.data?.message || `Server error (${error.response.status})`
      } else if (error.request) {
        // Request dibuat tapi tidak ada response
        console.error('No response received:', error.request)
        errorMessage += 'Tidak ada response dari server. Pastikan API sudah berjalan.'
      } else {
        // Error lainnya
        errorMessage += error.message
      }
      
      setError(errorMessage)
      setProcessingPayment(false)
    }
  }

  // Fungsi untuk membuka Snap payment
  const openSnapPayment = (token) => {
    if (!snapLoaded) {
      setError('Metode pembayaran belum siap. Silakan tunggu...')
      setProcessingPayment(false)
      return
    }

    if (!window.snap) {
      setError('Snap Midtrans tidak tersedia. Silakan refresh halaman.')
      setProcessingPayment(false)
      return
    }

    try {
      console.log('Opening Snap with token:', token)
      
      // Buka Snap dengan token
      window.snap.pay(token, {
        onSuccess: function(result) {
          console.log('Payment success:', result)
          handlePaymentSuccess(result)
        },
        onPending: function(result) {
          console.log('Payment pending:', result)
          handlePaymentPending(result)
        },
        onError: function(result) {
          console.error('Payment error:', result)
          handlePaymentError(result)
        },
        onClose: function() {
          console.log('Payment popup closed')
          setProcessingPayment(false)
        }
      })
    } catch (error) {
      console.error('Error in snap.pay:', error)
      setError('Gagal memproses pembayaran: ' + error.message)
      setProcessingPayment(false)
    }
  }

  const handlePaymentSuccess = async (result) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_method: result.payment_type,
          payment_details: result,
          midtrans_transaction_id: result.transaction_id,
          midtrans_transaction_status: result.transaction_status,
          midtrans_payment_type: result.payment_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) throw error

      // Redirect ke halaman sukses
      navigate(`/payment-success/${order.id}`)
    } catch (error) {
      console.error('Error updating order after success:', error)
      alert('Pembayaran berhasil tetapi gagal memperbarui status. Hubungi admin.')
      setProcessingPayment(false)
    }
  }

  const handlePaymentPending = async (result) => {
    try {
      await supabase
        .from('orders')
        .update({ 
          midtrans_transaction_status: 'pending',
          payment_details: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
      
      alert('Pembayaran sedang diproses. Silakan cek status secara berkala.')
    } catch (error) {
      console.error('Error updating pending status:', error)
    }
    setProcessingPayment(false)
  }

  const handlePaymentError = async (result) => {
    setError('Pembayaran gagal: ' + (result.status_message || 'Silakan coba lagi'))
    setProcessingPayment(false)
  }

  // Handler untuk tombol bayar
  const handlePayNow = () => {
    if (!snapLoaded) {
      setError('Metode pembayaran belum siap. Silakan tunggu...')
      return
    }

    if (!order) {
      setError('Data pesanan tidak ditemukan')
      return
    }

    // Cek apakah order sudah punya snap_token
    if (order.snap_token) {
      openSnapPayment(order.snap_token)
    } else {
      // Jika belum, buat transaksi baru
      createTransaction()
    }
  }

  const handleRefreshOrder = () => {
    fetchOrder()
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '-'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat detail pembayaran...</p>
          </div>
        </div>
      </div>
    )
  }

  // Order not found
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">
              Maaf, kami tidak dapat menemukan data pesanan Anda.
            </p>
            <button
              onClick={() => navigate('/concerts')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <BiArrowBack className="text-xl" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Order not pending
  if (order.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
            {order.status === 'paid' ? (
              <>
                <BiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Sudah Dibayar</h2>
                <p className="text-gray-600 mb-6">Pesanan Anda sudah dalam status LUNAS</p>
                <button
                  onClick={() => navigate(`/payment-success/${order.id}`)}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Lihat Tiket
                </button>
              </>
            ) : order.status === 'cancelled' ? (
              <>
                <BiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Dibatalkan</h2>
                <p className="text-gray-600 mb-6">Pesanan Anda telah dibatalkan</p>
              </>
            ) : (
              <>
                <BiTimer className="text-6xl text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Kadaluarsa</h2>
                <p className="text-gray-600 mb-6">Waktu pembayaran telah habis</p>
              </>
            )}
            <button
              onClick={() => navigate('/concerts')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main payment page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <BiError className="text-red-500 text-lg flex-shrink-0" />
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Timer */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-red-500"></div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${timeLeft < 300 ? 'bg-red-100' : 'bg-blue-100'}`}>
                <BiTimer className={`text-2xl ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Waktu Pembayaran</p>
                <p className={`text-3xl font-bold font-mono ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Batas waktu</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(order.payment_expiry)}
              </p>
              <button 
                onClick={handleRefreshOrder}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 mt-1 ml-auto"
                title="Refresh status"
              >
                <BiRefresh className="text-lg" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Ringkasan Pesanan
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Nomor Pesanan</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                  {order.order_number}
                </span>
                <button
                  onClick={() => copyToClipboard(order.order_number)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  title="Salin nomor pesanan"
                >
                  <BiCopy className="text-lg" />
                </button>
                {copied && (
                  <span className="text-xs text-green-500">Tersalin!</span>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="font-semibold text-gray-700 mb-2">Detail Produk</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produk:</span>
                  <span className="font-medium text-gray-800">{order.products?.name || order.product_name || 'Tiket Konser'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga Satuan:</span>
                  <span className="font-medium text-gray-800">{formatRupiah(order.product_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium text-gray-800">{order.quantity || 1} tiket</span>
                </div>
              </div>
            </div>

            {order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <span className="flex items-center gap-1">
                  <BiCheck className="text-lg" />
                  Diskon Promo
                </span>
                <span>- {formatRupiah(order.promo_discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-gray-200">
              <span>Total yang harus dibayar</span>
              <span className="text-blue-600 text-2xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Data */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Data Pemesan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-800">{order.customer_email || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
              <p className="font-medium text-gray-800">{order.customer_name || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Alamat</p>
              <p className="font-medium text-gray-800">{order.customer_address || '-'}</p>
            </div>
          </div>
        </div>

        {/* Additional Buyers */}
        {order.additional_buyers && order.additional_buyers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Pembeli Lainnya
            </h2>
            
            <div className="space-y-3">
              {order.additional_buyers.map((buyer, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pembeli {index + 2}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="text-sm text-gray-800">{buyer.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NIK</p>
                      <p className="text-sm text-gray-800">{buyer.nik || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="text-sm text-gray-800">{buyer.address || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <BiCheckCircle className="text-blue-500 text-lg flex-shrink-0" />
            <span>Konfirmasi pembayaran akan dikirim ke email: </span>
            <span className="font-medium break-all">{order.customer_email}</span>
          </p>
        </div>

        {/* Midtrans Status */}
        {!snapLoaded && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <BiTimer className="text-yellow-500 text-lg" />
              <span>Memuat metode pembayaran... Silakan tunggu.</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCancelOrder}
            disabled={processingPayment}
            className="flex-1 py-4 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BiX className="text-xl" />
            <span>Batalkan Pesanan</span>
          </button>
          <button
            onClick={handlePayNow}
            disabled={!snapLoaded || processingPayment || timeLeft <= 0}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingPayment ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <BiCreditCard className="text-xl" />
                <span>Bayar Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Info tambahan */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Anda akan diarahkan ke halaman pembayaran Midtrans</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium text-center">Mempersiapkan pembayaran...</p>
            <p className="text-sm text-gray-500 mt-2 text-center">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentPage
