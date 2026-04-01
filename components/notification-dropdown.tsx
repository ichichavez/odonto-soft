"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications, type Notification } from "@/context/notification-context"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <div className="h-2 w-2 rounded-full bg-blue-500" />
      case "warning":
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />
      case "success":
        return <div className="h-2 w-2 rounded-full bg-green-500" />
      case "error":
        return <div className="h-2 w-2 rounded-full bg-red-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white"
              variant="outline"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={() => markAllAsRead()}>
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No tienes notificaciones</div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex cursor-pointer flex-col items-start p-4 ${!notification.read ? "bg-muted/50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span className="flex-1 font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
