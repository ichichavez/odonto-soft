"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EndodonciaData {
  // Datos del diente
  diente: string

  // Historia odontológica (15 preguntas)
  q1_molestia: string          // si / no
  q1_motivo: string
  q2_senalar_diente: string    // si / no
  q3_inicio_dolor: string      // horas / dias / semanas / meses / anos / nunca
  q4_tipo_aparicion: string    // solo / provocado / primero_provocado
  q5_continuidad: string       // continuo / intermitente / primero_intermitente
  q6_duracion: string          // fugaz / persistente / primero_fugaz
  q7_tipo_dolor: string        // agudo / sordo / punzante
  q8_intensidad: string        // leve / moderado / severo
  q9_sensibilidad: string      // frio / caliente / ninguno / ambos
  q10_morder: string           // si / no
  q11_alrededor: string        // si / no
  q12_tratamiento_conducto: string // si / no
  q13_restauracion: string     // si / no
  q14_impide_actividades: string // si / no
  q15_medicamento: string      // si / no
  q15_cual: string
  q15_efecto: string           // si / no

  // Examen clínico — Inspección
  caries_profundidad: string   // superficial / media / profunda / pulpa_expuesta
  material_protector: string   // oze / resina / amalgama / incrustacion / corona / perno_corona / corona_cariada
  trauma_oclusal: string       // ausente / erosion / abrasion / atricion
  traumatismo: string          // ausente / esmalte / esmalte_dentina / esmalte_dentina_pulpa / cambio_color
  enf_periodontal: string      // ausente / presente
  bolsa_periodontal: string    // ausente / presente
  bolsa_localizacion: string
  bolsa_profundidad: string
  percusion_vertical: string   // presencia_dolor / ausencia_dolor
  percusion_horizontal: string // presencia_dolor / ausencia_dolor

  // Palpación
  movilidad: string            // ausente / presente
  apical: string               // ausencia_dolor / presencia_dolor
  edema: string                // ausente / presente
  edema_estado: string         // inicial / en_evolucion / evolucionado
  edema_ubicacion: string      // local / facial
  fistula: string              // ausente / presente / antecedentes

  // Test de vitalidad
  test_frio: string            // ausencia_estimulo / alivio / estimulo
  test_cavidad: string         // ausencia_estimulo / estimulo
  test_anestesia: string       // ausencia_estimulo / estimulo

  // Examen radiográfico — Cámara pulpar
  camara_normal: boolean; camara_amplia: boolean; camara_nodulos: boolean
  camara_cariada: boolean; camara_estrecha: boolean; camara_calcificada: boolean

  // Conductos radiculares — presentes
  cond_V: boolean; cond_P: boolean; cond_MV: boolean; cond_ML: boolean
  cond_DV: boolean; cond_DL: boolean; cond_D: boolean
  cond_unico: boolean; cond_foramen_unico: boolean

  // Conductos — características
  cond_normal: boolean; cond_amplio: boolean; cond_estrecho: boolean
  cond_calcificado: boolean; cond_obturado: boolean
  cond_recto: boolean; cond_curvo: boolean; cond_acodado: boolean
  cond_bayoneta: boolean; cond_bifurcado: boolean

  // Zona periapical
  apice_formado: boolean; apice_incompleto: boolean
  apice_reabs_interna: boolean; apice_reabs_externa: boolean
  periodonto_normal: boolean; periodonto_ensanchado: boolean
  zona_circular: boolean; zona_difusa: boolean

  // Diagnóstico clínico probable
  diag_pulpitis_reversible: boolean
  diag_pulpitis_irreversible: boolean
  diag_pi_sintomatica: boolean; diag_pi_asintomatica: boolean
  diag_motivos_protesicos: boolean
  diag_necrosis: boolean
  diag_periodontitis_apical: boolean
  diag_pa_sintomatica: boolean; diag_pa_asintomatica: boolean

  // Tratamiento indicado
  trat_biopulp_parcial: boolean    // Pulpotomía
  trat_biopulp_total: boolean
  trat_necropulp_i: boolean
  trat_necropulp_ii: boolean

  // Odontometría
  odontometria: Array<{
    conducto: string; long_radiografica: string; referencia: string
    penetracion_inst: string; long_trabajo: string
  }>

  // Preparación Químico-Mecánica
  preparacion: Array<{
    conducto: string; progresion: string; inst_inicial: string
    inst_memoria: string; inst_final: string
  }>

  // Obturación
  obturacion: Array<{
    conducto: string; tecnica_material: string; cemento: string
    cono_principal: string; conos_accesorios: string
  }>

  observaciones: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyRow4 = <T extends object>(template: T): T[] =>
  Array.from({ length: 4 }, () => ({ ...template }))

