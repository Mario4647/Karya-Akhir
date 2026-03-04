import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import NavbarEvent from '../../components/NavbarEvent';
import { withAuth } from '../../authMiddleware';
import { 
  sanitizeInput, 
  validateNIK, 
  validatePhone, 
  formatPhoneForMidtrans,
  globalRateLimiter
} from '../../utils/security';
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
  BiCheckCircle,
  BiError,
  BiRefresh,
  BiPurchaseTag,
  BiMovie,
  BiMoney,
  BiPackage,
  BiMusic,
  BiMicrophone,
  BiCamera,
  BiVideo,
  BiImage,
  BiImages,
  BiPhotoAlbum,
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
  BiMessage,
  BiMessageDetail,
  BiMessageRounded,
  BiMessageDots,
  BiVolumeFull,
  BiVolumeLow,
  BiVolumeMute,
  BiPlay,
  BiPause,
  BiStop,
  BiSkipNext,
  BiSkipPrevious,
  BiCart,
  BiWallet,
  BiShoppingBag,
  BiPhone
} from 'react-icons/bi';

const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiImage, BiImages, BiPhotoAlbum,
  BiStar, BiHeart, BiLike, BiDiamond, BiCrown, BiRocket,
  BiPalette, BiBrush, BiPaint, BiPen, BiPencil, BiBook,
  BiBookOpen, BiLibrary, BiMessage, BiMessageDetail, BiMessageRounded, BiMessageDots,
  BiVolumeFull, BiVolumeLow, BiVolumeMute, BiPlay, BiPause, BiStop,
  BiSkipNext, BiSkipPrevious, BiCart, BiWallet, BiShoppingBag, BiPurchaseTag
];

