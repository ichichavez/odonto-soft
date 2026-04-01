"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

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

// Usuario de demostración
const DEMO_USER: UserWithRole = {
  id: "061e844e-1916-45d3-8dbf-da39a3c8085b",
  email: "isidrochavez429@gmail.com",
  name: "Isidro Chávez",
  role: "admin",
  clinic_id: "00000000-0000-0000-0000-000000000001",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem("demo-user")
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setSession({ user: userData })
    }
    setLoading(false)
  }, [])

  // Redirigir a login si no está autenticado y no está en la página de login
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      // Simulación de autenticación
      if (email === "isidrochavez429@gmail.com" || email === "admin@odontoclinica.com") {
        setUser(DEMO_USER)
        setSession({ user: DEMO_USER })
        localStorage.setItem("demo-user", JSON.stringify(DEMO_USER))
        return { error: null }
      } else {
        return {
          error: {
            message:
              "Credenciales inválidas. Use: isidrochavez429@gmail.com o admin@odontoclinica.com con cualquier contraseña.",
          },
        }
      }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    setUser(null)
    setSession(null)
    localStorage.removeItem("demo-user")
    router.push("/login")
  }

  const hasPermission = (requiredRoles: string[]) => {
    if (!user) return false
    return requiredRoles.includes(user.role)
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
      {!loading && children}
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
