import { createBrowserClient } from "@/lib/supabase"

export type ConsentTemplate = {
  id: string
  clinic_id: string
  name: string
  specialty: string
  content: string
  created_at: string
  updated_at: string
}

export const SPECIALTY_LABELS: Record<string, string> = {
  general:      "General",
  armonizacion: "Armonización Orofacial",
  ortodoncia:   "Ortodoncia",
  periodoncia:  "Periodoncia",
  estetica:     "Estética Dental",
  cirugia:      "Cirugía",
}

/** Plantillas incluidas en el sistema que la clínica puede importar con un click */
export const BUILTIN_TEMPLATES: Omit<ConsentTemplate, "id" | "clinic_id" | "created_at" | "updated_at">[] = [
  {
    name: "Toxina Botulínica",
    specialty: "armonizacion",
    content: `CONSENTIMIENTO PARA TOXINA BOTULÍNICA

En la Ciudad de _____________________, a _____ de __________________ de __________

-DEJO CONSTANCIA que se me ha explicado que cuando se inyectan pequeñas cantidades de toxina botulínica purificada en un músculo se produce el debilitamiento o parálisis del mismo.

-Que este efecto aparece entre el tercero y el séptimo día de la inyección y perdura habitualmente de cuatro a seis meses.

-Que dado que numerosas alteraciones estéticas aparecen o se empeoran con la contracción de determinados músculos faciales, como las "patas de gallo" y las arrugas del entrecejo, el efecto de parálisis local reversible que produce la toxina botulínica mejora el aspecto estético de muchas personas con este tipo de arrugas. Sé que no podré "fruncir el ceño" mientras duren los efectos de la inyección.

-Que dichos efectos persistirán entre cuatro y seis meses antes de que desaparezcan y en ese momento podré optar por tratarme nuevamente.

-Comprendo que debo mantener la cabeza erguida y no tocar las zonas tratadas durante un período de 4 horas luego del procedimiento.

-Comprendo que el tratamiento con toxina botulínica de las arrugas faciales del entrecejo puede causar una caída parcial y temporaria de un párpado en un pequeño número de casos, que habitualmente dura entre 2 y 3 semanas y que ocasionalmente pueden aparecer sensación de adormecimiento en la frente y dolor de cabeza transitorios. Sé que en un escaso número de personas, la inyección no produce el efecto con el grado esperado (parálisis muscular) o por el período de tiempo antes mencionado.

-Autorizo a tomar fotografías clínicas de control para su uso posterior con fines exclusivamente científicos, publicaciones o presentaciones científicas, sabiendo que mi identidad será protegida en todo momento.

-Declaro no estar embarazada ni padecer enfermedad neurológica alguna (por ejemplo, parálisis facial, espasmos, debilidad de movimientos, etc).

-Sé que este procedimiento es cosmético y que no está cubierto por los seguros médicos, obras sociales, etc.

-He leído y comprendido los párrafos precedentes. Mis preguntas fueron respondidas satisfactoriamente por el profesional y sus colaboradores.

-Acepto los riesgos y complicaciones potenciales del procedimiento.

---

Nombres y apellidos del paciente: _____________________________________

Tipo y número del documento de identidad: _____________________ / _____________________

Firma del paciente: _____________________________________     Fecha: _____________________`,
  },
]

export const consentTemplateService = {
  async getByClinic(clinicId: string): Promise<ConsentTemplate[]> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("consent_templates")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("specialty")
      .order("name")
    if (error) throw error
    return (data ?? []) as ConsentTemplate[]
  },

  async create(payload: Pick<ConsentTemplate, "clinic_id" | "name" | "specialty" | "content">): Promise<ConsentTemplate> {
    const supabase = createBrowserClient()
    const { data, error } = await (supabase as any)
      .from("consent_templates")
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return data as ConsentTemplate
  },

  async update(id: string, patch: Partial<Pick<ConsentTemplate, "name" | "specialty" | "content">>): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await (supabase as any)
      .from("consent_templates")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await (supabase as any)
      .from("consent_templates")
      .delete()
      .eq("id", id)
    if (error) throw error
  },
}
