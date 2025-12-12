import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. Client Biasa (Tanpa Login)
// Gunakan ini HANYA jika Anda mau ambil data yang benar-benar public
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Client Khusus Clerk (YANG KITA BUTUHKAN)
// Fungsi ini akan menyisipkan Token Clerk ke dalam request Supabase
export const createClerkSupabaseClient = async (getToken) => {
  const token = await getToken({ template: 'supabase' });
 
  if (!token) {
    // Jika token gagal diambil, kembalikan null
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        // Ini adalah "KTP" digital agar RLS mengizinkan masuk
        Authorization: `Bearer ${token}`,
      },
    },
  });
};