"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(allowedRoles)) {
    return (
      fallback || (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>No tiene permisos suficientes para acceder a esta sección.</AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}
