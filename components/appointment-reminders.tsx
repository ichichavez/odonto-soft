"use client"

/**
 * AppointmentReminders
 * Componente sin UI que programa notificaciones del navegador
 * para cada valor en reminder_minutes del usuario.
 * También muestra un toast in-app con opción de enviar WhatsApp.
 */

import { useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { appointmentService } from "@/services/appointments"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function apptDateTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(dateStr + "T00:00:00")
  d.setHours(h, m, 0, 0)
  return d
}

function formatMinLabel(min: number): string {
  if (min >= 1440) return "24 horas"
  if (min >= 60) return `${min / 60} hora${min / 60 > 1 ? "s" : ""}`
  return `${min} minutos`
}

function buildWhatsAppUrl(phone: string, patientName: string, timeStr: string): string {
  const clean = phone.replace(/\D/g, "")
  const text = encodeURIComponent(
    `Hola ${patientName}, le recordamos su cita odontológica de hoy a las ${timeStr}. ¡Lo esperamos!`
  )
  return `https://wa.me/${clean}?text=${text}`
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

        const reminderValues = user.reminder_minutes?.length ? user.reminder_minutes : [30]

        for (const appt of appointments) {
          if (appt.status === "cancelada" || appt.status === "completada") continue

          const patientName = appt.patients
            ? `${appt.patients.first_name} ${appt.patients.last_name}`
            : "Paciente"
          const timeStr = appt.time.substring(0, 5)
          const phone: string | undefined = (appt.patients as any)?.phone

          for (const minutesBefore of reminderValues) {
            const apptTime = apptDateTime(appt.date, appt.time)
            const reminderTime = new Date(apptTime.getTime() - minutesBefore * 60 * 1000)
            const delay = reminderTime.getTime() - Date.now()

            // Ignorar si ya pasó la hora del recordatorio
            if (delay < 0) continue

            const label = formatMinLabel(minutesBefore)

            const timer = setTimeout(() => {
              // Notificación del navegador (burbuja del SO)
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(`Cita en ${label}`, {
                  body: `${patientName} — ${timeStr}`,
                  icon: "/favicon.ico",
                  tag: `appt-${appt.id}-${minutesBefore}`,
                })
              }

              // Toast in-app con acción WhatsApp opcional
              toast({
                title: `Cita en ${label}`,
                description: `${patientName} a las ${timeStr}`,
                ...(phone
                  ? {
                      action: (
                        <ToastAction
                          altText="Enviar WhatsApp"
                          onClick={() => window.open(buildWhatsAppUrl(phone, patientName, timeStr), "_blank")}
                        >
                          WhatsApp
                        </ToastAction>
                      ),
                    }
                  : {}),
              })
            }, delay)

            timers.current.push(timer)
          }
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
