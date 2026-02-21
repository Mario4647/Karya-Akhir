import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiGift,
  BiEdit,
  BiTrash,
  BiPlus,
  BiX,
  BiSearch,
  BiCalendar,
  BiMoney,
  BiPackage,
  BiCheck,
  BiError,
  BiInfoCircle
} from 'react-icons/bi'

const PromosPage = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [deletingPromo, setDeletingPromo] = useState(null)
  const [deleteCheckResult, setDeleteCheckResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    stock: '',
    valid_from: '',
    valid_until: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromos(data || [])
    } catch (error) {
      console.error('Error fetching promos:', error)
      alert('Gagal memuat data promo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.code) newErrors.code = 'Kode promo harus diisi'
    if (!formData.discount_value) newErrors.discount_value = 'Nilai diskon harus diisi'
    if (parseFloat(formData.discount_value) <= 0) newErrors.discount_value = 'Nilai diskon harus lebih dari 0'
    if (!formData.stock) newErrors.stock = 'Stok harus diisi'
    if (parseInt(formData.stock) <= 0) newErrors.stock = 'Stok harus lebih dari 0'
    if (!formData.valid_from) newErrors.valid_from = 'Tanggal mulai harus diisi'
    if (!formData.valid_until) newErrors.valid_until = 'Tanggal berakhir harus diisi'
    
    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
        newErrors.valid_until = 'Tanggal berakhir harus setelah tanggal mulai'
      }
    }

    if (formData.discount_type === 'percentage') {
      if (parseFloat(formData.discount_value) > 100) {
        newErrors.discount_value = 'Diskon persentase maksimal 100%'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        stock: parseInt(formData.stock),
        used_count: editingPromo ? editingPromo.used_count : 0,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      // Cek apakah kode promo sudah ada (untuk insert baru)
      if (!editingPromo) {
        const { data: existingPromo, error: checkError } = await supabase
          .from('promo_codes')
          .select('id')
          .eq('code', promoData.code)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingPromo) {
          alert(`Kode promo "${promoData.code}" sudah ada. Gunakan kode yang berbeda.`)
          setSubmitting(false)
          return
        }
      }

      let result
      if (editingPromo) {
        // Untuk edit, pastikan tidak mengubah ke kode yang sudah ada (kecuali kode sendiri)
        if (formData.code.toUpperCase() !== editingPromo.code) {
          const { data: existingPromo, error: checkError } = await supabase
            .from('promo_codes')
            .select('id')
            .eq('code', promoData.code)
            .neq('id', editingPromo.id)
            .maybeSingle()

          if (checkError) throw checkError

          if (existingPromo) {
            alert(`Kode promo "${promoData.code}" sudah digunakan oleh promo lain.`)
            setSubmitting(false)
            return
          }
        }

        result = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingPromo.id)
      } else {
        result = await supabase
          .from('promo_codes')
          .insert([{ ...promoData, created_at: new Date().toISOString() }])
      }

      if (result.error) {
        // Handle duplicate key error
        if (result.error.code === '23505') {
          alert(`Kode promo "${promoData.code}" sudah ada. Gunakan kode yang berbeda.`)
        } else {
          throw result.error
        }
      } else {
        await fetchPromos()
        closeModal()
        alert(editingPromo ? 'Kode promo berhasil diperbarui!' : 'Kode promo berhasil ditambahkan!')
      }
    } catch (error) {
      console.error('Error saving promo:', error)
      alert('Gagal menyimpan kode promo: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const checkPromoUsage = async (promoId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total_amount, created_at', { count: 'exact' })
        .eq('promo_code_id', promoId)
        .limit(5)

      if (error) throw error

      return {
        used: data.length > 0,
        count: data.length,
        orders: data
      }
    } catch (error) {
      console.error('Error checking promo usage:', error)
      return { used: false, count: 0, orders: [], error: error.message }
    }
  }

  const handleDeleteClick = async (promo) => {
    setDeletingPromo(promo)
    setSubmitting(true)
    
    try {
      const usage = await checkPromoUsage(promo.id)
      setDeleteCheckResult(usage)
      setShowDeleteModal(true)
    } catch (error) {
      alert('Gagal memeriksa penggunaan promo: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingPromo) return

    setSubmitting(true)
    try {
      // Jika promo sudah digunakan, kita tidak bisa menghapus
      if (deleteCheckResult?.used) {
        alert(`Promo tidak dapat dihapus karena sudah digunakan di ${deleteCheckResult.count} pesanan. Anda dapat menonaktifkannya secara manual.`)
        setShowDeleteModal(false)
        setDeletingPromo(null)
        setDeleteCheckResult(null)
        return
      }

      // Hapus promo
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', deletingPromo.id)

      if (error) throw error

      await fetchPromos()
      setShowDeleteModal(false)
      setDeletingPromo(null)
      setDeleteCheckResult(null)
      alert('Kode promo berhasil dihapus!')
    } catch (error) {
      console.error('Error deleting promo:', error)
      
      // Jika error karena foreign key, beri informasi lebih jelas
      if (error.message.includes('foreign key constraint')) {
        alert('Promo tidak dapat dihapus karena sudah digunakan di beberapa pesanan. Silakan nonaktifkan promo ini sebagai gantinya.')
      } else {
        alert('Gagal menghapus kode promo: ' + error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivatePromo = async (promo) => {
    if (!window.confirm(`Yakin ingin menonaktifkan promo ${promo.code}?`)) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', promo.id)

      if (error) throw error

      await fetchPromos()
      alert('Promo berhasil dinonaktifkan!')
    } catch (error) {
      console.error('Error deactivating promo:', error)
      alert('Gagal menonaktifkan promo: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo)
      setFormData({
        code: promo.code || '',
        discount_type: promo.discount_type || 'percentage',
        discount_value: promo.discount_value || '',
        stock: promo.stock || '',
        valid_from: promo.valid_from ? promo.valid_from.slice(0, 16) : '',
        valid_until: promo.valid_until ? promo.valid_until.slice(0, 16) : ''
      })
    } else {
      setEditingPromo(null)
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        stock: '',
        valid_from: '',
        valid_until: ''
      })
    }
    setShowModal(true)
    setErrors({})
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPromo(null)
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      stock: '',
      valid_from: '',
      valid_until: ''
    })
    setErrors({})
  }

  const filteredPromos = promos.filter(promo =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatus = (promo) => {
    const now = new Date()
    const validFrom = new Date(promo.valid_from)
    const validUntil = new Date(promo.valid_until)

    if (promo.is_active === false) return 'inactive'
    if (now < validFrom) return 'upcoming'
    if (now > validUntil) return 'expired'
    if (promo.used_count >= promo.stock) return 'out-of-stock'
    return 'active'
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Nonaktif</span>
      case 'upcoming':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Akan Datang</span>
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Kadaluarsa</span>
      case 'out-of-stock':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Habis</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Kode Promo</h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2"
          >
            <BiPlus className="text-xl" />
            <span>Tambah Kode Promo</span>
          </button>
        </div>

        {/* Info Alert */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <BiInfoCircle className="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Informasi:</p>
            <p>Kode promo yang sudah digunakan di pesanan tidak dapat dihapus, tetapi dapat dinonaktifkan.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode promo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Promos Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Promo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe Diskon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terpakai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berlaku</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPromos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data kode promo
                    </td>
                  </tr>
                ) : (
                  filteredPromos.map((promo) => {
                    const status = getStatus(promo)
                    return (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-gray-800">{promo.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          {promo.discount_type === 'percentage' ? 'Persentase' : 'Nominal'}
                        </td>
                        <td className="px-6 py-4">
                          {promo.discount_type === 'percentage' 
                            ? `${promo.discount_value}%`
                            : `Rp ${promo.discount_value.toLocaleString()}`
                          }
                        </td>
                        <td className="px-6 py-4">{promo.stock}</td>
                        <td className="px-6 py-4">{promo.used_count}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div>{new Date(promo.valid_from).toLocaleDateString('id-ID')}</div>
                            <div className="text-gray-400">sd</div>
                            <div>{new Date(promo.valid_until).toLocaleDateString('id-ID')}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(promo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <BiEdit className="text-lg" />
                            </button>
                            
                            {status === 'active' && (
                              <button
                                onClick={() => handleDeactivatePromo(promo)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Nonaktifkan"
                              >
                                <BiX className="text-lg" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteClick(promo)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                              disabled={status === 'active' && promo.used_count > 0}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingPromo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Konfirmasi Hapus</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingPromo(null)
                    setDeleteCheckResult(null)
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              {deleteCheckResult?.used ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <BiError className="text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Promo sudah digunakan!</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Kode promo <span className="font-bold">{deletingPromo.code}</span> telah digunakan di {deleteCheckResult.count} pesanan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {deleteCheckResult.orders.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Contoh pesanan yang menggunakan promo ini:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {deleteCheckResult.orders.map((order, idx) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-mono">{order.order_number}</span> - {order.customer_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-600">
                    Promo yang sudah digunakan tidak dapat dihapus. Anda dapat menonaktifkannya sebagai gantinya.
                  </p>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        handleDeactivatePromo(deletingPromo)
                        setShowDeleteModal(false)
                        setDeletingPromo(null)
                        setDeleteCheckResult(null)
                      }}
                      className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Nonaktifkan Promo
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingPromo(null)
                        setDeleteCheckResult(null)
                      }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Yakin ingin menghapus kode promo <span className="font-bold">{deletingPromo.code}</span>?
                  </p>
                  <p className="text-sm text-gray-500">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleConfirmDelete}
                      disabled={submitting}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingPromo(null)
                        setDeleteCheckResult(null)
                      }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingPromo ? 'Edit Kode Promo' : 'Tambah Kode Promo Baru'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Kode Promo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="CONTOH50"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tipe Diskon <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nilai Diskon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {formData.discount_type === 'percentage' ? (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                    ) : (
                      <BiMoney className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    )}
                    <input
                      type="number"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleInputChange}
                      min="1"
                      max={formData.discount_type === 'percentage' ? "100" : undefined}
                      className={`w-full ${
                        formData.discount_type === 'percentage' ? 'pr-8' : 'pl-10'
                      } px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.discount_value ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.discount_value && <p className="text-red-500 text-sm mt-1">{errors.discount_value}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Stok Kode Promo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.stock ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tanggal Mulai Berlaku <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="valid_from"
                      value={formData.valid_from}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.valid_from ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.valid_from && <p className="text-red-500 text-sm mt-1">{errors.valid_from}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tanggal Berakhir <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="valid_until"
                      value={formData.valid_until}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.valid_until ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.valid_until && <p className="text-red-500 text-sm mt-1">{errors.valid_until}</p>}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingPromo ? 'Simpan Perubahan' : 'Tambah Promo'}</span>
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

export default PromosPage
