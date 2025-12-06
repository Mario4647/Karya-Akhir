import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient"; // Import supabase client

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
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Setup auth listener dan cek session
  useEffect(() => {
    // Cek session yang sudah ada
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession) {
          // Ambil role user dari profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', currentSession.user.id)
            .single();
            
          if (!error && profile) {
            setUserRole(profile.roles);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        
        setSession(currentSession);
        
        if (currentSession) {
          // Ambil role user
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', currentSession.user.id)
            .single();
            
          if (!error && profile) {
            setUserRole(profile.roles);
          }
          
          // Redirect berdasarkan role setelah login
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              if (profile?.roles === 'admin') {
                navigate('/admin');
              } else if (profile?.roles === 'user-raport') {
                navigate('/dashboard-user');
              } else {
                navigate('/');
              }
            }, 100);
          }
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Private Route Component dengan role checking
  const PrivateRoute = ({ children, allowedRoles = [] }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/auth" />;
    }

    // Jika ada role restriction, cek role user
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Redirect ke halaman sesuai role
      if (userRole === 'admin') {
        return <Navigate to="/admin" />;
      } else if (userRole === 'user-raport') {
        return <Navigate to="/dashboard-user" />;
      } else {
        return <Navigate to="/" />;
      }
    }

    return children;
  };

  // Loading skeleton
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
    <Routes>
      {/* Route untuk halaman login */}
      <Route 
        path="/auth" 
        element={
          session ? (
            <Navigate to={
              userRole === 'admin' ? '/admin' : 
              userRole === 'user-raport' ? '/dashboard-user' : 
              '/'
            } />
          ) : (
            <Form />
          )
        } 
      />
      
      {/* Route untuk halaman utama (dashboard) */}
      <Route
        path="/"
        element={
          <PrivateRoute>
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
          </PrivateRoute>
        }
      />
      
      {/* Route untuk admin dashboard */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      
      {/* Route untuk dashboard user dapodik */}
      <Route
        path="/dashboard-user"
        element={
          <PrivateRoute allowedRoles={['user-raport', 'admin']}>
            <DapodikDashboard />
          </PrivateRoute>
        }
      />
      
      {/* Route untuk admin dapodik */}
      <Route
        path="/dapodik"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDapodik />
          </PrivateRoute>
        }
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
