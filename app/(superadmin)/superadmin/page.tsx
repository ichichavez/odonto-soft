"use client"

import { useEffect, useState } from "react"
import { Building2, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { fetchMetrics, type SuperadminMetrics } from "@/services/superadmin"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  pro: "#10b981",
  enterprise: "#6366f1",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2.5">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
      </div>
    </div>
  )
}

export default function SuperadminDashboard() {
  const [metrics, setMetrics] = useState<SuperadminMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-slate-400">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <span>{error}</span>
      </div>
    )
  }

  if (!metrics) return null

  const pieData = [
    { name: "Free", value: metrics.plan_breakdown.free, color: PLAN_COLORS.free },
    { name: "Pro", value: metrics.plan_breakdown.pro, color: PLAN_COLORS.pro },
    { name: "Enterprise", value: metrics.plan_breakdown.enterprise, color: PLAN_COLORS.enterprise },
  ].filter((d) => d.value > 0)

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Panel de Control</h1>
        <p className="text-slate-400 text-sm mt-1">Vista global del SaaS OdontoSoft</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Clínicas activas"
          value={metrics.active_clinics}
          icon={Building2}
          sub={`${metrics.total_clinics} en total · ${metrics.suspended_clinics} suspendidas`}
        />
        <StatCard
          label="Usuarios totales"
          value={metrics.total_users}
          icon={Users}
        />
        <StatCard
          label="MRR estimado"
          value={`$${metrics.mrr}`}
          icon={DollarSign}
          sub="Basado en planes activos"
        />
        <StatCard
          label="Nuevas clínicas (mes)"
          value={metrics.new_clinics_this_month}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Bar Chart */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">MRR últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.mrr_history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#10b981" }}
                formatter={(v: number) => [`$${v}`, "MRR"]}
              />
              <Bar dataKey="mrr" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Pie Chart */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Distribución por plan</h2>
          {pieData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-slate-500 text-sm">
              Sin datos de suscripciones aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent clinics table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Clínicas recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="pb-3 pr-4 font-medium">Clínica</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 pr-4 font-medium">Estado</th>
                <th className="pb-3 pr-4 font-medium">Usuarios</th>
                <th className="pb-3 font-medium">Registrada</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent_clinics.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 pr-4 text-slate-100 font-medium">{c.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: `${PLAN_COLORS[c.plan] ?? "#94a3b8"}20`,
                        color: PLAN_COLORS[c.plan] ?? "#94a3b8",
                      }}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[c.status] ?? "outline"} className="capitalize">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{c.user_count}</td>
                  <td className="py-3 text-slate-400">
                    {c.created_at
                      ? format(new Date(c.created_at), "dd MMM yyyy", { locale: es })
                      : "—"}
                  </td>
                </tr>
              ))}
              {metrics.recent_clinics.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No hay clínicas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
