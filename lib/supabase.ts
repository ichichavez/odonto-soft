import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export { createClient }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL no está configurada. " +
    "Agrega las variables de entorno en Vercel → Settings → Environment Variables."
  )
}

// Singleton para el cliente del navegador
let browserClient: ReturnType<typeof createClient<Database>> | null = null

export const createBrowserClient = () => {
  if (browserClient) return browserClient

  browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true },
  })
  return browserClient
}

/**
 * Elimina TODOS los datos de sesión de Supabase del localStorage
 * y resetea el singleton para que el próximo createBrowserClient()
 * arranque limpio. Llama esto cuando la sesión está corrompida o expirada.
 */
export function clearAllSupabaseData() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("sb-"))
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {}
  // Resetear el singleton para que el próximo cliente arranque sin caché
  browserClient = null
}

export const createServerClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
