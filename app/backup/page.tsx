"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase"
import { FileSpreadsheet, FileCode2, Download, ShieldCheck, Info } from "lucide-react"
import * as XLSX from "xlsx"

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

function toSqlInserts(tableName: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `-- ${tableName}: sin datos\n`

  const lines: string[] = [`-- Tabla: ${tableName} (${rows.length} filas)`]
  for (const row of rows) {
    const cols = Object.keys(row).join(", ")
    const vals = Object.values(row)
      .map((v) => {
        if (v === null || v === undefined) return "NULL"
        if (typeof v === "number" || typeof v === "boolean") return String(v)
        // Escape single quotes inside strings
        return `'${String(v).replace(/'/g, "''")}'`
      })
      .join(", ")
    lines.push(`INSERT INTO ${tableName} (${cols}) VALUES (${vals});`)
  }
  return lines.join("\n")
}

// ─── component ────────────────────────────────────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  patients: "Pacientes",
  appointments: "Citas",
  invoices: "Facturas",
  invoice_items: "Items de facturas",
  budgets: "Presupuestos",
  budget_items: "Items de presupuestos",
  treatments: "Tratamientos",
  purchases: "Compras",
  purchase_items: "Items de compras",
  expenses: "Gastos",
  inventory: "Inventario",
  treatment_plan_items: "Plan de tratamiento",
  users: "Usuarios",
}

export default function BackupPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState<{ at: string; counts: Record<string, number> } | null>(null)

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
      </div>
    )
  }

  const fetchBackupData = async () => {
    const headers = await getAuthHeader()
    const res = await fetch("/api/backup", { headers })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Error ${res.status}`)
    }
    return res.json() as Promise<{
      exported_at: string
      clinic_id: string
      tables: Record<string, Record<string, unknown>[]>
    }>
  }

  const handleExcelExport = async () => {
    setLoading(true)
    try {
      const data = await fetchBackupData()
      const wb = XLSX.utils.book_new()

      for (const [key, rows] of Object.entries(data.tables)) {
        const label = TABLE_LABELS[key] ?? key
        const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
        XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31)) // max 31 chars for sheet name
      }

      const date = new Date(data.exported_at).toISOString().slice(0, 10)
      XLSX.writeFile(wb, `odonto-backup-${date}.xlsx`)

      const counts = Object.fromEntries(
        Object.entries(data.tables).map(([k, v]) => [k, v.length])
      )
      setLastBackup({ at: data.exported_at, counts })
      toast({ title: "Backup Excel descargado", description: `Exportado el ${date}` })
    } catch (e: any) {
      toast({ title: "Error al exportar Excel", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSqlExport = async () => {
    setLoading(true)
    try {
      const data = await fetchBackupData()
      const date = new Date(data.exported_at).toISOString().slice(0, 10)

      const sections = [
        `-- =============================================`,
        `-- ODONTO-SOFT — Backup SQL`,
        `-- Clínica: ${data.clinic_id}`,
        `-- Exportado: ${data.exported_at}`,
        `-- =============================================`,
        ``,
        `SET session_replication_role = 'replica'; -- deshabilita FK checks durante la carga`,
        ``,
      ]

      for (const [key, rows] of Object.entries(data.tables)) {
        sections.push(toSqlInserts(key, rows))
        sections.push("")
      }

      sections.push(`SET session_replication_role = 'origin';`)

      const blob = new Blob([sections.join("\n")], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `odonto-backup-${date}.sql`
      a.click()
      URL.revokeObjectURL(url)

      const counts = Object.fromEntries(
        Object.entries(data.tables).map(([k, v]) => [k, v.length])
      )
      setLastBackup({ at: data.exported_at, counts })
      toast({ title: "Backup SQL descargado", description: `Exportado el ${date}` })
    } catch (e: any) {
      toast({ title: "Error al exportar SQL", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backup de datos</h1>
        <p className="text-muted-foreground">
          Descarga una copia completa de los datos de tu clínica
        </p>
      </div>

      {/* Opciones de exportación */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Excel</CardTitle>
                <CardDescription className="text-xs">Multi-hoja (.xlsx)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Una hoja por tabla. Abre directamente en Excel, LibreOffice o Google Sheets. Ideal para revisar y analizar los datos.
            </p>
            <Button
              onClick={handleExcelExport}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {loading ? "Generando..." : "Descargar Excel"}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">SQL</CardTitle>
                <CardDescription className="text-xs">Sentencias INSERT (.sql)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Script SQL listo para importar en Supabase o PostgreSQL. Ideal para migración o restauración completa.
            </p>
            <Button
              onClick={handleSqlExport}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {loading ? "Generando..." : "Descargar SQL"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultado del último backup */}
      {lastBackup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Último backup generado
            </CardTitle>
            <CardDescription>
              {new Date(lastBackup.at).toLocaleString("es-PY", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(lastBackup.counts).map(([key, count]) => (
                <Badge key={key} variant="secondary" className="gap-1">
                  <span className="font-normal text-muted-foreground">{TABLE_LABELS[key] ?? key}:</span>
                  <span>{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota informativa */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="flex gap-3 pt-6">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              El backup incluye todos los datos de <strong>tu clínica</strong>: pacientes, citas, facturas, presupuestos, tratamientos, compras, gastos, inventario y plan de tratamiento.
            </p>
            <p>
              Las contraseñas de usuarios <strong>no se incluyen</strong> por razones de seguridad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
