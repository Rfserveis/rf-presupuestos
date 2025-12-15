// Configuración de Supabase para RF Presupuestos
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwtsdtjiwfvurquddfqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dHNkdGppd2Z2dXJxdWRkZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODMwNTIsImV4cCI6MjA4MDE1OTA1Mn0.aE9OqNLORZs1HhQsjfqNymabkNQJizAkwVanx0D19NU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
