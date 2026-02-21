import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { 
  BiHome, 
  BiMovie, 
  BiPurchaseTag,
  BiGift, 
  BiShoppingBag, 
  BiLogOut,
  BiMenu,
  BiX,
  BiUser,
  BiBarChart,
  BiListUl,
  BiCheckCircle,
  BiXCircle,
  BiHistory,
  BiCreditCard,
  BiPackage,
  BiMoney,
  BiTime
} from 'react-icons/bi'

const NavbarEvent = ({ userRole = 'user' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  // ========== HALAMAN YANG ADA DI APP.JSX ==========
  
  // Halaman User Tiket (bisa diakses oleh: user, user-raport, admin, admin-event)
  const userPages = [
    { name: 'Beranda', path: '/concerts', icon: BiHome },
    { name: 'Pesanan Saya', path: '/my-orders', icon: BiShoppingBag },
    { name: 'Detail Pesanan', path: '/order-detail/:orderId', icon: BiHistory, hide: true }, // Hidden karena dynamic
    { name: 'Pembayaran', path: '/payment/:orderId', icon: BiCreditCard, hide: true }, // Hidden karena dynamic
    { name: 'Sukses', path: '/payment-success/:orderId', icon: BiCheckCircle, hide: true } // Hidden karena dynamic
  ]

  // Halaman Admin Tiket (hanya untuk admin dan admin-event)
  const adminPages = [
    { name: 'Dashboard', path: '/admin/concert-dashboard', icon: BiBarChart },
    { name: 'Produk', path: '/admin/concert-products', icon: BiPackage },
    { name: 'Kode Promo', path: '/admin/concert-promos', icon: BiGift },
    { name: 'Pesanan', path: '/admin/concert-orders', icon: BiListUl },
    { name: 'Pesanan Sukses', path: '/admin/concert-success-orders', icon: BiCheckCircle },
    { name: 'Pesanan Batal', path: '/admin/concert-cancelled-orders', icon: BiXCircle }
  ]

  // Filter hanya halaman yang tidak di-hide
  const visibleUserPages = userPages.filter(page => !page.hide)
  const visibleAdminPages = adminPages

  const navItems = userRole === 'admin' ? visibleAdminPages : visibleUserPages

  const isActive = (path) => {
    // Handle dynamic routes
    if (path.includes(':')) {
      const basePath = path.split('/:')[0]
      return location.pathname.startsWith(basePath)
    }
    return location.pathname === path
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      {/* Navbar Utama */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left section - Hamburger menu dan logo */}
            <div className="flex items-center">
              {/* Hamburger menu untuk desktop (sebelah kiri) */}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex mr-4 p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                title="Menu"
              >
                <BiMenu className="h-6 w-6" />
              </button>

              {/* Logo */}
              <Link to={userRole === 'admin' ? '/admin/concert-dashboard' : '/concerts'} className="flex items-center space-x-2">
                <BiPurchaseTag className="h-8 w-8 text-blue-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TicketConcert
                </span>
              </Link>
            </div>

            {/* Desktop Menu - User info dan logout (sebelah kanan) */}
            <div className="hidden md:flex items-center">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <BiUser className="text-blue-500" />
                    <span className="truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
                    title="Logout"
                  >
                    <BiLogOut className="text-xl" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button (sebelah kanan) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                {isOpen ? <BiX className="h-6 w-6" /> : <BiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (dropdown) */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 pt-2 pb-3 space-y-1 max-h-[80vh] overflow-y-auto">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 flex items-center space-x-3 ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Mobile User Info & Logout */}
              {user && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="px-4 py-3 flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                    <BiUser className="text-blue-500 text-xl" />
                    <span className="truncate flex-1">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="w-full mt-2 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-3 text-base"
                  >
                    <BiLogOut className="text-xl" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar untuk Desktop (strip 3 di kiri) */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <div 
          className={`absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BiPurchaseTag className="h-6 w-6 text-blue-500" />
              <span className="font-bold text-gray-800">Menu Navigasi</span>
            </div>
            <button
              onClick={closeSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BiX className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
            {/* User Info */}
            {user && (
              <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BiUser className="text-blue-600 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Role: {userRole}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Groups - Sesuai dengan App.jsx */}
            {userRole === 'admin' ? (
              // Admin Navigation Groups
              <>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Dashboard
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/admin/concert-dashboard" 
                      icon={BiBarChart} 
                      label="Dashboard"
                      isActive={isActive('/admin/concert-dashboard')}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Manajemen
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/admin/concert-products" 
                      icon={BiPackage} 
                      label="Produk"
                      isActive={isActive('/admin/concert-products')}
                      onClick={closeSidebar}
                    />
                    <SidebarLink 
                      to="/admin/concert-promos" 
                      icon={BiGift} 
                      label="Kode Promo"
                      isActive={isActive('/admin/concert-promos')}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Pesanan
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/admin/concert-orders" 
                      icon={BiListUl} 
                      label="Semua Pesanan"
                      isActive={isActive('/admin/concert-orders')}
                      onClick={closeSidebar}
                    />
                    <SidebarLink 
                      to="/admin/concert-success-orders" 
                      icon={BiCheckCircle} 
                      label="Pesanan Sukses"
                      isActive={isActive('/admin/concert-success-orders')}
                      onClick={closeSidebar}
                    />
                    <SidebarLink 
                      to="/admin/concert-cancelled-orders" 
                      icon={BiXCircle} 
                      label="Pesanan Batal"
                      isActive={isActive('/admin/concert-cancelled-orders')}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>
              </>
            ) : (
              // User Navigation Groups
              <>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Utama
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/concerts" 
                      icon={BiHome} 
                      label="Beranda"
                      isActive={isActive('/concerts')}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Pesanan Saya
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/my-orders" 
                      icon={BiShoppingBag} 
                      label="Semua Pesanan"
                      isActive={isActive('/my-orders')}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Status Pesanan
                  </p>
                  <div className="space-y-1">
                    <SidebarLink 
                      to="/my-orders?status=pending" 
                      icon={BiTime} 
                      label="Menunggu"
                      isActive={location.pathname === '/my-orders' && new URLSearchParams(location.search).get('status') === 'pending'}
                      onClick={closeSidebar}
                    />
                    <SidebarLink 
                      to="/my-orders?status=paid" 
                      icon={BiCheckCircle} 
                      label="Sukses"
                      isActive={location.pathname === '/my-orders' && new URLSearchParams(location.search).get('status') === 'paid'}
                      onClick={closeSidebar}
                    />
                    <SidebarLink 
                      to="/my-orders?status=cancelled" 
                      icon={BiXCircle} 
                      label="Batal"
                      isActive={location.pathname === '/my-orders' && new URLSearchParams(location.search).get('status') === 'cancelled'}
                      onClick={closeSidebar}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Logout Button di Sidebar */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  handleLogout()
                  closeSidebar()
                }}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-3 transition-colors"
              >
                <BiLogOut className="text-xl" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Komponen helper untuk sidebar link
const SidebarLink = ({ to, icon: Icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
    }`}
  >
    <Icon className="text-xl" />
    <span className="text-sm font-medium">{label}</span>
    {isActive && (
      <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
    )}
  </Link>
)

export default NavbarEvent
