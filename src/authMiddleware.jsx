// ============================================
// MIDDLEWARE UNTUK PROTEKSI ROUTE
// ============================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { globalRateLimiter } from '../utils/security';

export const withAuth = (WrappedComponent, allowedRoles = ['user', 'admin', 'admin-event']) => {
  return (props) => {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading && !user) {
        navigate('/auth');
      }
      
      if (!loading && user && !allowedRoles.includes(profile?.roles)) {
        navigate('/');
      }
    }, [loading, user, profile, navigate]);
    
    if (loading) {
      return (
        <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700">Memeriksa autentikasi...</p>
          </div>
        </div>
      );
    }
    
    if (!user || !allowedRoles.includes(profile?.roles)) {
      return null;
    }
    
    return <WrappedComponent {...props} user={user} profile={profile} />;
  };
};

// HOC untuk public routes (seperti login)
export const withoutAuth = (WrappedComponent) => {
  return (props) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading && user) {
        navigate('/');
      }
    }, [loading, user, navigate]);
    
    if (loading) {
      return (
        <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700">Memuat...</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Rate limiting middleware untuk API calls
export const withRateLimit = (handler, options = {}) => {
  const {
    maxRequests = 30,
    windowMs = 60000,
    keyGenerator = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress
  } = options;
  
  return async (req, res) => {
    const key = keyGenerator(req);
    const rateCheck = globalRateLimiter.check(key);
    
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.reason,
        retryAfter: rateCheck.retryAfter
      });
    }
    
    return handler(req, res);
  };
};
