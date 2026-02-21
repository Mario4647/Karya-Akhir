import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiMovie,
  BiEdit,
  BiTrash,
  BiPlus,
  BiX,
  BiImage,
  BiCalendar,
  BiMap,
  BiMoney,
  BiPackage,
  BiSearch,
  BiRefresh,
  BiUpload,
  BiInfoCircle,
  BiCheck,
  BiError
} from 'react-icons/bi'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    event_date: '',
    event_location: '',
    location_description: '',
    maps_link: '',
    description: '',
    ticket_types: [] // Untuk multiple tiket type
  })

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Reguler', price: '', stock: '', description: '' }
  ])

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async () => {
    if (!selectedImage) return null

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Simpan sebagai base64 string
        resolve(reader.result)
      }
      reader.readAsDataURL(selectedImage)
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleTicketTypeChange = (index, field, value) => {
    const updatedTypes = [...ticketTypes]
    updatedTypes[index][field] = value
    setTicketTypes(updatedTypes)
  }

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', stock: '', description: '' }])
  }

  const removeTicketType = (index) => {
    if (ticketTypes.length > 1) {
      const updatedTypes = ticketTypes.filter((_, i) => i !== index)
      setTicketTypes(updatedTypes)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Nama produk harus diisi'
    if (!formData.event_date) newErrors.event_date = 'Tanggal event harus diisi'
    if (!formData.event_location) newErrors.event_location = 'Lokasi event harus diisi'
    
    // Validate ticket types
    ticketTypes.forEach((type, index) => {
      if (!type.name) newErrors[`ticket_name_${index}`] = `Nama tiket ${index + 1} harus diisi`
      if (!type.price) newErrors[`ticket_price_${index}`] = `Harga tiket ${index + 1} harus diisi`
      if (!type.stock) newErrors[`ticket_stock_${index}`] = `Stok tiket ${index + 1} harus diisi`
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setUploading(true)

    try {
      // Upload image jika ada
      let imageUrl = editingProduct?.image_url || ''
      if (selectedImage) {
        imageUrl = await uploadImage()
      }

      const productData = {
        ...formData,
        price: parseFloat(ticketTypes[0].price), // harga default dari tipe pertama
        stock: ticketTypes.reduce((sum, type) => sum + parseInt(type.stock), 0),
        ticket_types: ticketTypes,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ ...productData, created_at: new Date().toISOString() }])

        if (error) throw error
      }

      fetchProducts()
      closeModal()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Gagal menyimpan produk: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini? Semua tiket terkait juga akan dihapus.')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Gagal menghapus produk: ' + error.message)
      }
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || '',
        price: product.price || '',
        stock: product.stock || '',
        event_date: product.event_date ? product.event_date.slice(0, 16) : '',
        event_location: product.event_location || '',
        location_description: product.location_description || '',
        maps_link: product.maps_link || '',
        description: product.description || '',
        ticket_types: product.ticket_types || [{ name: 'Reguler', price: product.price, stock: product.stock, description: '' }]
      })
      setTicketTypes(product.ticket_types || [{ name: 'Reguler', price: product.price, stock: product.stock, description: '' }])
      setImagePreview(product.image_url || '')
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        price: '',
        stock: '',
        event_date: '',
        event_location: '',
        location_description: '',
        maps_link: '',
        description: '',
        ticket_types: []
      })
      setTicketTypes([{ name: 'Reguler', price: '', stock: '', description: '' }])
      setImagePreview('')
      setSelectedImage(null)
    }
    setShowModal(true)
    setErrors({})
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      stock: '',
      event_date: '',
      event_location: '',
      location_description: '',
      maps_link: '',
      description: '',
      ticket_types: []
    })
    setTicketTypes([{ name: 'Reguler', price: '', stock: '', description: '' }])
    setImagePreview('')
    setSelectedImage(null)
    setErrors({})
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.event_location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalStock = (product) => {
    if (product.ticket_types) {
      return product.ticket_types.reduce((sum, type) => sum + (type.stock || 0), 0)
    }
    return product.stock || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Produk</h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2"
          >
            <BiPlus className="text-xl" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe Tiket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
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
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data produk
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <BiImage className="text-2xl text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {product.ticket_types ? (
                          <div className="space-y-1">
                            {product.ticket_types.map((type, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{type.name}:</span> Rp {type.price?.toLocaleString()} ({type.stock} tiket)
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm">Reguler</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {product.ticket_types ? (
                          <div className="text-sm">
                            Mulai Rp {Math.min(...product.ticket_types.map(t => t.price)).toLocaleString()}
                          </div>
                        ) : (
                          `Rp ${product.price?.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          totalStock(product) > 10 ? 'bg-green-100 text-green-700' :
                          totalStock(product) > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {totalStock(product)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {new Date(product.event_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-gray-800">{product.event_location}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Gambar Produk
                  </label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200" />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <BiImage className="text-4xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <BiUpload className="text-lg" />
                        <span>Pilih Gambar</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Format: JPG, PNG, GIF. Maksimal 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Ticket Types */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">Tipe Tiket</h3>
                    <button
                      type="button"
                      onClick={addTicketType}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <BiPlus />
                      <span>Tambah Tipe</span>
                    </button>
                  </div>

                  {ticketTypes.map((type, index) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg relative">
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                        >
                          <BiX className="text-lg" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nama Tipe <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={type.name}
                            onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                            placeholder="Contoh: VIP, Reguler, Festival"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`ticket_name_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`ticket_name_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`ticket_name_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Harga <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <BiMoney className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={type.price}
                              onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`ticket_price_${index}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {errors[`ticket_price_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`ticket_price_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Stok <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <BiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={type.stock}
                              onChange={(e) => handleTicketTypeChange(index, 'stock', e.target.value)}
                              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`ticket_stock_${index}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {errors[`ticket_stock_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`ticket_stock_${index}`]}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Deskripsi Tipe (Opsional)
                          </label>
                          <input
                            type="text"
                            value={type.description}
                            onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                            placeholder="Contoh: Akses ke area VIP, termasuk merchandise"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tanggal Event <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.event_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Lokasi Event <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BiMap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="event_location"
                      value={formData.event_location}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.event_location ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.event_location && <p className="text-red-500 text-sm mt-1">{errors.event_location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Deskripsi Lokasi
                  </label>
                  <textarea
                    name="location_description"
                    value={formData.location_description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Link Google Maps
                  </label>
                  <input
                    type="url"
                    name="maps_link"
                    value={formData.maps_link}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Deskripsi Event
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    disabled={uploading}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
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

export default ProductsPage
