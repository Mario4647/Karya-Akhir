import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Add from "./components/Add";
import Transactions from "./components/Transactions";
import Statistics from "./components/Statistics";
import Budget from "./components/Budget";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";

import Form from "./auth/Form";
import AdminDashboard from "./admin/AdminDashboard";
import DapodikDashboard from "./dashboard-user/DapodikDashboard";
import AdminDapodik from "./dapodik/AdminDapodik";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Hanya check authentication tanpa loading delay
  useEffect(() => {
    // Check authentication status (simple example)
    const token = localStorage.getItem('auth_token');
    const userLoggedIn = !!token;
    
    setIsAuthenticated(userLoggedIn);
    
    // Simulate minimal loading untuk UI
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced to 500ms hanya untuk UI
    
    return () => clearTimeout(timer);
  }, []);

  // Handle login success
  const handleLoginSuccess = () => {
    localStorage.setItem('auth_token', 'user_token'); // Contoh sederhana
    setIsAuthenticated(true);
    navigate('/');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    navigate('/auth');
  };

  // Jika masih loading, tampilkan skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Skeleton Navbar */}
        <nav className="bg-white shadow-lg w-full fixed z-50 p-4">
          <div className="container">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="hidden sm:block w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="sm:hidden w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="hidden md:flex gap-6 items-center">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                  <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="md:hidden w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Skeleton Dashboard */}
        <section className="min-h-screen pt-24 pb-6 bg-white">
          <div className="container">
            <div className="max-w-7xl mx-auto px-4 mt-6">
              <div className="relative bg-white backdrop-blur-xl shadow-xl border border-gray-100 p-10 md:p-12 rounded-2xl">
                {/* Profile Section */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                {/* Date and Text Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-40 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2 pl-5">
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                {/* Cards Section */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center p-4 bg-gray-100 rounded-xl shadow-lg animate-pulse"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                      <div>
                        <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="w-32 h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Route untuk halaman login - pass handleLoginSuccess sebagai prop */}
        <Route path="/auth" element={<Form onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Route untuk admin dashboard */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? <AdminDashboard onLogout={handleLogout} /> : <Form onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        {/* Route untuk dashboard user dapodik */}
        <Route 
          path="/dashboard-user" 
          element={
            isAuthenticated ? <DapodikDashboard onLogout={handleLogout} /> : <Form onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        {/* Route untuk admin dapodik */}
        <Route 
          path="/dapodik" 
          element={
            isAuthenticated ? <AdminDapodik onLogout={handleLogout} /> : <Form onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        {/* Route untuk halaman utama (dashboard) */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <>
                <Navbar onLogout={handleLogout} />
                <Dashboard />
                <Add />
                <Transactions />
                <Statistics />
                <Budget />
                <Footer />
                <ScrollToTop />
              </>
            ) : (
              <Form onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
