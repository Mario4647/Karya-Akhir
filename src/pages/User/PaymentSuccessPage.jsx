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
  BiUser
} from 'react-icons/bi'
import QRCode from 'qrcode.react'

const PaymentSuccessPage = () => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
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

  const generateQRCode = (text) => {
    return (
      <div className="relative">
        <QRCode
          value={text}
          size={150}
          bgColor="#ffffff"
          fgColor="#000000"
          level="L"
          includeMargin={false}
          renderAs="svg"
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `e-ticket-${order?.invoice_code}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-600">
            Terima kasih telah melakukan pembayaran. Tiket Anda telah dikonfirmasi.
          </p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">E-TICKET</p>
                <h2 className="text-2xl font-bold mt-1">{order.product_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">INVOICE</p>
                <p className="font-mono text-lg">{order.invoice_code}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side - QR Code */}
              <div className="flex flex-col items-center">
                {generateQRCode(order.invoice_code)}
                <p className="text-sm text-gray-500 mt-2">Scan untuk verifikasi</p>
              </div>

              {/* Right side - Ticket Info */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nama Produk</p>
                    <p className="font-medium text-gray-800">{order.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kode Produk</p>
                    <p className="font-mono text-sm text-gray-800">{order.invoice_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Harga</p>
                    <p className="font-medium text-gray-800">Rp {order.product_price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jumlah</p>
                    <p className="font-medium text-gray-800">{order.quantity} tiket</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Detail Event</p>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <BiCalendar className="text-blue-500 mt-1" />
                      <p className="text-sm text-gray-700">
                        {new Date(order.products?.event_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <BiMap className="text-blue-500 mt-1" />
                      <p className="text-sm text-gray-700">{order.products?.event_location}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Data Pemesan</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">{order.customer_name}</p>
                    <p className="text-sm text-gray-700">{order.customer_email}</p>
                    <p className="text-sm text-gray-700">{order.customer_address}</p>
                  </div>
                </div>

                {order.order_buyers && order.order_buyers.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Pembeli Lainnya</p>
                    <div className="space-y-2">
                      {order.order_buyers.map((buyer, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">Pembeli {index + 2}: {buyer.name}</p>
                          <p className="text-gray-600">NIK: {buyer.nik}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <BiPrinter className="text-xl" />
            <span>Cetak Tiket</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <BiDownload className="text-xl" />
            <span>Download E-Ticket</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <BiMovie className="text-xl" />
            <span>Lihat Event Lainnya</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
