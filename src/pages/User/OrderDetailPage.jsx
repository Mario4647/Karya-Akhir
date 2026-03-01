import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiCheckCircle,
  BiXCircle,
  BiTime,
  BiError,
  BiArrowBack,
  BiCalendar,
  BiMovie,
  BiUser,
  BiMoney,
  BiPurchaseTag,
  BiDownload,
  BiPrinter,
  BiCopy,
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
  BiX
} from 'react-icons/bi'
import { QRCode } from 'react-qr-code'

// Array icon untuk background dekoratif
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiMovie, BiPurchaseTag
]

const OrderDetailPage = () => {
  const [order, setOrder] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('order_id', orderId)

      if (ticketsError) throw ticketsError
      setTickets(ticketsData || [])
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 border-2 border-green-200 shadow-[2px_2px_0px_0px_rgba(34,197,94,0.2)]">
          <BiCheckCircle /> Sukses
        </span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1 border-2 border-yellow-200 shadow-[2px_2px_0px_0px_rgba(234,179,8,0.2)]">
          <BiTime /> Menunggu
        </span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 border-2 border-red-200 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]">
          <BiXCircle /> Batal
        </span>
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1 border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
          <BiError /> Kadaluarsa
        </span>
      default:
        return null
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const generateQRCode = (text) => {
    return (
      <div className="relative inline-block">
        <QRCode
          value={text}
          size={100}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="w-full h-full grid grid-cols-8 gap-0.5">
            {[...Array(64)].map((_, i) => (
              <div key={i} className="bg-black"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = (ticketCode) => {
    const svg = document.querySelector(`.qr-${ticketCode.replace(/[^a-zA-Z0-9]/g, '')} svg`)
    if (svg) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const link = document.createElement('a')
        link.download = `ticket-${ticketCode}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      
      const svgData = new XMLSerializer().serializeToString(svg)
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }
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
            <p className="text-gray-700 font-medium">Memuat detail pesanan...</p>
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
              onClick={() => navigate('/my-orders')}
              className="px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] inline-flex items-center gap-2"
            >
              <BiArrowBack className="text-xl" />
              <span>Kembali ke Pesanan</span>
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/my-orders')}
            className="p-2 text-gray-600 hover:text-[#4a90e2] hover:bg-[#e6f0ff] rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
          >
            <BiArrowBack className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Detail Pesanan</h1>
          <div className="ml-auto">
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white border-b-2 border-indigo-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">No. Pesanan</p>
                <p className="font-mono font-bold">{order.order_number}</p>
              </div>
              <button
                onClick={() => handleCopy(order.order_number)}
                className="text-white hover:text-blue-100 flex items-center gap-1 px-3 py-1 bg-white/20 rounded border border-white/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                title="Salin nomor pesanan"
              >
                <BiCopy />
                {copied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiMovie className="text-[#4a90e2]" />
                Informasi Event
              </h3>
              <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <p className="font-medium text-gray-800 mb-2">{order.product_name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <BiCalendar className="text-[#4a90e2] mt-1" />
                    <span>{formatDate(order.products?.event_date)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <BiUser className="text-[#4a90e2] mt-1" />
                    <span>{order.products?.event_location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiMoney className="text-[#4a90e2]" />
                Ringkasan Pembayaran
              </h3>
              <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga Tiket</span>
                  <span className="text-gray-800">{formatRupiah(order.product_price)} x {order.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">{formatRupiah(order.subtotal)}</span>
                </div>
                {order.promo_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon Promo</span>
                    <span>- {formatRupiah(order.promo_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t-2 border-gray-200">
                  <span>Total Dibayar</span>
                  <span className="text-[#4a90e2]">{formatRupiah(order.total_amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiUser className="text-[#4a90e2]" />
                Data Pemesan
              </h3>
              <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Nama</p>
                    <p className="font-medium text-gray-800">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">NIK</p>
                    <p className="font-medium text-gray-800">{order.customer_nik}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{order.customer_email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Alamat</p>
                    <p className="font-medium text-gray-800">{order.customer_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {order.status === 'paid' && tickets.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BiPurchaseTag className="text-[#4a90e2]" />
                  Tiket ({tickets.length})
                </h3>
                <div className="space-y-4">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className={`qr-${ticket.ticket_code.replace(/[^a-zA-Z0-9]/g, '')} bg-white border-2 border-blue-200 rounded p-4 shadow-[6px_6px_0px_0px_rgba(74,144,226,0.2)]`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Tiket #{index + 1}</p>
                          <p className="font-mono font-bold text-[#4a90e2] mb-2">{ticket.ticket_code}</p>
                          <p className="text-sm text-gray-600">Tipe: {ticket.ticket_type || 'Reguler'}</p>
                          <p className="text-sm text-gray-600">Harga: {formatRupiah(ticket.price)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          {generateQRCode(ticket.ticket_code)}
                          <button
                            onClick={() => handleDownloadQR(ticket.ticket_code)}
                            className="mt-2 text-xs bg-[#e6f0ff] text-[#4a90e2] hover:bg-[#d4e4ff] px-3 py-1 rounded-full border border-blue-200 shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-1 font-medium"
                          >
                            <BiDownload />
                            Download QR
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {order.status === 'pending' && (
            <div className="flex-1 relative overflow-hidden rounded border-2 border-[#357abd] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 pointer-events-none">
                {buttonIconPositions.slice(0, 10).map((pos, i) => {
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
                      <IconComponent size={18} />
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => navigate(`/payment/${order.id}`)}
                className="relative z-10 w-full py-3 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] transition-colors"
              >
                Lanjutkan Pembayaran
              </button>
            </div>
          )}
          {order.status === 'paid' && (
            <>
              <div className="flex-1 relative overflow-hidden rounded border-2 border-blue-600 shadow-[6px_6px_0px_0px_rgba(74,144,226,0.25)]">
                <div className="absolute inset-0 pointer-events-none">
                  {buttonIconPositions.slice(10, 15).map((pos, i) => {
                    const IconComponent = pos.icon
                    return (
                      <div
                        key={i}
                        className="absolute text-blue-600/30"
                        style={{
                          top: pos.top,
                          left: pos.left,
                          transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                          opacity: pos.opacity * 0.8,
                          zIndex: 1
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => window.print()}
                  className="relative z-10 w-full py-3 bg-white text-blue-600 rounded font-bold border-2 border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <BiPrinter />
                  Cetak Tiket
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden rounded border-2 border-green-600 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.25)]">
                <div className="absolute inset-0 pointer-events-none">
                  {buttonIconPositions.slice(15, 20).map((pos, i) => {
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
                        <IconComponent size={18} />
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => navigate(`/payment-success/${order.id}`)}
                  className="relative z-10 w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <BiPurchaseTag />
                  Lihat E-Ticket
                </button>
              </div>
            </>
          )}
          <div className="flex-1 relative overflow-hidden rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(0, 5).map((pos, i) => {
                const IconComponent = pos.icon
                return (
                  <div
                    key={i}
                    className="absolute text-gray-400/30"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                      opacity: pos.opacity * 0.8,
                      zIndex: 1
                    }}
                  >
                    <IconComponent size={16} />
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/my-orders')}
              className="relative z-10 w-full py-3 bg-white text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage
