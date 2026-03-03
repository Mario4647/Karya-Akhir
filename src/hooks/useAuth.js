// ============================================
// AUTHENTICATION HOOK DENGAN KEAMANAN
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { globalRateLimiter } from '../utils/security';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 menit
  const WARNING_BEFORE = 5 * 60 * 1000; // 5 menit sebelum logout
  
  useEffect(() => {
    let inactivityTimer;
    let warningTimer;
    
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
          setUser(user);
          await fetchProfile(user.id);
          resetInactivityTimer();
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
    };
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      
      if (user) {
        // Warning 5 menit sebelum logout
        warningTimer = setTimeout(() => {
          // Tampilkan warning ke user (bisa via context/global state)
          window.dispatchEvent(new CustomEvent('session-warning', {
            detail: { timeLeft: 5 * 60 }
          }));
        }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
        
        // Logout setelah 30 menit tidak aktif
        inactivityTimer = setTimeout(async () => {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          navigate('/auth');
          
          window.dispatchEvent(new CustomEvent('session-expired'));
        }, INACTIVITY_TIMEOUT);
      }
    };
    
    checkAuth();
    
    // Event listeners untuk aktivitas user
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      if (user) {
        resetInactivityTimer();
      }
    };
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user);
        fetchProfile(session.user.id);
        resetInactivityTimer();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
        navigate('/auth');
      }
    });
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      subscription.unsubscribe();
    };
  }, [navigate, user]);
  
  const login = async (email, password) => {
    // Rate limiting
    const rateCheck = globalRateLimiter.check(email, 'login');
    if (!rateCheck.allowed) {
      return { error: rateCheck.reason };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        globalRateLimiter.recordFailure(email);
        return { error: error.message };
      }
      
      globalRateLimiter.recordSuccess?.(email);
      return { success: true, data };
    } catch (error) {
      return { error: error.message };
    }
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  
  return {
    user,
    profile,
    loading,
    error,
    login,
    logout
  };
};

export default useAuth;
