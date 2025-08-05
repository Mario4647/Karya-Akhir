import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpzohovxxudriznyflpu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwem9ob3Z4eHVkcml6bnlmbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODgyMTIsImV4cCI6MjA2OTk2NDIxMn0.AicKIVKglwcjqcZne1iDKE8ZMEdrjlfVRpdWkNSS_ns'; 
export const supabase = createClient(supabaseUrl, supabaseKey);