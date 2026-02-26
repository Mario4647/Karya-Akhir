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
        {/* Skeleton loading - sama seperti sebelumnya */}
        <nav className="bg-white shadow-lg w-full fixed z-50 p-4">
          {/* ... skeleton navbar ... */}
        </nav>
        <section className="min-h-screen pt-24 pb-6 bg-white">
          {/* ... skeleton content ... */}
        </section>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* ========== PUBLIC ROUTES (TIDAK PERLU PROTECTED ROUTE) ========== */}
        <Route path="/auth" element={<Form />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ========== TIKET CONCERT ROUTES ========== */}
        
        {/* Halaman User Tiket */}
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

        {/* Halaman Admin Tiket */}
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

        {/* ========== EXISTING ROUTES ========== */}
        
        {/* Admin Utama */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dataguru" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminGuru />
          </ProtectedRoute>
        } />
        
        <Route path="/datasiswa" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSiswa />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard-user" element={
          <ProtectedRoute allowedRoles={['user-raport', 'admin']}>
            <DapodikDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dapodik" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDapodik />
          </ProtectedRoute>
        } />
        
        <Route path="/mlbb" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MLAccountChecker />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard-user/pencarian" element={
          <ProtectedRoute allowedRoles={['user-raport', 'admin']}>
            <UserSearch />
          </ProtectedRoute>
        } />
        
        <Route path="/pencarian" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSearchLog />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/tripsettings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Trip />
          </ProtectedRoute>
        } />
        
        <Route path="/triplist" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin']}>
            <UserTripDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/pesan" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminMessage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/pip" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPIP />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/banned" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBansPage />
          </ProtectedRoute>
        } />
        
        <Route path="/pencarian/pip" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSearchHistory />
          </ProtectedRoute>
        } />
        
        <Route path="/user/pip" element={
          <ProtectedRoute allowedRoles={['user', 'user-raport', 'admin']}>
            <CekPIP />
          </ProtectedRoute>
        } />

        {/* Default route */}
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
