// ============================================
// HOOK UNTUK RATE LIMITING DI CLIENT
// ============================================

import { useState, useCallback, useRef } from 'react';

export const useRateLimit = (options = {}) => {
  const {
    maxRequests = 5,
    windowMs = 60000, // 1 menit
    cooldownMs = 30000 // 30 detik cooldown setelah limit
  } = options;
  
  const [requests, setRequests] = useState([]);
  const [isLimited, setIsLimited] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const timerRef = useRef(null);
  
  const checkLimit = useCallback(() => {
    const now = Date.now();
    
    // Cek cooldown
    if (cooldownUntil && now < cooldownUntil) {
      const waitSeconds = Math.ceil((cooldownUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Terlalu banyak percobaan. Silakan tunggu ${waitSeconds} detik.`,
        waitSeconds
      };
    }
    
    // Hapus request lama
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      // Set cooldown
      setCooldownUntil(now + cooldownMs);
      setIsLimited(true);
      
      // Reset cooldown setelah waktu habis
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsLimited(false);
        setCooldownUntil(null);
        setRequests([]);
      }, cooldownMs);
      
      const waitSeconds = Math.ceil(cooldownMs / 1000);
      return {
        allowed: false,
        reason: `Terlalu banyak percobaan. Silakan tunggu ${waitSeconds} detik.`,
        waitSeconds
      };
    }
    
    // Tambah request baru
    recentRequests.push(now);
    setRequests(recentRequests);
    
    return { allowed: true };
  }, [requests, maxRequests, windowMs, cooldownMs, cooldownUntil]);
  
  const recordSuccess = useCallback(() => {
    // Reset failures saat sukses
    setRequests([]);
    setCooldownUntil(null);
    setIsLimited(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const reset = useCallback(() => {
    setRequests([]);
    setCooldownUntil(null);
    setIsLimited(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  return {
    checkLimit,
    recordSuccess,
    reset,
    isLimited,
    requestCount: requests.length
  };
};

export default useRateLimit;
