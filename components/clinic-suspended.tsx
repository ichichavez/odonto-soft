"use client"

import { ShieldOff } from "lucide-react"

export function ClinicSuspendedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-5">
            <ShieldOff className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Cuenta suspendida</h1>
          <p className="text-muted-foreground">
            Tu clínica ha sido suspendida. Por favor contactá a soporte para regularizar tu situación.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/50 px-6 py-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Contacto de soporte</p>
          <p>soporte@odonto-soft.com</p>
        </div>
      </div>
    </div>
  )
}
