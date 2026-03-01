import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiCheckCircle,
  BiDownload,
  BiPrinter,
  BiMovie,
  BiCalendar,
  BiMap,
  BiUser,
  BiCopy,
  BiArrowBack,
  BiPurchaseTag,
  BiHome,
  BiIdCard,
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
import QRCode from 'react-qr-code'

// Array icon untuk background dekoratif
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiMovie, BiPurchaseTag
]

const PaymentSuccessPage = () => {
  const [order, setOrder] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
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
    fetchOrderAndTickets()
  }, [orderId])

  const fetchOrderAndTickets = async () => {
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
      setQrLoaded(true)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadQR = (ticketCode) => {
    const container = document.getElementById(`qr-${ticketCode.replace(/[^a-zA-Z0-9]/g, '')}`)
    if (container) {
      const svg = container.querySelector('svg')
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
  }

  const handleDownloadAllTickets = () => {
    tickets.forEach((ticket, index) => {
      setTimeout(() => {
        handleDownloadQR(ticket.ticket_code)
      }, index * 500)
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
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

  const generateQRCode = (text, code) => {
    const safeId = `qr-${text.replace(/[^a-zA-Z0-9]/g, '')}`
    
    return (
      <div id={safeId} className="flex flex-col items-center">
        <div className="bg-white p-2 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
          <QRCode
            value={text}
            size={80}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs font-mono font-bold text-[#4a90e2] bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)]">
            {code}
          </span>
        </div>
      </div>
    )
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
            <BiCheckCircle className="text-6xl text-yellow-500 mx-auto mb-4" />
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full border-2 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)] flex items-center justify-center mx-auto mb-4">
            <BiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Terima kasih telah melakukan pembayaran. Tiket Anda telah dikonfirmasi dan siap digunakan.
          </p>
          <div className="mt-4 inline-flex items-center bg-blue-50 px-4 py-2 rounded-full border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
            <span className="text-sm text-blue-700">No. Pesanan: </span>
            <span className="font-mono font-bold text-blue-800 ml-2">{order.order_number}</span>
            <button
              onClick={() => handleCopy(order.order_number)}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Salin nomor pesanan"
            >
              <BiCopy className="text-lg" />
            </button>
          </div>
        </div>

        {/* Data Pemesan Card */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BiUser className="text-[#4a90e2]" />
            Data Pemesan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiUser className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Nama Lengkap</p>
                  <p className="font-medium text-gray-800">{order.customer_name}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiIdCard className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">NIK</p>
                  <p className="font-medium text-gray-800">{order.customer_nik}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiUser className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{order.customer_email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:col-span-2">
              <div className="flex items-start gap-3">
                <BiHome className="text-[#4a90e2] text-xl mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Alamat</p>
                  <p className="font-medium text-gray-800">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </div>

          {order.additional_buyers && order.additional_buyers.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pembeli Lainnya:</p>
              <div className="space-y-3">
                {order.additional_buyers.map((buyer, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
                    <p className="text-sm font-medium text-gray-800">Pembeli {index + 2}</p>
                    <p className="text-xs text-gray-600 mt-1">Nama: {buyer.name}</p>
                    <p className="text-xs text-gray-600">NIK: {buyer.nik}</p>
                    <p className="text-xs text-gray-600">Alamat: {buyer.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invoice Code Display */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Kode Invoice</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold text-[#4a90e2]">{order.invoice_code}</span>
            <button
              onClick={() => handleCopy(order.invoice_code)}
              className="text-gray-400 hover:text-[#4a90e2] transition-colors"
              title="Salin kode invoice"
            >
              <BiCopy className="text-lg" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1">Kode berhasil disalin!</p>
          )}
        </div>

        {/* Multiple Tickets with QR Codes */}
        <div className="space-y-4 mb-6">
          {tickets.map((ticket, index) => (
            <div key={ticket.id} className="bg-white rounded border-2 border-blue-200 shadow-[8px_8px_0px_0px_rgba(74,144,226,0.2)] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white border-b-2 border-indigo-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">E-TICKET #{index + 1}</p>
                    <h3 className="text-xl font-bold mt-1">{order.product_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">TIPE TIKET</p>
                    <p className="font-bold">{ticket.ticket_type || 'Reguler'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:w-32">
                    {generateQRCode(ticket.ticket_code, ticket.ticket_code)}
                    <button
                      onClick={() => handleDownloadQR(ticket.ticket_code)}
                      className="mt-2 text-xs bg-blue-50 text-[#4a90e2] hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-1 font-medium"
                    >
                      <BiDownload size={14} />
                      <span>Download QR</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        <p className="text-xs text-gray-500">Nama Pemilik</p>
                        <p className="font-medium text-gray-800 text-sm">
                          {index === 0 ? order.customer_name : order.additional_buyers?.[index-1]?.name}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        <p className="text-xs text-gray-500">Harga Tiket</p>
                        <p className="font-medium text-[#4a90e2] text-sm">{formatRupiah(ticket.price)}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                      <p className="text-xs text-gray-500 mb-2">Detail Event</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BiCalendar className="text-[#4a90e2]" />
                          <span className="text-gray-700">
                            {order.products?.event_date ? formatDate(order.products.event_date) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BiMap className="text-[#4a90e2]" />
                          <span className="text-gray-700">{order.products?.event_location || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({order.quantity} tiket)</span>
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
              <span className="text-[#4a90e2] text-xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <div className="relative overflow-hidden rounded border-2 border-blue-600 shadow-[6px_6px_0px_0px_rgba(74,144,226,0.25)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(0, 7).map((pos, i) => {
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
              onClick={handlePrint}
              className="relative z-10 px-6 py-3 bg-white text-blue-600 rounded font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <BiPrinter className="text-xl" />
              <span>Cetak Semua Tiket</span>
            </button>
          </div>

          <div className="relative overflow-hidden rounded border-2 border-green-600 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.25)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(7, 14).map((pos, i) => {
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
              onClick={handleDownloadAllTickets}
              className="relative z-10 px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <BiDownload className="text-xl" />
              <span>Download Semua QR</span>
            </button>
          </div>

          <div className="relative overflow-hidden rounded border-2 border-[#4a90e2] shadow-[6px_6px_0px_0px_rgba(74,144,226,0.25)]">
            <div className="absolute inset-0 pointer-events-none">
              {buttonIconPositions.slice(14, 20).map((pos, i) => {
                const IconComponent = pos.icon
                return (
                  <div
                    key={i}
                    className="absolute text-[#4a90e2]/30"
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
              className="relative z-10 px-6 py-3 bg-white text-[#4a90e2] rounded font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 border-2 border-[#4a90e2]"
            >
              <BiPurchaseTag className="text-xl" />
              <span>Lihat Semua Pesanan</span>
            </button>
          </div>
        </div>

        {/* Email Info */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p className="flex items-center justify-center gap-1 bg-blue-50 p-3 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
            <BiCheckCircle className="text-green-500" />
            <span>Konfirmasi pembayaran telah dikirim ke email: </span>
            <span className="font-medium text-gray-700">{order.customer_email}</span>
          </p>
        </div>
      </div>

      {/* Test QR Code */}
      <div style={{ display: 'none' }}>
        <QRCode value="test" size={10} />
      </div>
    </div>
  )
}

export default PaymentSuccessPage
