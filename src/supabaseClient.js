import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpzohovxxudriznyflpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODgyMTIsImV4cCI6MjA2OTk2NDIxMn0.AicKIVKglwcjqcZne1iDKE8ZMEdrjlfVRpdWkNSS_ns';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4ODIxMiwiZXhwIjoyMDY5OTY0MjEyfQ.AwiJ1Og4X59VWgdAAdiQEy2wOpvrtkm0RBMMtkUQz9A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper untuk upload file PDF
export const uploadRaportPDF = async (userId, file, semester) => {
  try {
    // Konversi file ke bytea
    const arrayBuffer = await file.arrayBuffer();
    const bytea = new Uint8Array(arrayBuffer);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        raport_file: bytea,
        raport_filename: file.name,
        raport_mimetype: file.type,
        semester: semester,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk download file PDF
export const downloadRaportPDF = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('raport_file, raport_filename, raport_mimetype, akses_raport_status')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // Cek apakah user punya akses
    if (data.akses_raport_status !== 'disetujui') {
      throw new Error('Anda belum memiliki akses untuk download raport');
    }
    
    if (!data.raport_file) {
      return { success: false, error: 'File tidak ditemukan' };
    }
    
    // Konversi bytea ke Blob
    const blob = new Blob([data.raport_file], { type: data.raport_mimetype });
    const url = window.URL.createObjectURL(blob);
    
    return { 
      success: true, 
      url, 
      filename: data.raport_filename,
      blob 
    };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk update data siswa
export const updateStudentData = async (userId, updateData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk mendapatkan semua siswa
export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('roles', 'user-raport')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting students:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Helper untuk mendapatkan permintaan akses pending
export const getPendingAccessRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, class, akses_raport_status, akses_raport_requested_at')
      .eq('roles', 'user-raport')
      .eq('akses_raport_status', 'pending')
      .order('akses_raport_requested_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Helper untuk update status akses
export const updateAccessStatus = async (userId, status, keterangan = null) => {
  try {
    const updateData = {
      akses_raport_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (keterangan) {
      updateData.keterangan_ditolak = keterangan;
    } else if (status === 'disetujui') {
      updateData.keterangan_ditolak = null;
    }
    
    if (status === 'disetujui') {
      updateData.akses_raport_approved_at = new Date().toISOString();
    } else if (status === 'belum_disetujui') {
      updateData.akses_raport_requested_at = null;
      updateData.akses_raport_approved_at = null;
    }
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating access status:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk cabut akses
export const revokeAccess = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        akses_raport_status: 'belum_disetujui',
        akses_raport_approved_at: null,
        keterangan_ditolak: 'Akses dicabut oleh admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error revoking access:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk minta akses download (user)
export const requestAccess = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        akses_raport_status: 'pending',
        akses_raport_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error requesting access:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk minta naikan ranking (user)
export const requestRankingUpdate = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        permintaan_ranking_status: 'pending',
        permintaan_ranking_tanggal: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error requesting ranking update:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk update ranking dan nilai (admin)
export const updateRankingNilai = async (userId, ranking, nilaiRataRata) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ranking: ranking,
        nilai_rata_rata: nilaiRataRata,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating ranking:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk update status ranking (admin)
export const updateRankingStatus = async (userId, status, keterangan = null) => {
  try {
    const updateData = {
      permintaan_ranking_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (keterangan) {
      updateData.keterangan_ditolak = keterangan;
    } else if (status === 'disetujui') {
      updateData.keterangan_ditolak = null;
    }
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating ranking status:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk mengatur timer ranking (admin)
export const setRankingTimer = async (userId, days, hours, minutes) => {
  try {
    const totalMs = (days * 24 * 60 * 60 * 1000) + 
                   (hours * 60 * 60 * 1000) + 
                   (minutes * 60 * 1000);
    
    if (totalMs <= 0) {
      return { success: false, error: 'Waktu timer harus lebih dari 0' };
    }
    
    const timerEnd = new Date(Date.now() + totalMs);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ranking_timer_end: timerEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error setting ranking timer:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk mendapatkan permintaan ranking pending
export const getPendingRankingRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, class, ranking, nilai_rata_rata, semester, permintaan_ranking_status, permintaan_ranking_tanggal, ranking_timer_end')
      .eq('roles', 'user-raport')
      .eq('permintaan_ranking_status', 'pending')
      .order('permintaan_ranking_tanggal', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting pending ranking requests:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Helper untuk reset data siswa
export const resetStudentData = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        asal_sekolah: null,
        nisn: null,
        tanggal_lahir: null,
        nomor_telepon: null,
        nama_ayah: null,
        nama_ibu: null,
        alamat: null,
        tanggal_diterima: null,
        semester: null,
        ranking: null,
        nilai_rata_rata: null,
        raport_file: null,
        raport_filename: null,
        raport_mimetype: null,
        akses_raport_status: 'belum_disetujui',
        akses_raport_requested_at: null,
        akses_raport_approved_at: null,
        permintaan_ranking_status: 'belum_disetujui',
        permintaan_ranking_tanggal: null,
        ranking_timer_end: null,
        keterangan_ditolak: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error resetting student data:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk cek apakah user adalah admin
export const isUserAdmin = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', session.user.id)
      .single();
    
    if (error) return false;
    
    return profile.roles === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper untuk cek apakah user adalah user-raport
export const isUserRaport = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', session.user.id)
      .single();
    
    if (error) return false;
    
    return profile.roles === 'user-raport' || profile.roles === 'admin';
  } catch (error) {
    console.error('Error checking raport user status:', error);
    return false;
  }
};

// Helper untuk mendapatkan data user lengkap
export const getUserProfile = async (userId = null) => {
  try {
    let idToQuery = userId;
    
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: 'Tidak ada session' };
      idToQuery = session.user.id;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', idToQuery)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk update profile image
export const updateProfileImage = async (userId, imageData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        profile_image: imageData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile image:', error);
    return { success: false, error: error.message };
  }
};

// Helper untuk cek timer ranking
export const checkRankingTimer = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('ranking_timer_end')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data.ranking_timer_end) {
      return { success: true, timerActive: false };
    }
    
    const timerEnd = new Date(data.ranking_timer_end);
    const now = new Date();
    const timerActive = timerEnd > now;
    
    return { 
      success: true, 
      timerActive,
      timerEnd: data.ranking_timer_end,
      timeRemaining: timerEnd - now
    };
  } catch (error) {
    console.error('Error checking ranking timer:', error);
    return { success: false, error: error.message };
  }
};
