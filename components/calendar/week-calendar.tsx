"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"

// ── Constants ──────────────────────────────────────────────────────────────────

const START_HOUR = 7    // 7:00 AM
const END_HOUR   = 21   // 9:00 PM (exclusive)
const HOUR_H     = 64   // px per hour
const SNAP_MIN   = 15   // snap drag to nearest N minutes

const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const STATUS_CLASSES: Record<string, string> = {
  confirmada: "border-green-500  bg-green-50   text-green-900  dark:bg-green-950/60  dark:text-green-100",
  pendiente:  "border-yellow-500 bg-yellow-50  text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-100",
  cancelada:  "border-red-500    bg-red-50     text-red-900    dark:bg-red-950/60    dark:text-red-100",
  completada: "border-blue-500   bg-blue-50    text-blue-900   dark:bg-blue-950/60   dark:text-blue-100",
  programada: "border-violet-500 bg-violet-50  text-violet-900 dark:bg-violet-950/60 dark:text-violet-100",
  scheduled:  "border-violet-500 bg-violet-50  text-violet-900 dark:bg-violet-950/60 dark:text-violet-100",
}
const DEFAULT_CLASS = "border-gray-400 bg-gray-50 text-gray-900 dark:bg-gray-900/60 dark:text-gray-100"

// ── Utilities ──────────────────────────────────────────────────────────────────

