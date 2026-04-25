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
  branch_id: string | null
  reminder_minutes: number[]
}

type AuthContextType = {
  user: UserWithRole | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null; role: string | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isSuperAdmin: boolean
  hasPermission: (requiredRoles: string[]) => boolean
  updateReminderMinutes: (minutes: number[]) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cargar perfil desde public.users
async function fetchProfile(userId: string, email: string | null): Promise<UserWithRole> {
  try {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("users")
      .select("name, role, clinic_id, branch_id, reminder_minutes")
      .eq("id", userId)
      .single()

    return {
      id: userId,
      email,
      name: data?.name ?? email ?? "Usuario",
      role: data?.role ?? "asistente",
      clinic_id: data?.clinic_id ?? null,
      branch_id: data?.branch_id ?? null,
      reminder_minutes: (data as any)?.reminder_minutes ?? [30],
    }
  } catch {
    return {
      id: userId,
      email,
      name: email ?? "Usuario",
      role: "asistente",
      clinic_id: null,
      branch_id: null,
      reminder_minutes: [30],
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

  // Redirigir a login si no está autenticado (excluir rutas públicas)
  const PUBLIC_ROUTES = ["/login", "/precios", "/registro", "/recuperar-contrasena", "/nueva-contrasena"]
  useEffect(() => {
    if (loading) return
    if (!user && !PUBLIC_ROUTES.includes(pathname ?? "")) {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error, role: null }
    // Leer rol del perfil para que el login pueda redirigir al destino correcto
    let role: string | null = null
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
      role = profile?.role ?? null
    }
    return { error: null, role }
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
    if (user.role === "superadmin") return true // superadmin tiene acceso total
    return requiredRoles.includes(user.role)
  }

  const updateReminderMinutes = async (minutes: number[]) => {
    const supabase = createBrowserClient()
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession?.access_token) return
    await fetch("/api/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reminder_minutes: minutes }),
    })
    setUser(prev => prev ? { ...prev, reminder_minutes: minutes } : null)
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
        updateReminderMinutes,
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
