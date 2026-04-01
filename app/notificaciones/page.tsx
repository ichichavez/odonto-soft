"use client"

import { useNotifications } from "@/context/notification-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

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
