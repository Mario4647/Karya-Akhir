import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import { QRCode } from 'react-qr-code'
import {
  BiSearch,
  BiX,
  BiEdit,
  BiTrash,
  BiDetail,
  BiDownload,
  BiPrinter,
  BiCode,
  BiDuplicate,
  BiSave
} from 'react-icons/bi'

const SuccessOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    nik: '',
    price: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchSuccessOrders()
  }, [])

  const fetchSuccessOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (*),
        profiles:user_id (email, name, alamat)
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pesanan ini?')) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchSuccessOrders()
      }
    }
  }

  const handleEdit = (order) => {
    setSelectedOrder(order)
    setEditForm({
      name: order.customer_name,
      nik: order.customer_nik,
      price: order.total_amount
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from('orders')
      .update({
        customer_name: editForm.name,
        customer_nik: editForm.nik,
        total_amount: parseFloat(editForm.price),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedOrder.id)

    if (!error) {
      fetchSuccessOrders()
      setShowEditModal(false)
    }
    setUpdating(false)
  }

  const generateQRCode = (invoiceCode) => {
    return (
      <div className="relative">
        <QRCode
          value={invoiceCode}
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_nik?.includes(searchTerm) ||
      order.invoice_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Kode berhasil disalin!')
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

  const handleDownloadQR = (invoiceCode) => {
    const svg = document.querySelector(`.qr-${invoiceCode.replace(/[^a-zA-Z0-9]/g, '')} svg`)
    if (svg) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const link = document.createElement('a')
        link.download = `QR-${invoiceCode}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      
      const svgData = new XMLSerializer().serializeToString(svg)
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pesanan Sukses</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no. pesanan, nama, email, NIK, kode INV..."
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jml</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode INV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-4 text-center text-gray-500">
                      Tidak ada data pesanan sukses
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-800">{index + 1}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.customer_email}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.customer_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.customer_nik}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.product_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">Rp {order.product_price.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">{order.quantity}</td>
                      <td className="px-4 py-4 text-sm text-gray-800">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-sm text-blue-600">{order.invoice_code}</span>
                          <button
                            onClick={() => copyToClipboard(order.invoice_code)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <BiDuplicate className="text-sm" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDetailModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <BiCode className="text-xl" />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetailModal(true)
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Detail"
                          >
                            <BiDetail className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus"
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

      {/* Detail Modal with QR Code */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Detail QR Code</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                {/* QR Code */}
                <div className={`qr-${selectedOrder.invoice_code?.replace(/[^a-zA-Z0-9]/g, '')} mb-4 p-4 bg-white rounded-xl shadow-inner`}>
                  <QRCode
                    value={selectedOrder.invoice_code || selectedOrder.order_number}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>

                {/* Info */}
                <div className="w-full space-y-2 text-center">
                  <p className="text-sm text-gray-500">Kode Invoice</p>
                  <p className="font-mono text-lg font-bold text-blue-600">{selectedOrder.invoice_code}</p>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="font-medium text-gray-800">{selectedOrder.product_name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.quantity} tiket x Rp {selectedOrder.product_price.toLocaleString()}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      Rp {selectedOrder.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6 w-full">
                  <button
                    onClick={() => handleDownloadQR(selectedOrder.invoice_code)}
                    className="flex-1 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <BiDownload />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <BiPrinter />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Pesanan</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    NIK
                  </label>
                  <input
                    type="text"
                    value={editForm.nik}
                    onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength="16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Total Harga
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <BiSave />
                        <span>Simpan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuccessOrdersPage
