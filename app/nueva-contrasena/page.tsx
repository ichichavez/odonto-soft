"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, SmileIcon as Tooth } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase"

export default function NuevaContrasenaPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createBrowserClient()
    // Detect PASSWORD_RECOVERY event from Supabase when the user lands via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })
    // Also allow the page if there's already a session (token was handled on load)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" })
      return
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast({ title: "Contraseña actualizada", description: "Podés iniciar sesión con tu nueva contraseña." })
      router.push("/login")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <h2 className="text-xl font-semibold text-white">Nueva contraseña</h2>
            <p className="text-sm text-zinc-400">Elegí una contraseña segura para tu cuenta</p>
          </div>

          {!ready ? (
            <p className="text-sm text-zinc-500">Verificando enlace de recuperación...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300 text-sm">
                  Nueva contraseña
                </Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-zinc-300 text-sm">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#a2d5e6] hover:bg-[#8fcbde] text-zinc-900 font-semibold transition-colors"
              >
                {isLoading ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
