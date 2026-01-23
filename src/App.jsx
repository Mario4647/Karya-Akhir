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
import UserTripDashboard from "./triplist/UserTripDashboard";


function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2-second delay
    return () => clearTimeout(timer);
  }, []);

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
        {/* Route untuk halaman login */}
        <Route path="/auth" element={<Form />} />
            <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dataguru" element={<AdminGuru />} />
        <Route path="/datasiswa" element={<AdminSiswa />} />
        <Route path="/dashboard-user" element={<DapodikDashboard />} />
        <Route path="/dapodik" element={<AdminDapodik />} />
        <Route path="/mlbb" element={<MLAccountChecker />} />
        <Route path="/dashboard-user/pencarian" element={<UserSearch />} />
        <Route path="/pencarian" element={<AdminSearchLog />} />
        <Route path="/admin/tripsettings" element={<Trip />} />
        <Route path="/triplist" element={<UserTripDashboard />} />
      <Route path="/admin/pesan" element={<AdminMessage />}
<Route path="/reset-password" element={<ResetPassword />} />
        {/* Route untuk halaman utama (dashboard) */}
        <Route
          path="/"
          element={
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
          }
        />
      </Routes>
    </>
  );
}

export default App;
