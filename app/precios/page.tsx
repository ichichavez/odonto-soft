"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, SmileIcon as Tooth, Zap } from "lucide-react"

// ── Plan definitions ────────────────────────────────────────────────────────

type Plan = {
  id: string
  name: string
  price: number
  description: string
  highlight: boolean
  badge?: string
  limits: string
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 64,
    description: "Ideal para consultorios individuales",
    highlight: false,
    limits: "1 sucursal · hasta 3 usuarios",
    features: [
      "Agenda de citas",
      "Ficha del paciente",
      "Odontograma digital",
      "Presupuestos y facturación",
      "Inventario básico",
      "Reportes mensuales",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    description: "Para clínicas en crecimiento",
    highlight: true,
    badge: "Más popular",
    limits: "Hasta 3 sucursales · hasta 10 usuarios",
    features: [
      "Todo lo del plan Básico",
      "Múltiples sucursales",
      "Panel multi-sede",
      "Compras, gastos y reportes avanzados",
      "Soporte por correo prioritario",
    ],
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: 179,
    description: "Para cadenas y grandes clínicas",
    highlight: false,
    limits: "Sucursales y usuarios ilimitados",
    features: [
      "Todo lo del plan Pro",
      "Sucursales y usuarios ilimitados",
      "Personalización de marca",
      "Onboarding dedicado",
      "Soporte prioritario 24/7",
    ],
  },
]

// ── Component ───────────────────────────────────────────────────────────────

export default function PreciosPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/precios" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a2d5e6]/15 border border-[#a2d5e6]/30">
            <Tooth className="h-4.5 w-4.5 text-[#a2d5e6]" />
          </div>
          <span className="font-semibold text-white">OdontoSoft</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Iniciar sesión →
        </Link>
      </header>

      {/* Hero */}
      <section className="text-center pt-16 pb-12 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a2d5e6]/10 border border-[#a2d5e6]/20 text-[#a2d5e6] text-xs font-medium mb-6">
          <Zap className="h-3 w-3" />
          7 días gratis · Sin tarjeta de crédito
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Planes y precios
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Elegí el plan que mejor se adapte a tu consultorio.
          Podés cambiar o cancelar en cualquier momento.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="flex-1 px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlight
                  ? "border-[#a2d5e6]/50 bg-zinc-900 shadow-[0_0_40px_-10px_rgba(162,213,230,0.15)]"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-[#a2d5e6] text-zinc-900 text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-zinc-500 text-sm mb-1">/mes</span>
                </div>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
                <p className="text-zinc-600 text-xs mt-1">{plan.limits}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? "text-[#a2d5e6]" : "text-zinc-500"}`} />
                    <span className="text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => router.push(`/registro?plan=${plan.id}`)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-[#a2d5e6] text-zinc-900 hover:bg-[#8fcbde]"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                Comenzar prueba gratis
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-sm mt-10">
          Todos los precios en USD · Facturación mensual ·{" "}
          <Link href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            ¿Ya tenés cuenta? Iniciá sesión
          </Link>
        </p>
      </section>
    </div>
  )
}