function getWeekStart(d: Date): Date {
  const clone = new Date(d)
  const day = clone.getDay()            // 0=Sun
  const offset = day === 0 ? -6 : 1 - day // shift to Monday
  clone.setDate(clone.getDate() + offset)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

// ── Layout helper — assigns horizontal columns to overlapping appointments ──────

interface AppointmentFull {
  id: string
  date: string
  time: string
  duration: number
  status: string
  dentist_id: string
  patients?: { id: string; first_name: string; last_name: string } | null
  treatments?: { id: string; name: string } | null
}

interface LayoutItem {
  appt: AppointmentFull
  col: number
  total: number
}

function layoutDay(appts: AppointmentFull[]): LayoutItem[] {
  if (appts.length === 0) return []
  const sorted = [...appts].sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
  const colEnds: number[] = [] // end minute of last appt in each column

  const assigned: Array<{ appt: AppointmentFull; col: number }> = sorted.map(appt => {
    const start = timeToMin(appt.time)
    const end   = start + Math.max(1, appt.duration || 30)
    let c = colEnds.findIndex(e => e <= start)
    if (c === -1) c = colEnds.length
    colEnds[c] = end
    return { appt, col: c }
  })

  const total = Math.max(1, colEnds.length)
  return assigned.map(({ appt, col }) => ({ appt, col, total }))
}

// ── Component ──────────────────────────────────────────────────────────────────

interface WeekCalendarProps {
  dentistFilter?: string
}

export function WeekCalendar({ dentistFilter = "todos" }: WeekCalendarProps) {
  const router  = useRouter()
  const { toast } = useToast()

  const [view, setView] = useState<"week" | "day">("week")
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [appointments, setAppointments] = useState<AppointmentFull[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  // Red "current time" line updates every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const dragging  = useRef<AppointmentFull | null>(null)
  const colRefs   = useRef<Record<string, HTMLDivElement | null>>({})

  // Days to show
  const days: Date[] = view === "week"
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        return d
      })
    : [selectedDay]

  // ── Data loading ────────────────────────────────────────────────────────────

  const reload = useCallback(async (daysList: Date[], filter: string) => {
    setLoading(true)
    try {
      const start = isoDate(daysList[0])
      const end   = isoDate(daysList[daysList.length - 1])
      const raw   = await appointmentService.getByDateRange(start, end)
      const filtered = filter && filter !== "todos"
        ? (raw as AppointmentFull[]).filter(a => a.dentist_id === filter)
        : (raw as AppointmentFull[])
      setAppointments(filtered)
    } catch {
      toast({ title: "Error al cargar citas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    reload(days, dentistFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, selectedDay, view, dentistFilter])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const shift = (direction: 1 | -1) => {
    if (view === "week") {
      setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + direction * 7); return d })
    } else {
      setSelectedDay(d => { const n = new Date(d); n.setDate(n.getDate() + direction); return n })
    }
  }

  const goToday = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    setWeekStart(getWeekStart(today))
    setSelectedDay(today)
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const onDragStart = (e: React.DragEvent, appt: AppointmentFull) => {
    dragging.current = appt
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", appt.id)
  }

  const onDragEnd = () => { dragging.current = null }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault()
    const appt = dragging.current
    dragging.current = null
    if (!appt) return

    const ds  = isoDate(day)
    const col = colRefs.current[ds]
    if (!col) return

    const rect   = col.getBoundingClientRect()
    const relY   = e.clientY - rect.top
    const rawMin = (relY / HOUR_H) * 60 + START_HOUR * 60
    const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN
    const clamped = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snapped))
    const newTime = minToTime(clamped)

    if (ds === appt.date && newTime === appt.time) return

    try {
      await appointmentService.update(appt.id, { date: ds, time: newTime } as any)
      setAppointments(prev =>
        prev.map(a => a.id === appt.id ? { ...a, date: ds, time: newTime } : a)
      )
      toast({ title: "Cita reprogramada", description: `${ds} a las ${newTime.substring(0, 5)}` })
    } catch {
      toast({ title: "Error al reprogramar cita", variant: "destructive" })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const todayStr = isoDate(new Date())
  const hours    = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const nowMin   = now.getHours() * 60 + now.getMinutes()
  const nowTop   = ((nowMin - START_HOUR * 60) / 60) * HOUR_H
  const showNow  = nowTop >= 0 && nowTop <= HOUR_H * (END_HOUR - START_HOUR)

  function rangeLabel() {
    if (view === "day") {
      const d = selectedDay
      return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    }
    const first = days[0], last = days[6]
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
    }
    return `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <span className="text-sm font-semibold flex-1 truncate">{rangeLabel()}</span>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

        {/* View toggle */}
        <div className="flex rounded-lg border bg-muted p-0.5 text-sm shrink-0">
          <button
            onClick={() => setView("week")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-all",
              view === "week"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >Semana</button>
          <button
            onClick={() => setView("day")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-all",
              view === "day"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >Día</button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 min-h-[400px] overflow-auto rounded-xl border bg-card">

        {/* Sticky day-column headers */}
        <div className="sticky top-0 z-20 flex bg-card border-b shadow-sm">
          <div className="w-14 shrink-0" /> {/* spacer for time labels */}
          {days.map(day => {
            const ds      = isoDate(day)
            const isToday = ds === todayStr
            return (
              <div
                key={ds}
                onClick={() => { setSelectedDay(day); setView("day") }}
                className={cn(
                  "flex-1 min-w-0 py-2 text-center border-l first:border-l-0",
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  isToday && "bg-primary/5"
                )}
              >
                <p className={cn(
                  "text-[11px] uppercase tracking-wide font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {DAYS_SHORT[day.getDay()]}
                </p>
                <div className={cn(
                  "mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid body */}
        <div className="flex">

          {/* Hour labels */}
          <div className="w-14 shrink-0 select-none">
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_H }} className="relative">
                <span className="absolute -top-2.5 right-2 text-[11px] text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
            {/* bottom padding so last hour label is visible */}
            <div style={{ height: 20 }} />
          </div>

          {/* Day columns */}
          {days.map(day => {
            const ds      = isoDate(day)
            const isToday = ds === todayStr
            const items   = layoutDay(appointments.filter(a => a.date === ds))

            return (
              <div
                key={ds}
                ref={el => { colRefs.current[ds] = el }}
                style={{ height: HOUR_H * (END_HOUR - START_HOUR) }}
                className={cn("flex-1 min-w-0 relative border-l", isToday && "bg-primary/[0.03]")}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, day)}
              >
                {/* Hour lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    style={{ top: (h - START_HOUR) * HOUR_H }}
                    className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
                  />
                ))}
                {/* Half-hour dashed lines */}
                {hours.map(h => (
                  <div
                    key={`${h}h`}
                    style={{ top: (h - START_HOUR) * HOUR_H + HOUR_H / 2 }}
                    className="absolute inset-x-0 border-t border-border/20 border-dashed pointer-events-none"
                  />
                ))}

                {/* Current time indicator */}
                {isToday && showNow && (
                  <div
                    style={{ top: nowTop }}
                    className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0 ring-2 ring-background" />
                    <span className="flex-1 border-t-2 border-red-500" />
                  </div>
                )}

                {/* Appointment blocks */}
                {items.map(({ appt, col, total }) => {
                  const startMin = timeToMin(appt.time)
                  const topPx    = ((startMin - START_HOUR * 60) / 60) * HOUR_H
                  const heightPx = Math.max(22, ((appt.duration || 30) / 60) * HOUR_H)
                  const colW     = 100 / total
                  const colorCls = STATUS_CLASSES[appt.status] ?? DEFAULT_CLASS

                  return (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={e => onDragStart(e, appt)}
                      onDragEnd={onDragEnd}
                      onClick={() => router.push(`/citas/${appt.id}`)}
                      style={{
                        top:    Math.max(0, topPx),
                        height: heightPx,
                        left:   `calc(${col * colW}% + 2px)`,
                        width:  `calc(${colW}% - 4px)`,
                      }}
                      className={cn(
                        "absolute rounded border-l-[3px] px-1.5 py-0.5 text-[11px] overflow-hidden",
                        "cursor-pointer hover:brightness-95 active:cursor-grabbing transition-[filter]",
                        "select-none",
                        colorCls
                      )}
                      title={`${appt.time.substring(0, 5)} · ${appt.patients?.first_name ?? ""} ${appt.patients?.last_name ?? ""}`.trim()}
                    >
                      <p className="font-semibold leading-tight truncate">
                        {appt.patients?.first_name} {appt.patients?.last_name}
                      </p>
                      {heightPx > 32 && (
                        <p className="opacity-75 truncate leading-tight mt-px">
                          {appt.time.substring(0, 5)} · {appt.treatments?.name ?? "Consulta"}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
