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
  BiTicket
} from 'react-icons/bi'
import { QRCode } from 'react-qr-code'

const PaymentSuccessPage = () => {
  const [order, setOrder] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrderAndTickets()
  }, [orderId])

  const fetchOrderAndTickets = async () => {
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
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvoice = () => {
    if (order?.invoice_code) {
      navigator.clipboard.writeText(order.invoice_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
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

  const generateQRCode = (text, index) => {
    return (
      <div className={`qr-${text.replace(/[^a-zA-Z0-9]/g, '')} relative inline-block`}>
        <QRCode
          value={text}
          size={120}
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
            <BiCheckCircle className="text-6xl text-yellow-500 mx-auto mb-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Terima kasih telah melakukan pembayaran. Tiket Anda telah dikonfirmasi dan siap digunakan.
          </p>
          <div className="mt-4 inline-flex items-center bg-blue-50 px-4 py-2 rounded-full">
            <span className="text-sm text-blue-700">No. Pesanan: </span>
            <span className="font-mono font-bold text-blue-800 ml-2">{order.order_number}</span>
            <button
              onClick={() => navigator.clipboard.writeText(order.order_number)}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Salin nomor pesanan"
            >
              <BiCopy className="text-lg" />
            </button>
          </div>
        </div>

        {/* Multiple Tickets */}
        <div className="space-y-4 mb-6">
          {tickets.map((ticket, index) => (
            <div key={ticket.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">E-TICKET #{index + 1}</p>
                    <h3 className="text-xl font-bold mt-1">{order.product_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">KODE TIKET</p>
                    <p className="font-mono text-sm">{ticket.ticket_code}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center md:w-48">
                    {generateQRCode(ticket.ticket_code, index)}
                    <p className="text-xs text-gray-500 mt-2">Scan untuk verifikasi</p>
                    <button
                      onClick={() => handleDownloadQR(ticket.ticket_code)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <BiDownload />
                      Download QR
                    </button>
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Nama Pemilik</p>
                        <p className="font-medium text-gray-800">
                          {index === 0 ? order.customer_name : order.additional_buyers?.[index-1]?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tipe Tiket</p>
                        <p className="font-medium text-gray-800">{ticket.ticket_type || 'Reguler'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Detail Event</p>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BiCalendar className="text-blue-500" />
                          <span>{formatDate(order.products?.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BiMap className="text-blue-500" />
                          <span>{order.products?.event_location}</span>
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
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Pesanan</h2>
          <div className="space-y-2">
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
              <span className="text-blue-600 text-xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg shadow-blue-500/30"
          >
            <BiPrinter className="text-xl" />
            <span>Cetak Semua Tiket</span>
          </button>
          <button
            onClick={handleDownloadAllTickets}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg shadow-green-500/30"
          >
            <BiDownload className="text-xl" />
            <span>Download Semua QR</span>
          </button>
          <button
            onClick={() => navigate('/my-orders')}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <BiTicket className="text-xl" />
            <span>Lihat Semua Pesanan</span>
          </button>
        </div>

        {/* Email Info */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p className="flex items-center justify-center gap-1">
            <BiCheckCircle className="text-green-500" />
            <span>Konfirmasi pembayaran telah dikirim ke email: </span>
            <span className="font-medium text-gray-700">{order.customer_email}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccesPage
