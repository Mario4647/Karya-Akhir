// ============================================
// UTILITAS KEAMANAN - XSS Prevention, Validasi, Rate Limiting
// ============================================

// Sanitasi input untuk mencegah XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Hapus karakter berbahaya
  return input
    .replace(/[<>]/g, '') // Hapus < dan >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validasi email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validasi NIK (16 digit angka)
export const validateNIK = (nik) => {
  const nikRegex = /^\d{16}$/;
  return nikRegex.test(nik);
};

// Validasi nomor HP Indonesia
export const validatePhone = (phone) => {
  // Format: 08xxxxxxxxxx atau 62xxxxxxxxxx
  const phoneRegex = /^(08|62)\d{8,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format nomor HP untuk Midtrans
export const formatPhoneForMidtrans = (phone) => {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  return cleanPhone;
};

// Rate limiting sederhana (client-side)
export class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  check(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Hapus request lama
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  clear() {
    this.requests.clear();
  }
}

// Debounce untuk mencegah spam klik
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
