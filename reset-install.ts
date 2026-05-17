import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '');
console.log('URL:', supabaseUrl);
const url = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
const supabaseKey = String(process.env.VITE_SUPABASE_ANON_KEY || '');

const supabase = createClient(url, supabaseKey);

async function resetInstall() {
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('id', 'config');

  if (error) {
    console.error('Error reset:', error);
  } else {
    console.log('Reset berhasil!');
  }
}

resetInstall();
