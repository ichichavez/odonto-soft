"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/context/notification-context"
import { patientService } from "@/services/patients"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Trash2, RefreshCw, AlertCircle, Cake, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return "595" + digits.slice(1)
  return digits
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications()

  const [birthdayPatients, setBirthdayPatients] = useState<any[]>([])

  useEffect(() => {
    patientService.getAll().then((patients) => {
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()
      const birthdays = patients.filter((p) => {
        if (!p.birth_date) return false
        const d = new Date(p.birth_date)
        return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay
      })
      setBirthdayPatients(birthdays)
    }).catch(console.error)
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error en Notificaciones
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Para solucionar este problema:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Ejecuta el script de creación de la tabla de notificaciones</li>
                <li>Verifica que tienes permisos en la base de datos</li>
                <li>Recarga la página después de ejecutar el script</li>
              </ol>
              <Button onClick={refreshNotifications} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer` : "No tienes notificaciones sin leer"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Cumpleaños de hoy */}
      {birthdayPatients.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Cake className="h-5 w-5 text-pink-500" />
            Cumpleaños de hoy
          </h2>
          <div className="space-y-3">
            {birthdayPatients.map((patient) => {
              const age = patient.birth_date ? calculateAge(patient.birth_date) : null
              const phone = patient.phone || patient.secondary_phone || ""
              const wa = phone ? formatWhatsApp(phone) : null
              const name = `${patient.first_name} ${patient.last_name}`
              const waText = encodeURIComponent(
                `¡Feliz cumpleaños ${patient.first_name}! 🎂 De parte de todos en la clínica, le deseamos un muy feliz día.`
              )
              return (
                <Card key={patient.id} className="border-l-4 border-l-pink-400">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm shrink-0">
                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        {age !== null && (
                          <p className="text-sm text-muted-foreground">Cumple {age} años hoy 🎉</p>
                        )}
                      </div>
                    </div>
                    {wa && (
                      <Button asChild size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-2">
                        <a
                          href={`https://wa.me/${wa}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Enviar por WhatsApp
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando notificaciones...</span>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
            <p className="text-muted-foreground text-center">Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`${!notification.read ? "border-l-4 border-l-blue-500" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <Badge variant="secondary" className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="default" className="bg-blue-500">
                            Nuevo
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{notification.message}</p>
                {notification.link && (
                  <Button variant="link" className="p-0 h-auto mt-2" asChild>
                    <a href={notification.link}>Ver más detalles →</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
