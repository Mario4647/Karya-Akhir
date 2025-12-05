import { createClient } from '@supabase/supabase-js';

// URL dan Keys
const supabaseUrl = 'https://kpzohovxxudriznyflpu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODgyMTIsImV4cCI6MjA2OTk2NDIxMn0.AicKIVKglwcjqcZne1iDKE8ZMEdrjlfVRpdWkNSS_ns';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4ODIxMiwiZXhwIjoyMDY5OTY0MjEyfQ.AwiJ1Og4X59VWgdAAdiQEy2wOpvrtkm0RBMMtkUQz9A';

// Client untuk aplikasi biasa
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Client khusus untuk admin dengan SERVICE ROLE KEY
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function untuk create user
export const createUserWithProfile = async (userData) => {
  try {
    // 1. Create auth user dengan service role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        class: userData.class
      }
    });

    if (authError) {
      // Handle specific errors
      if (authError.message.includes('already registered')) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // 2. Tunggu sebentar untuk memastikan user terbuat
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Cek apakah profil sudah ada (Supabase mungkin membuat otomatis)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    let profileResult = null;

    if (checkError && checkError.code === 'PGRST116') {
      // Profil tidak ada, buat baru
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          roles: userData.roles || 'user-raport',
          name: userData.name,
          class: userData.class,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        // Jika duplicate key, coba update saja
        if (createError.code === '23505') {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
              email: userData.email,
              roles: userData.roles || 'user-raport',
              name: userData.name,
              class: userData.class,
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          profileResult = updatedProfile;
        } else {
          throw createError;
        }
      } else {
        profileResult = newProfile;
      }
    } else if (existingProfile) {
      // Profil sudah ada, update saja
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: userData.email,
          roles: userData.roles || 'user-raport',
          name: userData.name,
          class: userData.class,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      profileResult = updatedProfile;
    }

    return {
      success: true,
      user: authData.user,
      profile: profileResult
    };

  } catch (error) {
    console.error('Error in createUserWithProfile:', error);
    
    // Return error object with user-friendly message
    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return {
        success: false,
        error: 'Email sudah terdaftar di sistem',
        code: 'EMAIL_EXISTS'
      };
    } else if (error.message.includes('Forbidden') || error.message.includes('user not allowed')) {
      return {
        success: false,
        error: 'Akses ditolak. Service role key mungkin tidak valid',
        code: 'ACCESS_DENIED'
      };
    } else if (error.message.includes('duplicate')) {
      return {
        success: false,
        error: 'User sudah ada dalam sistem',
        code: 'DUPLICATE_USER'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Gagal membuat user',
      code: 'UNKNOWN_ERROR'
    };
  }
};

// Helper untuk mendapatkan semua users
export const getAllAuthUsers = async () => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;
    return { success: true, users: users || [] };
  } catch (error) {
    console.error('Error getting auth users:', error);
    return { success: false, error: error.message, users: [] };
  }
};