const ConcertPage = ({ user }) => {
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
  const [buyers, setBuyers] = useState([{ 
    name: '', 
    nik: '', 
    address: '',
    phone: '' 
  }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [stockCheckResult, setStockCheckResult] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const navigate = useNavigate()

  const [iconPositions] = useState(() => {
    const positions = []
    for (let i = 0; i < 40; i++) {
      positions.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.7 + Math.random() * 0.8,
        opacity: 0.1 + Math.random() * 0.1,
        icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
      })
    }
    return positions
  })

  // Fetch products dengan error handling yang lebih baik
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true)
    setFetchError('')
    
    try {
      console.log('📦 Fetching products...')
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      console.log('✅ Products fetched:', data?.length || 0)
      
      const processedData = data.map(product => {
        let ticket_types = product.ticket_types;
        
        // Parse jika string
        if (typeof ticket_types === 'string') {
          try {
            ticket_types = JSON.parse(ticket_types);
          } catch (e) {
            console.error('Error parsing ticket_types for product', product.id, e);
            ticket_types = [];
          }
        }
        
        // Pastikan array
        if (!Array.isArray(ticket_types)) {
          ticket_types = [];
        }
        
        // Pastikan setiap item memiliki properti yang diperlukan
        ticket_types = ticket_types.map(type => ({
          name: type.name || 'Reguler',
          price: parseFloat(type.price || product.price || 0),
          stock: parseInt(type.stock || 0),
          description: type.description || ''
        }));
        
        // Hitung total stok
        const totalStock = ticket_types.reduce((sum, type) => sum + (type.stock || 0), 0);
        
        return {
          ...product,
          ticket_types: ticket_types,
          stock: totalStock,
          image_url: product.image_data || product.poster_url
        };
      })
      
      setProducts(processedData || [])
      
      if (processedData && processedData.length > 0) {
        setSelectedProduct(processedData[0])
        if (processedData[0].ticket_types && processedData[0].ticket_types.length > 0) {
          setSelectedTicketType(processedData[0].ticket_types[0])
        }
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error)
      setFetchError('Gagal memuat data event: ' + error.message)
    } finally {
      setIsLoadingProducts(false)
    }
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    fetchProducts()
    
    // Subscribe ke perubahan produk
    const productsSubscription = supabase
      .channel('products-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        (payload) => {
          console.log('🔄 Product changed:', payload.eventType, payload.new?.id)
          
          if (payload.eventType === 'INSERT') {
            // Tambah produk baru
            const newProduct = {
              ...payload.new,
              ticket_types: typeof payload.new.ticket_types === 'string' 
                ? JSON.parse(payload.new.ticket_types) 
                : payload.new.ticket_types || []
            }
            setProducts(prev => [newProduct, ...prev])
          }
          
          if (payload.eventType === 'UPDATE') {
            // Update produk yang ada
            setProducts(prev => prev.map(p => 
              p.id === payload.new.id 
                ? { 
                    ...p, 
                    ...payload.new,
                    ticket_types: typeof payload.new.ticket_types === 'string' 
                      ? JSON.parse(payload.new.ticket_types) 
                      : payload.new.ticket_types || []
                  }
                : p
            ))
            
            // Update selected product jika perlu
            if (selectedProduct?.id === payload.new.id) {
              setSelectedProduct(prev => ({ 
                ...prev, 
                ...payload.new,
                ticket_types: typeof payload.new.ticket_types === 'string' 
                  ? JSON.parse(payload.new.ticket_types) 
                  : payload.new.ticket_types || []
              }))
            }
          }
          
          if (payload.eventType === 'DELETE') {
            // Hapus produk
            setProducts(prev => prev.filter(p => p.id !== payload.old.id))
            if (selectedProduct?.id === payload.old.id) {
              setSelectedProduct(products[0] || null)
            }
          }
        }
      )
      .subscribe()
    
    setSubscription(productsSubscription)
    
    return () => {
      if (productsSubscription) {
        supabase.removeChannel(productsSubscription)
      }
    }
  }, [fetchProducts, selectedProduct])

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
        .maybeSingle()

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
    setBuyers([...buyers, { name: '', nik: '', address: '', phone: '' }])
  }

  const handleRemoveBuyer = (index) => {
    if (buyers.length > 1) {
      setBuyers(buyers.filter((_, i) => i !== index))
    }
  }

  const handleBuyerChange = (index, field, value) => {
    const sanitizedValue = field === 'name' || field === 'address' ? sanitizeInput(value) : value
    const updatedBuyers = [...buyers]
    updatedBuyers[index][field] = sanitizedValue
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
      if (!validateNIK(buyer.nik)) {
        setError(`NIK Pembeli ${i + 1} harus 16 digit angka`)
        return false
      }
      if (!buyer.phone.trim()) {
        setError(`Nomor HP Pembeli ${i + 1} harus diisi`)
        return false
      }
      if (!validatePhone(buyer.phone)) {
        setError(`Nomor HP Pembeli ${i + 1} tidak valid (08xx atau 62xx)`)
        return false
      }
      if (!buyer.address.trim()) {
        setError(`Alamat Pembeli ${i + 1} harus diisi`)
        return false
      }
    }
    return true
  }

  const checkStock = async (productId, ticketType, qty) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock, ticket_types')
        .eq('id', productId)
        .single()
      
      if (error) throw error
      
      let availableStock = data.stock
      if (ticketType && data.ticket_types) {
        const types = typeof data.ticket_types === 'string' 
          ? JSON.parse(data.ticket_types) 
          : data.ticket_types
        const found = types.find(t => t.name === ticketType)
        if (found) {
          availableStock = found.stock
        }
      }
      
      return {
        available: availableStock >= qty,
        stock: availableStock
      }
    } catch (error) {
      console.error('Error checking stock:', error)
      return { available: false, stock: 0 }
    }
  }

  const createOrder = async () => {
    if (!validateBuyers()) return

    if (!globalRateLimiter.check(user.id, 'create-order').allowed) {
      setError('Terlalu banyak percobaan. Silakan tunggu.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const stockCheck = await checkStock(
        selectedProduct.id, 
        selectedTicketType.name, 
        quantity
      )
      
      if (!stockCheck.available) {
        throw new Error(`Stok tidak mencukupi. Tersedia: ${stockCheck.stock}`)
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const expiryTime = new Date()
      expiryTime.setMinutes(expiryTime.getMinutes() + 60)

      const formattedPhone = formatPhoneForMidtrans(buyers[0].phone)

      const orderData = {
        order_number: orderNumber,
        user_id: user.id,
        product_id: selectedProduct.id,
        product_name: `${selectedProduct.name} - ${selectedTicketType.name}`,
        product_price: selectedTicketType.price,
        ticket_type: selectedTicketType.name,
        quantity: quantity,
        subtotal: subtotal,
        promo_code_id: promoApplied?.id || null,
        promo_discount: discount,
        total_amount: total,
        customer_name: buyers[0].name,
        customer_nik: buyers[0].nik,
        customer_email: user.email,
        customer_phone: formattedPhone,
        customer_address: buyers[0].address,
        additional_buyers: buyers.slice(1).map(b => ({
          name: b.name,
          nik: b.nik,
          phone: formatPhoneForMidtrans(b.phone),
          address: b.address
        })),
        status: 'pending',
        payment_expiry: expiryTime.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) throw orderError

      const tickets = buyers.map((buyer, index) => ({
        product_id: selectedProduct.id,
        order_id: order.id,
        buyer_index: index,
        ticket_type: selectedTicketType.name,
        price: selectedTicketType.price,
        is_available: true,
        ticket_code: `TCK-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(tickets)

      if (ticketsError) {
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error('Gagal membuat tiket')
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

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-gray-700"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 flex items-center justify-center h-[80vh]">
          <div className="text-center bg-white/80 p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Memuat event...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-gray-700"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 bg-white/90 backdrop-blur-sm rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)]">
            <BiError className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-gray-600 mt-2">{fetchError}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-2 mx-auto"
            >
              <BiRefresh className="text-xl" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedProduct || products.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-gray-700"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-20 bg-white/90 backdrop-blur-sm rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)]">
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
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute text-gray-700"
            style={{
              top: pos.top,
              left: pos.left,
              transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
              opacity: pos.opacity,
              zIndex: 0
            }}
          >
            {React.createElement(pos.icon, { size: 28 })}
          </div>
        ))}
      </div>

      <NavbarEvent />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {products.length > 1 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductChange(product)}
                  className={`flex-shrink-0 px-5 py-3 rounded transition-all font-medium flex items-center gap-2 ${
                    selectedProduct.id === product.id
                      ? 'bg-[#4a90e2] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] border-2 border-[#357abd]'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  <BiMovie className="text-xl" />
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs opacity-75">
                      {product.event_date ? new Date(product.event_date).toLocaleDateString('id-ID') : 'TBA'}
                    </div>
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
            <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] overflow-hidden relative">
              {selectedProduct.image_data || selectedProduct.poster_url ? (
                <img 
                  src={selectedProduct.image_data || selectedProduct.poster_url} 
                  alt={selectedProduct.name}
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <BiMovie className="text-8xl text-gray-400" />
                </div>
              )}
              <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-2">
                <BiPurchaseTag className="text-[#4a90e2]" />
                <span className="font-medium text-gray-700">{selectedProduct.ticket_types?.length || 0} Tipe Tiket</span>
              </div>
            </div>

            {/* Event Info */}
            <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <BiInfoCircle className="text-3xl text-[#4a90e2]" />
                <h1 className="text-3xl font-bold text-gray-800">{selectedProduct.name}</h1>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-[#e6f0ff] rounded border border-[#4a90e2] shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)]">
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
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-[#e6f0ff] rounded border border-[#4a90e2] shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)]">
                    <BiMap className="text-xl text-[#4a90e2]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">Lokasi</p>
                    <p className="text-gray-600">{selectedProduct.event_location || 'Belum ditentukan'}</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-[#e6f0ff] rounded border border-[#4a90e2] shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)]">
                      <BiInfoCircle className="text-xl text-[#4a90e2]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Deskripsi</p>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <BiPurchaseTag className="text-2xl text-[#4a90e2]" />
                <h2 className="text-xl font-bold text-gray-800">Beli Tiket</h2>
              </div>

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
                          className={`w-full p-4 rounded text-left transition-all border-2 flex items-start gap-3 ${
                            isSelected
                              ? 'bg-[#e6f0ff] border-[#4a90e2] shadow-[4px_4px_0px_0px_rgba(74,144,226,0.3)]'
                              : isOutOfStock
                              ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-[#4a90e2] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                          }`}
                        >
                          <BiPurchaseTag className={`text-2xl ${isSelected ? 'text-[#4a90e2]' : 'text-gray-500'}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className={`font-medium ${isSelected ? 'text-[#4a90e2]' : 'text-gray-800'}`}>
                                {type.name}
                              </p>
                              <p className={`font-bold ${isSelected ? 'text-[#4a90e2]' : 'text-gray-800'}`}>
                                {formatRupiah(type.price)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Stok: <span className="font-medium">{type.stock}</span>
                            </p>
                            {isOutOfStock && (
                              <p className="text-xs text-red-500 mt-2 font-medium">Tiket telah habis</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {selectedTicketType && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Jumlah Tiket</p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange('minus')}
                      disabled={quantity === 1}
                      className="w-10 h-10 rounded border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                    >
                      <BiMinus />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-gray-800">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange('add')}
                      disabled={quantity >= selectedTicketType.stock}
                      className="w-10 h-10 rounded border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                    >
                      <BiPlus />
                    </button>
                    <span className="text-sm font-medium text-gray-600 ml-2">
                      Stok: {selectedTicketType.stock}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <button
                  onClick={() => setShowPromoInput(!showPromoInput)}
                  className="text-[#4a90e2] hover:text-[#357abd] flex items-center gap-2 text-sm font-medium"
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
                        onChange={(e) => setPromoCode(sanitizeInput(e.target.value.toUpperCase()))}
                        placeholder="Masukkan kode promo"
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-[#4a90e2] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                      />
                      <button
                        onClick={validatePromo}
                        disabled={promoLoading}
                        className="px-4 py-2 bg-[#4a90e2] text-white rounded hover:bg-[#357abd] transition-colors disabled:opacity-50 font-medium border-2 border-[#357abd] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                      >
                        {promoLoading ? '...' : 'Gunakan'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-red-500 text-sm flex items-center gap-1 font-medium">
                        <BiError />
                        <span>{promoError}</span>
                      </p>
                    )}
                    {promoApplied && (
                      <div className="p-3 bg-green-50 border-2 border-green-200 rounded">
                        <p className="text-green-700 font-medium">Promo berhasil diterapkan!</p>
                        <p className="text-sm text-green-600 mt-1">
                          {promoApplied.discount_type === 'percentage' 
                            ? `Diskon ${promoApplied.discount_value}%`
                            : `Diskon ${formatRupiah(promoApplied.discount_value)}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

              <button
                onClick={handleBuyNow}
                disabled={!selectedTicketType || selectedTicketType.stock === 0 || quantity === 0 || !user}
                className="w-full py-4 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#357abd] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2"
              >
                {!user ? (
                  <>
                    <BiUser />
                    <span>Login</span>
                  </>
                ) : !selectedTicketType ? (
                  <>
                    <BiPurchaseTag />
                    <span>Pilih Tiket</span>
                  </>
                ) : selectedTicketType.stock === 0 ? (
                  <>
                    <BiError />
                    <span>Tiket Habis</span>
                  </>
                ) : (
                  <>
                    <BiCreditCard />
                    <span>Beli Tiket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Form Modal */}
      {showBuyerForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 relative">
            
            <div className="relative z-10 p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <BiUser className="text-2xl text-[#4a90e2]" />
                  <h2 className="text-2xl font-bold text-gray-800">Data Pembeli</h2>
                </div>
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                >
                  <BiX className="text-xl" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-[#e6f0ff] border-2 border-[#4a90e2] rounded">
                <p className="text-sm text-[#4a90e2] font-medium">
                  Setiap pembeli akan mendapatkan QR code unik. Nomor HP diperlukan.
                </p>
              </div>

              {buyers.map((buyer, index) => (
                <div key={index} className="mb-6 p-4 border-2 border-gray-200 rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700">Pembeli {index + 1}</h3>
                    {buyers.length > 1 && (
                      <button
                        onClick={() => handleRemoveBuyer(index)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                      >
                        <BiX />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        value={buyer.name}
                        onChange={(e) => handleBuyerChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">NIK (16 digit) *</label>
                      <input
                        type="text"
                        value={buyer.nik}
                        onChange={(e) => handleBuyerChange(index, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nomor HP *</label>
                      <input
                        type="tel"
                        value={buyer.phone}
                        onChange={(e) => handleBuyerChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Alamat *</label>
                      <textarea
                        value={buyer.address}
                        onChange={(e) => handleBuyerChange(index, 'address', e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {selectedTicketType && quantity > 1 && buyers.length < quantity && (
                <button
                  onClick={handleAddBuyer}
                  className="w-full mb-4 py-3 border-2 border-dashed border-[#4a90e2] text-[#4a90e2] rounded hover:bg-[#e6f0ff]"
                >
                  + Tambah Pembeli
                </button>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBuyerForm(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={createOrder}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#4a90e2] text-white rounded font-bold hover:bg-[#357abd] disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Simpan & Lanjut'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(ConcertPage)
