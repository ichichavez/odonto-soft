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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { Bell, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useToast } from "@/hooks/use-toast"

// ─── Reminder options ─────────────────────────────────────────────────────────

const REMINDER_OPTIONS = [
  { value: 1440, label: "24 horas antes" },
  { value: 120,  label: "2 horas antes" },
  { value: 60,   label: "1 hora antes" },
  { value: 45,   label: "45 minutos antes" },
  { value: 30,   label: "30 minutos antes" },
  { value: 15,   label: "15 minutos antes" },
  { value: 10,   label: "10 minutos antes" },
]

function formatMin(min: number): string {
  if (min >= 1440) return "24 h"
  if (min >= 60) return `${min / 60} h`
  return `${min} min`
}

function summaryLabel(minutes: number[]): string {
  if (!minutes.length) return "ninguno"
  return [...minutes].sort((a, b) => b - a).map(formatMin).join(" · ")
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserNav() {
  const { user, signOut, isAuthenticated, updateReminderMinutes } = useAuth()
  const { toast } = useToast()
  const [notifOpen, setNotifOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">Iniciar sesión</Button>
      </Link>
    )
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase()

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":      return "Administrador"
      case "dentista":   return "Dentista"
      case "asistente":  return "Asistente"
      default:           return role
    }
  }

  const handleOpenNotifDialog = () => {
    setSelected(user?.reminder_minutes ?? [30])
    setNotifOpen(true)
  }

  const toggleOption = (value: number) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSave = async () => {
    if (!selected.length) {
      toast({ title: "Seleccioná al menos un recordatorio", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await updateReminderMinutes(selected)
      toast({
        title: "Preferencia guardada",
        description: `Recibirás avisos: ${summaryLabel(selected)} antes de cada cita.`,
      })
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
                {summaryLabel(user?.reminder_minutes ?? [30])}
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

      {/* Dialog — configurar recordatorios */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Avisos de citas</DialogTitle>
            <DialogDescription>
              Seleccioná uno o más momentos para recibir el recordatorio.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {REMINDER_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center gap-3">
                <Checkbox
                  id={`reminder-${opt.value}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={() => toggleOption(opt.value)}
                />
                <Label htmlFor={`reminder-${opt.value}`} className="text-sm cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
