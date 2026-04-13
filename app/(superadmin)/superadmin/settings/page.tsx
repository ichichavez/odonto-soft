"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Server, CreditCard, LayoutGrid, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase"

// ── Plan definitions (must match app/precios/page.tsx) ────────────────────────

const PLANS = [
  {
    name: "Básico",
    price: "$64 / mes",
    limits: "1-2 sucursales · 3 usuarios · 300 pacientes",
    features: ["Agenda de citas", "Ficha y odontograma", "Presupuestos", "Inventario básico", "Reportes mensuales"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99 / mes",
    limits: "Hasta 5 sucursales · 20 usuarios · 2000 pacientes",
    features: ["Todo lo de Básico", "Múltiples sucursales", "Panel multi-sede", "Compras, gastos y reportes avanzados", "Soporte prioritario"],
    highlight: true,
  },
  {
    name: "Empresarial",
    price: "$179 / mes",
    limits: "Sucursales y usuarios ilimitados",
    features: ["Todo lo de Pro", "Pacientes ilimitados", "Personalización de marca", "Onboarding dedicado", "Soporte 24/7"],
    highlight: false,
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function EnvRow({
  label,
  configured,
  loading = false,
}: {
  label: string
  configured: boolean | null
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0">
      <span className="text-sm font-mono text-slate-300">{label}</span>
      <span className="flex items-center gap-1.5 text-sm">
        {loading || configured === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : configured ? (
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

function ModeRow({ sandbox }: { sandbox: boolean | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
      <span className="text-sm font-mono text-slate-300">DLOCAL_SANDBOX</span>
      <span className="flex items-center gap-1.5 text-sm">
        {sandbox === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : sandbox ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            Sandbox (pruebas)
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            Producción
          </span>
        )}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type DlocalStatus = {
  sandbox: boolean
  api_key: boolean
  secret_key: boolean
  plan_token_basico: boolean
  plan_token_pro: boolean
  plan_token_empresarial: boolean
}

export default function SuperadminSettingsPage() {
  const { toast } = useToast()
  const [dlocalStatus, setDlocalStatus] = useState<DlocalStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [creatingPlans, setCreatingPlans] = useState(false)

  const loadStatus = async () => {
    setLoadingStatus(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/dlocal/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setDlocalStatus(await res.json())
    } catch {}
    finally { setLoadingStatus(false) }
  }

  useEffect(() => { loadStatus() }, [])

  const handleCreatePlans = async () => {
    setCreatingPlans(true)
    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error("Sin sesión")
      const res = await fetch("/api/dlocal/plans", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      const ok = data.results?.filter((r: any) => r.ok) ?? []
      const fail = data.results?.filter((r: any) => !r.ok) ?? []

      if (ok.length > 0) {
        toast({
          title: `${ok.length} plan(es) creado(s)`,
          description: "Copiá los DLOCAL_PLAN_TOKEN_* de la consola y agregalos a las variables de entorno.",
        })
        // Log tokens to console for copy-paste
        console.log("[dLocalGo] Planes creados:")
        ok.forEach((r: any) => console.log(r.env_var))
      }
      if (fail.length > 0) {
        toast({
          title: `${fail.length} plan(es) fallaron`,
          description: fail.map((r: any) => `${r.key}: ${r.error}`).join(" · "),
          variant: "destructive",
        })
      }
      await loadStatus()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setCreatingPlans(false)
    }
  }

  const plansConfigured =
    dlocalStatus?.plan_token_basico &&
    dlocalStatus?.plan_token_pro &&
    dlocalStatus?.plan_token_empresarial

  return (
    <div className="p-6 space-y-8 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Configuración Global</h1>
        <p className="text-slate-400 text-sm mt-1">Planes, integración dLocalGo y estado del sistema</p>
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
                <p className="text-xs text-slate-500 mt-0.5">{plan.limits}</p>
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
          Para cambiar precios o límites, actualizá los archivos <span className="font-mono">app/precios/page.tsx</span>,{" "}
          <span className="font-mono">lib/plan-limits.ts</span> y recreá los planes en dLocalGo.
        </p>
      </section>

      {/* dLocalGo */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Integración dLocalGo</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200 gap-1.5"
            onClick={loadStatus}
            disabled={loadingStatus}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 mb-4">
          <ModeRow sandbox={dlocalStatus?.sandbox ?? null} />
          <EnvRow label="DLOCAL_API_KEY" configured={dlocalStatus?.api_key ?? null} loading={loadingStatus} />
          <EnvRow label="DLOCAL_SECRET_KEY" configured={dlocalStatus?.secret_key ?? null} loading={loadingStatus} />
          <EnvRow label="DLOCAL_PLAN_TOKEN_BASICO" configured={dlocalStatus?.plan_token_basico ?? null} loading={loadingStatus} />
          <EnvRow label="DLOCAL_PLAN_TOKEN_PRO" configured={dlocalStatus?.plan_token_pro ?? null} loading={loadingStatus} />
          <EnvRow label="DLOCAL_PLAN_TOKEN_EMPRESARIAL" configured={dlocalStatus?.plan_token_empresarial ?? null} loading={loadingStatus} />
        </div>

        <div className="flex flex-wrap gap-3">
          {!plansConfigured && (
            <Button
              size="sm"
              onClick={handleCreatePlans}
              disabled={creatingPlans || !dlocalStatus?.api_key || !dlocalStatus?.secret_key}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {creatingPlans ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creando planes...</>
              ) : (
                "Crear planes en dLocalGo"
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
            onClick={() => window.open(
              dlocalStatus?.sandbox
                ? "https://dashboard-sbx.dlocalgo.com"
                : "https://dashboard.dlocalgo.com",
              "_blank"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir dashboard dLocalGo
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Los tokens de plan se obtienen al crear los planes. Agregalos en Vercel → Settings → Environment Variables.
          El webhook de notificaciones apunta a <span className="font-mono">/api/dlocal/webhook</span>.
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
            <span className="text-sm font-mono text-slate-400">0.2.0</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Última migración</span>
            <span className="text-sm font-mono text-slate-400">20260413000000</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Framework</span>
            <span className="text-sm font-mono text-slate-400">Next.js 15 / React 19</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700">
            <span className="text-sm text-slate-300">Base de datos</span>
            <span className="text-sm font-mono text-slate-400">Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-300">Pasarela de pago</span>
            <span className="text-sm font-mono text-slate-400">dLocalGo</span>
          </div>
        </div>
      </section>
    </div>
  )
}
