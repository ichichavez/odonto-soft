"use client"

import { useState } from "react"
import { SmileIcon as Tooth } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo enviar el correo. Intenta de nuevo.",
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

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Revisa tu correo</h2>
              <p className="text-sm text-zinc-400">
                Enviamos las instrucciones de recuperación a <span className="text-zinc-200">{email}</span>.
                Revisá también la carpeta de spam.
              </p>
              <Link href="/login" className="block text-sm text-[#a2d5e6] hover:text-[#8fcbde] transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Recuperar contraseña</h2>
                <p className="text-sm text-zinc-400">Ingresá tu correo y te enviaremos las instrucciones</p>
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#a2d5e6] hover:bg-[#8fcbde] text-zinc-900 font-semibold transition-colors"
                >
                  {isLoading ? "Enviando..." : "Enviar instrucciones"}
                </Button>
              </form>

              <p className="text-center text-sm text-zinc-600">
                <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
