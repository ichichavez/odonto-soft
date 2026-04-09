"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="text-center max-w-sm space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">¡Suscripción activada!</h1>
          <p className="text-muted-foreground">
            Tu período de prueba de <strong>7 días</strong> ha comenzado.
            Al finalizar, se cobrará automáticamente según el plan elegido.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/">Ir al panel principal</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">Ver mi suscripción</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Podés cancelar en cualquier momento desde{" "}
          <Link href="/billing" className="underline underline-offset-4">
            Mi suscripción
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
