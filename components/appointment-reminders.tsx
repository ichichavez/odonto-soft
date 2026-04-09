"use client"

/**
 * AppointmentReminders
 * Componente sin UI que programa notificaciones del navegador
 * 30 minutos antes de cada cita del día actual.
 * También muestra un toast in-app como respaldo.
 */

import { useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function apptDateTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(dateStr + "T00:00:00")
  d.setHours(h, m, 0, 0)
  return d
}

export function AppointmentReminders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!user) return

    // Solicitar permiso de notificación de forma silenciosa
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }

    let cancelled = false

    const scheduleReminders = async () => {
      // Limpiar timers anteriores
      timers.current.forEach(clearTimeout)
      timers.current = []

      try {
        const today = todayStr()
        const appointments = await appointmentService.getByDate(today)

        if (cancelled) return

        for (const appt of appointments) {
          if (appt.status === "cancelada" || appt.status === "completada") continue

          const minutesBefore = user.notification_before_minutes ?? 30
          const apptTime = apptDateTime(appt.date, appt.time)
          const reminderTime = new Date(apptTime.getTime() - minutesBefore * 60 * 1000)
          const delay = reminderTime.getTime() - Date.now()

          // Ignorar si ya pasó la hora del recordatorio
          if (delay < 0) continue

          const patientName = appt.patients
            ? `${appt.patients.first_name} ${appt.patients.last_name}`
            : "Paciente"
          const timeStr = appt.time.substring(0, 5)

          const timer = setTimeout(() => {
            // Notificación del navegador (burbuja del SO)
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`Cita en ${minutesBefore} minutos`, {
                body: `${patientName} — ${timeStr}`,
                icon: "/favicon.ico",
                tag: `appt-${appt.id}`,   // evita duplicados si se remonta
              })
            }

            // Toast in-app como respaldo
            toast({
              title: `Cita en ${minutesBefore} minutos`,
              description: `${patientName} a las ${timeStr}`,
            })
          }, delay)

          timers.current.push(timer)
        }
      } catch {
        // Silencioso — no rompe la app si falla
      }
    }

    scheduleReminders()

    // Re-programar cada día a medianoche para el día siguiente
    const now = new Date()
    const midnight = new Date(now)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 1, 0, 0)
    const midnightDelay = midnight.getTime() - now.getTime()
    const midnightTimer = setTimeout(scheduleReminders, midnightDelay)

    return () => {
      cancelled = true
      timers.current.forEach(clearTimeout)
      timers.current = []
      clearTimeout(midnightTimer)
    }
  }, [user])

  return null
}
