import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Re-exportar createClient para que otros módulos puedan importarlo
export { createClient }

// Singleton para el cliente de Supabase en el navegador
let browserClient: ReturnType<typeof createClient<Database>> | null = null

// Cliente para el navegador (lado del cliente)
export const createBrowserClient = () => {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}

// Cliente para el servidor
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
