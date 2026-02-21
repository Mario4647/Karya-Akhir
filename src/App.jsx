import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Add from "./components/Add";
import Transactions from "./components/Transactions";
import Statistics from "./components/Statistics";
import Budget from "./components/Budget";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";
import ResetPassword from "./components/ResetPassword";

import Form from "./auth/Form";
import UserSearch from "./dashboard-user/pencarian/UserSearch";
import AdminSearchLog from "./pencarian/AdminSearchLog";
import AdminDashboard from "./admin/AdminDashboard";
import DapodikDashboard from "./dashboard-user/DapodikDashboard";
import AdminDapodik from "./dapodik/AdminDapodik";
import MLAccountChecker from "./mlbb/MLAccountChecker";
import AdminGuru from "./dataguru/AdminGuru";
import AdminSiswa from "./datasiswa/AdminSiswa";
import Trip from "./admin/tripsettings/Trip";
import AdminMessage from "./admin/pesan/AdminMessage";
import AdminPIP from "./admin/pip/AdminPIP";
import AdminBansPage from "./admin/banned/AdminBansPage";
import AdminSearchHistory from "./pencarian/pip/AdminSearchHistory";
import CekPIP from "./user/pip/CekPIP";
import UserTripDashboard from "./triplist/UserTripDashboard";

// Import komponen untuk penjualan tiket konser
import ConcertPage from "./pages/User/ConcertPage";
import PaymentPage from "./pages/User/PaymentPage";
import PaymentSuccessPage from "./pages/User/PaymentSuccessPage";
import MyOrdersPage from "./pages/User/MyOrdersPage";
import OrderDetailPage from "./pages/User/OrderDetailPage";

// Admin pages untuk tiket konser
import midtrans from "./api/midtrans";
import AdminConcertDashboard from "./pages/Admin/DashboardPage";
import AdminProducts from "./pages/Admin/ProductsPage";
import AdminPromos from "./pages/Admin/PromosPage";
import AdminOrders from "./pages/Admin/OrdersPage";
import AdminSuccessOrders from "./pages/Admin/SuccessOrdersPage";
import AdminCancelledOrders from "./pages/Admin/CancelledOrdersPage";

// Import ProtectedRoute
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
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

        <section className="min-h-screen pt-24 pb-6 bg-white">
          <div className="container">
            <div className="max-w-7xl mx-auto px-4 mt-6">
              <div className="relative bg-white backdrop-blur-xl shadow-xl border border-gray-100 p-10 md:p-12 rounded-2xl">
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
        {/* Public Route - Halaman login bisa diakses semua orang */}
        <Route path="/auth" element={<Form />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ========== TIKET CONCERT ROUTES ========== */}
        
        {/* Halaman User Tiket - Bisa diakses oleh: user, user-raport, admin, admin-event */}
        <Route path="/concerts" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
            <ConcertPage />
          </ProtectedRoute>
        } />
        <Route path="/payment/:orderId" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/payment-success/:orderId" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
            <PaymentSuccessPage />
          </ProtectedRoute>
        } />
        <Route path="/my-orders" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
            <MyOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/order-detail/:orderId" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
            <OrderDetailPage />
          </ProtectedRoute>
        } />

        {/* Halaman Admin Tiket - Hanya untuk admin dan admin-event */}
        <Route path="/admin/concert-dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminConcertDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/concert-products" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminProducts />
          </ProtectedRoute>
        } />
        <Route path="/admin/concert-promos" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminPromos />
          </ProtectedRoute>
        } />
        <Route path="/admin/concert-orders" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/concert-success-orders" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminSuccessOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/concert-cancelled-orders" element={
          <ProtectedRoute allowedRoles={['admin', 'admin-event']}>
            <AdminCancelledOrders />
          </ProtectedRoute>
        } />

        {/* ========== EXISTING ROUTES (NON-TIKET) ========== */}

{/* Halaman Admin Utama - Hanya untuk admin (bukan admin-event) */}
        <Route path="/api/midtrans" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <midtrans />
          </ProtectedRoute>
        } />
        
        {/* Halaman Admin Utama - Hanya untuk admin (bukan admin-event) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Manajemen Data Guru - Hanya admin */}
        <Route path="/dataguru" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminGuru />
          </ProtectedRoute>
        } />
        
        {/* Manajemen Data Siswa - Hanya admin */}
        <Route path="/datasiswa" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSiswa />
          </ProtectedRoute>
        } />
        
        {/* Dashboard User Raport - Bisa diakses oleh user-raport dan admin */}
        <Route path="/dashboard-user" element={
          <ProtectedRoute allowedRoles={['user-raport', 'admin']}>
            <DapodikDashboard />
          </ProtectedRoute>
        } />
        
        {/* Admin Dapodik - Hanya admin */}
        <Route path="/dapodik" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDapodik />
          </ProtectedRoute>
        } />
        
        {/* ML Account Checker - Bisa diakses semua role yang sudah login */}
        <Route path="/mlbb" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MLAccountChecker />
          </ProtectedRoute>
        } />
        
        {/* User Search - Bisa diakses oleh user-raport dan admin */}
        <Route path="/dashboard-user/pencarian" element={
          <ProtectedRoute allowedRoles={['user-raport', 'admin']}>
            <UserSearch />
          </ProtectedRoute>
        } />
        
        {/* Admin Search Log - Hanya admin */}
        <Route path="/pencarian" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSearchLog />
          </ProtectedRoute>
        } />
        
        {/* Admin Trip Settings - Hanya admin */}
        <Route path="/admin/tripsettings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Trip />
          </ProtectedRoute>
        } />
        
        {/* User Trip List - Bisa diakses oleh user, user-raport, admin, admin-event */}
        <Route path="/triplist" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin']}>
            <UserTripDashboard />
          </ProtectedRoute>
        } />
        
        {/* Admin Message - Hanya admin */}
        <Route path="/admin/pesan" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminMessage />
          </ProtectedRoute>
        } />
        
        {/* Admin PIP - Hanya admin */}
        <Route path="/admin/pip" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPIP />
          </ProtectedRoute>
        } />
        
        {/* Admin Bans - Hanya admin */}
        <Route path="/admin/banned" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBansPage />
          </ProtectedRoute>
        } />
        
        {/* Admin Search History - Hanya admin */}
        <Route path="/pencarian/pip" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSearchHistory />
          </ProtectedRoute>
        } />
        
        {/* User PIP Check - Bisa diakses oleh user, user-raport, admin */}
        <Route path="/user/pip" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin']}>
            <CekPIP />
          </ProtectedRoute>
        } />

        {/* Default route - Dashboard utama */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin', 'admin-event']}>
              <>
                <Navbar />
                <Dashboard />
                <Add />
                <Transactions />
                <Statistics />
                <Budget />
                <Footer />
                <ScrollToTop />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
