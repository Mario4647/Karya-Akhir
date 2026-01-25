import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AdminNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

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

    return (
        <nav className="bg-gradient-to-r from-indigo-700 to-purple-800 shadow-lg w-full fixed z-50 p-4">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xl font-bold text-white leading-none tracking-wide">
                            <i className="bx bx-shield-quarter"></i>
                            <span className="hidden sm:inline">Admin Dashboard</span>
                            <span className="sm:hidden">Admin</span>
                        </div>
                        <ul className="hidden md:flex gap-4 items-center">
                            <li>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-gray-100 transition-all duration-300"
                                >
                                    <i className="bx bx-dashboard"></i>
                                    <span>Dashboard</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/dapodik')}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                                >
                                    <i className="bx bx-file"></i>
                                    <span>Dapodik</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/admin/pesan')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all duration-300"
                                >
                                    <i className="bx bx-home"></i>
                                    <span>Pesan Admin</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/dataguru')}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                                >
                                    <i className="bx bx-file"></i>
                                    <span>Data Guru</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/datasiswa')}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                                >
                                    <i className="bx bx-file"></i>
                                    <span>Data Siswa</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/pencarian')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all duration-300"
                                >
                                    <i className="bx bx-home"></i>
                                    <span>Riwayat Pencarian</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/admin/tripsettings')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all duration-300"
                                >
                                    <i className="bx bx-home"></i>
                                    <span>Pengaturan Perjalanan</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                                >
                                    <i className="bx bx-log-out"></i>
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden flex items-center justify-center w-10 h-10 text-white hover:text-gray-300 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-indigo-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex justify-between items-center p-6 border-b border-indigo-700">
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                        <i className="bx bx-shield-quarter"></i>
                        Admin Menu
                    </div>
                    <button
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center w-8 h-8 text-white hover:text-gray-300 transition-colors duration-200"
                        aria-label="Close mobile menu"
                    >
                        <i className="bx bx-x text-xl"></i>
                    </button>
                </div>
                <div className="flex-1 p-6">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => { navigate('/admin'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-indigo-700 rounded-lg border-l-4 border-blue-400 hover:bg-indigo-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-dashboard text-xl"></i>
                                <span className="text-base font-medium">Admin Dashboard</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/dapodik'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-purple-700 rounded-lg border-l-4 border-purple-400 hover:bg-purple-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-file text-xl"></i>
                                <span className="text-base font-medium">Dapodik</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/admin/pesan'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-gray-700 rounded-lg border-l-4 border-gray-400 hover:bg-gray-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-home text-xl"></i>
                                <span className="text-base font-medium">Pesan Admin</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/dataguru'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-purple-700 rounded-lg border-l-4 border-purple-400 hover:bg-purple-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-file text-xl"></i>
                                <span className="text-base font-medium">Dapodik Data Guru</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/datasiswa'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-purple-700 rounded-lg border-l-4 border-purple-400 hover:bg-purple-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-file text-xl"></i>
                                <span className="text-base font-medium">Dapodik Data Siswa</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/pencarian'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-gray-700 rounded-lg border-l-4 border-gray-400 hover:bg-gray-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-home text-xl"></i>
                                <span className="text-base font-medium">Riwayat Pencarian</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { navigate('/admin/tripsettings'); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-gray-700 rounded-lg border-l-4 border-gray-400 hover:bg-gray-600 transition-all duration-200 group"
                            >
                                <i className="bx bx-home text-xl"></i>
                                <span className="text-base font-medium">Pengaturan Perjalanan</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { handleLogout(); closeMobileMenu(); }}
                                className="flex items-center gap-3 p-3 w-full text-white bg-red-600 rounded-lg border-l-4 border-red-400 hover:bg-red-700 transition-all duration-200 group"
                            >
                                <i className="bx bx-log-out text-xl"></i>
                                <span className="text-base font-medium">Logout</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;
