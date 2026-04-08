"use client"

import { CheckCircle, XCircle, Server, CreditCard, LayoutGrid } from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "$0 / mes",
    patients: "50 pacientes",
    users: "1 usuario",
    features: ["Gestión básica", "Sin exportar PDF", "Sin WhatsApp"],
  },
  {
    name: "Pro",
    price: "$29 / mes",
    patients: "Ilimitados",
    users: "5 usuarios",
    features: ["Todo lo de Free", "Exportar PDF", "WhatsApp integrado"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$79 / mes",
    patients: "Ilimitados",
    users: "Ilimitados",
    features: ["Todo lo de Pro", "Soporte prioritario", "SLA garantizado"],
  },
]

function EnvStatus({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="flex items-center gap-1.5 text-sm">
        {configured ? (
          <>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">Configurada</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400">No configurada</span>
          </>
        )}
      </span>
    </div>
  )
}

export default function SuperadminSettingsPage() {
  const stripeSecret = typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : undefined

  const stripeConfigured = !!stripeSecret && stripeSecret !== "pk_test_placeholder"

  return (
    <div className="p-6 space-y-8 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Configuración Global</h1>
        <p className="text-slate-400 text-sm mt-1">Planes, integración Stripe y estado del sistema</p>
      </div>

      {/* Plans */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Planes disponibles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-5 space-y-3 ${
                plan.highlight
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-800"
              }`}
            >
              {plan.highlight && (
                <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Más popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{plan.price}</p>
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                <p>👤 {plan.users}</p>
                <p>🦷 {plan.patients}</p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Los precios se configuran en Stripe Dashboard. Para cambiarlos, actualiza los Price IDs en las variables de entorno.
        </p>
      </section>

      {/* Stripe */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Integración Stripe</h2>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2">
          <EnvStatus
            label="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
            configured={stripeConfigured}
          />
          <EnvStatus
            label="STRIPE_SECRET_KEY"
            configured={false /* server-side only, can't check from client */}
          />
          <EnvStatus
            label="STRIPE_WEBHOOK_SECRET"
            configured={false}
          />
          <EnvStatus
            label="STRIPE_PRICE_PRO_MONTHLY"
            configured={false}
          />
          <EnvStatus
            label="STRIPE_PRICE_ENTERPRISE_MONTHLY"
            configured={false}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Las variables server-side no son verificables desde el cliente por seguridad.
          Verifica su estado en los logs del servidor o en Vercel → Settings → Environment Variables.
        </p>
      </section>

      {/* System */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Sistema</h2>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2">
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Versión</span>
            <span className="text-sm font-mono text-slate-400">0.1.0</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Última migración</span>
            <span className="text-sm font-mono text-slate-400">20260408000002</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Framework</span>
            <span className="text-sm font-mono text-slate-400">Next.js 16 / React 19</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-300">Base de datos</span>
            <span className="text-sm font-mono text-slate-400">Supabase PostgreSQL</span>
          </div>
        </div>
      </section>
    </div>
  )
}
