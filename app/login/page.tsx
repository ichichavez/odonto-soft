"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, SmileIcon as Tooth, RotateCcw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { clearAllSupabaseData } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { signIn } = useAuth()

  useEffect(() => {
    clearAllSupabaseData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error, role } = await signIn(email, password)
      if (error) throw error

      toast({ title: "Inicio de sesión exitoso", description: "Bienvenido/a al sistema" })
      // Forzar recarga completa para que AuthContext reinicie con la sesión nueva.
      window.location.replace(role === "superadmin" ? "/superadmin" : "/")
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales inválidas. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleHardReset = () => {
    clearAllSupabaseData()
    window.location.reload()
    toast({ title: "Sesión limpiada", description: "Vuelve a iniciar sesión." })
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Panel izquierdo — branding (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center gap-6 p-12 bg-zinc-950 border-r border-zinc-800">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#a2d5e6]/15 border border-[#a2d5e6]/30">
          <Tooth className="h-10 w-10 text-[#a2d5e6]" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">OdontoSoft</h1>
          <p className="text-zinc-400 text-lg">Gestión integral para consultorios odontológicos</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-xs text-sm text-zinc-500">
          {["Agenda de citas", "Ficha del paciente", "Presupuestos", "Reportes PDF"].map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#a2d5e6]" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo móvil */}
          <div className="flex lg:hidden flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a2d5e6]/15 border border-[#a2d5e6]/30">
              <Tooth className="h-7 w-7 text-[#a2d5e6]" />
            </div>
            <h1 className="text-2xl font-bold text-white">OdontoSoft</h1>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Iniciar sesión</h2>
            <p className="text-sm text-zinc-400">Ingresá tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-sm">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300 text-sm">
                  Contraseña
                </Label>
                <a
                  href="/recuperar-contrasena"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"} contraseña</span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#a2d5e6] hover:bg-[#8fcbde] text-zinc-900 font-semibold transition-colors"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-zinc-600">o</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-zinc-600">
              ¿No tenés cuenta?{" "}
              <a href="/precios" className="text-zinc-400 hover:text-white transition-colors">
                Ver planes y registrarte →
              </a>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-zinc-700 hover:text-zinc-400 hover:bg-zinc-900 gap-2"
              onClick={handleHardReset}
              disabled={isLoading}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ¿Problemas para ingresar? Limpiar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
