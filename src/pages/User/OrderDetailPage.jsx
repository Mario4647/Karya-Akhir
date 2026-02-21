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
  BiTicket,
  BiDownload,
  BiPrinter,
  BiCopy
} from 'react-icons/bi'
import { QRCode } from 'react-qr-code'

const OrderDetailPage = () => {
  const [order, setOrder] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      // Fetch order
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

      // Fetch tickets for this order
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
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiCheckCircle /> Sukses
        </span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiTime /> Menunggu
        </span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiXCircle /> Batal
        </span>
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
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
        {/* Efek garis-garis */}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat detail pesanan...</p>
          </div>
        </div>
      </div>
    )
  }

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
              onClick={() => navigate('/my-orders')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/my-orders')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <BiArrowBack className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Detail Pesanan</h1>
          <div className="ml-auto">
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">No. Pesanan</p>
                <p className="font-mono font-bold">{order.order_number}</p>
              </div>
              <button
                onClick={() => handleCopy(order.order_number)}
                className="text-white hover:text-blue-100 flex items-center gap-1"
                title="Salin nomor pesanan"
              >
                <BiCopy />
                {copied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiMovie className="text-blue-500" />
                Informasi Event
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="font-medium text-gray-800 mb-2">{order.product_name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <BiCalendar className="text-blue-500 mt-1" />
                    <span>{formatDate(order.products?.event_date)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <BiUser className="text-blue-500 mt-1" />
                    <span>{order.products?.event_location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiMoney className="text-blue-500" />
                Ringkasan Pembayaran
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
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
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                  <span>Total Dibayar</span>
                  <span className="text-blue-600">{formatRupiah(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Customer Data */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiUser className="text-blue-500" />
                Data Pemesan
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl">
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

            {/* Tickets - Only for paid orders */}
            {order.status === 'paid' && tickets.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BiTicket className="text-blue-500" />
                  Tiket ({tickets.length})
                </h3>
                <div className="space-y-4">
                  {tickets.map((ticket, index) => (
                    <div key={ticket.id} className={`qr-${ticket.ticket_code.replace(/[^a-zA-Z0-9]/g, '')} bg-white border-2 border-blue-100 rounded-xl p-4`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Tiket #{index + 1}</p>
                          <p className="font-mono font-bold text-blue-600 mb-2">{ticket.ticket_code}</p>
                          <p className="text-sm text-gray-600">Tipe: {ticket.ticket_type || 'Reguler'}</p>
                          <p className="text-sm text-gray-600">Harga: {formatRupiah(ticket.price)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          {generateQRCode(ticket.ticket_code)}
                          <button
                            onClick={() => handleDownloadQR(ticket.ticket_code)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
            <button
              onClick={() => navigate(`/payment/${order.id}`)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Lanjutkan Pembayaran
            </button>
          )}
          {order.status === 'paid' && (
            <>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <BiPrinter />
                Cetak Tiket
              </button>
              <button
                onClick={() => navigate(`/payment-success/${order.id}`)}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <BiTicket />
                Lihat E-Ticket
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/my-orders')}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage
