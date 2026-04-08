"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Al entrar en /login siempre limpiamos datos de sesión rancios.
  // Esto evita que un token expirado bloquee un nuevo inicio de sesión.
  useEffect(() => {
    clearAllSupabaseData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        throw error
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido/a al sistema",
      })

      router.push("/")
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
    // Recargar la página para que el cliente de Supabase arranque completamente limpio
    window.location.reload()
    toast({ title: "Sesión limpiada", description: "Vuelve a iniciar sesión." })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md">
              <Tooth className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">OdontoSoft</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          {/* Botón de emergencia — limpia todo sin abrir DevTools */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground gap-2"
            onClick={handleHardReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            ¿Problemas para ingresar? Limpiar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
