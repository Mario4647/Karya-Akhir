import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiSearch,
  BiXCircle,
  BiCalendar,
  BiUser,
  BiPackage,
  BiDollar,
  BiRefresh,
  BiDetail,
  BiTrash,
  BiX
} from 'react-icons/bi'

const CancelledOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchCancelledOrders()
  }, [])

  const fetchCancelledOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (*),
        profiles:user_id (email, name, alamat)
      `)
      .in('status', ['cancelled', 'expired'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus permanen pesanan ini?')) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchCancelledOrders()
      }
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_nik?.includes(searchTerm)
    
    return matchesSearch
  })

  const getStatusBadge = (status) => {
    return status === 'cancelled' 
      ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Dibatalkan</span>
      : <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Kadaluarsa</span>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pesanan Batal / Kadaluarsa</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no. pesanan, nama, email, NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                    <td colSpan="10" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data pesanan batal
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
                      <td className="px-6 py-4 text-sm text-gray-800">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">Rp {order.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetailModal(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <BiDetail className="text-lg" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(order.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Permanen"
                          >
                            <BiTrash className="text-lg" />
                          </button>
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
                <h2 className="text-2xl font-bold text-gray-800">Detail Pesanan Batal</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl ${
                  selectedOrder.status === 'cancelled' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <BiXCircle className={`text-2xl ${
                      selectedOrder.status === 'cancelled' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">
                        {selectedOrder.status === 'cancelled' ? 'Pesanan Dibatalkan' : 'Pesanan Kadaluarsa'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.status === 'cancelled' 
                          ? 'Pesanan ini dibatalkan oleh admin atau user'
                          : 'Waktu pembayaran telah habis'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">No. Pesanan</p>
                      <p className="font-mono font-medium text-gray-800">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Pesan</p>
                      <p className="text-gray-800">{formatDate(selectedOrder.created_at)}</p>
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
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-gray-800">Rp {selectedOrder.total_amount.toLocaleString()}</span>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CancelledOrdersPage
