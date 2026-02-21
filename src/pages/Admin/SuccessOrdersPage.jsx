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
  BiSave,
  BiTicket
} from 'react-icons/bi'

const SuccessOrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    nik: '',
    price: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchSuccessOrders()
    fetchAllTickets()
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

  const fetchAllTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTickets(data)
    }
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

  const getOrderTickets = (orderId) => {
    return tickets.filter(ticket => ticket.order_id === orderId)
  }

  const generateQRCode = (text, size = 80) => {
    return (
      <div className="relative inline-block">
        <QRCode
          value={text}
          size={size}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiket</th>
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
                  filteredOrders.map((order, index) => {
                    const orderTickets = getOrderTickets(order.id)
                    return (
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
                          <div className="flex items-center space-x-1">
                            <BiTicket className="text-blue-500" />
                            <span className="text-sm">{orderTickets.length}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowDetailModal(true)
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Detail Tiket"
                            >
                              <BiCode className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <BiEdit className="text-lg" />
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal with Multiple QR Codes */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Detail Tiket - {selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {getOrderTickets(selectedOrder.id).map((ticket, idx) => (
                  <div key={ticket.id} className={`qr-${ticket.ticket_code.replace(/[^a-zA-Z0-9]/g, '')} border border-gray-200 rounded-xl p-4`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">Tiket #{idx + 1}</p>
                        <p className="font-mono font-bold text-blue-600">{ticket.ticket_code}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Pemilik: {idx === 0 ? selectedOrder.customer_name : selectedOrder.additional_buyers?.[idx-1]?.name}
                        </p>
                        <p className="text-sm text-gray-600">Tipe: {ticket.ticket_type || 'Reguler'}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        {generateQRCode(ticket.ticket_code, 100)}
                        <button
                          onClick={() => handleDownloadQR(ticket.ticket_code)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <BiDownload />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tutup
                </button>
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
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
