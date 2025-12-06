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
      .select('raport_file, raport_filename, raport_mimetype')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
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
