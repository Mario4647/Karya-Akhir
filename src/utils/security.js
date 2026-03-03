// ============================================
// SISTEM KEAMANAN KOMPREHENSIF
// Mencakup: XSS Prevention, SQL Injection Prevention,
// Rate Limiting, Brute Force Protection, CSRF Protection,
// Input Validation, Output Encoding, dan banyak lagi
// ============================================

/**
 * 1. XSS PREVENTION - Sanitasi input untuk mencegah XSS
 */
export const sanitizeInput = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);
  
  // Hapus karakter berbahaya
  return input
    .replace(/[<>]/g, '') // Hapus < dan >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .trim();
};

/**
 * 2. DEEP SANITIZATION - Untuk objek dan array
 */
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

/**
 * 3. SQL INJECTION PREVENTION - Escape string untuk query
 */
export const escapeSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  // Escape karakter berbahaya untuk SQL
  return input
    .replace(/'/g, "''")
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|MERGE|SELECT|UPDATE|UNION)\b/gi, '');
};

/**
 * 4. RATE LIMITING - Mencegah brute force dan DDoS
 */
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // Default: 1 menit
    this.maxRequests = options.maxRequests || 30; // Default: 30 request per menit
    this.maxConsecutiveFails = options.maxConsecutiveFails || 5; // Default: 5 gagal beruntun
    this.requests = new Map();
    this.failures = new Map();
    this.blocked = new Map();
  }

  // Cek apakah request diizinkan
  check(key, endpoint = 'default') {
    const now = Date.now();
    const requestKey = `${key}:${endpoint}`;
    
    // Cek apakah diblokir permanen
    if (this.isBlocked(key)) {
      return { allowed: false, reason: 'IP diblokir permanen', blockExpiry: this.blocked.get(key) };
    }
    
    // Bersihkan request lama
    this.cleanOldRequests();
    
    // Dapatkan data request
    const userRequests = this.requests.get(requestKey) || [];
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    // Cek apakah melebihi batas
    if (validRequests.length >= this.maxRequests) {
      return { 
        allowed: false, 
        reason: 'Terlalu banyak request. Silakan tunggu beberapa saat.',
        retryAfter: Math.ceil((this.windowMs - (now - validRequests[0])) / 1000)
      };
    }
    
    // Simpan request baru
    validRequests.push(now);
    this.requests.set(requestKey, validRequests);
    
    return { allowed: true };
  }

  // Catat percobaan gagal (untuk brute force protection)
  recordFailure(key) {
    const now = Date.now();
    const failures = this.failures.get(key) || [];
    
    // Hapus failure lama (> 15 menit)
    const recentFailures = failures.filter(time => now - time < 15 * 60 * 1000);
    recentFailures.push(now);
    
    this.failures.set(key, recentFailures);
    
    // Jika terlalu banyak gagal, blokir sementara
    if (recentFailures.length >= this.maxConsecutiveFails) {
      this.blockTemporarily(key, 30 * 60 * 1000); // Blokir 30 menit
    }
  }

  // Blokir sementara
  blockTemporarily(key, duration) {
    this.blocked.set(key, Date.now() + duration);
    
    // Hapus setelah durasi
    setTimeout(() => {
      this.blocked.delete(key);
    }, duration);
  }

  // Cek apakah diblokir
  isBlocked(key) {
    const blockExpiry = this.blocked.get(key);
    if (!blockExpiry) return false;
    
    if (Date.now() > blockExpiry) {
      this.blocked.delete(key);
      return false;
    }
    
    return true;
  }

  // Bersihkan request lama
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

  // Reset untuk testing
  reset() {
    this.requests.clear();
    this.failures.clear();
    this.blocked.clear();
  }
}

// Singleton instance untuk digunakan di seluruh aplikasi
export const globalRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 menit
  maxRequests: 30, // 30 request per menit
  maxConsecutiveFails: 5 // 5 gagal beruntun
});

/**
 * 5. CSRF PROTECTION - Token generation dan validation
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) return false;
  return token === storedToken;
};

/**
 * 6. PASSWORD STRENGTH VALIDATION
 */
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

/**
 * 7. EMAIL VALIDATION
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * 8. NIK VALIDATION (16 digit angka)
 */
export const validateNIK = (nik) => {
  const nikRegex = /^\d{16}$/;
  return nikRegex.test(nik);
};

/**
 * 9. PHONE NUMBER VALIDATION (Indonesia)
 */
export const validatePhone = (phone) => {
  // Format: 08xx atau 62xx, 10-13 digit
  const phoneRegex = /^(08|62)\d{8,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * 10. FORMAT PHONE UNTUK MIDTRANS
 */
export const formatPhoneForMidtrans = (phone) => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  return cleanPhone;
};

/**
 * 11. INPUT VALIDATION GENERIC
 */
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

/**
 * 12. DEBOUNCE - Mencegah spam klik
 */
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

/**
 * 13. THROTTLE - Membatasi frekuensi eksekusi
 */
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

/**
 * 14. ENCRYPT/DECRYPT SENSITIVE DATA (Client-side)
 * Catatan: Ini hanya obfuscation, bukan enkripsi sebenarnya
 * Untuk production, gunakan server-side encryption
 */
export const obfuscate = (text) => {
  return btoa(encodeURIComponent(text));
};

export const deobfuscate = (obfuscated) => {
  try {
    return decodeURIComponent(atob(obfuscated));
  } catch {
    return '';
  }
};

/**
 * 15. DETECT SUSPICIOUS INPUT
 */
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

/**
 * 16. GENERATE RANDOM TOKEN
 */
export const generateToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * 17. HTTP HEADERS KEAMANAN
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * 18. CONTENT SECURITY POLICY
 */
export const cspHeader = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://app.sandbox.midtrans.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://kpzohovxxudriznyflpu.supabase.co https://api.midtrans.com",
    "frame-src 'self' https://app.sandbox.midtrans.com"
  ].join('; ')
};

// Export semua fungsi
export default {
  sanitizeInput,
  deepSanitize,
  escapeSQL,
  RateLimiter,
  globalRateLimiter,
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
  obfuscate,
  deobfuscate,
  isSuspiciousInput,
  generateToken,
  securityHeaders,
  cspHeader
};
