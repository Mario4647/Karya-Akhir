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
  BiDollar,
  BiMusic,
  BiMicrophone,
  BiSpeaker,
  BiHeadphone,
  BiRadio,
  BiVolumeFull,
  BiDisc,
  BiAlbum,
  BiPlayCircle
} from 'react-icons/bi'

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
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu')
      }

      if (!selectedProduct || !selectedTicketType) {
        throw new Error('Pilih produk dan tipe tiket terlebih dahulu')
      }

      if (quantity > selectedTicketType.stock) {
        throw new Error('Jumlah tiket melebihi stok yang tersedia')
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      const expiryTime = new Date()
      expiryTime.setMinutes(expiryTime.getMinutes() + 60)

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

      const tickets = []
      
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

      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(tickets)

      if (ticketsError) {
        console.error('Tickets insert error:', ticketsError)
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Gagal membuat tiket: ${ticketsError.message}`)
      }

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

      if (promoApplied) {
        await supabase
          .from('promo_codes')
          .update({ 
            used_count: promoApplied.used_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', promoApplied.id)
      }

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

  // Array ikon untuk background
  const backgroundIcons = [
    BiMusic, BiMicrophone, BiSpeaker, BiHeadphone, 
    BiRadio, BiVolumeFull, BiDisc, BiAlbum, BiPlayCircle,
    BiPurchaseTag, BiMovie, BiCalendar, BiMap, BiGift, BiCreditCard
  ]

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden">
        {/* Background Icons */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(30)].map((_, i) => {
            const Icon = backgroundIcons[i % backgroundIcons.length]
            const size = Math.floor(Math.random() * 100) + 50
            const top = Math.random() * 100
            const left = Math.random() * 100
            const rotate = Math.random() * 360
            return (
              <Icon 
                key={i}
                size={size}
                className="absolute text-black"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: `rotate(${rotate}deg)`,
                  opacity: 0.1
                }}
              />
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-yellow-400 mx-auto mb-4"></div>
            <p className="text-black font-bold text-xl uppercase tracking-widest">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden">
        {/* Background Icons */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(30)].map((_, i) => {
            const Icon = backgroundIcons[i % backgroundIcons.length]
            const size = Math.floor(Math.random() * 100) + 50
            const top = Math.random() * 100
            const left = Math.random() * 100
            const rotate = Math.random() * 360
            return (
              <Icon 
                key={i}
                size={size}
                className="absolute text-black"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: `rotate(${rotate}deg)`,
                  opacity: 0.1
                }}
              />
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12">
            <BiError className="text-6xl text-red-600 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-black uppercase mb-4">Gagal Memuat Data</h2>
            <p className="text-black text-xl mb-6">{fetchError}</p>
            <button
              onClick={fetchProducts}
              className="px-8 py-4 bg-black text-white font-bold text-xl uppercase border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              COBA LAGI
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedProduct || products.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden">
        {/* Background Icons */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(30)].map((_, i) => {
            const Icon = backgroundIcons[i % backgroundIcons.length]
            const size = Math.floor(Math.random() * 100) + 50
            const top = Math.random() * 100
            const left = Math.random() * 100
            const rotate = Math.random() * 360
            return (
              <Icon 
                key={i}
                size={size}
                className="absolute text-black"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: `rotate(${rotate}deg)`,
                  opacity: 0.1
                }}
              />
            )
          })}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12">
            <BiInfoCircle className="text-6xl text-black mx-auto mb-4" />
            <h2 className="text-4xl font-black text-black uppercase mb-4">BELUM ADA EVENT</h2>
            <p className="text-black text-xl">Silakan cek kembali nanti</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] relative overflow-hidden">
      {/* Background Icons - Random dan Menarik */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const Icon = backgroundIcons[i % backgroundIcons.length]
          const size = Math.floor(Math.random() * 120) + 40
          const top = Math.random() * 100
          const left = Math.random() * 100
          const rotate = Math.random() * 360
          const color = i % 3 === 0 ? '#000' : (i % 3 === 1 ? '#fbbf24' : '#ef4444')
          return (
            <Icon 
              key={i}
              size={size}
              className="absolute"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                transform: `rotate(${rotate}deg)`,
                color: color,
                opacity: 0.15
              }}
            />
          )
        })}
      </div>

      <NavbarEvent />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Product Selector - Neo Brutalizm Style */}
        {products.length > 1 && (
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex space-x-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductChange(product)}
                  className={`flex-shrink-0 px-6 py-3 font-bold text-lg uppercase transition-all ${
                    selectedProduct.id === product.id
                      ? 'bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)]'
                      : 'bg-white text-black border-4 border-black hover:bg-yellow-400 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div>{product.name}</div>
                  <div className="text-sm opacity-75">
                    {product.event_date ? new Date(product.event_date).toLocaleDateString('id-ID') : 'TBA'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Poster - Neo Brutalizm */}
            <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {selectedProduct.image_data || selectedProduct.poster_url ? (
                <img 
                  src={selectedProduct.image_data || selectedProduct.poster_url} 
                  alt={selectedProduct.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-yellow-400 flex items-center justify-center">
                  <BiMovie className="text-8xl text-black" />
                </div>
              )}
            </div>

            {/* Event Info - Neo Brutalizm */}
            <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
              <h1 className="text-5xl font-black text-black uppercase mb-6 border-b-4 border-black pb-4">
                {selectedProduct.name}
              </h1>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-yellow-400 border-2 border-black">
                    <BiCalendar className="text-3xl text-black" />
                  </div>
                  <div>
                    <p className="font-black text-black text-xl mb-1 uppercase">Tanggal & Waktu</p>
                    <p className="text-black text-lg font-bold">
                      {selectedProduct.event_date ? new Date(selectedProduct.event_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Belum ditentukan'}
                    </p>
                    {selectedProduct.event_date && (
                      <p className="text-black text-lg font-bold">
                        {new Date(selectedProduct.event_date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-400 border-2 border-black">
                    <BiMap className="text-3xl text-black" />
                  </div>
                  <div>
                    <p className="font-black text-black text-xl mb-1 uppercase">Lokasi</p>
                    <p className="text-black text-lg font-bold">{selectedProduct.event_location || 'Belum ditentukan'}</p>
                    {selectedProduct.location_description && (
                      <p className="text-black mt-2 italic">{selectedProduct.location_description}</p>
                    )}
                    {selectedProduct.maps_link && (
                      <a
                        href={selectedProduct.maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 mt-4 px-6 py-3 bg-black text-white font-bold uppercase border-2 border-black hover:bg-yellow-400 hover:text-black transition-colors"
                      >
                        <BiMap className="text-xl" />
                        <span>LIHAT MAPS</span>
                      </a>
                    )}
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-400 border-2 border-black">
                      <BiInfoCircle className="text-3xl text-black" />
                    </div>
                    <div>
                      <p className="font-black text-black text-xl mb-1 uppercase">Deskripsi</p>
                      <p className="text-black text-lg">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase - Neo Brutalizm */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border-4 border-black bg-yellow-400 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="text-3xl font-black text-black uppercase mb-6 border-b-4 border-black pb-2">
                BELI TIKET
              </h2>

              {/* Ticket Type Selection */}
              {selectedProduct.ticket_types && selectedProduct.ticket_types.length > 0 ? (
                <div className="mb-8">
                  <p className="font-black text-black text-lg mb-3 uppercase">PILIH TIPE</p>
                  <div className="space-y-3">
                    {selectedProduct.ticket_types.map((type, index) => {
                      const isSelected = selectedTicketType?.name === type.name
                      const isOutOfStock = type.stock === 0
                      return (
                        <button
                          key={index}
                          onClick={() => !isOutOfStock && handleTicketTypeChange(type)}
                          disabled={isOutOfStock}
                          className={`w-full p-4 border-4 border-black text-left transition-all ${
                            isSelected
                              ? 'bg-black text-white'
                              : isOutOfStock
                              ? 'bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed'
                              : 'bg-white text-black hover:bg-red-400'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-black text-lg">{type.name}</p>
                              {type.description && (
                                <p className="text-sm opacity-75">{type.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-black text-xl">{formatRupiah(type.price)}</p>
                              <p className="text-sm">Stok: {type.stock}</p>
                            </div>
                          </div>
                          {isOutOfStock && (
                            <p className="text-sm text-red-600 mt-2 font-bold">HABIS</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 border-4 border-black bg-white">
                  <p className="text-black font-bold text-center">BELUM ADA TIPE TIKET</p>
                </div>
              )}

              {/* Quantity Selector */}
              {selectedTicketType && (
                <div className="mb-8">
                  <p className="font-black text-black text-lg mb-3 uppercase">JUMLAH</p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange('minus')}
                      disabled={quantity === 1}
                      className="w-14 h-14 border-4 border-black bg-white text-black font-black text-2xl hover:bg-red-400 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <BiMinus className="mx-auto" />
                    </button>
                    <span className="w-20 text-center font-black text-3xl text-black">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('add')}
                      disabled={quantity >= selectedTicketType.stock}
                      className="w-14 h-14 border-4 border-black bg-white text-black font-black text-2xl hover:bg-green-400 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <BiPlus className="mx-auto" />
                    </button>
                  </div>
                  {selectedTicketType.stock === 0 && (
                    <p className="text-red-600 font-bold text-lg mt-3">TIKET HABIS</p>
                  )}
                </div>
              )}

              {/* Promo Code */}
              <div className="mb-8">
                <button
                  onClick={() => setShowPromoInput(!showPromoInput)}
                  className="w-full py-4 bg-black text-white font-black text-lg uppercase border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center space-x-2"
                >
                  <BiGift className="text-2xl" />
                  <span>PAKAI KODE PROMO</span>
                </button>

                {showPromoInput && (
                  <div className="mt-4 space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="MASUKKAN KODE"
                        className="flex-1 px-4 py-3 border-4 border-black bg-white font-bold text-black uppercase placeholder:text-gray-400 focus:outline-none focus:ring-0"
                      />
                      <button
                        onClick={validatePromo}
                        disabled={promoLoading}
                        className="px-6 py-3 bg-black text-white font-black uppercase border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {promoLoading ? '...' : 'OK'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-red-600 font-bold flex items-center space-x-1">
                        <BiError className="text-xl" />
                        <span>{promoError}</span>
                      </p>
                    )}
                    {promoApplied && (
                      <div className="p-4 border-4 border-black bg-green-400">
                        <p className="text-black font-black flex items-center space-x-1">
                          <BiCheck className="text-2xl" />
                          <span>PROMO BERHASIL!</span>
                        </p>
                        <p className="text-black font-bold mt-1">
                          {promoApplied.discount_type === 'percentage' 
                            ? `DISKON ${promoApplied.discount_value}%`
                            : `DISKON ${formatRupiah(promoApplied.discount_value)}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total */}
              {selectedTicketType && (
                <div className="mb-8 border-t-4 border-black pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-black">SUBTOTAL</span>
                      <span className="text-black">{formatRupiah(subtotal)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-lg font-bold text-red-600">
                        <span>DISKON</span>
                        <span>- {formatRupiah(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-2xl font-black pt-3 border-t-2 border-black">
                      <span className="text-black">TOTAL</span>
                      <span className="text-black">{formatRupiah(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedTicketType || selectedTicketType.stock === 0 || quantity === 0 || !user}
                className="w-full py-5 bg-black text-white font-black text-2xl uppercase border-4 border-black hover:bg-yellow-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
              >
                {!user ? 'LOGIN DULU' : 
                 !selectedTicketType ? 'PILIH TIKET' :
                 selectedTicketType.stock === 0 ? 'TIKET HABIS' : 'BELI SEKARANG'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Form Modal - Neo Brutalizm */}
      {showBuyerForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-400 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-black text-black uppercase">DATA PEMBELI</h2>
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="w-14 h-14 border-4 border-black bg-white hover:bg-red-400 transition-colors flex items-center justify-center"
                >
                  <BiX className="text-4xl font-black" />
                </button>
              </div>

              <div className="mb-6 p-4 border-4 border-black bg-white">
                <p className="text-black font-bold">
                  <span className="font-black">INFO:</span> Setiap pembeli mendapat QR code unik.
                </p>
              </div>

              {buyers.map((buyer, index) => (
                <div key={index} className="mb-8 p-6 border-4 border-black bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-black text-black">PEMBELI {index + 1}</h3>
                    {buyers.length > 1 && (
                      <button
                        onClick={() => handleRemoveBuyer(index)}
                        className="px-4 py-2 bg-red-400 text-black font-black border-2 border-black hover:bg-red-600 transition-colors"
                      >
                        HAPUS
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-black text-black mb-2">NAMA LENGKAP *</label>
                      <div className="relative">
                        <BiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-black" />
                        <input
                          type="text"
                          value={buyer.name}
                          onChange={(e) => handleBuyerChange(index, 'name', e.target.value)}
                          placeholder="Masukkan nama lengkap"
                          className="w-full pl-12 pr-4 py-4 border-4 border-black bg-white font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-black text-black mb-2">NIK (16 DIGIT) *</label>
                      <div className="relative">
                        <BiIdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-black" />
                        <input
                          type="text"
                          value={buyer.nik}
                          onChange={(e) => handleBuyerChange(index, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="16 digit NIK"
                          maxLength="16"
                          className="w-full pl-12 pr-4 py-4 border-4 border-black bg-white font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-0"
                          required
                        />
                      </div>
                      {buyer.nik && buyer.nik.length < 16 && (
                        <p className="text-red-600 font-bold mt-2">NIK HARUS 16 DIGIT</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-black text-black mb-2">ALAMAT *</label>
                      <div className="relative">
                        <BiHome className="absolute left-4 top-4 text-2xl text-black" />
                        <textarea
                          value={buyer.address}
                          onChange={(e) => handleBuyerChange(index, 'address', e.target.value)}
                          placeholder="Masukkan alamat lengkap"
                          rows="3"
                          className="w-full pl-12 pr-4 py-4 border-4 border-black bg-white font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-0"
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
                  className="w-full mb-6 py-4 border-4 border-black bg-white text-black font-black text-lg hover:bg-green-400 transition-colors"
                >
                  + TAMBAH PEMBELI
                </button>
              )}

              {error && (
                <div className="mb-6 p-4 border-4 border-black bg-red-400">
                  <div className="flex items-start gap-3">
                    <BiError className="text-3xl text-black" />
                    <div>
                      <p className="font-black text-black">GAGAL!</p>
                      <p className="text-black font-bold">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="flex-1 py-4 border-4 border-black bg-white text-black font-black text-lg hover:bg-red-400 transition-colors"
                >
                  BATAL
                </button>
                <button
                  onClick={createOrder}
                  disabled={loading}
                  className="flex-1 py-4 border-4 border-black bg-black text-white font-black text-lg hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>PROSES...</span>
                    </>
                  ) : (
                    <span>SIMPAN & LANJUT</span>
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
