import { createClient } from '@supabase/supabase-js'

// ❗️ POSA AQUI les teves dades REALS i oblida variables d'entorn
const supabaseUrl = "https://ELTEUPROJECTE.supabase.co"
const supabaseAnonKey = "ELATEVAKEYPUBLICA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
