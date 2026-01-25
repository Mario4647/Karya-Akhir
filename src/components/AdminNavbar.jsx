import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AdminNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('');
    const navigate = useNavigate();

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

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    // Warna tema formal: Navy Blue, Dark Slate Blue, dengan aksen emas
    const navbarColors = {
        primary: 'from-navy-800 to-slate-900',
        primarySolid: 'bg-navy-800',
        secondary: 'bg-slate-800',
        accent: 'bg-gold-500',
        hover: 'hover:bg-navy-700',
        text: 'text-white',
        border: 'border-navy-600'
    };

    return (
        <nav className={`bg-gradient-to-r ${navbarColors.primary} shadow-xl w-full fixed z-50 py-3 px-4 border-b ${navbarColors.border}`}>
            <div className="container mx-auto">
                <div className="flex justify-between items-center">
                    {/* Logo & Brand - Desktop */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${navbarColors.accent} shadow-lg`}>
                            <i className="bx bx-shield-alt-2 text-xl text-white"></i>
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-white leading-tight">
                                Admin Portal
                            </h1>
                            <p className="text-xs text-gray-300">Sistem Manajemen Sekolah</p>
                        </div>
                        <div className="md:hidden">
                            <h1 className="text-lg font-bold text-white">Admin</h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        {/* Menu Items */}
                        <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                            <NavButton
                                icon="bx-dashboard"
                                label="Dashboard"
                                onClick={() => navigate('/admin')}
                                active={location.pathname === '/admin'}
                                variant="primary"
                            />
                            <NavButton
                                icon="bx-data"
                                label="Dapodik"
                                onClick={() => navigate('/dapodik')}
                                active={location.pathname === '/dapodik'}
                                variant="accent"
                            />
                            <NavButton
                                icon="bx-chalkboard"
                                label="Data Guru"
                                onClick={() => navigate('/dataguru')}
                                active={location.pathname === '/dataguru'}
                                variant="secondary"
                            />
                            <NavButton
                                icon="bx-user-pin"
                                label="Data Siswa"
                                onClick={() => navigate('/datasiswa')}
                                active={location.pathname === '/datasiswa'}
                                variant="secondary"
                            />
                            <NavButton
                                icon="bx-message-detail"
                                label="Pesan"
                                onClick={() => navigate('/admin/pesan')}
                                active={location.pathname === '/admin/pesan'}
                                variant="secondary"
                            />
                            <NavButton
                                icon="bx-search-alt"
                                label="Pencarian"
                                onClick={() => navigate('/pencarian')}
                                active={location.pathname === '/pencarian'}
                                variant="secondary"
                            />
                            <NavButton
                                icon="bx-cog"
                                label="Pengaturan"
                                onClick={() => navigate('/admin/tripsettings')}
                                active={location.pathname === '/admin/tripsettings'}
                                variant="secondary"
                            />
                        </div>

                        {/* User Profile & Logout */}
                        <div className="flex items-center space-x-2 ml-2">
                            {/* User Profile Circle */}
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full ${navbarColors.accent} flex items-center justify-center shadow-lg cursor-pointer hover:opacity-90 transition-opacity`}>
                                    <span className="text-white font-bold text-lg">{userInitial}</span>
                                </div>
                                <div className="hidden lg:block">
                                    <p className="text-sm font-medium text-white">{userName}</p>
                                    <p className="text-xs text-gray-300">Administrator</p>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-300 shadow hover:shadow-lg border border-red-600"
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
                        <div className={`w-9 h-9 rounded-full ${navbarColors.accent} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-bold">{userInitial}</span>
                        </div>
                        
                        <button
                            onClick={toggleMobileMenu}
                            className={`flex items-center justify-center w-10 h-10 rounded-lg ${navbarColors.hover} transition-colors duration-200`}
                            aria-label="Toggle mobile menu"
                        >
                            <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl text-white`}></i>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 h-full w-72 ${navbarColors.primarySolid} shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-5 border-b border-navy-700 bg-navy-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${navbarColors.accent} flex items-center justify-center`}>
                            <i className="bx bx-shield-alt-2 text-xl text-white"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Menu Admin</h2>
                            <p className="text-xs text-gray-300">Sistem Manajemen</p>
                        </div>
                    </div>
                    <button
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center w-8 h-8 text-white hover:text-gray-300 transition-colors duration-200"
                        aria-label="Close mobile menu"
                    >
                        <i className="bx bx-x text-xl"></i>
                    </button>
                </div>

                {/* User Profile Section - Mobile */}
                <div className="p-5 border-b border-navy-700 bg-navy-900/30">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${navbarColors.accent} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-bold text-xl">{userInitial}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">{userName}</h3>
                            <p className="text-sm text-gray-300">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Items */}
                <div className="flex-1 p-5 overflow-y-auto">
                    <ul className="space-y-1">
                        <MobileNavItem
                            icon="bx-dashboard"
                            label="Dashboard"
                            onClick={() => { navigate('/admin'); closeMobileMenu(); }}
                            active={location.pathname === '/admin'}
                        />
                        <MobileNavItem
                            icon="bx-data"
                            label="Data Dapodik"
                            onClick={() => { navigate('/dapodik'); closeMobileMenu(); }}
                            active={location.pathname === '/dapodik'}
                            accent={true}
                        />
                        <MobileNavItem
                            icon="bx-chalkboard"
                            label="Data Guru"
                            onClick={() => { navigate('/dataguru'); closeMobileMenu(); }}
                            active={location.pathname === '/dataguru'}
                        />
                        <MobileNavItem
                            icon="bx-user-pin"
                            label="Data Siswa"
                            onClick={() => { navigate('/datasiswa'); closeMobileMenu(); }}
                            active={location.pathname === '/datasiswa'}
                        />
                        <MobileNavItem
                            icon="bx-message-detail"
                            label="Pesan Admin"
                            onClick={() => { navigate('/admin/pesan'); closeMobileMenu(); }}
                            active={location.pathname === '/admin/pesan'}
                        />
                        <MobileNavItem
                            icon="bx-search-alt"
                            label="Riwayat Pencarian"
                            onClick={() => { navigate('/pencarian'); closeMobileMenu(); }}
                            active={location.pathname === '/pencarian'}
                        />
                        <MobileNavItem
                            icon="bx-cog"
                            label="Pengaturan Perjalanan"
                            onClick={() => { navigate('/admin/tripsettings'); closeMobileMenu(); }}
                            active={location.pathname === '/admin/tripsettings'}
                        />
                    </ul>
                </div>

                {/* Mobile Logout Section */}
                <div className="p-5 border-t border-navy-700 bg-navy-900/50">
                    <button
                        onClick={() => { handleLogout(); closeMobileMenu(); }}
                        className="flex items-center justify-center gap-3 w-full p-3 text-white bg-red-700 rounded-lg hover:bg-red-800 transition-all duration-200 border border-red-600"
                    >
                        <i className="bx bx-log-out-circle text-xl"></i>
                        <span className="text-base font-medium">Keluar dari Sistem</span>
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">
                        Sistem Manajemen Sekolah v1.0
                    </p>
                </div>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}
        </nav>
    );
};

// Reusable Desktop Navigation Button Component
const NavButton = ({ icon, label, onClick, active = false, variant = 'primary' }) => {
    const variantStyles = {
        primary: active 
            ? 'bg-navy-700 text-white border-navy-500' 
            : 'text-gray-300 hover:bg-navy-700 hover:text-white border-transparent',
        accent: active 
            ? 'bg-gold-600 text-navy-900 border-gold-400' 
            : 'text-gray-300 hover:bg-gold-600 hover:text-navy-900 border-transparent',
        secondary: active 
            ? 'bg-slate-700 text-white border-slate-500' 
            : 'text-gray-300 hover:bg-slate-700 hover:text-white border-transparent'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${variantStyles[variant]} min-w-[100px] justify-center`}
            title={label}
        >
            <i className={`bx ${icon} text-lg`}></i>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
};

// Reusable Mobile Navigation Item Component
const MobileNavItem = ({ icon, label, onClick, active = false, accent = false }) => {
    const baseStyle = "flex items-center gap-3 p-3 w-full rounded-lg transition-all duration-200 group";
    const activeStyle = active 
        ? `bg-navy-700 text-white border-l-4 ${accent ? 'border-gold-400' : 'border-blue-400'}` 
        : `text-gray-300 hover:bg-navy-700 hover:text-white border-l-4 ${accent ? 'border-gold-400/30' : 'border-transparent'}`;
    
    const iconStyle = accent ? 'text-gold-400' : 'text-gray-400 group-hover:text-white';

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
                        <i className="bx bx-chevron-right text-gray-400"></i>
                    </span>
                )}
            </button>
        </li>
    );
};

export default AdminNavbar;
