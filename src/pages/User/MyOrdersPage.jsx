import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiTime,
  BiCheckCircle,
  BiXCircle,
  BiError,
  BiDetail,
  BiCalendar,
  BiMovie,
  BiMoney,
  BiPurchaseTag,
  BiSearch,
  BiFilter,
  BiRefresh,
  BiCreditCard,
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

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
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
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchOrders(user.id)
      fetchTickets(user.id)
    }
  }

  const fetchOrders = async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          orders!inner(user_id, order_number, status)
        `)
        .eq('orders.user_id', userId)

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
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
      day: '2-digit',
      month: 'long',
      year: 'numeric',
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getOrderTickets = (orderId) => {
    return tickets.filter(ticket => ticket.order_id === orderId)
  }

  const handleViewDetail = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const generateQRCode = (text) => {
    return (
      <div className="relative inline-block">
        <QRCode
          value={text}
          size={80}
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
            <p className="text-gray-700 font-medium">Memuat pesanan Anda...</p>
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pesanan Saya</h1>

        {/* Filters */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor pesanan, produk, nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <BiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="paid">Sukses</option>
                <option value="cancelled">Batal</option>
                <option value="expired">Kadaluarsa</option>
              </select>
              <button
                onClick={() => user && fetchOrders(user.id)}
                className="p-2 text-[#4a90e2] hover:bg-[#e6f0ff] rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
                title="Refresh"
              >
                <BiRefresh className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-12 text-center">
            <BiMovie className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Anda belum melakukan pemesanan tiket</p>
            <button
              onClick={() => navigate('/concerts')}
              className="px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]"
            >
              Lihat Event Tersedia
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const orderTickets = getOrderTickets(order.id)
              return (
                <div key={order.id} className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] overflow-hidden hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <BiMovie className="text-[#4a90e2] text-xl" />
                          <h3 className="font-semibold text-gray-800 text-lg">{order.product_name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                            <p className="text-xs text-gray-500">No. Pesanan</p>
                            <p className="font-mono text-sm font-medium text-gray-800">{order.order_number}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                            <p className="text-xs text-gray-500">Tanggal Pesan</p>
                            <p className="text-sm text-gray-800 flex items-center gap-1">
                              <BiCalendar className="text-[#4a90e2]" />
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                            <p className="text-xs text-gray-500">Jumlah Tiket</p>
                            <p className="text-sm text-gray-800">{order.quantity} tiket</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-bold text-[#4a90e2]">
                              {formatRupiah(order.total_amount)}
                            </p>
                          </div>
                        </div>

                        {orderTickets.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {orderTickets.map((ticket, idx) => (
                              <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full border border-gray-200 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
                                {ticket.ticket_type || 'Reguler'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[200px]">
                        {getStatusBadge(order.status)}
                        
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <div className="relative overflow-hidden rounded border-2 border-[#357abd] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                              <button
                                onClick={() => navigate(`/payment/${order.id}`)}
                                className="px-4 py-2 bg-[#4a90e2] text-white text-sm font-medium hover:bg-[#357abd] transition-colors flex items-center gap-1"
                              >
                                <BiCreditCard />
                                Lanjutkan
                              </button>
                            </div>
                          )}
                          
                          <div className="relative overflow-hidden rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
                            <button
                              onClick={() => handleViewDetail(order)}
                              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                              <BiDetail />
                              Detail
                            </button>
                          </div>

                          {order.status === 'paid' && (
                            <div className="relative overflow-hidden rounded border-2 border-green-600 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.25)]">
                              <button
                                onClick={() => navigate(`/payment-success/${order.id}`)}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <BiPurchaseTag />
                                Tiket
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.25)] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            
            {/* Decorative Icons di modal */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {iconPositions.slice(0, 15).map((pos, i) => {
                const IconComponent = pos.icon
                return (
                  <div
                    key={i}
                    className="absolute text-gray-300"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                      opacity: pos.opacity * 0.5,
                      zIndex: 0
                    }}
                  >
                    <IconComponent size={24} />
                  </div>
                )
              })}
            </div>
            
            <div className="relative z-10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Detail Pesanan</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded border-2 ${
                  selectedOrder.status === 'paid' ? 'bg-green-50 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)]' :
                  selectedOrder.status === 'pending' ? 'bg-yellow-50 border-yellow-200 shadow-[4px_4px_0px_0px_rgba(234,179,8,0.2)]' :
                  'bg-red-50 border-red-200 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)]'
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedOrder.status === 'paid' && <BiCheckCircle className="text-2xl text-green-500" />}
                    {selectedOrder.status === 'pending' && <BiTime className="text-2xl text-yellow-500" />}
                    {selectedOrder.status === 'cancelled' && <BiXCircle className="text-2xl text-red-500" />}
                    {selectedOrder.status === 'expired' && <BiError className="text-2xl text-gray-500" />}
                    <div>
                      <p className="font-medium text-gray-800">
                        {selectedOrder.status === 'paid' ? 'Pembayaran Sukses' :
                         selectedOrder.status === 'pending' ? 'Menunggu Pembayaran' :
                         selectedOrder.status === 'cancelled' ? 'Pesanan Dibatalkan' :
                         'Pesanan Kadaluarsa'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.status === 'paid' ? 'Tiket Anda sudah aktif dan dapat digunakan' :
                         selectedOrder.status === 'pending' ? 'Silakan selesaikan pembayaran sebelum batas waktu' :
                         'Pesanan ini tidak dapat dilanjutkan'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">No. Pesanan</p>
                      <p className="font-mono font-medium text-gray-800">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Pesan</p>
                      <p className="text-sm text-gray-800">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <h3 className="font-semibold text-gray-800 mb-3">Detail Produk</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produk:</span>
                      <span className="font-medium text-gray-800">{selectedOrder.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Satuan:</span>
                      <span className="text-gray-800">{formatRupiah(selectedOrder.product_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="text-gray-800">{selectedOrder.quantity} tiket</span>
                    </div>
                    {selectedOrder.promo_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon:</span>
                        <span>- {formatRupiah(selectedOrder.promo_discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t-2 border-gray-200">
                      <span>Total:</span>
                      <span className="text-[#4a90e2]">{formatRupiah(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <h3 className="font-semibold text-gray-800 mb-3">Data Pemesan</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="text-gray-800">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NIK</p>
                      <p className="text-gray-800">{selectedOrder.customer_nik}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-gray-800">{selectedOrder.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="text-gray-800">{selectedOrder.customer_address}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'paid' && (
                  <div className="border-2 border-gray-200 rounded p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <h3 className="font-semibold text-gray-800 mb-3">Tiket</h3>
                    <div className="space-y-4">
                      {getOrderTickets(selectedOrder.id).map((ticket, index) => (
                        <div key={ticket.id} className="bg-blue-50 p-4 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">Tiket {index + 1}</p>
                              <p className="text-sm text-gray-600">Kode: {ticket.ticket_code}</p>
                              <p className="text-sm text-gray-600">Tipe: {ticket.ticket_type || 'Reguler'}</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                              {generateQRCode(ticket.ticket_code)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {selectedOrder.status === 'pending' && (
                    <div className="flex-1 relative overflow-hidden rounded border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          navigate(`/payment/${selectedOrder.id}`)
                        }}
                        className="w-full py-3 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] transition-colors"
                      >
                        Lanjutkan Pembayaran
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'paid' && (
                    <div className="flex-1 relative overflow-hidden rounded border-2 border-green-600 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.25)]">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          navigate(`/payment-success/${selectedOrder.id}`)
                        }}
                        className="w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
                      >
                        Lihat E-Ticket
                      </button>
                    </div>
                  )}
                  <div className="flex-1 relative overflow-hidden rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="w-full py-3 bg-white text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrdersPage
