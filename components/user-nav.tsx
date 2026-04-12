"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { Bell, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useToast } from "@/hooks/use-toast"

export function UserNav() {
  const { user, signOut, isAuthenticated, updateNotificationMinutes } = useAuth()
  const { toast } = useToast()
  const [notifOpen, setNotifOpen] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState<string>("30")
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Iniciar sesión
        </Button>
      </Link>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "dentista":
        return "Dentista"
      case "asistente":
        return "Asistente"
      default:
        return role
    }
  }

  const handleOpenNotifDialog = () => {
    setSelectedMinutes(String(user?.notification_before_minutes ?? 30))
    setNotifOpen(true)
  }

  const handleSaveNotifMinutes = async () => {
    setSaving(true)
    try {
      await updateNotificationMinutes(Number(selectedMinutes))
      toast({ title: "Preferencia guardada", description: `Recibirás avisos ${selectedMinutes} minutos antes de cada cita.` })
      setNotifOpen(false)
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <NotificationDropdown />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
              <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1">{getRoleName(user?.role || "")}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleOpenNotifDialog}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Aviso de citas</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {user?.notification_before_minutes ?? 30} min
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para configurar aviso de citas */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aviso de citas</DialogTitle>
            <DialogDescription>
              ¿Cuánto tiempo antes de cada cita quieres recibir el aviso?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block text-sm">Tiempo de anticipación</Label>
            <Select value={selectedMinutes} onValueChange={setSelectedMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutos antes</SelectItem>
                <SelectItem value="15">15 minutos antes</SelectItem>
                <SelectItem value="20">20 minutos antes</SelectItem>
                <SelectItem value="30">30 minutos antes</SelectItem>
                <SelectItem value="45">45 minutos antes</SelectItem>
                <SelectItem value="60">60 minutos antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveNotifMinutes} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
