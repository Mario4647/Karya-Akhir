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
  BiArrowBack
} from 'react-icons/bi'
import { QRCode } from 'react-qr-code'

const PaymentSuccessPage = () => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { orderId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrder()
  }, [orderId])

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

  const handleDownloadQR = () => {
    const svg = document.querySelector('.qr-code-container svg')
    if (svg) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const link = document.createElement('a')
        link.download = `QR-${order?.invoice_code || 'ticket'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      
      const svgData = new XMLSerializer().serializeToString(svg)
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }
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
              onClick={() => navigate('/')}
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

      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 print:shadow-none">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90 mb-1">E-TICKET</p>
                <h2 className="text-2xl font-bold">{order.product_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">INVOICE</p>
                <p className="font-mono text-lg font-bold">{order.invoice_code}</p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side - QR Code */}
              <div className="flex flex-col items-center md:w-48">
                <div className="qr-code-container bg-white p-4 rounded-xl shadow-inner border-2 border-dashed border-blue-200">
                  <QRCode
                    value={order.invoice_code || order.order_number}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Scan kode ini untuk verifikasi tiket
                </p>
                <button
                  onClick={handleDownloadQR}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <BiDownload className="text-lg" />
                  <span>Download QR</span>
                </button>
              </div>

              {/* Right side - Ticket Info */}
              <div className="flex-1 space-y-4">
                {/* Event Details */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <BiMovie className="text-blue-500" />
                    Detail Event
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <BiCalendar className="text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Tanggal & Waktu</p>
                        <p className="text-sm text-gray-600">
                          {order.products?.event_date ? formatDate(order.products.event_date) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <BiMap className="text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Lokasi</p>
                        <p className="text-sm text-gray-600">{order.products?.event_location || '-'}</p>
                        {order.products?.location_description && (
                          <p className="text-xs text-gray-500 mt-1">{order.products.location_description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Nama Produk</p>
                    <p className="font-medium text-gray-800 text-sm">{order.product_name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Kode Invoice</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-bold text-blue-600">{order.invoice_code}</p>
                      <button
                        onClick={handleCopyInvoice}
                        className="text-gray-400 hover:text-blue-500"
                        title="Salin kode invoice"
                      >
                        <BiCopy className="text-lg" />
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-1">Tersalin!</p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Harga Satuan</p>
                    <p className="font-medium text-gray-800 text-sm">{formatRupiah(order.product_price)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Jumlah Tiket</p>
                    <p className="font-medium text-gray-800 text-sm">{order.quantity} tiket</p>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="border-t border-gray-200 pt-4">
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
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                      <span>Total Dibayar</span>
                      <span className="text-blue-600">{formatRupiah(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BiUser className="text-blue-500" />
                Data Pemesan
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                    <p className="font-medium text-gray-800">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NIK</p>
                    <p className="font-medium text-gray-800">{order.customer_nik}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-800">{order.customer_email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Alamat</p>
                    <p className="font-medium text-gray-800">{order.customer_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Buyers */}
            {order.order_buyers && order.order_buyers.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Pembeli Lainnya</h3>
                <div className="space-y-3">
                  {order.order_buyers.map((buyer, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl">
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

            {/* Payment Info */}
            {order.midtrans_transaction_id && (
              <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-200 pt-4">
                <p>Transaction ID: {order.midtrans_transaction_id}</p>
                <p>Payment Method: {order.midtrans_payment_type || order.payment_method}</p>
                <p>Payment Time: {formatDate(order.updated_at)}</p>
              </div>
            )}
          </div>

          {/* Ticket Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>© 2024 TicketConcert</span>
            <span>Tiket ini adalah bukti pembayaran yang sah</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg shadow-blue-500/30"
          >
            <BiPrinter className="text-xl" />
            <span>Cetak Tiket</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg shadow-green-500/30"
          >
            <BiDownload className="text-xl" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <BiMovie className="text-xl" />
            <span>Lihat Event Lainnya</span>
          </button>
        </div>

        {/* Email Info */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p className="flex items-center justify-center gap-1">
            <BiCheckCircle className="text-green-500" />
            <span>Konfirmasi pembayaran telah dikirim ke email Anda: </span>
            <span className="font-medium text-gray-700">{order.customer_email}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
