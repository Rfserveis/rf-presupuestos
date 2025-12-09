import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase (públicas - sin datos sensibles)
// Nota: Estas son credenciales ANON (solo lectura/escritura con reglas de BD)
// NO incluyen credenciales de servicio o admin
const supabaseUrl = 'https://lwtsdtjiwfvurquddfqd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dHNkdGppd2Z2dXJxdWRkZnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTUzODU2MDAsImV4cCI6MTk5NDU2MTYwMH0.5vQx-8_9K2x-R9Y8pZ-W3_4M1N2O3P4Q5R6S7T8U9V0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
