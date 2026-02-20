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
  BiMoney, // Ganti BiDollar
  BiPackage,
  BiCheck,
  BiError
} from 'react-icons/bi'

const PromosPage = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
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

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPromos(data)
    }
    setLoading(false)
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
    if (!formData.stock) newErrors.stock = 'Stok harus diisi'
    if (!formData.valid_from) newErrors.valid_from = 'Tanggal mulai harus diisi'
    if (!formData.valid_until) newErrors.valid_until = 'Tanggal berakhir harus diisi'
    
    // Validasi tanggal
    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
        newErrors.valid_until = 'Tanggal berakhir harus setelah tanggal mulai'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const promoData = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      stock: parseInt(formData.stock),
      used_count: 0
    }

    if (editingPromo) {
      const { error } = await supabase
        .from('promo_codes')
        .update({ ...promoData, updated_at: new Date().toISOString() })
        .eq('id', editingPromo.id)

      if (!error) {
        fetchPromos()
        closeModal()
      }
    } else {
      const { error } = await supabase
        .from('promo_codes')
        .insert([promoData])

      if (!error) {
        fetchPromos()
        closeModal()
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kode promo ini?')) {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchPromos()
      }
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

    if (now < validFrom) return 'upcoming'
    if (now > validUntil) return 'expired'
    if (promo.used_count >= promo.stock) return 'out-of-stock'
    return 'active'
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
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
                          <div className="font-mono font-medium text-gray-800">{promo.code}</div>
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
                            <div className="text-gray-500">s/d</div>
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
                            >
                              <BiEdit className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal Form */}
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
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    {editingPromo ? 'Simpan Perubahan' : 'Tambah Promo'}
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
