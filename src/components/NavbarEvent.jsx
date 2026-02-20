import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { 
  BiHome, 
  BiMovie, 
  BiPurchaseTag, // Ganti BiTicket dengan BiPurchaseTag
  BiGift, 
  BiShoppingBag, 
  BiLogOut,
  BiMenu,
  BiX,
  BiUser,
  BiCalendar,
  BiMap,
  BiBarChart,
  BiListUl,
  BiCheckCircle,
  BiXCircle
} from 'react-icons/bi'

const NavbarEvent = ({ userRole = 'user' }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [user, setUser] = React.useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
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

  const userNavItems = [
    { name: 'Beranda', path: '/', icon: BiHome },
    { name: 'Event', path: '/events', icon: BiMovie },
    { name: 'Pesanan Saya', path: '/my-orders', icon: BiShoppingBag }
  ]

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin', icon: BiBarChart },
    { name: 'Produk', path: '/admin/products', icon: BiMovie },
    { name: 'Kode Promo', path: '/admin/promos', icon: BiGift },
    { name: 'Pesanan', path: '/admin/orders', icon: BiListUl },
    { name: 'Pesanan Sukses', path: '/admin/success-orders', icon: BiCheckCircle },
    { name: 'Pesanan Batal', path: '/admin/cancelled-orders', icon: BiXCircle }
  ]

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BiPurchaseTag className="h-8 w-8 text-blue-500" /> {/* Ganti dengan BiPurchaseTag */}
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TicketConcert
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {user && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <BiUser className="text-blue-500" />
                  <span className="truncate max-w-[150px]">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
                >
                  <BiLogOut className="text-xl" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 flex items-center space-x-2 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {user && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-3 py-2 flex items-center space-x-2 text-sm text-gray-600">
                  <BiUser className="text-blue-500" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full mt-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
                >
                  <BiLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default NavbarEvent
