import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpzohovxxudriznyflpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODgyMTIsImV4cCI6MjA2OTk2NDIxMn0.AicKIVKglwcjqcZne1iDKE8ZMEdrjlfVRpdWkNSS_ns';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4ODIxMiwiZXhwIjoyMDY5OTY0MjEyfQ.AwiJ1Og4X59VWgdAAdiQEy2wOpvrtkm0RBMMtkUQz9A';

// Client untuk aplikasi biasa (public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  }
});

// Client khusus untuk admin (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storage: window.sessionStorage
  },
  db: {
    schema: 'public'
  }
});

// Helper untuk cek koneksi
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return { success: !error, error: error?.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper untuk upload file PDF (versi admin)
export const uploadRaportPDF = async (userId, file, semester) => {
  try {
    console.log('Starting PDF upload for user:', userId);
    
    // Validasi file
    if (!file) {
      throw new Error('File tidak ditemukan');
    }
    
    if (!file.type.includes('pdf')) {
      throw new Error('Hanya file PDF yang diperbolehkan');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Ukuran file maksimal 10MB');
    }
    
    // Konversi file ke bytea menggunakan FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const bytea = event.target.result;
          
          console.log('File converted, updating database...');
          
          // Update database dengan bytea
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
            .select('id, raport_filename, semester')
            .single();
          
          if (error) {
            console.error('Database update error:', error);
            throw error;
          }
          
          console.log('PDF upload successful:', data);
          resolve({ 
            success: true, 
            data,
            message: 'Raport berhasil diupload'
          });
          
        } catch (error) {
          console.error('Error in reader callback:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      // Baca file sebagai ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
    
  } catch (error) {
    console.error('Error in uploadRaportPDF:', error);
    return { 
      success: false, 
      error: error.message,
      message: `Gagal upload raport: ${error.message}`
    };
  }
};

// Helper untuk download file PDF (versi user)
export const downloadRaportPDF = async (userId) => {
  try {
    console.log('Downloading PDF for user:', userId);
    
    // Ambil data raport dari database
    const { data, error } = await supabase
      .from('profiles')
      .select('raport_file, raport_filename, raport_mimetype, akses_raport_status')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    // Cek apakah user punya akses
    if (data.akses_raport_status !== 'disetujui') {
      throw new Error('Anda belum memiliki akses untuk download raport');
    }
    
    if (!data.raport_file) {
      throw new Error('File raport tidak ditemukan');
    }
    
    console.log('File found:', data.raport_filename);
    
    // Konversi bytea ke Blob
    let blob;
    if (data.raport_file instanceof Uint8Array) {
      // Jika sudah Uint8Array
      blob = new Blob([data.raport_file], { type: data.raport_mimetype });
    } else if (typeof data.raport_file === 'string') {
      // Jika string base64
      const byteCharacters = atob(data.raport_file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: data.raport_mimetype });
    } else {
      // Fallback untuk ArrayBuffer
      blob = new Blob([data.raport_file], { type: data.raport_mimetype });
    }
    
    const url = window.URL.createObjectURL(blob);
    
    return { 
      success: true, 
      url, 
      filename: data.raport_filename || 'raport.pdf',
      blob,
      message: 'File siap didownload'
    };
    
  } catch (error) {
    console.error('Error in downloadRaportPDF:', error);
    return { 
      success: false, 
      error: error.message,
      message: `Gagal download raport: ${error.message}`
    };
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
export const updateAccessStatus = async (userId, status) => {
  try {
    const updateData = {
      akses_raport_status: status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'disetujui') {
      updateData.akses_raport_approved_at = new Date().toISOString();
    } else if (status === 'belum_akses') {
      updateData.akses_raport_requested_at = null;
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

// Helper untuk reset data siswa (hapus kecuali nama, email, kelas)
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
        raport_file: null,
        raport_filename: null,
        raport_mimetype: null,
        akses_raport_status: 'belum_akses',
        akses_raport_requested_at: null,
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
