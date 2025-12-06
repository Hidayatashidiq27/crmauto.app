import { createClient } from '@supabase/supabase-js'

// Pastikan variabel ini ada di .env.local Anda
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)