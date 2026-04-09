"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, SmileIcon as Tooth, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase"

// ── Plan metadata ────────────────────────────────────────────────────────────

const PLAN_INFO: Record<string, { name: string; price: number; features: string[] }> = {
  basico: {
    name: "Básico",
    price: 59,
    features: ["1 sucursal", "Hasta 3 usuarios", "Agenda, pacientes, facturación"],
  },
  pro: {
    name: "Pro",
    price: 99,
    features: ["Hasta 3 sucursales", "Hasta 10 usuarios", "Reportes avanzados y gastos"],
  },
  empresarial: {
    name: "Empresarial",
    price: 179,
    features: ["Sucursales ilimitadas", "Usuarios ilimitados", "Soporte prioritario"],
  },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const planParam = searchParams.get("plan") ?? "basico"
  const plan = PLAN_INFO[planParam] ? planParam : "basico"
  const planInfo = PLAN_INFO[plan]

  const [form, setForm] = useState({
    name: "",
    clinicName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          clinicName: form.clinicName,
          email: form.email,
          password: form.password,
          plan,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al registrarse")

      // Iniciar sesión automáticamente
      const supabase = createBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        toast({ title: "Cuenta creada", description: "Por favor iniciá sesión." })
        router.push("/login")
        return
      }

      // Obtener token y redirigir a Stripe Checkout
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        const checkoutRes = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan }),
        })
        const checkoutData = await checkoutRes.json()
        if (checkoutData.url) {
          window.location.href = checkoutData.url
          return
        }
      }

      // Fallback si Stripe no está configurado
      toast({
        title: "¡Bienvenido/a a OdontoSoft!",
        description: "Tu período de prueba de 7 días ha comenzado.",
      })
      router.push("/")
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Panel izquierdo — plan seleccionado (solo desktop) */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-center gap-8 p-12 bg-zinc-950 border-r border-zinc-800">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a2d5e6]/15 border border-[#a2d5e6]/30">
            <Tooth className="h-5 w-5 text-[#a2d5e6]" />
          </div>
          <span className="font-semibold text-white text-lg">OdontoSoft</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Plan seleccionado
          </p>
          <h2 className="text-3xl font-bold text-white mb-1">
            {planInfo.name}
          </h2>
          <p className="text-zinc-400 text-lg">
            <span className="text-white font-semibold">${planInfo.price}</span>
            <span className="text-sm"> /mes</span>
          </p>
        </div>

        <ul className="space-y-3">
          {planInfo.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
              <Check className="h-4 w-4 text-[#a2d5e6] shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-zinc-800">
          <p className="text-zinc-500 text-sm">
            7 días gratis, sin tarjeta de crédito.{" "}
            <Link href="/precios" className="text-[#a2d5e6] hover:underline">
              Ver todos los planes →
            </Link>
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          {/* Back link */}
          <Link
            href="/precios"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ver planes
          </Link>

          {/* Mobile: plan badge */}
          <div className="flex lg:hidden items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Tooth className="h-4 w-4 text-[#a2d5e6]" />
              <span className="text-white font-semibold text-sm">OdontoSoft</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#a2d5e6]/15 text-[#a2d5e6] text-xs font-medium border border-[#a2d5e6]/20">
              Plan {planInfo.name} · ${planInfo.price}/mes
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Crear cuenta</h2>
            <p className="text-sm text-zinc-400">
              7 días gratis · Sin tarjeta de crédito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-zinc-300 text-sm">Nombre completo</Label>
              <Input
                id="name"
                placeholder="Dr. Juan García"
                value={form.name}
                onChange={set("name")}
                required
                disabled={loading}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinicName" className="text-zinc-300 text-sm">Nombre de la clínica</Label>
              <Input
                id="clinicName"
                placeholder="Clínica Dental García"
                value={form.clinicName}
                onChange={set("clinicName")}
                required
                disabled={loading}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={set("email")}
                required
                disabled={loading}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300 text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={set("password")}
                  required
                  disabled={loading}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repetí tu contraseña"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                required
                disabled={loading}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#a2d5e6]/50 h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#a2d5e6] hover:bg-[#8fcbde] text-zinc-900 font-semibold transition-colors mt-2"
            >
              {loading ? "Creando cuenta..." : "Comenzar prueba gratis 7 días"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-600">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
