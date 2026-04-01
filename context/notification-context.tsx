"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

export type Notification = {
  id: string
  user_id: string | null
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  created_at: string
  link?: string
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<Notification, "id" | "created_at" | "read" | "user_id">) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createBrowserClient()

  // Cargar notificaciones al iniciar
  useEffect(() => {
    if (user) {
      fetchNotifications()
    } else {
      setNotifications([])
      setLoading(false)
      setError(null)
    }
  }, [user])

  // Suscribirse a cambios en notificaciones
  useEffect(() => {
    if (!user || error) return

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, error])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      console.log("🔔 Cargando notificaciones para usuario:", user.id)

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (fetchError) {
        console.error("❌ Error al cargar notificaciones:", fetchError)

        // Si la tabla no existe, mostrar mensaje específico
        if (fetchError.message.includes('relation "notifications" does not exist')) {
          setError("La tabla de notificaciones no existe. Ejecuta el script de creación.")
          return
        }

        throw fetchError
      }

      console.log("✅ Notificaciones cargadas:", data?.length || 0)
      setNotifications(data || [])
    } catch (error: any) {
      console.error("❌ Error al cargar notificaciones:", error)
      setError(error.message || "Error al cargar notificaciones")

      // No mostrar toast si es un error de tabla no existente
      if (!error.message?.includes('relation "notifications" does not exist')) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las notificaciones",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const addNotification = async (notification: Omit<Notification, "id" | "created_at" | "read" | "user_id">) => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").insert({
        ...notification,
        user_id: user.id,
        read: false,
      })

      if (error) throw error

      // La notificación se actualizará a través de la suscripción
    } catch (error) {
      console.error("Error al añadir notificación:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
    }
  }

  const refreshNotifications = async () => {
    return fetchNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        addNotification,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications debe ser usado dentro de un NotificationProvider")
  }
  return context
}
