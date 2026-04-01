import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]

export const notificationService = {
  // Crear una notificación para un usuario específico
  async createForUser(userId: string, notification: Omit<NotificationInsert, "user_id" | "read">) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        ...notification,
        user_id: userId,
        read: false,
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Crear notificaciones para todos los usuarios con un rol específico
  async createForRole(role: string, notification: Omit<NotificationInsert, "user_id" | "read">) {
    const supabase = createBrowserClient()

    // Primero obtenemos todos los usuarios con ese rol
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("role", role)

    if (usersError) throw usersError
    if (!users || users.length === 0) return []

    // Creamos un array de notificaciones para insertar
    const notifications = users.map((user) => ({
      ...notification,
      user_id: user.id,
      read: false,
    }))

    // Insertamos todas las notificaciones
    const { data, error } = await supabase.from("notifications").insert(notifications).select()

    if (error) throw error
    return data
  },

  // Crear notificación para todos los usuarios
  async createForAll(notification: Omit<NotificationInsert, "user_id" | "read">) {
    const supabase = createBrowserClient()

    // Obtenemos todos los usuarios
    const { data: users, error: usersError } = await supabase.from("users").select("id")

    if (usersError) throw usersError
    if (!users || users.length === 0) return []

    // Creamos un array de notificaciones para insertar
    const notifications = users.map((user) => ({
      ...notification,
      user_id: user.id,
      read: false,
    }))

    // Insertamos todas las notificaciones
    const { data, error } = await supabase.from("notifications").insert(notifications).select()

    if (error) throw error
    return data
  },

  // Crear notificaciones para recordatorios de citas
  async createAppointmentReminders() {
    const supabase = createBrowserClient()

    // Obtenemos las citas de mañana que no tengan recordatorio enviado
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const { data: appointments, error: appError } = await supabase
      .from("appointments")
      .select(`
        id,
        date,
        time,
        patient_id,
        dentist_id,
        patients (id, first_name, last_name),
        treatments (id, name)
      `)
      .eq("date", tomorrowStr)
      .eq("status", "confirmada")

    if (appError) throw appError
    if (!appointments || appointments.length === 0) return []

    // Para cada cita, creamos notificaciones para el paciente y el dentista
    const notifications = []

    for (const appointment of appointments) {
      // Notificación para el dentista
      if (appointment.dentist_id) {
        notifications.push({
          user_id: appointment.dentist_id,
          title: "Recordatorio de cita mañana",
          message: `Tienes una cita con ${appointment.patients.first_name} ${appointment.patients.last_name} mañana a las ${appointment.time.substring(0, 5)}`,
          type: "info",
          read: false,
          link: `/citas/${appointment.id}`,
        })
      }

      // Aquí podríamos enviar un email al paciente si tuviéramos esa funcionalidad
    }

    if (notifications.length === 0) return []

    // Insertamos todas las notificaciones
    const { data, error } = await supabase.from("notifications").insert(notifications).select()

    if (error) throw error
    return data
  },
}
