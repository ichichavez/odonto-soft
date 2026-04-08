"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient, clearAllSupabaseData } from "@/lib/supabase"

type UserWithRole = {
  id: string
  email: string | null
  name: string
  role: string
  clinic_id: string | null
}

type AuthContextType = {
  user: UserWithRole | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isSuperAdmin: boolean
  hasPermission: (requiredRoles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cargar perfil desde public.users
async function fetchProfile(userId: string, email: string | null): Promise<UserWithRole> {
  try {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("users")
      .select("name, role, clinic_id")
      .eq("id", userId)
      .single()

    return {
      id: userId,
      email,
      name: data?.name ?? email ?? "Usuario",
      role: data?.role ?? "asistente",
      clinic_id: data?.clinic_id ?? null,
    }
  } catch {
    return {
      id: userId,
      email,
      name: email ?? "Usuario",
      role: "asistente",
      clinic_id: null,
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  // Evitar que el timeout dispare después del desmontaje
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let subscription: { unsubscribe: () => void } | null = null

    const finish = (sessionData: any | null, userData: UserWithRole | null) => {
      if (!mountedRef.current) return
      setSession(sessionData)
      setUser(userData)
      setLoading(false)
    }

    const init = async () => {
      // ── Timeout de seguridad: si en 6 s no hay respuesta, limpiar y salir ──
      const safetyTimer = setTimeout(() => {
        if (!mountedRef.current) return
        console.warn("[auth] Timeout esperando sesión — limpiando datos y redirigiendo a login")
        clearAllSupabaseData()
        finish(null, null)
      }, 6000)

      try {
        const supabase = createBrowserClient()

        // Intentar obtener la sesión actual (con refresh automático si aplica)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          // Token inválido o refresh fallido — limpiar todo
          clearAllSupabaseData()
          clearTimeout(safetyTimer)
          finish(null, null)
          return
        }

        const currentSession = sessionData.session

        if (currentSession?.user) {
          const profile = await fetchProfile(
            currentSession.user.id,
            currentSession.user.email ?? null
          )
          clearTimeout(safetyTimer)
          finish(currentSession, profile)
        } else {
          clearTimeout(safetyTimer)
          finish(null, null)
        }

        // Suscribirse a cambios FUTUROS de sesión (sign in, sign out, token refresh)
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mountedRef.current) return

            // Token no renovable → limpiar y forzar login
            if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !newSession) {
              clearAllSupabaseData()
              setSession(null)
              setUser(null)
              return
            }

            setSession(newSession)

            if (newSession?.user) {
              const profile = await fetchProfile(
                newSession.user.id,
                newSession.user.email ?? null
              )
              if (mountedRef.current) setUser(profile)
            } else {
              setUser(null)
            }
          }
        )

        subscription = sub
      } catch (err) {
        // Error inesperado — limpiar y arrancar limpio
        console.error("[auth] Error al inicializar sesión:", err)
        clearAllSupabaseData()
        clearTimeout(safetyTimer)
        finish(null, null)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [])

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    // El perfil se cargará vía onAuthStateChange
    return { error: null }
  }

  const signOut = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
    } catch {}
    clearAllSupabaseData()
    setUser(null)
    setSession(null)
    router.push("/login")
  }

  const hasPermission = (requiredRoles: string[]) => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === "superadmin",
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
