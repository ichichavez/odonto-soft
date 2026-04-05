"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"

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
  hasPermission: (requiredRoles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Limpia la sesión de Supabase del localStorage si está corrompida
function clearSupabaseSession() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        localStorage.removeItem(key)
      }
    })
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Cargar perfil desde public.users
  const loadProfile = async (authUser: { id: string; email: string | null }) => {
    try {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("users")
        .select("name, role, clinic_id")
        .eq("id", authUser.id)
        .single()

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: data?.name ?? authUser.email ?? "Usuario",
        role: data?.role ?? "asistente",
        clinic_id: data?.clinic_id ?? null,
      })
    } catch {
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email ?? "Usuario",
        role: "asistente",
        clinic_id: null,
      })
    }
  }

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    const init = async () => {
      try {
        const supabase = createBrowserClient()

        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            try {
              setSession(currentSession)
              if (currentSession?.user) {
                await loadProfile({
                  id: currentSession.user.id,
                  email: currentSession.user.email ?? null,
                })
              } else {
                setUser(null)
              }
            } catch (err) {
              console.error("Auth state change error:", err)
              setUser(null)
            } finally {
              setLoading(false)
            }
          }
        )

        subscription = sub
      } catch (err) {
        // Sesión corrompida — limpiar y reiniciar
        console.error("Auth init error, clearing session:", err)
        clearSupabaseSession()
        setUser(null)
        setLoading(false)
      }
    }

    init()

    return () => {
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
    return { error }
  }

  const signOut = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
    } catch {}
    clearSupabaseSession()
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
