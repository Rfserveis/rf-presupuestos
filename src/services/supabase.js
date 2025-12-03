import { createClient } from '@supabase/supabase-js';

// Intentar carregar des de variables d'entorn, si no existeixen usar valors hardcoded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwtsdtjiwfvurquddfqd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dHNkdGppd2Z2dXJxdWRkZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODMwNTIsImV4cCI6MjA4MDE1OTA1Mn0.aE9OqNLORZs1HhQsjfqNymabkNQJizAkwVanx0D19NU';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key loaded:', !!supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);