export function defaultEndodoncia(): EndodonciaData {
  return {
    diente: "",
    q1_molestia: "", q1_motivo: "",
    q2_senalar_diente: "",
    q3_inicio_dolor: "",
    q4_tipo_aparicion: "",
    q5_continuidad: "",
    q6_duracion: "",
    q7_tipo_dolor: "",
    q8_intensidad: "",
    q9_sensibilidad: "",
    q10_morder: "",
    q11_alrededor: "",
    q12_tratamiento_conducto: "",
    q13_restauracion: "",
    q14_impide_actividades: "",
    q15_medicamento: "", q15_cual: "", q15_efecto: "",
    caries_profundidad: "", material_protector: "",
    trauma_oclusal: "", traumatismo: "",
    enf_periodontal: "", bolsa_periodontal: "",
    bolsa_localizacion: "", bolsa_profundidad: "",
    percusion_vertical: "", percusion_horizontal: "",
    movilidad: "", apical: "",
    edema: "", edema_estado: "", edema_ubicacion: "",
    fistula: "",
    test_frio: "", test_cavidad: "", test_anestesia: "",
    camara_normal: false, camara_amplia: false, camara_nodulos: false,
    camara_cariada: false, camara_estrecha: false, camara_calcificada: false,
    cond_V: false, cond_P: false, cond_MV: false, cond_ML: false,
    cond_DV: false, cond_DL: false, cond_D: false,
    cond_unico: false, cond_foramen_unico: false,
    cond_normal: false, cond_amplio: false, cond_estrecho: false,
    cond_calcificado: false, cond_obturado: false,
    cond_recto: false, cond_curvo: false, cond_acodado: false,
    cond_bayoneta: false, cond_bifurcado: false,
    apice_formado: false, apice_incompleto: false,
    apice_reabs_interna: false, apice_reabs_externa: false,
    periodonto_normal: false, periodonto_ensanchado: false,
    zona_circular: false, zona_difusa: false,
    diag_pulpitis_reversible: false,
    diag_pulpitis_irreversible: false, diag_pi_sintomatica: false, diag_pi_asintomatica: false,
    diag_motivos_protesicos: false,
    diag_necrosis: false,
    diag_periodontitis_apical: false, diag_pa_sintomatica: false, diag_pa_asintomatica: false,
    trat_biopulp_parcial: false, trat_biopulp_total: false,
    trat_necropulp_i: false, trat_necropulp_ii: false,
    odontometria: emptyRow4({ conducto: "", long_radiografica: "", referencia: "", penetracion_inst: "", long_trabajo: "" }),
    preparacion: emptyRow4({ conducto: "", progresion: "", inst_inicial: "", inst_memoria: "", inst_final: "" }),
    obturacion: emptyRow4({ conducto: "", tecnica_material: "", cemento: "", cono_principal: "", conos_accesorios: "" }),
    observaciones: "",
  }
}

// ─── UI helpers ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b pb-1 mb-3">{children}</h3>
}

