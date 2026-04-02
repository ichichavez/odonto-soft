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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient()

  // Cargar perfil desde public.users
  const loadProfile = async (authUser: { id: string; email: string | null }) => {
    try {
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
      // Si no existe perfil aún, usar datos mínimos
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email ?? "Usuario",
        role: "asistente",
        clinic_id: null,
      })
    }
  }

  // Escuchar cambios de sesión de Supabase Auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)

        if (currentSession?.user) {
          await loadProfile({
            id: currentSession.user.id,
            email: currentSession.user.email ?? null,
          })
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
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
