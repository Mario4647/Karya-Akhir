// ============================================
// VALIDASI KHUSUS UNTUK APLIKASI TIKET
// ============================================

import { 
  validateEmail as baseValidateEmail,
  validateNIK as baseValidateNIK,
  validatePhone as baseValidatePhone,
  validatePasswordStrength,
  validateInput,
  isSuspiciousInput,
  deepSanitize
} from './security';

/**
 * Validasi data pembeli
 */
export const validateBuyerData = (buyer, index) => {
  const errors = [];
  
  // Validasi nama
  if (!buyer.name || buyer.name.trim() === '') {
    errors.push(`Nama Pembeli ${index + 1} harus diisi`);
  } else if (buyer.name.length < 3) {
    errors.push(`Nama Pembeli ${index + 1} minimal 3 karakter`);
  } else if (buyer.name.length > 100) {
    errors.push(`Nama Pembeli ${index + 1} maksimal 100 karakter`);
  } else if (isSuspiciousInput(buyer.name)) {
    errors.push(`Nama Pembeli ${index + 1} mengandung karakter tidak valid`);
  }
  
  // Validasi NIK
  if (!buyer.nik) {
    errors.push(`NIK Pembeli ${index + 1} harus diisi`);
  } else if (!baseValidateNIK(buyer.nik)) {
    errors.push(`NIK Pembeli ${index + 1} harus 16 digit angka`);
  }
  
  // Validasi nomor HP
  if (!buyer.phone) {
    errors.push(`Nomor HP Pembeli ${index + 1} harus diisi`);
  } else if (!baseValidatePhone(buyer.phone)) {
    errors.push(`Nomor HP Pembeli ${index + 1} tidak valid (gunakan 08xx atau 62xx)`);
  }
  
  // Validasi alamat
  if (!buyer.address || buyer.address.trim() === '') {
    errors.push(`Alamat Pembeli ${index + 1} harus diisi`);
  } else if (buyer.address.length < 10) {
    errors.push(`Alamat Pembeli ${index + 1} minimal 10 karakter`);
  } else if (isSuspiciousInput(buyer.address)) {
    errors.push(`Alamat Pembeli ${index + 1} mengandung karakter tidak valid`);
  }
  
  return errors;
};

/**
 * Validasi data order
 */
export const validateOrderData = (orderData) => {
  const errors = [];
  
  if (!orderData.product_id) {
    errors.push('Produk harus dipilih');
  }
  
  if (!orderData.quantity || orderData.quantity < 1) {
    errors.push('Jumlah tiket minimal 1');
  }
  
  if (orderData.quantity > 10) {
    errors.push('Maksimal pembelian 10 tiket per transaksi');
  }
  
  return errors;
};

/**
 * Validasi kode promo
 */
export const validatePromoCode = (promoCode) => {
  if (!promoCode || promoCode.trim() === '') {
    return { valid: false, error: 'Kode promo harus diisi' };
  }
  
  if (promoCode.length > 20) {
    return { valid: false, error: 'Kode promo terlalu panjang' };
  }
  
  if (isSuspiciousInput(promoCode)) {
    return { valid: false, error: 'Kode promo tidak valid' };
  }
  
  return { valid: true };
};

/**
 * Validasi tanggal event
 */
export const validateEventDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Format tanggal tidak valid' };
  }
  
  if (date < now) {
    return { valid: false, error: 'Tanggal event harus di masa depan' };
  }
  
  return { valid: true };
};

/**
 * Validasi harga
 */
export const validatePrice = (price) => {
  if (!price || price < 1000) {
    return { valid: false, error: 'Harga minimal Rp 1.000' };
  }
  
  if (price > 100000000) {
    return { valid: false, error: 'Harga maksimal Rp 100.000.000' };
  }
  
  if (!Number.isInteger(price)) {
    return { valid: false, error: 'Harga harus bilangan bulat' };
  }
  
  return { valid: true };
};

/**
 * Validasi stok
 */
export const validateStock = (stock) => {
  if (!stock || stock < 0) {
    return { valid: false, error: 'Stok tidak boleh negatif' };
  }
  
  if (stock > 10000) {
    return { valid: false, error: 'Stok maksimal 10.000' };
  }
  
  if (!Number.isInteger(stock)) {
    return { valid: false, error: 'Stok harus bilangan bulat' };
  }
  
  return { valid: true };
};

/**
 * Bersihkan semua data sebelum dikirim ke API
 */
export const prepareDataForAPI = (data) => {
  return deepSanitize(data);
};

export default {
  validateBuyerData,
  validateOrderData,
  validatePromoCode,
  validateEventDate,
  validatePrice,
  validateStock,
  prepareDataForAPI
};
