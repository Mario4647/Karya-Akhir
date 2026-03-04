import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import { withAuth } from '../../authMiddleware'
import { sendEmail, formatEmailData } from '../../utils/emailService'
import { globalRateLimiter, debounce } from '../../utils/security'
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
  BiVolumeFull,
  BiEnvelope,
  BiMailSend
} from 'react-icons/bi'

const MIDTRANS_CLIENT_KEY = 'Mid-client-PKxh7PoyLs2QwsBh'

const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiCreditCard, BiWallet, BiCode,
  BiEnvelope, BiMailSend
]

const PaymentPage = ({ user }) => {
  const [order, setOrder] = useState(null)
  const [products, setProducts] = useState(null)
  const [tickets, setTickets] = useState([])
  const [promoApplied, setPromoApplied] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')
  const [snapLoaded, setSnapLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [snapToken, setSnapToken] = useState(null)
  const [apiStatus, setApiStatus] = useState('Memeriksa koneksi...')
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [orderHistory, setOrderHistory] = useState([])
  const [updating, setUpdating] = useState(false)
  const { orderId } = useParams()
  const navigate = useNavigate()

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
    if (order && order.payment_expiry && order.status === 'pending') {
      const expiryTime = new Date(order.payment_expiry).getTime()
      const now = new Date().getTime()
      const initialTimeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000))
      setTimeLeft(initialTimeLeft)

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleExpireOrder()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [order])

  const handleExpireOrder = async () => {
    if (!order || order.status !== 'pending' || updating) return
    
    setUpdating(true)
    try {
      console.log('⏰ Order expired, updating status...')
      
      const { data, error } = await supabase
        .rpc('update_order_status_rls', {
          p_order_id: order.id,
          p_new_status: 'expired'
        })

      if (error) throw error
      
      if (data?.success) {
        console.log('✅ Order expired successfully')
        await fetchOrder()
      } else {
        throw new Error(data?.message || 'Gagal mengupdate status')
      }
      
    } catch (error) {
      console.error('Error expiring order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const sendPaymentEmail = async (orderData, productsData, ticketsData) => {
    try {
      if (emailSent) return

      setEmailLoading(true)
      setEmailError('')

      if (!orderData?.customer_email) {
        throw new Error('Email penerima tidak valid')
      }

      const emailData = formatEmailData(orderData, productsData, ticketsData)
      
      console.log('📧 Sending email to:', emailData.email)
      
      const result = await sendEmail('paymentPending', emailData)
      
      if (result.success) {
        console.log('✅ Email sent successfully')
        setEmailSent(true)
        
        await supabase
          .from('orders')
          .update({ 
            email_notification_sent: true,
            email_sent_at: new Date().toISOString()
          })
          .eq('id', orderData.id)
          .eq('user_id', user.id)
      } else {
        console.error('❌ Failed to send email:', result.error)
        setEmailError(result.error)
      }
    } catch (error) {
      console.error('❌ Error in sendPaymentEmail:', error)
      setEmailError(error.message)
    } finally {
      setEmailLoading(false)
    }
  }

  const checkApiHealth = async () => {
    try {
      setApiStatus('Memeriksa koneksi...')
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (data.status === 'OK') {
        setApiStatus('Server terhubung ✓')
      } else {
        setApiStatus('Server error')
      }
    } catch (error) {
      setApiStatus('Server tidak merespons ✗')
    }
  }

  const loadMidtransScript = () => {
    if (document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]')) {
      setSnapLoaded(true)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY)
    
    script.onload = () => {
      console.log('✅ Midtrans script loaded')
      setSnapLoaded(true)
    }
    
    script.onerror = () => {
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
          order_buyers (*),
          promo_codes!left(*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        console.log('Order not found, redirecting...')
        navigate('/concerts')
        return
      }
      
      console.log('✅ Order fetched:', data)
      setOrder(data)
      setProducts(data.products)
      
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .eq('order_id', data.id)
      
      setTickets(ticketsData || [])
      
      const { data: historyData } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', data.id)
        .order('created_at', { ascending: false })
      
      setOrderHistory(historyData || [])
      
      if (data.promo_code_id) {
        setPromoApplied(data.promo_codes)
      }
      
      if (!data.email_notification_sent && data.status === 'pending') {
        await sendPaymentEmail(data, data.products, ticketsData)
      }
    } catch (error) {
      console.error('❌ Error fetching order:', error)
      setError('Gagal memuat data pesanan: ' + error.message)
    } finally {
      setLoading(false)
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
    if (!order || order.status !== 'pending') return

    if (!globalRateLimiter.check(user.id, 'cancel').allowed) {
      setError('Terlalu banyak percobaan. Silakan tunggu.')
      return
    }

    if (!window.confirm('Yakin ingin membatalkan pesanan?')) {
      return
    }

    setUpdating(true)
    setError('')

    try {
      console.log('🔄 Cancelling order:', order.id)
      
      const { data, error } = await supabase
        .rpc('update_order_status_rls', {
          p_order_id: order.id,
          p_new_status: 'cancelled'
        })

      if (error) throw error
      
      if (data?.success) {
        console.log('✅ Order cancelled successfully')
        await fetchOrder()
        
        setTimeout(() => {
          navigate('/concerts')
        }, 2000)
      } else {
        throw new Error(data?.message || 'Gagal membatalkan pesanan')
      }
      
    } catch (error) {
      console.error('❌ Error cancelling order:', error)
      setError('Gagal membatalkan pesanan: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createTransaction = async () => {
    if (!globalRateLimiter.check(user.id, 'payment').allowed) {
      throw new Error('Terlalu banyak percobaan. Silakan tunggu.')
    }

    try {
      const payload = {
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerAddress: order.customer_address,
        productName: order.product_name,
        productPrice: order.product_price,
        quantity: order.quantity,
        promoCode: order.promo_code_id ? {
          id: order.promo_code_id,
          code: order.promo_codes?.code,
          discount: order.promo_discount
        } : null
      }

      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi')
      }

      return data
    } catch (error) {
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

    if (!order || order.status !== 'pending') {
      setError('Pesanan tidak dapat diproses')
      return
    }

    setProcessingPayment(true)
    setError('')

    try {
      const transaction = await createTransaction()
      
      if (transaction && transaction.token) {
        setSnapToken(transaction.token)

        await supabase
          .from('orders')
          .update({ 
            midtrans_transaction_id: transaction.transaction_id,
            midtrans_token: transaction.token,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .eq('user_id', user.id)

        window.snap.pay(transaction.token, {
          onSuccess: async (result) => {
            console.log('💰 Payment success callback received')
            await handlePaymentSuccess(result)
          },
          onPending: (result) => {
            console.log('⏳ Payment pending:', result)
            setProcessingPayment(false)
          },
          onError: (result) => {
            console.error('❌ Payment error:', result)
            setError('Pembayaran gagal: ' + (result.status_message || 'Silakan coba lagi'))
            setProcessingPayment(false)
          },
          onClose: () => {
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
      console.log('💰 Processing payment success for order:', order.id)
      console.log('💰 Payment result:', result)
      
      setUpdating(true)
      
      // Gunakan RPC function untuk update status (handle RLS automatically)
      const { data, error } = await supabase
        .rpc('update_order_status_rls', {
          p_order_id: order.id,
          p_new_status: 'paid'
        })

      if (error) throw error
      
      if (!data?.success) {
        throw new Error(data?.message || 'Gagal mengupdate status')
      }

      console.log('✅ Order status updated to paid via RPC')

      // Kirim email sukses
      try {
        const emailData = formatEmailData(order, products, tickets)
        await sendEmail('paymentSuccess', emailData)
      } catch (emailError) {
        console.error('❌ Error sending success email:', emailError)
      }

      navigate(`/payment-success/${order.id}`)

    } catch (error) {
      console.error('❌ Error in payment success handler:', error)
      
      // Fallback: coba update langsung
      try {
        console.log('⚠️ Trying direct update as fallback...')
        
        const { error: directError } = await supabase
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
          .eq('user_id', user.id)

        if (directError) throw directError
        
        console.log('✅ Order status updated via direct update')
        navigate(`/payment-success/${order.id}`)
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        alert('Pembayaran berhasil tetapi gagal memperbarui status. Silakan hubungi admin.\n\nOrder ID: ' + order.id + '\nError: ' + fallbackError.message)
      }
    } finally {
      setUpdating(false)
      setProcessingPayment(false)
    }
  }

  const handleRefreshOrder = debounce(() => {
    fetchOrder()
  }, 2000)

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
          {iconPositions.map((pos, i) => (
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
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
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
          {iconPositions.map((pos, i) => (
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
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 text-center max-w-md mx-auto">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">Maaf, kami tidak dapat menemukan data pesanan Anda.</p>
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
          {iconPositions.map((pos, i) => (
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
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 text-center max-w-md mx-auto">
            {order.status === 'paid' ? (
              <>
                <BiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Sudah Dibayar</h2>
                <p className="text-gray-600 mb-6">Pesanan Anda sudah dalam status LUNAS.</p>
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
                <p className="text-gray-600 mb-6">Pesanan Anda telah dibatalkan.</p>
              </>
            ) : (
              <>
                <BiTimer className="text-6xl text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Kadaluarsa</h2>
                <p className="text-gray-600 mb-6">Waktu pembayaran telah habis.</p>
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
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((pos, i) => (
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
            {React.createElement(pos.icon, { size: 28 })}
          </div>
        ))}
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

        {/* Email Status */}
        {emailLoading && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#4a90e2] border-t-transparent"></div>
            <p className="text-sm text-blue-700 font-medium">Mengirim notifikasi...</p>
          </div>
        )}

        {emailSent && !emailLoading && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)] flex items-center gap-2">
            <BiCheckCircle className="text-green-500 text-lg" />
            <p className="text-sm text-green-700 font-medium">Notifikasi telah dikirim ke {order.customer_email}</p>
          </div>
        )}

        {/* Timer */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-red-500"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded border-2 border-gray-200 ${timeLeft < 300 ? 'bg-red-100' : 'bg-blue-100'}`}>
                <BiTimer className={`text-2xl ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Waktu</p>
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
                className="text-[#4a90e2] hover:text-[#357abd] text-sm flex items-center gap-1 mt-1"
                disabled={updating}
              >
                <BiRefresh className="text-lg" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Pesanan</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
              <span className="text-gray-600">No. Pesanan</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                  {order.order_number}
                </span>
                <button
                  onClick={() => copyToClipboard(order.order_number)}
                  className="text-gray-400 hover:text-[#4a90e2]"
                >
                  <BiCopy className="text-lg" />
                </button>
                {copied && <span className="text-xs text-green-500">Tersalin!</span>}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
              <p className="font-semibold text-gray-700 mb-2">Detail Produk</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produk</span>
                  <span className="font-medium text-gray-800">{order.product_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga</span>
                  <span className="font-medium text-gray-800">{formatRupiah(order.product_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jumlah</span>
                  <span className="font-medium text-gray-800">{order.quantity} tiket</span>
                </div>
              </div>
            </div>

            {order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 bg-green-50 p-3 rounded border-2 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]">
                <span>Diskon Promo</span>
                <span>- {formatRupiah(order.promo_discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-gray-200">
              <span>Total</span>
              <span className="text-[#4a90e2] text-2xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Data */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Data Pemesan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{order.customer_email}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <p className="text-xs text-gray-500">Nama</p>
              <p className="font-medium text-gray-800">{order.customer_name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] md:col-span-2">
              <p className="text-xs text-gray-500">Alamat</p>
              <p className="font-medium text-gray-800">{order.customer_address}</p>
            </div>
          </div>
        </div>

        {/* Additional Buyers */}
        {order.additional_buyers && order.additional_buyers.length > 0 && (
          <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pembeli Lainnya</h2>
            <div className="space-y-3">
              {order.additional_buyers.map((buyer, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pembeli {index + 2}</p>
                  <p className="text-xs text-gray-600">Nama: {buyer.name}</p>
                  <p className="text-xs text-gray-600">NIK: {buyer.nik}</p>
                  <p className="text-xs text-gray-600">Alamat: {buyer.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Midtrans Status */}
        {!snapLoaded && (
          <div className="mb-6 p-4 bg-yellow-50 rounded border-2 border-yellow-200 shadow-[4px_4px_0px_0px_rgba(234,179,8,0.2)]">
            <p className="text-sm text-yellow-700">Memuat metode pembayaran...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded border-2 border-red-200 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative overflow-hidden rounded border-2 border-red-200 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.25)]">
            <button
              onClick={handleCancelOrder}
              disabled={updating || processingPayment || order.status !== 'pending'}
              className="w-full py-4 bg-white text-red-600 rounded font-bold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <BiX className="text-xl" />
                  <span>Batalkan</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden rounded border-2 border-[#357abd] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <button
              onClick={handlePayNow}
              disabled={!snapLoaded || processingPayment || updating || order.status !== 'pending'}
              className="w-full py-4 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <BiCreditCard className="text-xl" />
                  <span>Bayar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-2">
          <BiEnvelope className="text-[#4a90e2] text-lg" />
          <p className="text-sm text-[#4a90e2]">
            Notifikasi akan dikirim ke: <span className="font-bold">{order.customer_email}</span>
          </p>
          {!emailSent && !emailLoading && (
            <button
              onClick={() => sendPaymentEmail(order, products, tickets)}
              className="ml-auto text-xs bg-white px-3 py-1 rounded border border-[#4a90e2] text-[#4a90e2] hover:bg-blue-50"
            >
              Kirim Ulang
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuth(PaymentPage)
