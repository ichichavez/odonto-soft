"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react"
import { patientService } from "@/services/patients"
import { appointmentService } from "@/services/appointments"
import { purchaseService } from "@/services/purchases"
import { expenseService, CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/services/expenses"
import { inventoryService } from "@/services/inventory"
import { exportToExcel, exportToPDF } from "@/lib/export"

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function fmt(n: number) { return `₲ ${Number(n).toLocaleString("es-PY")}` }
function fmtDate(d: string) {
  if (!d) return "—"
  return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric"
  })
}

function getRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2,"0")}-01`
  const last = new Date(year, month, 0).getDate()
  const to   = `${year}-${String(month).padStart(2,"0")}-${last}`
  return { from, to }
}

function ExportButtons({ onExcel, onPDF }: { onExcel: () => void; onPDF: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExcel} className="flex items-center gap-1.5">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={onPDF} className="flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> PDF
      </Button>
    </div>
  )
}

export default function ReportesPage() {
  const { toast } = useToast()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [patients,     setPatients]     = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [purchases,    setPurchases]    = useState<any[]>([])
  const [expenses,     setExpenses]     = useState<any[]>([])
  const [materials,    setMaterials]    = useState<any[]>([])

  const [loadingPatients,     setLoadingPatients]     = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingPurchases,    setLoadingPurchases]    = useState(true)
  const [loadingExpenses,     setLoadingExpenses]     = useState(true)
  const [loadingMaterials,    setLoadingMaterials]    = useState(true)

  // Load static data once
  useEffect(() => {
    patientService.getAll()
      .then(setPatients)
      .catch(() => {})
      .finally(() => setLoadingPatients(false))

    inventoryService.materials.getAll()
      .then(setMaterials)
      .catch(() => {})
      .finally(() => setLoadingMaterials(false))
  }, [])

  // Load month-dependent data
  useEffect(() => {
    const { from, to } = getRange(year, month)

    setLoadingAppointments(true)
    appointmentService.getAll()
      .then(data => {
        const filtered = data.filter((a: any) => a.date >= from && a.date <= to)
        setAppointments(filtered)
      })
      .catch(() => {})
      .finally(() => setLoadingAppointments(false))

    setLoadingPurchases(true)
    purchaseService.getByDateRange(from, to)
      .then(setPurchases)
      .catch(() => {})
      .finally(() => setLoadingPurchases(false))

    setLoadingExpenses(true)
    expenseService.getByDateRange(from, to)
      .then(setExpenses)
      .catch(() => {})
      .finally(() => setLoadingExpenses(false))
  }, [year, month])

  const prevMonth = () => { if (month === 1) { setYear(y=>y-1); setMonth(12) } else setMonth(m=>m-1) }
  const nextMonth = () => { if (month === 12) { setYear(y=>y+1); setMonth(1) } else setMonth(m=>m+1) }

  const monthLabel = `${MONTH_NAMES[month-1]} ${year}`

  // Summaries
  const totalCompras  = useMemo(() => purchases.reduce((s,p) => s + Number(p.total), 0), [purchases])
  const totalGastos   = useMemo(() => expenses.reduce((s,e) => s + Number(e.amount), 0), [expenses])
  const stockBajo     = useMemo(() => materials.filter(m => m.stock_quantity <= m.min_stock).length, [materials])

  // ── Export helpers ──────────────────────────────────────────────────────────

  const exportPacientes = (type: "excel"|"pdf") => {
    const cols = [
      { header: "Apellido",   key: "last_name" },
      { header: "Nombre",     key: "first_name" },
      { header: "CI",         key: "ci" },
      { header: "Teléfono",   key: "phone" },
      { header: "Email",      key: "email" },
      { header: "Nacimiento", key: "birth_date" },
      { header: "Registro",   key: "_created" },
    ]
    const data = patients.map(p => ({
      ...p,
      birth_date: p.birth_date ? fmtDate(p.birth_date) : "—",
      _created: fmtDate(p.created_at?.split("T")[0] ?? ""),
    }))
    if (type === "excel") exportToExcel(data, cols, `Pacientes_${now.toISOString().split("T")[0]}`)
    else exportToPDF(data, cols, `Pacientes — ${patients.length} registros`)
  }

  const exportCitas = (type: "excel"|"pdf") => {
    const cols = [
      { header: "Fecha",      key: "_date" },
      { header: "Hora",       key: "time" },
      { header: "Paciente",   key: "_patient" },
      { header: "Dentista",   key: "_dentist" },
      { header: "Tratamiento",key: "_treatment" },
      { header: "Estado",     key: "status" },
      { header: "Notas",      key: "notes" },
    ]
    const data = appointments.map((a: any) => ({
      ...a,
      _date:      fmtDate(a.date),
      _patient:   a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "—",
      _dentist:   a.users?.name ?? "—",
      _treatment: a.treatments?.name ?? "—",
    }))
    if (type === "excel") exportToExcel(data, cols, `Citas_${monthLabel.replace(" ","_")}`)
    else exportToPDF(data, cols, `Citas — ${monthLabel}`)
  }

  const exportCompras = (type: "excel"|"pdf") => {
    const cols = [
      { header: "Fecha",     key: "_date" },
      { header: "Proveedor", key: "_supplier" },
      { header: "Ítems",     key: "_items" },
      { header: "Total",     key: "_total" },
      { header: "Notas",     key: "notes" },
    ]
    const data = purchases.map((p: any) => ({
      ...p,
      _date:     fmtDate(p.date),
      _supplier: p.supplier || "Sin proveedor",
      _items:    p.purchase_items?.length ?? 0,
      _total:    fmt(Number(p.total)),
    }))
    if (type === "excel") exportToExcel(data, cols, `Compras_${monthLabel.replace(" ","_")}`)
    else exportToPDF(data, cols, `Compras — ${monthLabel}`)
  }

  const exportGastos = (type: "excel"|"pdf") => {
    const cols = [
      { header: "Fecha",      key: "_date" },
      { header: "Categoría",  key: "_category" },
      { header: "Descripción",key: "description" },
      { header: "Pago",       key: "_payment" },
      { header: "Monto",      key: "_amount" },
      { header: "Notas",      key: "notes" },
    ]
    const data = expenses.map((e: any) => ({
      ...e,
      _date:     fmtDate(e.date),
      _category: CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS] ?? e.category,
      _payment:  PAYMENT_METHOD_LABELS[e.payment_method as keyof typeof PAYMENT_METHOD_LABELS] ?? e.payment_method,
      _amount:   fmt(Number(e.amount)),
    }))
    if (type === "excel") exportToExcel(data, cols, `Gastos_${monthLabel.replace(" ","_")}`)
    else exportToPDF(data, cols, `Gastos — ${monthLabel}`)
  }

  const exportMateriales = (type: "excel"|"pdf") => {
    const cols = [
      { header: "Nombre",        key: "name" },
      { header: "Unidad",        key: "unit" },
      { header: "Stock actual",  key: "stock_quantity" },
      { header: "Stock mínimo",  key: "min_stock" },
      { header: "Costo",         key: "_cost" },
      { header: "Precio venta",  key: "_sale" },
    ]
    const data = materials.map((m: any) => ({
      ...m,
      _cost: m.cost_price != null ? fmt(m.cost_price) : "—",
      _sale: m.sale_price  != null ? fmt(m.sale_price) : "—",
    }))
    if (type === "excel") exportToExcel(data, cols, `Materiales_${now.toISOString().split("T")[0]}`)
    else exportToPDF(data, cols, "Inventario de Materiales")
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Pacientes</CardTitle></CardHeader>
          <CardContent>{loadingPatients ? <Skeleton className="h-8 w-16"/> : <p className="text-2xl font-bold">{patients.length}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Citas ({MONTH_NAMES[month-1]})</CardTitle></CardHeader>
          <CardContent>{loadingAppointments ? <Skeleton className="h-8 w-16"/> : <p className="text-2xl font-bold">{appointments.length}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Compras ({MONTH_NAMES[month-1]})</CardTitle></CardHeader>
          <CardContent>{loadingPurchases ? <Skeleton className="h-8 w-32"/> : <p className="text-2xl font-bold text-primary">{fmt(totalCompras)}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Gastos ({MONTH_NAMES[month-1]})</CardTitle></CardHeader>
          <CardContent>{loadingExpenses ? <Skeleton className="h-8 w-32"/> : <p className="text-2xl font-bold text-destructive">{fmt(totalGastos)}</p>}</CardContent>
        </Card>
      </div>

      {/* Month navigator (applies to Citas, Compras, Gastos) */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4"/></Button>
        <span className="text-sm font-semibold w-40 text-center">{monthLabel}</span>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4"/></Button>
        <span className="text-xs text-muted-foreground">(aplica a Citas, Compras y Gastos)</span>
      </div>

      <Tabs defaultValue="pacientes">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
        </TabsList>

        {/* ── PACIENTES ── */}
        <TabsContent value="pacientes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Pacientes ({patients.length})</CardTitle>
              <ExportButtons onExcel={() => exportPacientes("excel")} onPDF={() => exportPacientes("pdf")} />
            </CardHeader>
            <CardContent>
              {loadingPatients ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-2 px-2">Apellido</th>
                        <th className="text-left py-2 px-2">Nombre</th>
                        <th className="text-left py-2 px-2">CI</th>
                        <th className="text-left py-2 px-2">Teléfono</th>
                        <th className="text-left py-2 px-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Sin registros</td></tr>
                      ) : patients.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-2 font-medium">{p.last_name}</td>
                          <td className="py-2 px-2">{p.first_name}</td>
                          <td className="py-2 px-2">{p.ci || "—"}</td>
                          <td className="py-2 px-2">{p.phone || "—"}</td>
                          <td className="py-2 px-2">{p.email || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CITAS ── */}
        <TabsContent value="citas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Citas — {monthLabel} ({appointments.length})</CardTitle>
              <ExportButtons onExcel={() => exportCitas("excel")} onPDF={() => exportCitas("pdf")} />
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-2 px-2">Fecha</th>
                        <th className="text-left py-2 px-2">Hora</th>
                        <th className="text-left py-2 px-2">Paciente</th>
                        <th className="text-left py-2 px-2">Dentista</th>
                        <th className="text-left py-2 px-2">Tratamiento</th>
                        <th className="text-left py-2 px-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sin citas en este período</td></tr>
                      ) : appointments.map((a: any) => (
                        <tr key={a.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-2">{fmtDate(a.date)}</td>
                          <td className="py-2 px-2">{a.time ?? "—"}</td>
                          <td className="py-2 px-2 font-medium">
                            {a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "—"}
                          </td>
                          <td className="py-2 px-2">{a.users?.name ?? "—"}</td>
                          <td className="py-2 px-2">{a.treatments?.name ?? "—"}</td>
                          <td className="py-2 px-2 capitalize">{a.status ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPRAS ── */}
        <TabsContent value="compras">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Compras — {monthLabel} ({purchases.length})</CardTitle>
              <ExportButtons onExcel={() => exportCompras("excel")} onPDF={() => exportCompras("pdf")} />
            </CardHeader>
            <CardContent>
              {loadingPurchases ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-2 px-2">Fecha</th>
                        <th className="text-left py-2 px-2">Proveedor</th>
                        <th className="text-center py-2 px-2">Ítems</th>
                        <th className="text-right py-2 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Sin compras en este período</td></tr>
                      ) : purchases.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-2">{fmtDate(p.date)}</td>
                          <td className="py-2 px-2">{p.supplier || <span className="italic text-muted-foreground">Sin proveedor</span>}</td>
                          <td className="py-2 px-2 text-center">{p.purchase_items?.length ?? 0}</td>
                          <td className="py-2 px-2 text-right font-semibold text-primary">{fmt(Number(p.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                    {purchases.length > 0 && (
                      <tfoot>
                        <tr className="border-t font-semibold bg-muted/40">
                          <td colSpan={3} className="py-2 px-2 text-right text-sm">Total</td>
                          <td className="py-2 px-2 text-right text-primary">{fmt(totalCompras)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GASTOS ── */}
        <TabsContent value="gastos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Gastos — {monthLabel} ({expenses.length})</CardTitle>
              <ExportButtons onExcel={() => exportGastos("excel")} onPDF={() => exportGastos("pdf")} />
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-2 px-2">Fecha</th>
                        <th className="text-left py-2 px-2">Categoría</th>
                        <th className="text-left py-2 px-2">Descripción</th>
                        <th className="text-left py-2 px-2">Pago</th>
                        <th className="text-right py-2 px-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Sin gastos en este período</td></tr>
                      ) : expenses.map((e: any) => (
                        <tr key={e.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-2">{fmtDate(e.date)}</td>
                          <td className="py-2 px-2 text-xs">{CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS] ?? e.category}</td>
                          <td className="py-2 px-2">{e.description}</td>
                          <td className="py-2 px-2 text-xs">{PAYMENT_METHOD_LABELS[e.payment_method as keyof typeof PAYMENT_METHOD_LABELS] ?? e.payment_method}</td>
                          <td className="py-2 px-2 text-right font-semibold">{fmt(Number(e.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                    {expenses.length > 0 && (
                      <tfoot>
                        <tr className="border-t font-semibold bg-muted/40">
                          <td colSpan={4} className="py-2 px-2 text-right text-sm">Total</td>
                          <td className="py-2 px-2 text-right text-destructive">{fmt(totalGastos)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MATERIALES ── */}
        <TabsContent value="materiales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Materiales ({materials.length})</CardTitle>
                {stockBajo > 0 && (
                  <p className="text-xs text-destructive mt-0.5">{stockBajo} material(es) con stock bajo o agotado</p>
                )}
              </div>
              <ExportButtons onExcel={() => exportMateriales("excel")} onPDF={() => exportMateriales("pdf")} />
            </CardHeader>
            <CardContent>
              {loadingMaterials ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full"/>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-2 px-2">Nombre</th>
                        <th className="text-left py-2 px-2">Unidad</th>
                        <th className="text-right py-2 px-2">Stock</th>
                        <th className="text-right py-2 px-2">Mín.</th>
                        <th className="text-right py-2 px-2">Costo</th>
                        <th className="text-right py-2 px-2">Precio venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sin materiales</td></tr>
                      ) : materials.map((m: any) => (
                        <tr key={m.id} className={`border-b hover:bg-muted/30 ${m.stock_quantity <= m.min_stock ? "bg-destructive/5" : ""}`}>
                          <td className="py-2 px-2 font-medium">{m.name}</td>
                          <td className="py-2 px-2 text-muted-foreground">{m.unit}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${m.stock_quantity <= m.min_stock ? "text-destructive" : ""}`}>
                            {Number(m.stock_quantity).toLocaleString("es-PY")}
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">{m.min_stock}</td>
                          <td className="py-2 px-2 text-right">{m.cost_price != null ? fmt(m.cost_price) : "—"}</td>
                          <td className="py-2 px-2 text-right">{m.sale_price  != null ? fmt(m.sale_price)  : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
