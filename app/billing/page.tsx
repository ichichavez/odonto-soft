"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, CheckCircle2, AlertTriangle, Clock, XCircle, ExternalLink, Users, UserRound, Building2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// ── Types ─────────────────────────────────────────────────────────────────────

type Subscription = {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  dlocal_order_id: string | null
}

type PlanUsage = {
  plan: string
  status: string
  limits: { patients: number | null; users: number | null; branches: number | null }
  usage: { patients: number; users: number; branches: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  basico:      "Básico",
  pro:         "Pro",
  empresarial: "Empresarial",
}

const PLAN_PRICES: Record<string, number> = {
  basico: 64,
  pro: 99,
  empresarial: 179,
}

type StatusInfo = { label: string; color: string; icon: React.ElementType }

const STATUS_INFO: Record<string, StatusInfo> = {
  trialing:  { label: "Período de prueba",  color: "bg-blue-100 text-blue-700",   icon: Clock          },
  active:    { label: "Activa",             color: "bg-green-100 text-green-700", icon: CheckCircle2   },
  past_due:  { label: "Pago pendiente",     color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  canceled:  { label: "Cancelada",          color: "bg-red-100 text-red-700",    icon: XCircle        },
  suspended: { label: "Suspendida",         color: "bg-red-100 text-red-700",    icon: XCircle        },
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_INFO[status] ?? STATUS_INFO.suspended
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${info.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {info.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const supabase = createBrowserClient()
      const [{ data: subData }, sessionData] = await Promise.all([
        (supabase as any)
          .from("subscriptions")
          .select("plan, status, current_period_end, cancel_at_period_end, dlocal_order_id")
          .eq("clinic_id", user.clinic_id)
          .single(),
        supabase.auth.getSession(),
      ])
      setSubscription(subData ?? null)

      const token = sessionData.data.session?.access_token
      if (token) {
        try {
          const res = await fetch("/api/plan/usage", { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) setPlanUsage(await res.json())
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [user])

  const openCheckout = async (plan?: string) => {
    if (!session?.access_token) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/dlocal/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: plan ?? subscription?.plan ?? "basico" }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) return null

  const trialEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

  const hasDlocalSubscription = !!subscription?.dlocal_order_id
  const isTrialing = subscription?.status === "trialing"
  const isActive = subscription?.status === "active"

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mi suscripción</h1>
          <p className="text-sm text-muted-foreground">Gestioná tu plan y facturación</p>
        </div>
      </div>

      {/* Subscription card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan actual</CardTitle>
          <CardDescription>Estado de tu suscripción a OdontoSoft</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-40" />
            </div>
          ) : subscription ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xl font-bold">
                    {PLAN_LABELS[subscription.plan] ?? subscription.plan}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ${PLAN_PRICES[subscription.plan] ?? "?"} /mes
                    </span>
                  </p>
                  {trialEnd && isTrialing && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Prueba gratuita hasta el {trialEnd}
                    </p>
                  )}
                  {trialEnd && isActive && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Próxima renovación: {trialEnd}
                    </p>
                  )}
                  {subscription.cancel_at_period_end && (
                    <p className="text-sm text-orange-600 mt-0.5">
                      Se cancelará al final del período
                    </p>
                  )}
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap pt-1">
                <Button onClick={() => openCheckout()} disabled={checkoutLoading} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  {checkoutLoading
                    ? "Redirigiendo..."
                    : hasDlocalSubscription
                    ? "Renovar / cambiar plan"
                    : "Suscribirme ahora"}
                </Button>

                {!isTrialing && !isActive && (
                  <Button variant="outline" onClick={() => router.push("/precios")}>
                    Ver planes
                  </Button>
                )}
              </div>

              {isTrialing && !hasDlocalSubscription && (
                <p className="text-xs text-muted-foreground">
                  Suscribite antes de que termine la prueba para no perder el acceso.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No tenés una suscripción activa.</p>
              <Button onClick={() => router.push("/precios")}>Ver planes</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso actual</CardTitle>
          <CardDescription>Recursos utilizados en tu plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[0,1,2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : planUsage ? (
            <div className="space-y-4">
              {(
                [
                  { key: "patients" as const, label: "Pacientes",   Icon: UserRound  },
                  { key: "users"    as const, label: "Usuarios",    Icon: Users      },
                  { key: "branches" as const, label: "Sucursales",  Icon: Building2  },
                ] as const
              ).map(({ key, label, Icon }) => {
                const current = planUsage.usage[key]
                const limit   = planUsage.limits[key]
                const pct     = limit ? Math.min((current / limit) * 100, 100) : 0
                const near    = limit !== null && pct >= 80
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {label}
                      </span>
                      <span className={near ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                        {current}{limit !== null ? ` / ${limit}` : " / Ilimitado"}
                      </span>
                    </div>
                    {limit !== null && (
                      <Progress value={pct} className={`h-2 ${near ? "[&>div]:bg-orange-500" : ""}`} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se pudo cargar el uso.</p>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-5 pb-4 text-sm text-muted-foreground space-y-2">
          <p>• Los pagos se procesan de forma segura a través de dLocalGo.</p>
          <p>• Si tu pago falla, tenés 7 días para actualizarlo antes de que se suspenda la cuenta.</p>
          <p>• Para cancelar tu suscripción, contactá a soporte.</p>
        </CardContent>
      </Card>
    </div>
  )
}
