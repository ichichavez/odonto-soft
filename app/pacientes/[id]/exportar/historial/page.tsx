import { redirect } from "next/navigation"

// Redirige a la página unificada de historial completo
export default function ExportarHistorialRedirect({ params }: { params: { id: string } }) {
  redirect(`/pacientes/${params.id}/exportar/completo`)
}
