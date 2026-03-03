// ============================================
// SISTEM KEAMANAN KOMPREHENSIF
// ============================================

import { useState, useCallback, useRef } from 'react';

// ============================================
// 1. XSS PREVENTION
// ============================================
export const sanitizeInput = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);
  
  return input
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .trim();
};

// ============================================
// 2. DEEP SANITIZATION
// ============================================
export const deepSanitize = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = deepSanitize(value);
    }
    return sanitized;
  }
  
  return obj;
};

// ============================================
// 3. SQL INJECTION PREVENTION
// ============================================
export const escapeSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/'/g, "''")
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|MERGE|SELECT|UPDATE|UNION)\b/gi, '');
};

// ============================================
// 4. RATE LIMITING
// ============================================
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 30;
    this.maxConsecutiveFails = options.maxConsecutiveFails || 5;
    this.requests = new Map();
    this.failures = new Map();
    this.blocked = new Map();
  }

  check(key, endpoint = 'default') {
    const now = Date.now();
    const requestKey = `${key}:${endpoint}`;
    
    if (this.isBlocked(key)) {
      return { allowed: false, reason: 'IP diblokir permanen', blockExpiry: this.blocked.get(key) };
    }
    
    this.cleanOldRequests();
    
    const userRequests = this.requests.get(requestKey) || [];
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return { 
        allowed: false, 
        reason: 'Terlalu banyak request. Silakan tunggu beberapa saat.',
        retryAfter: Math.ceil((this.windowMs - (now - validRequests[0])) / 1000)
      };
    }
    
    validRequests.push(now);
    this.requests.set(requestKey, validRequests);
    
    return { allowed: true };
  }

  recordFailure(key) {
    const now = Date.now();
    const failures = this.failures.get(key) || [];
    
    const recentFailures = failures.filter(time => now - time < 15 * 60 * 1000);
    recentFailures.push(now);
    
    this.failures.set(key, recentFailures);
    
    if (recentFailures.length >= this.maxConsecutiveFails) {
      this.blockTemporarily(key, 30 * 60 * 1000);
    }
  }

  blockTemporarily(key, duration) {
    this.blocked.set(key, Date.now() + duration);
    
    setTimeout(() => {
      this.blocked.delete(key);
    }, duration);
  }

  isBlocked(key) {
    const blockExpiry = this.blocked.get(key);
    if (!blockExpiry) return false;
    
    if (Date.now() > blockExpiry) {
      this.blocked.delete(key);
      return false;
    }
    
    return true;
  }

  cleanOldRequests() {
    const now = Date.now();
    
    for (const [key, times] of this.requests.entries()) {
      const validTimes = times.filter(time => now - time < this.windowMs);
      if (validTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimes);
      }
    }
  }

  reset() {
    this.requests.clear();
    this.failures.clear();
    this.blocked.clear();
  }
}

// Singleton instance
export const globalRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  maxConsecutiveFails: 5
});

// React Hook untuk rate limiting
export const useRateLimit = (options = {}) => {
  const {
    maxRequests = 5,
    windowMs = 60000,
    cooldownMs = 30000
  } = options;
  
  const [requests, setRequests] = useState([]);
  const [isLimited, setIsLimited] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const timerRef = useRef(null);
  
  const checkLimit = useCallback(() => {
    const now = Date.now();
    
    if (cooldownUntil && now < cooldownUntil) {
      const waitSeconds = Math.ceil((cooldownUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Terlalu banyak percobaan. Silakan tunggu ${waitSeconds} detik.`,
        waitSeconds
      };
    }
    
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      setCooldownUntil(now + cooldownMs);
      setIsLimited(true);
      
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
    
    recentRequests.push(now);
    setRequests(recentRequests);
    
    return { allowed: true };
  }, [requests, maxRequests, windowMs, cooldownMs, cooldownUntil]);
  
  const recordSuccess = useCallback(() => {
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

// ============================================
// 5. CSRF PROTECTION
// ============================================
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) return false;
  return token === storedToken;
};

// ============================================
// 6. PASSWORD STRENGTH VALIDATION
// ============================================
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung angka');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password harus mengandung karakter khusus (!@#$%^&*)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// 7. EMAIL VALIDATION
// ============================================
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// ============================================
// 8. NIK VALIDATION
// ============================================
export const validateNIK = (nik) => {
  const nikRegex = /^\d{16}$/;
  return nikRegex.test(nik);
};

// ============================================
// 9. PHONE NUMBER VALIDATION
// ============================================
export const validatePhone = (phone) => {
  const phoneRegex = /^(08|62)\d{8,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// ============================================
// 10. FORMAT PHONE UNTUK MIDTRANS
// ============================================
export const formatPhoneForMidtrans = (phone) => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  return cleanPhone;
};

// ============================================
// 11. INPUT VALIDATION
// ============================================
export const validateInput = (value, rules) => {
  const errors = [];
  
  if (rules.required && (!value || value.trim() === '')) {
    errors.push('Field harus diisi');
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimal ${rules.minLength} karakter`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maksimal ${rules.maxLength} karakter`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || 'Format tidak valid');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// 12. DEBOUNCE
// ============================================
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============================================
// 13. THROTTLE
// ============================================
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================
// 14. DETECT SUSPICIOUS INPUT
// ============================================
export const isSuspiciousInput = (input) => {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /--\s*$/i,
    /\bUNION\s+SELECT\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bEXEC\b/i,
    /\.\.\/\.\.\//i,
    /\\\\/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// ============================================
// 15. GENERATE RANDOM TOKEN
// ============================================
export const generateToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Export semua
export default {
  sanitizeInput,
  deepSanitize,
  escapeSQL,
  RateLimiter,
  globalRateLimiter,
  useRateLimit,
  generateCSRFToken,
  validateCSRFToken,
  validatePasswordStrength,
  validateEmail,
  validateNIK,
  validatePhone,
  formatPhoneForMidtrans,
  validateInput,
  debounce,
  throttle,
  isSuspiciousInput,
  generateToken
};
