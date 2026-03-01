import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiCalendar,
  BiMap,
  BiTime,
  BiInfoCircle,
  BiPlus,
  BiMinus,
  BiGift,
  BiX,
  BiCheck,
  BiUser,
  BiIdCard,
  BiHome,
  BiCreditCard,
  BiArrowBack,
  BiDuplicate,
  BiCheckCircle,
  BiError,
  BiRefresh,
  BiSend,
  BiPurchaseTag,
  BiMovie,
  BiMoney,
  BiPackage,
  BiMusic,
  BiMicrophone,
  BiSpeaker,
  BiHeadphone,
  BiRadio,
  BiVolume,
  BiDisc,
  // BiNote tidak ada, ganti dengan BiMusic
  BiCamera,
  BiVideo,
  BiPhotoAlbum,
  // BiTicket tidak ada, ganti dengan BiPurchaseTag
  BiStar,
  BiHeart,
  BiLike,
  BiDiamond,
  BiCrown,
  BiRocket,
  BiPalette,
  BiBrush,
  BiPaint,
  BiPen,
  BiPencil,
  BiBook,
  BiBookOpen,
  BiLibrary,
  BiNewspaper,
  BiNews,
  BiBullhorn,
  BiMegaphone,
  BiBroadcast,
  BiCameraMovie,
  BiSlideshow,
  BiPlayCircle,
  BiPauseCircle,
  BiStopCircle,
  BiSkipNext,
  BiSkipPrevious,
  BiVolumeFull,
  BiVolumeLow,
  BiVolumeMute
} from 'react-icons/bi'

// Array icon untuk background dekoratif (hanya icon yang tersedia)
const decorativeIcons = [
  BiMusic, BiMicrophone, BiSpeaker, BiHeadphone, BiRadio, BiVolume,
  BiDisc, BiMusic, BiCamera, BiVideo, BiPhotoAlbum, BiPurchaseTag,
  BiStar, BiHeart, BiLike, BiDiamond, BiCrown, BiRocket,
  BiPalette, BiBrush, BiPaint, BiPen, BiPencil, BiBook,
  BiBookOpen, BiLibrary, BiNewspaper, BiNews, BiBullhorn,
  BiMegaphone, BiBroadcast, BiCameraMovie, BiSlideshow,
  BiPlayCircle, BiPauseCircle, BiStopCircle, BiSkipNext,
  BiSkipPrevious, BiVolumeFull, BiVolumeLow
]

