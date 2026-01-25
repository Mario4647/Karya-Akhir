import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AdminNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', user.id)
                    .single();
                
                if (profile?.name) {
                    setUserName(profile.name);
                    // Ambil huruf pertama dari nama
                    const initial = profile.name.charAt(0).toUpperCase();
                    setUserInitial(initial);
                } else {
                    // Fallback ke email jika nama tidak ada
                    const emailInitial = user.email?.charAt(0).toUpperCase() || 'A';
                    setUserName(user.email || 'Admin');
                    setUserInitial(emailInitial);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleDesktopMenu = () => {
        setIsDesktopMenuOpen(!isDesktopMenuOpen);
    };

    const closeAllMenus = () => {
        setIsMobileMenuOpen(false);
        setIsDesktopMenuOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const handleUserProfileClick = () => {
        navigate('/dashboard-user');
    };

    // Warna tema yang cocok dengan background putih
    const navbarColors = {
        primary: 'bg-white',
        primaryDark: 'bg-gray-50',
        secondary: 'bg-blue-600',
        secondaryHover: 'hover:bg-blue-700',
        accent: 'bg-blue-500',
        accentHover: 'hover:bg-blue-600',
        text: 'text-gray-800',
        textLight: 'text-gray-600',
        border: 'border-gray-200',
        shadow: 'shadow-md'
    };

    return (
        <>
            {/* Main Navbar */}
            <nav className={`${navbarColors.primary} ${navbarColors.shadow} ${navbarColors.border} w-full fixed z-50 py-3 px-4 border-b`}>
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        {/* Logo & Brand with Hamburger - Desktop */}
                        <div className="flex items-center gap-3">
                            {/* Desktop Hamburger Button */}
                            <button
                                onClick={toggleDesktopMenu}
                                className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                aria-label="Toggle desktop menu"
                            >
                                <i className="bx bx-menu text-2xl"></i>
                            </button>
                            
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${navbarColors.secondary} shadow-sm`}>
                                    <i className="bx bx-shield-alt-2 text-xl text-white"></i>
                                </div>
                                <div className="hidden md:block">
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                        Admin Portal
                                    </h1>
                                    <p className="text-xs text-gray-500">Sistem Manajemen Sekolah</p>
                                </div>
                                <div className="md:hidden">
                                    <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation Items - Now with only Logout & Profile */}
                        <div className="hidden md:flex items-center space-x-2">
                            {/* User Profile & Logout */}
                            <div className="flex items-center space-x-2 ml-2">
                                {/* User Profile Circle */}
                                <div 
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={handleUserProfileClick}
                                >
                                    <div className={`w-10 h-10 rounded-full ${navbarColors.secondary} flex items-center justify-center shadow-sm group-hover:${navbarColors.secondaryHover} transition-colors`}>
                                        <span className="text-white font-bold text-lg">{userInitial}</span>
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                                        <p className="text-xs text-gray-500">Administrator</p>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-sm hover:shadow border border-red-500"
                                    title="Keluar dari sistem"
                                >
                                    <i className="bx bx-log-out-circle text-lg"></i>
                                    <span className="hidden lg:inline">Logout</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center space-x-3">
                            {/* User Profile Circle - Mobile */}
                            <div 
                                className={`w-9 h-9 rounded-full ${navbarColors.secondary} flex items-center justify-center shadow-sm cursor-pointer hover:${navbarColors.secondaryHover} transition-colors`}
                                onClick={handleUserProfileClick}
                            >
                                <span className="text-white font-bold">{userInitial}</span>
                            </div>
                            
                            <button
                                onClick={toggleMobileMenu}
                                className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                aria-label="Toggle mobile menu"
                            >
                                <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
                    isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${navbarColors.secondary} flex items-center justify-center`}>
                                <i className="bx bx-shield-alt-2 text-xl text-white"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Menu Admin</h2>
                                <p className="text-xs text-gray-500">Sistem Manajemen</p>
                            </div>
                        </div>
                        <button
                            onClick={closeAllMenus}
                            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            aria-label="Close mobile menu"
                        >
                            <i className="bx bx-x text-xl"></i>
                        </button>
                    </div>

                    {/* User Profile Section - Mobile */}
                    <div 
                        className="p-5 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => { handleUserProfileClick(); closeAllMenus(); }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${navbarColors.secondary} flex items-center justify-center shadow-sm`}>
                                <span className="text-white font-bold text-xl">{userInitial}</span>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{userName}</h3>
                                <p className="text-sm text-gray-500">Profile</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Items */}
                    <div className="flex-1 p-5 overflow-y-auto">
                        <ul className="space-y-1">
                            <MobileNavItem
                                icon="bx-dashboard"
                                label="Dashboard Admin"
                                onClick={() => { navigate('/admin'); closeAllMenus(); }}
                                active={location.pathname === '/admin'}
                            />
                            <MobileNavItem
                                icon="bx-data"
                                label="Data Dapodik"
                                onClick={() => { navigate('/dapodik'); closeAllMenus(); }}
                                active={location.pathname === '/dapodik'}
                                accent={true}
                            />
                            <MobileNavItem
                                icon="bx-chalkboard"
                                label="Data Guru"
                                onClick={() => { navigate('/dataguru'); closeAllMenus(); }}
                                active={location.pathname === '/dataguru'}
                            />
                            <MobileNavItem
                                icon="bx-user-pin"
                                label="Data Siswa"
                                onClick={() => { navigate('/datasiswa'); closeAllMenus(); }}
                                active={location.pathname === '/datasiswa'}
                            />
                            <MobileNavItem
                                icon="bx-message-detail"
                                label="Pesan Admin"
                                onClick={() => { navigate('/admin/pesan'); closeAllMenus(); }}
                                active={location.pathname === '/admin/pesan'}
                            />
                            <MobileNavItem
                                icon="bx-search-alt"
                                label="Riwayat Pencarian"
                                onClick={() => { navigate('/pencarian'); closeAllMenus(); }}
                                active={location.pathname === '/pencarian'}
                            />
                            <MobileNavItem
                                icon="bx-cog"
                                label="Pengaturan Perjalanan"
                                onClick={() => { navigate('/admin/tripsettings'); closeAllMenus(); }}
                                active={location.pathname === '/admin/tripsettings'}
                            />
                        </ul>
                    </div>

                    {/* Mobile Logout Section */}
                    <div className="p-5 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => { handleLogout(); closeAllMenus(); }}
                            className="flex items-center justify-center gap-3 w-full p-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 border border-red-500 shadow-sm"
                        >
                            <i className="bx bx-log-out-circle text-xl"></i>
                            <span className="text-base font-medium">Keluar dari Sistem</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Sistem Manajemen Sekolah v1.0
                        </p>
                    </div>
                </div>

                {/* Desktop Menu (Sidebar) */}
                <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 hidden md:flex flex-col ${
                    isDesktopMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    {/* Desktop Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${navbarColors.secondary} flex items-center justify-center`}>
                                <i className="bx bx-shield-alt-2 text-xl text-white"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Menu Admin</h2>
                                <p className="text-xs text-gray-500">Sistem Manajemen</p>
                            </div>
                        </div>
                        <button
                            onClick={closeAllMenus}
                            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            aria-label="Close desktop menu"
                        >
                            <i className="bx bx-x text-xl"></i>
                        </button>
                    </div>

                    {/* User Profile Section - Desktop */}
                    <div 
                        className="p-5 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => { handleUserProfileClick(); closeAllMenus(); }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${navbarColors.secondary} flex items-center justify-center shadow-sm`}>
                                <span className="text-white font-bold text-xl">{userInitial}</span>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{userName}</h3>
                                <p className="text-sm text-gray-500">Profile</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu Items */}
                    <div className="flex-1 p-5 overflow-y-auto">
                        <ul className="space-y-1">
                            <MobileNavItem
                                icon="bx-dashboard"
                                label="Dashboard Admin"
                                onClick={() => { navigate('/admin'); closeAllMenus(); }}
                                active={location.pathname === '/admin'}
                            />
                            <MobileNavItem
                                icon="bx-data"
                                label="Data Dapodik"
                                onClick={() => { navigate('/dapodik'); closeAllMenus(); }}
                                active={location.pathname === '/dapodik'}
                                accent={true}
                            />
                            <MobileNavItem
                                icon="bx-chalkboard"
                                label="Data Guru"
                                onClick={() => { navigate('/dataguru'); closeAllMenus(); }}
                                active={location.pathname === '/dataguru'}
                            />
                            <MobileNavItem
                                icon="bx-user-pin"
                                label="Data Siswa"
                                onClick={() => { navigate('/datasiswa'); closeAllMenus(); }}
                                active={location.pathname === '/datasiswa'}
                            />
                            <MobileNavItem
                                icon="bx-message-detail"
                                label="Pesan Admin"
                                onClick={() => { navigate('/admin/pesan'); closeAllMenus(); }}
                                active={location.pathname === '/admin/pesan'}
                            />
                            <MobileNavItem
                                icon="bx-search-alt"
                                label="Riwayat Pencarian"
                                onClick={() => { navigate('/pencarian'); closeAllMenus(); }}
                                active={location.pathname === '/pencarian'}
                            />
                            <MobileNavItem
                                icon="bx-cog"
                                label="Pengaturan Perjalanan"
                                onClick={() => { navigate('/admin/tripsettings'); closeAllMenus(); }}
                                active={location.pathname === '/admin/tripsettings'}
                            />
                        </ul>
                    </div>

                    {/* Desktop Logout Section */}
                    <div className="p-5 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => { handleLogout(); closeAllMenus(); }}
                            className="flex items-center justify-center gap-3 w-full p-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 border border-red-500 shadow-sm"
                        >
                            <i className="bx bx-log-out-circle text-xl"></i>
                            <span className="text-base font-medium">Keluar dari Sistem</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Sistem Manajemen Sekolah v1.0
                        </p>
                    </div>
                </div>

                {/* Overlay for mobile menu - TRANSPARAN TANPA BLUR */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 z-40 md:hidden bg-transparent"
                        onClick={closeAllMenus}
                    />
                )}

                {/* Overlay for desktop menu - TRANSPARAN TANPA BLUR */}
                {isDesktopMenuOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={closeAllMenus}
                    />
                )}
            </nav>

            {/* Spacer to prevent content from being hidden under fixed navbar */}
            <div className="h-16"></div>
        </>
    );
};

// Reusable Mobile Navigation Item Component (No changes needed)
const MobileNavItem = ({ icon, label, onClick, active = false, accent = false }) => {
    const baseStyle = "flex items-center gap-3 p-3 w-full rounded-lg transition-all duration-200 group";
    const activeStyle = active 
        ? `bg-blue-50 text-blue-700 border-l-4 ${accent ? 'border-blue-500' : 'border-blue-400'}` 
        : `text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 ${accent ? 'border-blue-200' : 'border-transparent'}`;
    
    const iconStyle = accent ? (active ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600') : (active ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600');

    return (
        <li>
            <button
                onClick={onClick}
                className={`${baseStyle} ${activeStyle}`}
            >
                <i className={`bx ${icon} text-xl ${iconStyle}`}></i>
                <span className="text-base font-medium">{label}</span>
                {active && (
                    <span className="ml-auto">
                        <i className="bx bx-chevron-right text-blue-400"></i>
                    </span>
                )}
            </button>
        </li>
    );
};

export default AdminNavbar;
