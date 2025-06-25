import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qxdkjxcyajxepzxfauap.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZGtqeGN5YWp4ZXB6eGZhdWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkxMzMsImV4cCI6MjA2NjQzNTEzM30.GmcxPXfU1yPslFm3jJoflpAXUNBUgW18qWE8dVkdLcI'; 
export const supabase = createClient(supabaseUrl, supabaseKey);