function Chips({
  options,
  value,
  onChange,
  allowMultiple = false,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  allowMultiple?: boolean
}) {
  const active = value.split(",").map((s) => s.trim()).filter(Boolean)
  const toggle = (v: string) => {
    if (allowMultiple) {
      const next = active.includes(v) ? active.filter((x) => x !== v) : [...active, v]
      onChange(next.join(", "))
    } else {
      onChange(active[0] === v ? "" : v)
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs border transition-colors",
            active.includes(o.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-accent"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function CB({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-primary rounded"
      />
      {label}
    </label>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface EndodonciaFormProps {
  value: EndodonciaData
  onChange: (v: EndodonciaData) => void
}

export function EndodonciaForm({ value: v, onChange }: EndodonciaFormProps) {
  const set = <K extends keyof EndodonciaData>(key: K, val: EndodonciaData[K]) =>
    onChange({ ...v, [key]: val })

  const SI_NO = [{ value: "si", label: "Sí" }, { value: "no", label: "No" }]
  const DOLOR = [{ value: "presencia_dolor", label: "Presencia de dolor" }, { value: "ausencia_dolor", label: "Ausencia de dolor" }]
  const AUSENTE_PRESENTE = [{ value: "ausente", label: "Ausente" }, { value: "presente", label: "Presente" }]

  return (
    <div className="space-y-6 text-sm">

      {/* Diente */}
      <div className="flex items-center gap-3">
        <Label className="text-xs font-semibold shrink-0">Diente N°</Label>
        <Input
          value={v.diente}
          onChange={(e) => set("diente", e.target.value)}
          placeholder="Ej: 36"
          className="h-8 w-24 text-sm"
        />
      </div>

      {/* ── HISTORIA ODONTOLÓGICA ── */}
      <div>
        <SectionTitle>Historia Odontológica</SectionTitle>
        <div className="space-y-3">

          {/* Q1 */}
          <div className="space-y-1">
            <p className="text-xs">1. ¿Está sufriendo actualmente alguna molestia?</p>
            <Chips options={SI_NO} value={v.q1_molestia} onChange={(val) => set("q1_molestia", val)} />
            {v.q1_molestia === "si" && (
              <Input
                value={v.q1_motivo}
                onChange={(e) => set("q1_motivo", e.target.value)}
                placeholder="Motivo..."
                className="h-7 text-xs"
              />
            )}
          </div>

          {/* Q2 */}
          <div className="space-y-1">
            <p className="text-xs">2. ¿Puede señalar el diente problema?</p>
            <Chips options={SI_NO} value={v.q2_senalar_diente} onChange={(val) => set("q2_senalar_diente", val)} />
          </div>

          {/* Q3 */}
          <div className="space-y-1">
            <p className="text-xs">3. ¿Cuándo sintió por primera vez el dolor?</p>
            <Chips
              options={[
                { value: "horas", label: "Horas" },
                { value: "dias", label: "Días" },
                { value: "semanas", label: "Semanas" },
                { value: "meses", label: "Meses" },
                { value: "anos", label: "Año/s" },
                { value: "nunca", label: "Nunca molestó" },
              ]}
              value={v.q3_inicio_dolor}
              onChange={(val) => set("q3_inicio_dolor", val)}
            />
          </div>

          {/* Q4 */}
          <div className="space-y-1">
            <p className="text-xs">4. ¿El dolor aparece solo o es provocado?</p>
            <Chips
              options={[
                { value: "solo", label: "Solo" },
                { value: "provocado", label: "Provocado" },
                { value: "primero_provocado", label: "Primero provocado, luego espontáneo" },
              ]}
              value={v.q4_tipo_aparicion}
              onChange={(val) => set("q4_tipo_aparicion", val)}
            />
          </div>

          {/* Q5 */}
          <div className="space-y-1">
            <p className="text-xs">5. ¿El dolor es constante o aparece y desaparece?</p>
            <Chips
              options={[
                { value: "continuo", label: "Continuo" },
                { value: "intermitente", label: "Intermitente" },
                { value: "primero_intermitente", label: "Primero intermitente, luego continuo" },
              ]}
              value={v.q5_continuidad}
              onChange={(val) => set("q5_continuidad", val)}
            />
          </div>

          {/* Q6 */}
          <div className="space-y-1">
            <p className="text-xs">6. ¿El dolor es momentáneo o tiende a perdurar?</p>
            <Chips
              options={[
                { value: "fugaz", label: "Fugaz" },
                { value: "persistente", label: "Persistente" },
                { value: "primero_fugaz", label: "Primero fugaz, ahora persiste" },
              ]}
              value={v.q6_duracion}
              onChange={(val) => set("q6_duracion", val)}
            />
          </div>

          {/* Q7 */}
          <div className="space-y-1">
            <p className="text-xs">7. ¿El dolor es agudo o sordo?</p>
            <Chips
              options={[
                { value: "agudo", label: "Agudo" },
                { value: "sordo", label: "Sordo" },
                { value: "punzante", label: "Punzante" },
              ]}
              value={v.q7_tipo_dolor}
              onChange={(val) => set("q7_tipo_dolor", val)}
            />
          </div>

          {/* Q8 */}
          <div className="space-y-1">
            <p className="text-xs">8. ¿El dolor es leve, moderado o severo?</p>
            <Chips
              options={[
                { value: "leve", label: "Leve" },
                { value: "moderado", label: "Moderado" },
                { value: "severo", label: "Severo" },
              ]}
              value={v.q8_intensidad}
              onChange={(val) => set("q8_intensidad", val)}
            />
          </div>

          {/* Q9 */}
          <div className="space-y-1">
            <p className="text-xs">9. ¿Siente dolor si algo frío o caliente llega al diente?</p>
            <Chips
              options={[
                { value: "frio", label: "Frío" },
                { value: "caliente", label: "Caliente" },
                { value: "ninguno", label: "Ninguno" },
                { value: "ambos", label: "Ambos" },
              ]}
              value={v.q9_sensibilidad}
              onChange={(val) => set("q9_sensibilidad", val)}
            />
          </div>

          {/* Q10 */}
          <div className="space-y-1">
            <p className="text-xs">10. ¿Le provoca dolor morder o masticar con ese diente?</p>
            <Chips options={SI_NO} value={v.q10_morder} onChange={(val) => set("q10_morder", val)} />
          </div>

          {/* Q11 */}
          <div className="space-y-1">
            <p className="text-xs">11. ¿Le provoca dolor la zona alrededor del diente?</p>
            <Chips options={SI_NO} value={v.q11_alrededor} onChange={(val) => set("q11_alrededor", val)} />
          </div>

          {/* Q12 */}
          <div className="space-y-1">
            <p className="text-xs">12. ¿Alguna vez se le inició un tratamiento de conducto en este diente?</p>
            <Chips options={SI_NO} value={v.q12_tratamiento_conducto} onChange={(val) => set("q12_tratamiento_conducto", val)} />
          </div>

          {/* Q13 */}
          <div className="space-y-1">
            <p className="text-xs">13. ¿Se le aplicó al diente alguna restauración recientemente?</p>
            <Chips options={SI_NO} value={v.q13_restauracion} onChange={(val) => set("q13_restauracion", val)} />
          </div>

          {/* Q14 */}
          <div className="space-y-1">
            <p className="text-xs">14. ¿El dolor le impide dormir o hacer sus actividades?</p>
            <Chips options={SI_NO} value={v.q14_impide_actividades} onChange={(val) => set("q14_impide_actividades", val)} />
          </div>

          {/* Q15 */}
          <div className="space-y-1">
            <p className="text-xs">15. ¿Tomó algún medicamento para el dolor?</p>
            <Chips options={SI_NO} value={v.q15_medicamento} onChange={(val) => set("q15_medicamento", val)} />
            {v.q15_medicamento === "si" && (
              <div className="flex gap-3 items-center flex-wrap pt-1">
                <Input value={v.q15_cual} onChange={(e) => set("q15_cual", e.target.value)}
                  placeholder="¿Cuál medicamento?" className="h-7 text-xs w-44" />
                <div className="space-y-1">
                  <p className="text-xs">¿Tuvo efecto?</p>
                  <Chips options={SI_NO} value={v.q15_efecto} onChange={(val) => set("q15_efecto", val)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXAMEN CLÍNICO — INSPECCIÓN ── */}
      <div>
        <SectionTitle>Examen Clínico — Inspección / Exploración</SectionTitle>
        <div className="space-y-3">

          <div className="space-y-1">
            <p className="text-xs font-medium">Caries (Profundidad)</p>
            <Chips
              options={[
                { value: "superficial", label: "Superficial" },
                { value: "media", label: "Media" },
                { value: "profunda", label: "Profunda" },
                { value: "pulpa_expuesta", label: "Pulpa expuesta" },
              ]}
              value={v.caries_profundidad}
              onChange={(val) => set("caries_profundidad", val)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Material protector</p>
            <Chips
              options={[
                { value: "oze", label: "OZE" },
                { value: "resina", label: "Resina" },
                { value: "amalgama", label: "Amalgama" },
                { value: "incrustacion", label: "Incrustación" },
                { value: "corona", label: "Corona" },
                { value: "perno_corona", label: "Perno-Corona" },
                { value: "corona_cariada", label: "Corona Cariada s/ Rest." },
              ]}
              value={v.material_protector}
              onChange={(val) => set("material_protector", val)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Trauma Oclusal</p>
            <Chips
              options={[
                { value: "ausente", label: "Ausente" },
                { value: "erosion", label: "Erosión" },
                { value: "abrasion", label: "Abrasión" },
                { value: "atricion", label: "Atrición" },
              ]}
              value={v.trauma_oclusal}
              onChange={(val) => set("trauma_oclusal", val)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Traumatismo</p>
            <Chips
              options={[
                { value: "ausente", label: "Ausente" },
                { value: "esmalte", label: "Esmalte" },
                { value: "esmalte_dentina", label: "Esmalte/Dentina" },
                { value: "esmalte_dentina_pulpa", label: "Esmalte/Dentina/Pulpa" },
                { value: "cambio_color", label: "Cambio de color" },
              ]}
              value={v.traumatismo}
              onChange={(val) => set("traumatismo", val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">Enfermedad Periodontal</p>
              <Chips options={AUSENTE_PRESENTE} value={v.enf_periodontal} onChange={(val) => set("enf_periodontal", val)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Bolsa Periodontal</p>
              <Chips options={AUSENTE_PRESENTE} value={v.bolsa_periodontal} onChange={(val) => set("bolsa_periodontal", val)} />
            </div>
          </div>

          {v.bolsa_periodontal === "presente" && (
            <div className="ml-4 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Localización</Label>
                <Input value={v.bolsa_localizacion} onChange={(e) => set("bolsa_localizacion", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Profundidad</Label>
                <Input value={v.bolsa_profundidad} onChange={(e) => set("bolsa_profundidad", e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">Percusión Vertical</p>
              <Chips options={DOLOR} value={v.percusion_vertical} onChange={(val) => set("percusion_vertical", val)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Percusión Horizontal</p>
              <Chips options={DOLOR} value={v.percusion_horizontal} onChange={(val) => set("percusion_horizontal", val)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PALPACIÓN ── */}
      <div>
        <SectionTitle>Palpación</SectionTitle>
        <div className="space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium">Movilidad</p>
              <Chips options={AUSENTE_PRESENTE} value={v.movilidad} onChange={(val) => set("movilidad", val)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Apical</p>
              <Chips options={[{ value: "ausencia_dolor", label: "Ausencia de dolor" }, { value: "presencia_dolor", label: "Presencia de dolor" }]}
                value={v.apical} onChange={(val) => set("apical", val)} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Edema</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Chips options={AUSENTE_PRESENTE} value={v.edema} onChange={(val) => set("edema", val)} />
              {v.edema === "presente" && (
                <>
                  <Chips
                    options={[
                      { value: "inicial", label: "Inicial" },
                      { value: "en_evolucion", label: "En evolución" },
                      { value: "evolucionado", label: "Evolucionado" },
                    ]}
                    value={v.edema_estado}
                    onChange={(val) => set("edema_estado", val)}
                  />
                  <Chips
                    options={[{ value: "local", label: "Local" }, { value: "facial", label: "Facial" }]}
                    value={v.edema_ubicacion}
                    onChange={(val) => set("edema_ubicacion", val)}
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Fístula</p>
            <Chips
              options={[
                { value: "ausente", label: "Ausente" },
                { value: "presente", label: "Presente" },
                { value: "antecedentes", label: "Antecedentes" },
              ]}
              value={v.fistula}
              onChange={(val) => set("fistula", val)}
            />
          </div>
        </div>
      </div>

      {/* ── TEST DE VITALIDAD ── */}
      <div>
        <SectionTitle>Test de Vitalidad</SectionTitle>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium">Frío</p>
            <Chips
              options={[
                { value: "ausencia_estimulo", label: "Ausencia de estímulo" },
                { value: "alivio", label: "Alivio" },
                { value: "estimulo", label: "Estímulo" },
              ]}
              value={v.test_frio}
              onChange={(val) => set("test_frio", val)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Test de cavidad</p>
            <Chips
              options={[
                { value: "ausencia_estimulo", label: "Ausencia de estímulo" },
                { value: "estimulo", label: "Estímulo" },
              ]}
              value={v.test_cavidad}
              onChange={(val) => set("test_cavidad", val)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Test de anestesia</p>
            <Chips
              options={[
                { value: "ausencia_estimulo", label: "Ausencia de estímulo" },
                { value: "estimulo", label: "Estímulo" },
              ]}
              value={v.test_anestesia}
              onChange={(val) => set("test_anestesia", val)}
            />
          </div>
        </div>
      </div>

      {/* ── EXAMEN RADIOGRÁFICO ── */}
      <div>
        <SectionTitle>Examen Radiográfico</SectionTitle>

        <div className="space-y-4">
          {/* Cámara pulpar */}
          <div>
            <p className="text-xs font-medium mb-2">Cámara Pulpar</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {([
                ["camara_normal", "Normal"],
                ["camara_amplia", "Amplia"],
                ["camara_nodulos", "Nódulos de calcificación"],
                ["camara_cariada", "Cariada"],
                ["camara_estrecha", "Estrecha"],
                ["camara_calcificada", "Calcificada"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
          </div>

          {/* Conductos presentes */}
          <div>
            <p className="text-xs font-medium mb-2">Conductos Presentes</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["cond_V", "V"], ["cond_P", "P"], ["cond_MV", "MV"], ["cond_ML", "ML"],
                ["cond_DV", "DV"], ["cond_DL", "DL"], ["cond_D", "D"],
                ["cond_unico", "Único"], ["cond_foramen_unico", "Foramen Único"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
          </div>

          {/* Conductos características */}
          <div>
            <p className="text-xs font-medium mb-2">Características de los Conductos</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {([
                ["cond_normal", "Normal/es"], ["cond_amplio", "Amplio/s"], ["cond_estrecho", "Estrecho/s"],
                ["cond_calcificado", "Calcificado/s"], ["cond_obturado", "Obturado/s"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-1.5">
              {([
                ["cond_recto", "Recto/s"], ["cond_curvo", "Curvo/s"], ["cond_acodado", "Acodado/s"],
                ["cond_bayoneta", "Bayoneta/s"], ["cond_bifurcado", "Bifurcado/s"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
          </div>

          {/* Zona periapical */}
          <div>
            <p className="text-xs font-medium mb-2">Zona Periapical</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5">
              <p className="text-xs text-muted-foreground col-span-full">Ápice</p>
              {([
                ["apice_formado", "Totalmente Formado"],
                ["apice_incompleto", "Incompleto"],
                ["apice_reabs_interna", "Reabs. Interna"],
                ["apice_reabs_externa", "Reabs. Externa"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5">
              <p className="text-xs text-muted-foreground col-span-full">Periodonto</p>
              {([
                ["periodonto_normal", "Normal"],
                ["periodonto_ensanchado", "Ensanchado"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <p className="text-xs text-muted-foreground col-span-full">Zona Radiolúcida</p>
              {([
                ["zona_circular", "Circular"],
                ["zona_difusa", "Difusa"],
              ] as [keyof EndodonciaData, string][]).map(([key, label]) => (
                <CB key={key} checked={v[key] as boolean} onChange={(val) => set(key, val)} label={label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DIAGNÓSTICO CLÍNICO PROBABLE ── */}
      <div>
        <SectionTitle>Diagnóstico Clínico Probable</SectionTitle>
        <div className="space-y-2">
          <CB checked={v.diag_pulpitis_reversible} onChange={(val) => set("diag_pulpitis_reversible", val)} label="Pulpitis Reversible" />
          <div className="flex items-center gap-3 flex-wrap">
            <CB checked={v.diag_pulpitis_irreversible} onChange={(val) => set("diag_pulpitis_irreversible", val)} label="Pulpitis Irreversible" />
            {v.diag_pulpitis_irreversible && (
              <>
                <CB checked={v.diag_pi_sintomatica} onChange={(val) => set("diag_pi_sintomatica", val)} label="sintomática" />
                <CB checked={v.diag_pi_asintomatica} onChange={(val) => set("diag_pi_asintomatica", val)} label="asintomática" />
              </>
            )}
          </div>
          <CB checked={v.diag_motivos_protesicos} onChange={(val) => set("diag_motivos_protesicos", val)} label="Motivos Protésicos" />
          <CB checked={v.diag_necrosis} onChange={(val) => set("diag_necrosis", val)} label="Necrosis pulpar" />
          <div className="flex items-center gap-3 flex-wrap">
            <CB checked={v.diag_periodontitis_apical} onChange={(val) => set("diag_periodontitis_apical", val)} label="Periodontitis apical" />
            {v.diag_periodontitis_apical && (
              <>
                <CB checked={v.diag_pa_sintomatica} onChange={(val) => set("diag_pa_sintomatica", val)} label="sintomática" />
                <CB checked={v.diag_pa_asintomatica} onChange={(val) => set("diag_pa_asintomatica", val)} label="asintomática" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TRATAMIENTO INDICADO ── */}
      <div>
        <SectionTitle>Tratamiento Indicado</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs font-medium">Biopulpectomía</p>
            <CB checked={v.trat_biopulp_parcial} onChange={(val) => set("trat_biopulp_parcial", val)} label="Parcial (Pulpotomía)" />
            <CB checked={v.trat_biopulp_total} onChange={(val) => set("trat_biopulp_total", val)} label="Total" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Necropulpectomía</p>
            <CB checked={v.trat_necropulp_i} onChange={(val) => set("trat_necropulp_i", val)} label="I" />
            <CB checked={v.trat_necropulp_ii} onChange={(val) => set("trat_necropulp_ii", val)} label="II" />
          </div>
        </div>
      </div>

      {/* ── ODONTOMETRÍA ── */}
      <div>
        <SectionTitle>Odontometría</SectionTitle>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-muted/50">
                {["Conducto", "Long. Radiográfica", "Referencia", "Penetración Inst.", "Long. de Trabajo"].map((h) => (
                  <th key={h} className="border border-gray-200 px-2 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.odontometria.map((row, i) => (
                <tr key={i}>
                  {(["conducto", "long_radiografica", "referencia", "penetracion_inst", "long_trabajo"] as const).map((field) => (
                    <td key={field} className="border border-gray-200 p-0.5">
                      <Input
                        value={row[field]}
                        onChange={(e) => {
                          const arr = v.odontometria.map((r, idx) =>
                            idx === i ? { ...r, [field]: e.target.value } : r
                          )
                          set("odontometria", arr)
                        }}
                        className="h-7 text-xs border-0 bg-transparent"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PREPARACIÓN QUÍMICO-MECÁNICA ── */}
      <div>
        <SectionTitle>Preparación Químico-Mecánica</SectionTitle>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-muted/50">
                {["Conducto", "Progresión de Instrumentos", "Inst. Inicial", "Inst. de Memoria", "Inst. Final"].map((h) => (
                  <th key={h} className="border border-gray-200 px-2 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.preparacion.map((row, i) => (
                <tr key={i}>
                  {(["conducto", "progresion", "inst_inicial", "inst_memoria", "inst_final"] as const).map((field) => (
                    <td key={field} className="border border-gray-200 p-0.5">
                      <Input
                        value={row[field]}
                        onChange={(e) => {
                          const arr = v.preparacion.map((r, idx) =>
                            idx === i ? { ...r, [field]: e.target.value } : r
                          )
                          set("preparacion", arr)
                        }}
                        className="h-7 text-xs border-0 bg-transparent"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OBTURACIÓN ── */}
      <div>
        <SectionTitle>Obturación</SectionTitle>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-muted/50">
                {["Conducto", "Técnica y Material", "Cemento", "Cono Principal", "Conos Accesorios"].map((h) => (
                  <th key={h} className="border border-gray-200 px-2 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.obturacion.map((row, i) => (
                <tr key={i}>
                  {(["conducto", "tecnica_material", "cemento", "cono_principal", "conos_accesorios"] as const).map((field) => (
                    <td key={field} className="border border-gray-200 p-0.5">
                      <Input
                        value={row[field]}
                        onChange={(e) => {
                          const arr = v.obturacion.map((r, idx) =>
                            idx === i ? { ...r, [field]: e.target.value } : r
                          )
                          set("obturacion", arr)
                        }}
                        className="h-7 text-xs border-0 bg-transparent"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OBSERVACIONES ── */}
      <div>
        <SectionTitle>Observaciones</SectionTitle>
        <Textarea
          value={v.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
          rows={3}
          className="resize-y text-sm"
          placeholder="Observaciones adicionales del profesional..."
        />
      </div>
    </div>
  )
}
