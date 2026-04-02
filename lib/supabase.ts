import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export { createClient }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

// Singleton para el cliente del navegador
let browserClient: ReturnType<typeof createClient<Database>> | null = null

export const createBrowserClient = () => {
  // Durante el build estático las env vars pueden no estar disponibles.
  // En ese caso devolvemos un cliente con URLs vacías; los componentes
  // que lo usen sólo se ejecutan en el cliente donde las vars sí existen.
  if (browserClient) return browserClient

  browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true },
  })
  return browserClient
}

export const createServerClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