const ConcertPage = () => {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedTicketType, setSelectedTicketType] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [showBuyerForm, setShowBuyerForm] = useState(false)
  const [buyers, setBuyers] = useState([{ name: '', nik: '', address: '' }])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const navigate = useNavigate()

  // Generate random positions for decorative icons
  const [iconPositions] = useState(() => {
    const positions = []
    for (let i = 0; i < 50; i++) {
      positions.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.5 + Math.random() * 0.5,
        opacity: 0.03 + Math.random() * 0.05,
        icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
      })
    }
    return positions
  })

  useEffect(() => {
    fetchProducts()
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchProfile(user.id)
    }
  }

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    }
  }

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    setFetchError('')
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const processedData = data.map(product => ({
        ...product,
        ticket_types: typeof product.ticket_types === 'string' 
          ? JSON.parse(product.ticket_types) 
          : product.ticket_types || [],
        image_url: product.image_data || product.poster_url
      }))
      
      console.log('Fetched products:', processedData)
      setProducts(processedData || [])
      
      if (processedData && processedData.length > 0) {
        setSelectedProduct(processedData[0])
        if (processedData[0].ticket_types && processedData[0].ticket_types.length > 0) {
          setSelectedTicketType(processedData[0].ticket_types[0])
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setFetchError('Gagal memuat data event: ' + error.message)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleProductChange = (product) => {
    setSelectedProduct(product)
    if (product.ticket_types && product.ticket_types.length > 0) {
      setSelectedTicketType(product.ticket_types[0])
    } else {
      setSelectedTicketType(null)
    }
    setQuantity(1)
    setPromoApplied(null)
    setPromoCode('')
  }

  const handleTicketTypeChange = (type) => {
    setSelectedTicketType(type)
    setQuantity(1)
  }

  const handleQuantityChange = (type) => {
    if (type === 'add') {
      if (quantity < (selectedTicketType?.stock || 0)) {
        setQuantity(prev => prev + 1)
      }
    } else {
      if (quantity > 1) {
        setQuantity(prev => prev - 1)
      }
    }
  }

  const validatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Masukkan kode promo')
      return
    }

    setPromoLoading(true)
    setPromoError('')

    const now = new Date().toISOString()
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .single()

      if (error || !data) {
        setPromoError('Kode promo tidak valid atau sudah kadaluarsa')
        setPromoLoading(false)
        return
      }

      if (data.used_count >= data.stock) {
        setPromoError('Kode promo sudah habis digunakan')
        setPromoLoading(false)
        return
      }

      setPromoApplied(data)
      setPromoError('')
    } catch (error) {
      console.error('Error validating promo:', error)
      setPromoError('Gagal memvalidasi kode promo')
    } finally {
      setPromoLoading(false)
    }
  }

  const calculateDiscount = (subtotal) => {
    if (!promoApplied) return 0
    
    if (promoApplied.discount_type === 'percentage') {
      return (subtotal * promoApplied.discount_value) / 100
    } else {
      return promoApplied.discount_value
    }
  }

  const subtotal = selectedTicketType ? selectedTicketType.price * quantity : 0
  const discount = calculateDiscount(subtotal)
  const total = subtotal - discount

  const handleBuyNow = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (quantity === 0 || !selectedTicketType) return
    setShowBuyerForm(true)
  }

  const handleAddBuyer = () => {
    setBuyers([...buyers, { name: '', nik: '', address: '' }])
  }

  const handleRemoveBuyer = (index) => {
    if (buyers.length > 1) {
      setBuyers(buyers.filter((_, i) => i !== index))
    }
  }

  const handleBuyerChange = (index, field, value) => {
    const updatedBuyers = [...buyers]
    updatedBuyers[index][field] = value
    setBuyers(updatedBuyers)
  }

  const validateBuyers = () => {
    for (let i = 0; i < buyers.length; i++) {
      const buyer = buyers[i]
      if (!buyer.name.trim()) {
        setError(`Nama Pembeli ${i + 1} harus diisi`)
        return false
      }
      if (!buyer.nik.trim()) {
        setError(`NIK Pembeli ${i + 1} harus diisi`)
        return false
      }
      if (buyer.nik.length < 16) {
        setError(`NIK Pembeli ${i + 1} harus 16 digit`)
        return false
      }
      if (buyer.nik.length > 16) {
        setError(`NIK Pembeli ${i + 1} maksimal 16 digit`)
        return false
      }
      if (!buyer.address.trim()) {
        setError(`Alamat Pembeli ${i + 1} harus diisi`)
        return false
      }
    }
    return true
  }

  const createOrder = async () => {
    if (!validateBuyers()) return

    setLoading(true)
    setError('')

    try {
      // Validasi data
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu')
      }

      if (!selectedProduct || !selectedTicketType) {
        throw new Error('Pilih produk dan tipe tiket terlebih dahulu')
      }

      if (quantity > selectedTicketType.stock) {
        throw new Error('Jumlah tiket melebihi stok yang tersedia')
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      // Set expiry time (60 menit)
      const expiryTime = new Date()
      expiryTime.setMinutes(expiryTime.getMinutes() + 60)

      // Siapkan data order
      const orderData = {
        order_number: orderNumber,
        user_id: user.id,
        product_id: selectedProduct.id,
        product_name: `${selectedProduct.name} - ${selectedTicketType.name}`,
        product_price: selectedTicketType.price,
        quantity: quantity,
        subtotal: subtotal,
        promo_code_id: promoApplied?.id || null,
        promo_discount: discount,
        total_amount: total,
        customer_name: buyers[0].name,
        customer_nik: buyers[0].nik,
        customer_email: user.email,
        customer_address: buyers[0].address,
        additional_buyers: buyers.slice(1).map(b => ({
          name: b.name,
          nik: b.nik,
          address: b.address
        })),
        status: 'pending',
        payment_expiry: expiryTime.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Order Data:', orderData)

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) {
        console.error('Order insert error details:', orderError)
        throw new Error(orderError.message || 'Gagal menyimpan order')
      }

      if (!order) {
        throw new Error('Gagal membuat order: Data tidak ditemukan setelah insert')
      }

      console.log('Order created:', order)

      // Create tickets for each buyer
      const tickets = []
      
      // Ticket for main buyer
      tickets.push({
        product_id: selectedProduct.id,
        order_id: order.id,
        buyer_index: 0,
        ticket_type: selectedTicketType.name,
        price: selectedTicketType.price,
        is_available: true,
        ticket_code: `TCK-${Date.now()}-0-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Tickets for additional buyers
      buyers.slice(1).forEach((buyer, index) => {
        tickets.push({
          product_id: selectedProduct.id,
          order_id: order.id,
          buyer_index: index + 1,
          ticket_type: selectedTicketType.name,
          price: selectedTicketType.price,
          is_available: true,
          ticket_code: `TCK-${Date.now()}-${index + 1}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })

      console.log('Tickets to insert:', tickets)

      // Insert tickets
      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(tickets)

      if (ticketsError) {
        console.error('Tickets insert error:', ticketsError)
        // Jika gagal insert tiket, hapus order yang sudah dibuat
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Gagal membuat tiket: ${ticketsError.message}`)
      }

      // Update stock
      const updatedTicketTypes = selectedProduct.ticket_types.map(type => {
        if (type.name === selectedTicketType.name) {
          return { ...type, stock: parseInt(type.stock) - quantity }
        }
        return type
      })

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          ticket_types: JSON.stringify(updatedTicketTypes),
          stock: parseInt(selectedProduct.stock) - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id)

      if (updateError) {
        console.error('Stock update error:', updateError)
      }

      // Update promo usage jika ada
      if (promoApplied) {
        await supabase
          .from('promo_codes')
          .update({ 
            used_count: promoApplied.used_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', promoApplied.id)
      }

      // Redirect ke halaman pembayaran
      navigate(`/payment/${order.id}`)

    } catch (error) {
      console.error('Error creating order:', error)
      setError(error.message || 'Gagal membuat pesanan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const totalStock = (product) => {
    if (product.ticket_types && product.ticket_types.length > 0) {
      return product.ticket_types.reduce((sum, type) => sum + (parseInt(type.stock) || 0), 0)
    }
    return product.stock || 0
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-800"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={24} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat event...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-800"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={24} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-2 border-gray-200">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-gray-600 mt-2">{fetchError}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-6 py-3 bg-[#4a90e2] text-white rounded-lg hover:bg-[#357abd] transition-colors font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] border-2 border-[#357abd]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedProduct || products.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => {
            const IconComponent = pos.icon
            return (
              <div
                key={i}
                className="absolute text-gray-800"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: 0
                }}
              >
                <IconComponent size={24} />
              </div>
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-2 border-gray-200">
            <BiInfoCircle className="text-6xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum ada event tersedia</h2>
            <p className="text-gray-600 mt-2">Silakan cek kembali nanti</p>
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
              className="absolute text-gray-800"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              <IconComponent size={24} />
            </div>
          )
        })}
      </div>

      <NavbarEvent />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Product Selector */}
        {products.length > 1 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductChange(product)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg transition-all font-medium ${
                    selectedProduct.id === product.id
                      ? 'bg-[#4a90e2] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] border-2 border-[#357abd]'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs opacity-75">
                    {product.event_date ? new Date(product.event_date).toLocaleDateString('id-ID') : 'TBA'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poster */}
            <div className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden border-2 border-gray-200">
              {selectedProduct.image_data || selectedProduct.poster_url ? (
                <img 
                  src={selectedProduct.image_data || selectedProduct.poster_url} 
                  alt={selectedProduct.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <BiMovie className="text-8xl text-gray-400" />
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 border-2 border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedProduct.name}</h1>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-[#e6f0ff] rounded-lg">
                    <BiCalendar className="text-xl text-[#4a90e2]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Tanggal & Waktu</p>
                    <p className="text-gray-600">
                      {selectedProduct.event_date ? new Date(selectedProduct.event_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Belum ditentukan'}
                    </p>
                    {selectedProduct.event_date && (
                      <p className="text-gray-600">
                        {new Date(selectedProduct.event_date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-[#e6f0ff] rounded-lg">
                    <BiMap className="text-xl text-[#4a90e2]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Lokasi</p>
                    <p className="text-gray-600">{selectedProduct.event_location || 'Belum ditentukan'}</p>
                    {selectedProduct.location_description && (
                      <p className="text-gray-500 text-sm mt-1">{selectedProduct.location_description}</p>
                    )}
                    {selectedProduct.maps_link && (
                      <a
                        href={selectedProduct.maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 mt-2 text-[#4a90e2] hover:text-[#357abd] font-medium"
                      >
                        <BiMap className="text-lg" />
                        <span>Lihat Melalui Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-[#e6f0ff] rounded-lg">
                      <BiInfoCircle className="text-xl text-[#4a90e2]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Deskripsi Event</p>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 sticky top-24 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Beli Tiket</h2>

              {/* Ticket Type Selection */}
              {selectedProduct.ticket_types && selectedProduct.ticket_types.length > 0 ? (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Pilih Tipe Tiket</p>
                  <div className="space-y-2">
                    {selectedProduct.ticket_types.map((type, index) => {
                      const isSelected = selectedTicketType?.name === type.name
                      const isOutOfStock = type.stock === 0
                      return (
                        <button
                          key={index}
                          onClick={() => !isOutOfStock && handleTicketTypeChange(type)}
                          disabled={isOutOfStock}
                          className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                            isSelected
                              ? 'bg-[#e6f0ff] border-[#4a90e2] shadow-[4px_4px_0px_0px_rgba(74,144,226,0.3)]'
                              : isOutOfStock
                              ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-[#4a90e2] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-[#4a90e2]' : 'text-gray-800'}`}>
                                {type.name}
                              </p>
                              {type.description && (
                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${isSelected ? 'text-[#4a90e2]' : 'text-gray-800'}`}>
                                {formatRupiah(type.price)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Stok: {type.stock}
                              </p>
                            </div>
                          </div>
                          {isOutOfStock && (
                            <p className="text-xs text-red-500 mt-2 font-medium">Tiket telah habis</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-sm text-yellow-700 font-medium">Belum ada tipe tiket tersedia</p>
                </div>
              )}

              {/* Quantity Selector */}
              {selectedTicketType && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Jumlah Tiket</p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange('minus')}
                      disabled={quantity === 1}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                    >
                      <BiMinus />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-gray-800">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('add')}
                      disabled={quantity >= selectedTicketType.stock}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                    >
                      <BiPlus />
                    </button>
                    <span className="text-sm font-medium text-gray-600 ml-2">
                      Stok: {selectedTicketType.stock}
                    </span>
                  </div>
                  {selectedTicketType.stock === 0 && (
                    <p className="text-red-500 text-sm mt-2 font-medium">Tiket telah habis</p>
                  )}
                </div>
              )}

              {/* Promo Code */}
              <div className="mb-6">
                <button
                  onClick={() => setShowPromoInput(!showPromoInput)}
                  className="text-[#4a90e2] hover:text-[#357abd] flex items-center space-x-1 text-sm font-medium"
                >
                  <BiGift className="text-lg" />
                  <span>Gunakan Kode Promo</span>
                </button>

                {showPromoInput && (
                  <div className="mt-3 space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Masukkan kode promo"
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                      />
                      <button
                        onClick={validatePromo}
                        disabled={promoLoading}
                        className="px-4 py-2 bg-[#4a90e2] text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50 font-medium border-2 border-[#357abd] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      >
                        {promoLoading ? '...' : 'Gunakan'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-red-500 text-sm flex items-center space-x-1 font-medium">
                        <BiError />
                        <span>{promoError}</span>
                      </p>
                    )}
                    {promoApplied && (
                      <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-green-700 font-medium flex items-center space-x-1">
                          <BiCheck className="text-lg" />
                          <span>Promo berhasil diterapkan!</span>
                        </p>
                        <p className="text-sm text-green-600 mt-1 font-medium">
                          {promoApplied.discount_type === 'percentage' 
                            ? `Diskon ${promoApplied.discount_value}%`
                            : `Diskon ${formatRupiah(promoApplied.discount_value)}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total */}
              {selectedTicketType && (
                <div className="border-t-2 border-gray-200 pt-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800 font-medium">{formatRupiah(subtotal)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Diskon</span>
                        <span className="text-green-600 font-medium">- {formatRupiah(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-200">
                      <span>Total</span>
                      <span className="text-[#4a90e2]">{formatRupiah(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedTicketType || selectedTicketType.stock === 0 || quantity === 0 || !user}
                className="w-full py-4 bg-[#4a90e2] text-white rounded-lg font-bold hover:bg-[#357abd] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
              >
                {!user ? 'Login untuk Membeli' : 
                 !selectedTicketType ? 'Pilih Tipe Tiket' :
                 selectedTicketType.stock === 0 ? 'Tiket Habis' : 'Beli Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Form Modal */}
      {showBuyerForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Data Pembeli</h2>
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-[#e6f0ff] border-2 border-[#4a90e2] rounded-lg">
                <p className="text-sm text-[#4a90e2] font-medium">
                  <span className="font-bold">Info:</span> Setiap pembeli akan mendapatkan QR code unik untuk tiketnya.
                </p>
              </div>

              {buyers.map((buyer, index) => (
                <div key={index} className="mb-6 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700">Pembeli {index + 1}</h3>
                    {buyers.length > 1 && (
                      <button
                        onClick={() => handleRemoveBuyer(index)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <BiX />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <BiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={buyer.name}
                          onChange={(e) => handleBuyerChange(index, 'name', e.target.value)}
                          placeholder="Masukkan nama lengkap"
                          className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        NIK <span className="text-red-500">*</span> (16 digit)
                      </label>
                      <div className="relative">
                        <BiIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={buyer.nik}
                          onChange={(e) => handleBuyerChange(index, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="16 digit NIK"
                          maxLength="16"
                          className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                          required
                        />
                      </div>
                      {buyer.nik && buyer.nik.length < 16 && (
                        <p className="text-xs text-red-500 mt-1 font-medium">NIK harus 16 digit</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Alamat <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <BiHome className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          value={buyer.address}
                          onChange={(e) => handleBuyerChange(index, 'address', e.target.value)}
                          placeholder="Masukkan alamat lengkap"
                          rows="2"
                          className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {selectedTicketType && quantity > 1 && buyers.length < quantity && (
                <button
                  onClick={handleAddBuyer}
                  className="w-full mb-4 py-3 border-2 border-dashed border-[#4a90e2] text-[#4a90e2] rounded-lg hover:bg-[#e6f0ff] transition-colors font-medium"
                >
                  + Tambah Pembeli
                </button>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <BiError className="text-red-500 text-xl mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Gagal membuat pesanan</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                >
                  Batal
                </button>
                <button
                  onClick={createOrder}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#4a90e2] text-white rounded-lg font-bold hover:bg-[#357abd] transition-colors disabled:opacity-50 border-2 border-[#357abd] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Simpan & Lanjut</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConcertPage
