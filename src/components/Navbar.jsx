import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { navbarData } from "../data/navbarData.jsx";
import { supabase } from "../supabaseClient";

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleMenuClick = (itemId) => {
        setActiveSection(itemId);
        closeMobileMenu();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        closeMobileMenu();
    };

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkSession();

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session);
        });

        // IntersectionObserver for active section
        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -50% 0px',
            threshold: 0.1
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        navbarData.forEach(item => {
            const section = document.getElementById(item.id);
            if (section) {
                observer.observe(section);
            }
        });

        return () => {
            observer.disconnect();
            authListener.subscription.unsubscribe();
        };
    }, []);

    const isActive = (itemId) => activeSection === itemId;

    return (
        <nav className="bg-white shadow-lg w-full fixed z-50 p-4">
            <div className="container">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xl font-bold text-gray-800 leading-none tracking-wide">
                            <i className="bx bx-money"></i>
                            <span className="hidden sm:inline">Pelacakan Keuangan</span>
                            <span className="sm:hidden">Management Keunangan Pribadi</span>
                        </div>
                        <ul className="hidden md:flex gap-6 items-center">
                            {navbarData.map((item) => (
                                <li key={item.id}>
                                    <a
                                        href={`#${item.id}`}
                                        onClick={() => handleMenuClick(item.id)}
                                        className={`flex items-center gap-2 text-sm lg:text-base px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                            isActive(item.id)
                                                ? 'text-white bg-gray-800'
                                                : 'text-gray-800 hover:text-white hover:bg-gray-600'
                                        }`}
                                    >
                                        <i className={`bx ${item.icon} text-lg`}></i>
                                        <span>{item.label}</span>
                                    </a>
                                </li>
                            ))}
                            {isLoggedIn ? (
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 text-sm lg:text-base px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-all duration-300"
                                    >
                                        <i className="bx bx-log-out text-lg"></i>
                                        <span>Logout</span>
                                    </button>
                                </li>
                            ) : (
                                <li>
                                    <Link
                                        to="/auth"
                                        onClick={closeMobileMenu}
                                        className="flex items-center gap-2 text-sm lg:text-base px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                                    >
                                        <i className="bx bx-log-in text-lg"></i>
                                        <span>Login</span>
                                    </Link>
                                </li>
                            )}
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
            <div className={`fixed top-0 right-0 h-full w-70 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <i className="bx bx-money"></i>
                        Navigation Links
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
                        {navbarData.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    onClick={() => handleMenuClick(item.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group cursor-pointer ${
                                        isActive(item.id)
                                            ? 'text-white bg-gray-800 border-l-4 border-gray-600'
                                            : 'text-gray-800 hover:text-white hover:bg-gray-600 border-l-4 border-transparent hover:border-gray-500'
                                    }`}
                                >
                                    <i className={`bx ${item.icon} text-xl group-hover:scale-110 transition-transform duration-200`}></i>
                                    <span className="text-base font-medium">{item.label}</span>
                                </a>
                            </li>
                        ))}
                        {isLoggedIn ? (
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 p-3 w-full text-white bg-red-600 rounded-lg border-l-4 border-red-500 hover:bg-red-700 transition-all duration-200 group"
                                >
                                    <i className="bx bx-log-out text-xl group-hover:scale-110 transition-transform duration-200"></i>
                                    <span className="text-base font-medium">Logout</span>
                                </button>
                            </li>
                        ) : (
                            <li>
                                <Link
                                    to="/auth"
                                    onClick={closeMobileMenu}
                                    className="flex items-center gap-3 p-3 w-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg border-l-4 border-blue-500 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 group"
                                >
                                    <i className="bx bx-log-in text-xl group-hover:scale-110 transition-transform duration-200"></i>
                                    <span className="text-base font-medium">Login</span>
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
                <div className="border-t border-gray-400 p-6 bg-white shadow-lg">
                    <div className="text-center space-y-1">
                        <p className="text-xs text-gray-800">Management Keuangan v1.0</p>
                        <p className="text-xs text-gray-800">© {new Date().getFullYear()} Karya Akhir Procommit 2025</p>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
