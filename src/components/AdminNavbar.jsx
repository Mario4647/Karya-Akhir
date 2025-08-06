import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AdminNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        closeMobileMenu();
    };

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setUserEmail(session.user.email);
            }
        };
        getSession();
    }, []);

    return (
        <nav className="bg-white shadow-lg w-full fixed z-50 p-4">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xl font-bold text-gray-800 leading-none tracking-wide">
                            <i className="bx bx-money"></i>
                            <span>Admin Dashboard</span>
                        </div>
                        <ul className="hidden md:flex gap-6 items-center">
                            <li>
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2 text-sm lg:text-base px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-white bg-gradient-to-r from-blue-500 to-purple-500"
                                >
                                    <i className="bx bx-dashboard text-lg"></i>
                                    <span>Dashboard</span>
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm lg:text-base px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                                >
                                    <i className="bx bx-log-out text-lg"></i>
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden flex items-center justify-center w-10 h-10 text-gray-800 hover:text-indigo-500 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            <div className={`fixed top-0 right-0 h-full w-70 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <i className="bx bx-money"></i>
                        Admin Menu
                    </div>
                    <button
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center w-8 h-8 text-gray-800 hover:text-indigo-500 transition-colors duration-200"
                        aria-label="Close mobile menu"
                    >
                        <i className="bx bx-x text-xl"></i>
                    </button>
                </div>
                <div className="flex-1 p-6">
                    <ul className="space-y-2">
                        <li>
                            <Link
                                to="/admin"
                                onClick={closeMobileMenu}
                                className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group cursor-pointer text-white bg-gradient-to-r from-blue-500 to-purple-500"
                            >
                                <i className="bx bx-dashboard text-xl"></i>
                                <span className="text-base font-medium">Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 p-3 w-full text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 group"
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
