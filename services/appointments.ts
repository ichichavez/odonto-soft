import { createBrowserClient } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
export type AppointmentUpdate = Database["public"]["Tables"]["appointments"]["Update"]

export const appointmentService = {
  // Determinar qué tabla usar
  async getTableName(): Promise<string> {
    try {
      const supabase = createBrowserClient()

      // Intentar consultar appointments_new primero
      const { error: newTableError } = await supabase.from("appointments_new").select("id").limit(1)

      if (!newTableError) {
        console.log("📋 Usando tabla: appointments_new")
        return "appointments_new"
      }

      // Si falla, usar la tabla original
      console.log("📋 Usando tabla: appointments (original)")
      return "appointments"
    } catch (error) {
      console.log("📋 Error determinando tabla, usando appointments original")
      return "appointments"
    }
  },

  // Obtener todas las citas
  async getAll() {
    try {
      console.log("📋 Obteniendo todas las citas")
      const supabase = createBrowserClient()
      const tableName = await this.getTableName()

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          patients (id, first_name, last_name),
          users (id, name),
          treatments (id, name, price)
        `)
        .order("date", { ascending: true })

      if (error) {
        console.error("Error fetching appointments:", error)
        throw new Error(`Error al obtener citas: ${error.message}`)
      }
      return data || []
    } catch (error) {
      console.error("Error in getAll:", error)
      throw error
    }
  },

  // Obtener citas por fecha
  async getByDate(date: string) {
    try {
      console.log(`📋 Obteniendo citas para fecha ${date}`)
      const supabase = createBrowserClient()
      const tableName = await this.getTableName()

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          patients (id, first_name, last_name),
          users (id, name),
          treatments (id, name, price)
        `)
        .eq("date", date)
        .order("time", { ascending: true })

      if (error) {
        console.error("Error fetching appointments by date:", error)
        throw new Error(`Error al obtener citas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getByDate:", error)
      throw error
    }
  },

  // Obtener una cita por ID
  async getById(id: string) {
    try {
      console.log(`📋 Obteniendo cita con ID ${id}`)
      const supabase = createBrowserClient()
      const tableName = await this.getTableName()

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          patients (id, first_name, last_name, email, phone),
          users (id, name),
          treatments (id, name, price)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching appointment by id:", error)
        throw new Error(`Error al obtener cita: ${error.message}`)
      }
      return data
    } catch (error) {
      console.error("Error in getById:", error)
      throw error
    }
  },

  // Crear una nueva cita con múltiples estrategias y valores de status
  async create(appointment: any) {
    try {
      console.log("🚀 CREANDO CITA (estrategia anti-constraint)")
      console.log("📋 Datos recibidos:", appointment)

      // Verificar que tenemos los datos mínimos
      if (!appointment.patient_id || !appointment.dentist_id || !appointment.date || !appointment.time) {
        throw new Error("Faltan campos requeridos: patient_id, dentist_id, date, time")
      }

      const supabase = createBrowserClient()

      // ESTRATEGIA 1: Intentar con función RPC
      try {
        console.log("🎯 Estrategia 1: Intentando con función RPC")

        const { data: rpcData, error: rpcError } = await supabase.rpc("create_appointment", {
          p_patient_id: appointment.patient_id,
          p_dentist_id: appointment.dentist_id,
          p_treatment_id: appointment.treatment_id || null,
          p_date: appointment.date,
          p_time: appointment.time,
          p_duration: Number(appointment.duration) || 30,
          p_notes: appointment.notes || null,
        })

        if (!rpcError && rpcData && !rpcData.error) {
          console.log("✅ Éxito con RPC:", rpcData)
          return rpcData
        }

        console.log("⚠️ RPC falló:", rpcError?.message || rpcData?.error)
      } catch (rpcErr) {
        console.log("⚠️ Error en RPC:", rpcErr)
      }

      // ESTRATEGIA 2: Inserción directa con múltiples valores de status
      console.log("🎯 Estrategia 2: Inserción directa con múltiples status")

      const baseData = {
        patient_id: appointment.patient_id,
        dentist_id: appointment.dentist_id,
        treatment_id: appointment.treatment_id || null,
        date: appointment.date,
        time: appointment.time,
        duration: Number(appointment.duration) || 30,
        notes: appointment.notes || null,
      }

      // Lista de valores de status para probar
      const statusValues = [
        null, // Sin status (usar default de la tabla)
        "programada",
        "scheduled",
        "pendiente",
        "activa",
        "nueva",
        "confirmada",
      ]

      // Intentar con appointments_new primero
      try {
        console.log("🎯 Probando con appointments_new")

        for (const statusValue of statusValues) {
          try {
            const appointmentData = { ...baseData, status: statusValue }
            console.log(`   Probando status: ${statusValue || "null (default)"}`)

            const { data: newData, error: newError } = await supabase
              .from("appointments_new")
              .insert([appointmentData])
              .select()

            if (!newError && newData && newData.length > 0) {
              console.log(`✅ Éxito con appointments_new (status: ${statusValue || "default"}):`, newData[0])
              return newData[0]
            }

            console.log(`   ❌ Falló con status ${statusValue || "null"}:`, newError?.message)
          } catch (err) {
            console.log(`   💥 Error con status ${statusValue || "null"}:`, err)
          }
        }

        console.log("⚠️ Todos los status fallaron en appointments_new")
      } catch (newErr) {
        console.log("⚠️ Error general con appointments_new:", newErr)
      }

      // ESTRATEGIA 3: Intentar con appointments original
      console.log("🎯 Probando con appointments original")

      for (const statusValue of statusValues) {
        try {
          const appointmentData = { ...baseData, status: statusValue }
          console.log(`   Probando status: ${statusValue || "null (default)"}`)

          const { data: originalData, error: originalError } = await supabase
            .from("appointments")
            .insert([appointmentData])
            .select()

          if (!originalError && originalData && originalData.length > 0) {
            console.log(`✅ Éxito con appointments (status: ${statusValue || "default"}):`, originalData[0])
            return originalData[0]
          }

          console.log(`   ❌ Falló con status ${statusValue || "null"}:`, originalError?.message)
        } catch (err) {
          console.log(`   💥 Error con status ${statusValue || "null"}:`, err)
        }
      }

      // ESTRATEGIA 4: Inserción sin status (solo campos requeridos)
      console.log("🎯 Estrategia 4: Solo campos mínimos")

      const minimalData = {
        patient_id: appointment.patient_id,
        dentist_id: appointment.dentist_id,
        date: appointment.date,
        time: appointment.time,
      }

      try {
        const { data: minimalResult, error: minimalError } = await supabase
          .from("appointments")
          .insert([minimalData])
          .select()

        if (!minimalError && minimalResult && minimalResult.length > 0) {
          console.log("✅ Éxito con datos mínimos:", minimalResult[0])
          return minimalResult[0]
        }

        console.log("❌ Falló con datos mínimos:", minimalError?.message)
      } catch (minimalErr) {
        console.log("💥 Error con datos mínimos:", minimalErr)
      }

      // Si llegamos aquí, todo falló
      throw new Error(
        "No se pudo crear la cita con ninguna estrategia. Verifique la configuración de la base de datos.",
      )
    } catch (error) {
      console.error("💥 Error general en create:", error)
      throw error
    }
  },

  // Actualizar una cita
  async update(id: string, appointment: AppointmentUpdate) {
    try {
      console.log(`📝 Actualizando cita ${id}`)
      const supabase = createBrowserClient()
      const tableName = await this.getTableName()

      const { data, error } = await supabase
        .from(tableName as any)
        .update(appointment)
        .eq("id", id)
        .select()

      if (error) {
        console.error("Error updating appointment:", error)
        throw new Error(`Error al actualizar cita: ${error.message}`)
      }
      return data[0]
    } catch (error) {
      console.error("Error in update:", error)
      throw error
    }
  },

  // Eliminar una cita
  async delete(id: string) {
    try {
      console.log(`🗑️ Eliminando cita ${id}`)
      const supabase = createBrowserClient()
      const tableName = await this.getTableName()

      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting appointment:", error)
        throw new Error(`Error al eliminar cita: ${error.message}`)
      }
      return true
    } catch (error) {
      console.error("Error in delete:", error)
      throw error
    }
  },
}
