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
  BiWallet,
  BiCode,
  BiCheckCircle,
  BiXCircle,
  BiCopy,
  BiRefresh,
  BiInfoCircle,
  BiMusic,
  BiMicrophone,
  BiCamera,
  BiVideo,
  BiStar,
  BiHeart,
  BiDiamond,
  BiCrown,
  BiRocket,
  BiPalette,
  BiBrush,
  BiPaint,
  BiBook,
  BiMessage,
  BiVolumeFull
} from 'react-icons/bi'

// Konfigurasi Midtrans
const MIDTRANS_CLIENT_KEY = 'Mid-client-PKxh7PoyLs2QwsBh'

// Array icon untuk background dekoratif
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiCreditCard, BiWallet, BiCode
]

const PaymentPage = () => {
  const [order, setOrder] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')
  const [snapLoaded, setSnapLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [snapToken, setSnapToken] = useState(null)
  const [apiStatus, setApiStatus] = useState('Memeriksa koneksi...')
  const { orderId } = useParams()
  const navigate = useNavigate()

  // Generate icon positions untuk background
  const [iconPositions] = useState(() => {
    const positions = []
    for (let i = 0; i < 30; i++) {
      positions.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.08 + Math.random() * 0.1,
        icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
      })
    }
    return positions
  })

  // Generate icon untuk tombol
  const [buttonIconPositions] = useState(() => {
    const positions = []
    for (let i = 0; i < 20; i++) {
      positions.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.4 + Math.random() * 0.6,
        opacity: 0.25 + Math.random() * 0.25,
        icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
      })
    }
    return positions
  })

  useEffect(() => {
    fetchOrder()
    loadMidtransScript()
    checkApiHealth()
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

  const checkApiHealth = async () => {
    try {
      setApiStatus('Memeriksa koneksi...')
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (data.status === 'OK') {
        setApiStatus('Server terhubung ✓')
        console.log('✅ Health check passed:', data)
      } else {
        setApiStatus('Server error')
      }
    } catch (error) {
      console.error('❌ Health check failed:', error)
      setApiStatus('Server tidak merespons ✗')
    }
  }

  const loadMidtransScript = () => {
    if (document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]')) {
      console.log('✅ Midtrans script already loaded')
      setSnapLoaded(true)
      return
    }
    
    console.log('📥 Loading Midtrans script...')
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY)
    
    script.onload = () => {
      console.log('✅ Midtrans script loaded successfully')
      setSnapLoaded(true)
    }
    
    script.onerror = (err) => {
      console.error('❌ Failed to load Midtrans script:', err)
      setError('Gagal memuat metode pembayaran. Silakan refresh halaman.')
    }
    
    document.body.appendChild(script)
  }

  const fetchOrder = async () => {
    setLoading(true)
    try {
      console.log('📦 Fetching order:', orderId)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (*),
          order_buyers (*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      console.log('✅ Order fetched:', data)
      setOrder(data)
    } catch (error) {
      console.error('❌ Error fetching order:', error)
      setError('Gagal memuat data pesanan: ' + error.message)
    } finally {
      setLoading(false)
    }
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
        console.error('❌ Error cancelling order:', error)
        alert('Gagal membatalkan pesanan')
      }
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createTransaction = async () => {
    try {
      console.log('🔄 Creating transaction for order:', order.order_number)
      
      const payload = {
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerAddress: order.customer_address,
        productName: order.product_name,
        productPrice: order.product_price,
        quantity: order.quantity
      }

      console.log('📦 Payload being sent:', payload)

      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('📥 Response from server:', data)

      if (!response.ok) {
        let errorMessage = data.error || 'Gagal membuat transaksi'
        if (data.missingFields) {
          errorMessage += ` (Field yang kurang: ${data.missingFields.join(', ')})`
        }
        throw new Error(errorMessage)
      }

      console.log('✅ Transaction response:', data)
      return data
    } catch (error) {
      console.error('❌ Error creating transaction:', error)
      throw error
    }
  }

  const handlePayNow = async () => {
    if (!snapLoaded) {
      setError('Metode pembayaran belum siap. Silakan tunggu...')
      return
    }

    if (!window.snap) {
      setError('Snap Midtrans tidak tersedia. Silakan refresh halaman.')
      return
    }

    setProcessingPayment(true)
    setError('')

    try {
      const transaction = await createTransaction()
      
      if (transaction && transaction.token) {
        console.log('🎫 Transaction token received:', transaction.token)
        setSnapToken(transaction.token)

        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            midtrans_transaction_id: transaction.transaction_id,
            midtrans_token: transaction.token,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (updateError) {
          console.error('❌ Error saving token to database:', updateError)
        }

        window.snap.pay(transaction.token, {
          onSuccess: function(result) {
            console.log('💰 Payment success:', result)
            handlePaymentSuccess(result)
          },
          onPending: function(result) {
            console.log('⏳ Payment pending:', result)
            supabase
              .from('orders')
              .update({ 
                midtrans_transaction_status: 'pending',
                payment_details: result,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id)
            alert('Pembayaran sedang diproses. Silakan cek status secara berkala.')
            setProcessingPayment(false)
          },
          onError: function(result) {
            console.error('❌ Payment error:', result)
            setError('Pembayaran gagal: ' + (result.status_message || 'Silakan coba lagi'))
            setProcessingPayment(false)
          },
          onClose: function() {
            console.log('🔒 Payment popup closed')
            setProcessingPayment(false)
          }
        })
      } else {
        throw new Error('Gagal mendapatkan token pembayaran')
      }
    } catch (error) {
      console.error('❌ Error in payment process:', error)
      setError('Gagal memproses pembayaran: ' + error.message)
      setProcessingPayment(false)
    }
  }

  const handlePaymentSuccess = async (result) => {
    try {
      console.log('💰 Processing payment success:', result)
      
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

      console.log('✅ Order updated successfully, redirecting...')
      navigate(`/payment-success/${order.id}`)
    } catch (error) {
      console.error('❌ Error updating order:', error)
      alert('Pembayaran berhasil tetapi gagal memperbarui status. Hubungi admin.')
    }
  }

  const handleRefreshOrder = () => {
    fetchOrder()
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-600"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={28} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 flex items-center justify-center h-[80vh]">
          <div className="text-center bg-white/80 p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Memuat detail pembayaran...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-600"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={28} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 text-center max-w-md mx-auto">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">
              Maaf, kami tidak dapat menemukan data pesanan Anda.
            </p>
            <button
              onClick={() => navigate('/concerts')}
              className="px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] inline-flex items-center gap-2"
            >
              <BiArrowBack className="text-xl" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (order.status !== 'pending') {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-600"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={28} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 text-center max-w-md mx-auto">
            {order.status === 'paid' ? (
              <>
                <BiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Sudah Dibayar</h2>
                <p className="text-gray-600 mb-6">Pesanan Anda sudah dalam status LUNAS</p>
                <button
                  onClick={() => navigate(`/payment-success/${order.id}`)}
                  className="px-6 py-3 bg-green-600 text-white rounded border-2 border-green-700 hover:bg-green-700 transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]"
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
              className="mt-4 px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
      {/* Decorative Icons Background */}
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((pos, i) => {
          const IconComponent = pos.icon
          return (
            <div
              key={i}
              className="absolute text-gray-600"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              <IconComponent size={28} />
            </div>
          )
        })}
      </div>

      <NavbarEvent />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="mb-4 flex items-center justify-between bg-white rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-3">
          <div className="flex items-center gap-2">
            <BiInfoCircle className={`text-lg ${
              apiStatus.includes('terhubung') ? 'text-green-500' : 
              apiStatus.includes('tidak') ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <span className="text-sm text-gray-600">Status Koneksi:</span>
          </div>
          <span className={`text-sm font-medium ${
            apiStatus.includes('terhubung') ? 'text-green-600' : 
            apiStatus.includes('tidak') ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {apiStatus}
          </span>
        </div>

        {/* Timer */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-red-500"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded border-2 border-gray-200 ${timeLeft < 300 ? 'bg-red-100' : 'bg-blue-100'}`}>
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
                {order.payment_expiry ? formatDate(order.payment_expiry) : '-'}
              </p>
              <button 
                onClick={handleRefreshOrder}
                className="text-[#4a90e2] hover:text-[#357abd] text-sm flex items-center gap-1 mt-1 font-medium"
                title="Refresh status"
              >
                <BiRefresh className="text-lg" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#4a90e2] rounded-full"></span>
            Ringkasan Pesanan
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
              <span className="text-gray-600">Nomor Pesanan</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                  {order.order_number}
                </span>
                <button
                  onClick={() => copyToClipboard(order.order_number)}
                  className="text-gray-400 hover:text-[#4a90e2] transition-colors"
                  title="Salin nomor pesanan"
                >
                  <BiCopy className="text-lg" />
                </button>
                {copied && (
                  <span className="text-xs text-green-500">Tersalin!</span>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
              <p className="font-semibold text-gray-700 mb-2">Detail Produk</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produk:</span>
                  <span className="font-medium text-gray-800">{order.product_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga Satuan:</span>
                  <span className="font-medium text-gray-800">{formatRupiah(order.product_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium text-gray-800">{order.quantity} tiket</span>
                </div>
              </div>
            </div>

            {order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 bg-green-50 p-3 rounded border-2 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]">
                <span className="flex items-center gap-1">
                  <BiCheck className="text-lg" />
                  Diskon Promo
                </span>
                <span>- {formatRupiah(order.promo_discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-gray-200">
              <span>Total yang harus dibayar</span>
              <span className="text-[#4a90e2] text-2xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Data */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#4a90e2] rounded-full"></span>
            Data Pemesan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-800">{order.customer_email}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
              <p className="font-medium text-gray-800">{order.customer_name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Alamat</p>
              <p className="font-medium text-gray-800">{order.customer_address}</p>
            </div>
          </div>
        </div>

        {/* Additional Buyers */}
        {order.additional_buyers && order.additional_buyers.length > 0 && (
          <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#4a90e2] rounded-full"></span>
              Pembeli Lainnya
            </h2>
            
            <div className="space-y-3">
              {order.additional_buyers.map((buyer, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pembeli {index + 2}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="text-sm text-gray-800">{buyer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NIK</p>
                      <p className="text-sm text-gray-800">{buyer.nik}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="text-sm text-gray-800">{buyer.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-2">
          <BiCheckCircle className="text-[#4a90e2] text-lg" />
          <p className="text-sm text-[#4a90e2] font-medium">
            Konfirmasi pembayaran akan dikirim ke email: <span className="font-bold">{order.customer_email}</span>
          </p>
        </div>

        {/* Midtrans Status */}
        {!snapLoaded && (
          <div className="mb-6 p-4 bg-yellow-50 rounded border-2 border-yellow-200 shadow-[4px_4px_0px_0px_rgba(234,179,8,0.2)] flex items-center gap-2">
            <BiTimer className="text-yellow-500 text-lg" />
            <p className="text-sm text-yellow-700 font-medium">Memuat metode pembayaran... Silakan tunggu.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded border-2 border-red-200 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)] flex items-center gap-2">
            <BiError className="text-red-500 text-lg" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tombol Batalkan */}
          <div className="flex-1 relative overflow-hidden rounded border-2 border-red-200 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.25)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(0, 10).map((pos, i) => {
                const IconComponent = pos.icon
                return (
                  <div
                    key={i}
                    className="absolute text-red-500/30"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                      opacity: pos.opacity * 0.8,
                      zIndex: 1
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                )
              })}
            </div>
            <button
              onClick={handleCancelOrder}
              className="relative z-10 w-full py-4 bg-white text-red-600 rounded font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <BiX className="text-xl" />
              <span>Batalkan Pesanan</span>
            </button>
          </div>

          {/* Tombol Bayar Sekarang */}
          <div className="flex-1 relative overflow-hidden rounded border-2 border-[#357abd] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(10, 20).map((pos, i) => {
                const IconComponent = pos.icon
                return (
                  <div
                    key={i}
                    className="absolute text-white/40"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                      opacity: pos.opacity,
                      zIndex: 1
                    }}
                  >
                    <IconComponent size={22} />
                  </div>
                )
              })}
            </div>
            <button
              onClick={handlePayNow}
              disabled={!snapLoaded || processingPayment}
              className="relative z-10 w-full py-4 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>

        {/* Info tambahan */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Anda akan diarahkan ke halaman pembayaran Midtrans</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.25)] p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Mempersiapkan pembayaran...</p>
            <p className="text-sm text-gray-500 mt-2">Menghubungi server Midtrans</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentPage
