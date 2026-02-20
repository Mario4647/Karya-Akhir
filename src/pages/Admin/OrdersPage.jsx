import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiSearch,
  BiFilter,
  BiX,
  BiCheck,
  BiTime,
  BiCalendar,
  BiUser,
  BiPackage,
  BiDollar,
  BiRefresh,
  BiDetail,
  BiCheckCircle,
  BiXCircle,
  BiError
} from 'react-icons/bi'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (*),
        profiles:user_id (email, name, alamat)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(true)
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (!error) {
      fetchOrders()
      if (showDetailModal) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    }
    setUpdating(false)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_nik?.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiCheckCircle /> Sukses
        </span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiTime /> Menunggu
        </span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiXCircle /> Batal
        </span>
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
          <BiError /> Kadaluarsa
        </span>
      default:
        return null
    }
  }

  const openDetailModal = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manajemen Pesanan</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor pesanan, nama, email, NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <BiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="paid">Sukses</option>
                <option value="cancelled">Batal</option>
                <option value="expired">Kadaluarsa</option>
              </select>
              <button
                onClick={fetchOrders}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <BiRefresh className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Pesanan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jml</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data pesanan
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-800">{order.order_number}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.customer_email}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.customer_nik}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.product_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">Rp {order.product_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        Rp {order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openDetailModal(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <BiDetail className="text-lg" />
                          </button>
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'paid')}
                                disabled={updating}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Ubah Status ke Sukses"
                              >
                                <BiCheck className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                disabled={updating}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Batalkan Pesanan"
                              >
                                <BiX className="text-lg" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Detail Pesanan</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">No. Pesanan</p>
                      <p className="font-mono font-medium text-gray-800">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div>{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Pesan</p>
                      <p className="text-gray-800">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Pembayaran</p>
                      <p className="text-gray-800">
                        {selectedOrder.updated_at ? formatDate(selectedOrder.updated_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <BiUser className="text-blue-500" />
                    Data Pemesan
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Nama</p>
                      <p className="text-gray-800">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">NIK</p>
                      <p className="text-gray-800">{selectedOrder.customer_nik}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">{selectedOrder.customer_email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="text-gray-800">{selectedOrder.customer_address}</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <BiPackage className="text-blue-500" />
                    Detail Produk
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produk:</span>
                      <span className="font-medium text-gray-800">{selectedOrder.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Satuan:</span>
                      <span className="text-gray-800">Rp {selectedOrder.product_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="text-gray-800">{selectedOrder.quantity} tiket</span>
                    </div>
                    {selectedOrder.promo_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon:</span>
                        <span>- Rp {selectedOrder.promo_discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-blue-600">Rp {selectedOrder.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Buyers */}
                {selectedOrder.additional_buyers && selectedOrder.additional_buyers.length > 0 && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Pembeli Lainnya</h3>
                    <div className="space-y-3">
                      {selectedOrder.additional_buyers.map((buyer, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">Pembeli {index + 2}: {buyer.name}</p>
                          <p className="text-sm text-gray-600">NIK: {buyer.nik}</p>
                          <p className="text-sm text-gray-600">Alamat: {buyer.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                {selectedOrder.midtrans_transaction_id && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Informasi Pembayaran</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Transaction ID:</span> {selectedOrder.midtrans_transaction_id}</p>
                      <p><span className="text-gray-500">Payment Type:</span> {selectedOrder.midtrans_payment_type}</p>
                      <p><span className="text-gray-500">Invoice Code:</span> {selectedOrder.invoice_code}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedOrder.status === 'pending' && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedOrder.id, 'cancelled')
                        setShowDetailModal(false)
                      }}
                      disabled={updating}
                      className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <BiXCircle />
                      <span>Batalkan Pesanan</span>
                    </button>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedOrder.id, 'paid')
                        setShowDetailModal(false)
                      }}
                      disabled={updating}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <BiCheckCircle />
                      <span>Ubah ke Sukses</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
