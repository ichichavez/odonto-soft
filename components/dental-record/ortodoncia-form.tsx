"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrtodonciaData {
  // Datos complementarios (barrio/ciudad ya en registro general pero se muestran como referencia)
  // Historia de la infancia
  lactancia_tipo: string
  enf_infancia: string
  enf_infectocontagiosas: string
  problemas_congenitos: string
  alergias_respiratorias: string
  fracturas_oseas: string
  artritis_reumatoidea: string
  medicacion_actual: string
  cirugias: string
  traumatismo_maxilofacial: string
  obs_infancia: string

  // Examen funcional
  respiracion: string
  diccion: string
  habitos: string
  deglucion: string
  posicion_lengua: string
  musculo_mentoniano: string
  cierre_labial: string
  amigdalas: string
  tejidos_blandos: string
  frenillo_lingual: string
  frenillo_labial: string
  tipo_periodonto: string
  higiene_bucal: string
  lineas_medias: string

  // Examen dentario
  supernumerarios: string
  agenesias: string
  anomalias_forma: string
  anomalias_color: string
  transposiciones: string
  ectopias: string
  retenidos: string
  ausentes: string
  terceros_molares: string
  otros_dentarios: string

  // Diagnóstico y Plan
  diagnostico: string
  plan_tratamiento: string

  // Análisis de Moyers
  moyers_esp_disp_sup_der: string; moyers_esp_disp_sup_izq: string
  moyers_esp_disp_inf_der: string; moyers_esp_disp_inf_izq: string
  moyers_esp_req_sup_der:  string; moyers_esp_req_sup_izq:  string
  moyers_esp_req_inf_der:  string; moyers_esp_req_inf_izq:  string
  moyers_disc_sup_der:     string; moyers_disc_sup_izq:     string
  moyers_disc_inf_der:     string; moyers_disc_inf_izq:     string
  moyers_diagnostico: string

  // Discrepancia dentaria
  disc_sup_disponible: string; disc_sup_requerido: string; disc_sup_discrepancia: string
  disc_inf_disponible: string; disc_inf_requerido: string; disc_inf_discrepancia: string

  // Articulador
  contacto_prematuro: string
  tipo_contacto: string        // A | B | C
  clase1_div: string; clase1_subdiv: string
  clase2_div: string; clase2_subdiv: string
  clase3_div: string; clase3_subdiv: string
  overjet: string
  overbite: string
  // Transversal (checkboxes)
  trans_mordida_cruzada: boolean
  trans_cuspide_fosa: boolean
  trans_cuspide_cuspide: boolean
  trans_mordida_tijera: boolean
  trans_inoclusion: boolean
  trans_curva_wilson: boolean

  // Estudio preliminar ATM — Anamnesis
  atm_traumatismos: string; atm_ruidos: string; atm_limitacion: string
  atm_dolor_cabeza: string; atm_dolor_cara: string; atm_dolor_cuello: string
  atm_enf_sistemica: string
  atm_medicamento: string
  atm_stress: string

  // Palpación muscular
  palpacion_der: string
  palpacion_izq: string
  laxitud: string               // "no" | "si"
  laxitud_grado: string

  // Examen clínico ATM
  manipulacion: string          // "facil" | "termino_medio" | "dificil" | "muy_dificil"
  cierre_forzado: string        // "forzado" | "levemente_forzado" | "no_forzado"
  labio_sup: string             // "normal" | "corto"
  hipertrofia: string
  otros_clinico: string

  // Mapa del dolor articular — 8 puntos (texto libre para anotaciones)
  mapa_1: string; mapa_2: string; mapa_3: string; mapa_4: string
  mapa_5: string; mapa_6: string; mapa_7: string; mapa_8: string
  mapa_otros: string
  mapa_palito_der: string       // "duele" | "no_duele"
  mapa_palito_izq: string

  // Dinámica mandibular
  din_protusion: string
  din_lat_der: string
  din_lat_izq: string
  din_apertura: string
  din_salto_der: string
  din_salto_izq: string
  din_otros: string

  // Rango y trayecto
  condilo_der: string
  condilo_izq: string
}

// ─── Default ──────────────────────────────────────────────────────────────────

export function defaultOrtodoncia(): OrtodonciaData {
  return {
    lactancia_tipo: "", enf_infancia: "", enf_infectocontagiosas: "",
    problemas_congenitos: "", alergias_respiratorias: "", fracturas_oseas: "",
    artritis_reumatoidea: "", medicacion_actual: "", cirugias: "",
    traumatismo_maxilofacial: "", obs_infancia: "",
    respiracion: "", diccion: "", habitos: "", deglucion: "",
    posicion_lengua: "", musculo_mentoniano: "", cierre_labial: "",
    amigdalas: "", tejidos_blandos: "", frenillo_lingual: "", frenillo_labial: "",
    tipo_periodonto: "", higiene_bucal: "", lineas_medias: "",
    supernumerarios: "", agenesias: "", anomalias_forma: "", anomalias_color: "",
    transposiciones: "", ectopias: "", retenidos: "", ausentes: "",
    terceros_molares: "", otros_dentarios: "",
    diagnostico: "", plan_tratamiento: "",
    moyers_esp_disp_sup_der: "", moyers_esp_disp_sup_izq: "",
    moyers_esp_disp_inf_der: "", moyers_esp_disp_inf_izq: "",
    moyers_esp_req_sup_der:  "", moyers_esp_req_sup_izq:  "",
    moyers_esp_req_inf_der:  "", moyers_esp_req_inf_izq:  "",
    moyers_disc_sup_der: "", moyers_disc_sup_izq: "",
    moyers_disc_inf_der: "", moyers_disc_inf_izq: "",
    moyers_diagnostico: "",
    disc_sup_disponible: "", disc_sup_requerido: "", disc_sup_discrepancia: "",
    disc_inf_disponible: "", disc_inf_requerido: "", disc_inf_discrepancia: "",
    contacto_prematuro: "", tipo_contacto: "",
    clase1_div: "", clase1_subdiv: "",
    clase2_div: "", clase2_subdiv: "",
    clase3_div: "", clase3_subdiv: "",
    overjet: "", overbite: "",
    trans_mordida_cruzada: false, trans_cuspide_fosa: false, trans_cuspide_cuspide: false,
    trans_mordida_tijera: false, trans_inoclusion: false, trans_curva_wilson: false,
    atm_traumatismos: "", atm_ruidos: "", atm_limitacion: "",
    atm_dolor_cabeza: "", atm_dolor_cara: "", atm_dolor_cuello: "",
    atm_enf_sistemica: "", atm_medicamento: "", atm_stress: "",
    palpacion_der: "", palpacion_izq: "", laxitud: "", laxitud_grado: "",
    manipulacion: "", cierre_forzado: "", labio_sup: "", hipertrofia: "", otros_clinico: "",
    mapa_1: "", mapa_2: "", mapa_3: "", mapa_4: "",
    mapa_5: "", mapa_6: "", mapa_7: "", mapa_8: "",
    mapa_otros: "", mapa_palito_der: "", mapa_palito_izq: "",
    din_protusion: "", din_lat_der: "", din_lat_izq: "", din_apertura: "",
    din_salto_der: "", din_salto_izq: "", din_otros: "",
    condilo_der: "", condilo_izq: "",
  }
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold border-b pb-1 mb-3">{children}</h3>
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function TI({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className="h-8 text-sm" />
  )
}

function RadioGroup({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input
            type="radio"
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-primary"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  )
}

// Moyers cell
function MC({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <td className="border border-gray-200 p-0.5">
      <Input value={value} onChange={e => onChange(e.target.value)}
        className="h-7 text-xs border-0 bg-transparent text-center" />
    </td>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  value: OrtodonciaData
  onChange: (v: OrtodonciaData) => void
}

export function OrtodonciaForm({ value: v, onChange }: Props) {
  const set = <K extends keyof OrtodonciaData>(key: K, val: OrtodonciaData[K]) =>
    onChange({ ...v, [key]: val })

  return (
    <div className="space-y-6 text-sm">

      {/* ── 1. Historia de la infancia ── */}
      <div>
        <SectionTitle>Historia de la infancia</SectionTitle>
        <div className="space-y-3">
          <Field label="Tipo de lactancia y tiempo">
            <TI value={v.lactancia_tipo} onChange={val => set("lactancia_tipo", val)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Enfermedades de la infancia">
              <TI value={v.enf_infancia} onChange={val => set("enf_infancia", val)} />
            </Field>
            <Field label="Enfermedades infectocontagiosas">
              <TI value={v.enf_infectocontagiosas} onChange={val => set("enf_infectocontagiosas", val)} />
            </Field>
            <Field label="Problemas congénitos">
              <TI value={v.problemas_congenitos} onChange={val => set("problemas_congenitos", val)} />
            </Field>
            <Field label="Alergias o enf. respiratorias">
              <TI value={v.alergias_respiratorias} onChange={val => set("alergias_respiratorias", val)} />
            </Field>
            <Field label="Fracturas óseas">
              <TI value={v.fracturas_oseas} onChange={val => set("fracturas_oseas", val)} />
            </Field>
            <Field label="Artritis reumatoidea">
              <TI value={v.artritis_reumatoidea} onChange={val => set("artritis_reumatoidea", val)} />
            </Field>
            <Field label="Medicación actual">
              <TI value={v.medicacion_actual} onChange={val => set("medicacion_actual", val)} />
            </Field>
            <Field label="Cirugías realizadas">
              <TI value={v.cirugias} onChange={val => set("cirugias", val)} />
            </Field>
            <Field label="Traumatismo maxilofacial">
              <TI value={v.traumatismo_maxilofacial} onChange={val => set("traumatismo_maxilofacial", val)} />
            </Field>
          </div>
          <Field label="Observaciones">
            <Textarea value={v.obs_infancia} onChange={e => set("obs_infancia", e.target.value)}
              rows={2} className="resize-none text-sm" />
          </Field>
        </div>
      </div>

      {/* ── 2. Examen funcional ── */}
      <div>
        <SectionTitle>Examen funcional</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            ["respiracion",      "Respiración"],
            ["diccion",          "Dicción"],
            ["habitos",          "Hábitos"],
            ["deglucion",        "Deglución"],
            ["posicion_lengua",  "Posición de la lengua"],
            ["musculo_mentoniano","Músculo mentoniano"],
            ["cierre_labial",    "Cierre labial"],
            ["amigdalas",        "Amígdalas"],
            ["tejidos_blandos",  "Tejidos blandos intrabucales"],
            ["frenillo_lingual", "Frenillo lingual"],
            ["frenillo_labial",  "Frenillo labial superior"],
            ["tipo_periodonto",  "Tipo de periodonto"],
            ["higiene_bucal",    "Higiene bucal"],
          ] as [keyof OrtodonciaData, string][]).map(([key, label]) => (
            <Field key={key} label={label}>
              <TI value={v[key] as string} onChange={val => set(key, val as any)} />
            </Field>
          ))}
        </div>
        <Field label="Líneas medias dentarias" className="mt-3">
          <TI value={v.lineas_medias} onChange={val => set("lineas_medias", val)} />
        </Field>
      </div>

      {/* ── 3. Examen dentario ── */}
      <div>
        <SectionTitle>Examen dentario</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <tbody>
              {([
                ["supernumerarios",  "Supernumerarios"],
                ["agenesias",        "Agenesias"],
                ["anomalias_forma",  "Anomalías de forma"],
                ["anomalias_color",  "Anomalías de color"],
                ["transposiciones",  "Transposiciones"],
                ["ectopias",         "Ectopias"],
                ["retenidos",        "Retenidos"],
                ["ausentes",         "Ausentes"],
                ["terceros_molares", "Terceros molares"],
                ["otros_dentarios",  "Otros"],
              ] as [keyof OrtodonciaData, string][]).map(([key, label]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 font-medium text-muted-foreground w-44 shrink-0">{label}</td>
                  <td className="py-1 w-full">
                    <Input value={v[key] as string} onChange={e => set(key, e.target.value as any)}
                      className="h-7 text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. Diagnóstico ── */}
      <div>
        <SectionTitle>Diagnóstico</SectionTitle>
        <Textarea value={v.diagnostico} onChange={e => set("diagnostico", e.target.value)}
          rows={4} className="resize-y text-sm" />
      </div>

      {/* ── 5. Plan de tratamiento ── */}
      <div>
        <SectionTitle>Plan de tratamiento</SectionTitle>
        <Textarea value={v.plan_tratamiento} onChange={e => set("plan_tratamiento", e.target.value)}
          rows={4} className="resize-y text-sm" />
      </div>

      {/* ── 6. Análisis de Moyers ── */}
      <div>
        <SectionTitle>Análisis de modelos — Moyers</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-gray-200 px-2 py-1.5 text-left font-medium" />
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium">Maxilar Sup. Derecho</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium">Maxilar Sup. Izquierdo</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium">Mandíbula Derecho</th>
                <th className="border border-gray-200 px-2 py-1.5 text-center font-medium">Mandíbula Izquierdo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-2 py-1 font-medium text-muted-foreground">Espacio disponible</td>
                <MC value={v.moyers_esp_disp_sup_der} onChange={val => set("moyers_esp_disp_sup_der", val)} />
                <MC value={v.moyers_esp_disp_sup_izq} onChange={val => set("moyers_esp_disp_sup_izq", val)} />
                <MC value={v.moyers_esp_disp_inf_der} onChange={val => set("moyers_esp_disp_inf_der", val)} />
                <MC value={v.moyers_esp_disp_inf_izq} onChange={val => set("moyers_esp_disp_inf_izq", val)} />
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1 font-medium text-muted-foreground">Espacio requerido</td>
                <MC value={v.moyers_esp_req_sup_der} onChange={val => set("moyers_esp_req_sup_der", val)} />
                <MC value={v.moyers_esp_req_sup_izq} onChange={val => set("moyers_esp_req_sup_izq", val)} />
                <MC value={v.moyers_esp_req_inf_der} onChange={val => set("moyers_esp_req_inf_der", val)} />
                <MC value={v.moyers_esp_req_inf_izq} onChange={val => set("moyers_esp_req_inf_izq", val)} />
              </tr>
              <tr>
                <td className="border border-gray-200 px-2 py-1 font-medium text-muted-foreground">Discrepancia total</td>
                <MC value={v.moyers_disc_sup_der} onChange={val => set("moyers_disc_sup_der", val)} />
                <MC value={v.moyers_disc_sup_izq} onChange={val => set("moyers_disc_sup_izq", val)} />
                <MC value={v.moyers_disc_inf_der} onChange={val => set("moyers_disc_inf_der", val)} />
                <MC value={v.moyers_disc_inf_izq} onChange={val => set("moyers_disc_inf_izq", val)} />
              </tr>
            </tbody>
          </table>
        </div>
        <Field label="Diagnóstico Moyers" className="mt-2">
          <TI value={v.moyers_diagnostico} onChange={val => set("moyers_diagnostico", val)} />
        </Field>
      </div>

      {/* ── 7. Discrepancia dentaria ── */}
      <div>
        <SectionTitle>Análisis de discrepancia dentaria</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-6">
          {(["Superior", "Inferior"] as const).map(arc => {
            const pfx = arc === "Superior" ? "sup" : "inf"
            return (
              <div key={arc}>
                <p className="text-xs font-medium mb-2">Arcada {arc}</p>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {([
                      [`disc_${pfx}_disponible`,   "Espacio disponible"],
                      [`disc_${pfx}_requerido`,    "Espacio requerido"],
                      [`disc_${pfx}_discrepancia`, "Discrepancia"],
                    ] as [keyof OrtodonciaData, string][]).map(([key, label]) => (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="py-1.5 pr-3 text-muted-foreground w-36">{label}</td>
                        <td className="py-1">
                          <Input value={v[key] as string} onChange={e => set(key, e.target.value as any)}
                            className="h-7 text-xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 8. Modelos en articulador ── */}
      <div>
        <SectionTitle>Análisis de modelos montados en articulador</SectionTitle>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Field label="Contacto prematuro">
            <TI value={v.contacto_prematuro} onChange={val => set("contacto_prematuro", val)} />
          </Field>
          <Field label="Tipo (A / B / C)">
            <RadioGroup
              value={v.tipo_contacto}
              onChange={val => set("tipo_contacto", val)}
              options={[{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }]}
            />
          </Field>
        </div>

        <p className="text-xs font-medium mb-2">Análisis sagital</p>
        <div className="overflow-x-auto mb-4">
          <table className="text-xs border-collapse min-w-[320px]">
            <thead>
              <tr className="bg-muted/40">
                <th className="border border-gray-200 px-3 py-1.5 text-left w-24" />
                <th className="border border-gray-200 px-3 py-1.5 text-center">División</th>
                <th className="border border-gray-200 px-3 py-1.5 text-center">Subdivisión</th>
              </tr>
            </thead>
            <tbody>
              {([
                ["clase1", "Clase I"],
                ["clase2", "Clase II"],
                ["clase3", "Clase III"],
              ] as [string, string][]).map(([pfx, label]) => (
                <tr key={pfx}>
                  <td className="border border-gray-200 px-3 py-1 font-medium">{label}</td>
                  <td className="border border-gray-200 p-0.5">
                    <Input
                      value={(v as any)[`${pfx}_div`]}
                      onChange={e => set(`${pfx}_div` as keyof OrtodonciaData, e.target.value as any)}
                      className="h-7 text-xs border-0 bg-transparent"
                    />
                  </td>
                  <td className="border border-gray-200 p-0.5">
                    <Input
                      value={(v as any)[`${pfx}_subdiv`]}
                      onChange={e => set(`${pfx}_subdiv` as keyof OrtodonciaData, e.target.value as any)}
                      className="h-7 text-xs border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Overjet (mm)">
            <TI value={v.overjet} onChange={val => set("overjet", val)} placeholder="0" />
          </Field>
          <Field label="Overbite (%)">
            <TI value={v.overbite} onChange={val => set("overbite", val)} placeholder="0" />
          </Field>
        </div>

        <p className="text-xs font-medium mb-2">Análisis transversal</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <CheckItem label="Mordida cruzada unilateral/bilateral"
            checked={v.trans_mordida_cruzada} onChange={val => set("trans_mordida_cruzada", val)} />
          <CheckItem label="Cúspide a fosa"
            checked={v.trans_cuspide_fosa} onChange={val => set("trans_cuspide_fosa", val)} />
          <CheckItem label="Cúspide a cúspide"
            checked={v.trans_cuspide_cuspide} onChange={val => set("trans_cuspide_cuspide", val)} />
          <CheckItem label="Mordida en tijera"
            checked={v.trans_mordida_tijera} onChange={val => set("trans_mordida_tijera", val)} />
          <CheckItem label="Inoclusión"
            checked={v.trans_inoclusion} onChange={val => set("trans_inoclusion", val)} />
          <CheckItem label="Curva de Wilson"
            checked={v.trans_curva_wilson} onChange={val => set("trans_curva_wilson", val)} />
        </div>
      </div>

      {/* ── 9. Estudio preliminar ATM — Anamnesis ── */}
      <div>
        <SectionTitle>Estudio preliminar — Ortodoncia / ATM / Dolor facial</SectionTitle>

        <p className="text-xs font-medium mb-2">Anamnesis</p>
        <div className="space-y-2 mb-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="1. Traumatismos">
              <TI value={v.atm_traumatismos} onChange={val => set("atm_traumatismos", val)} />
            </Field>
            <Field label="Ruidos articulares">
              <TI value={v.atm_ruidos} onChange={val => set("atm_ruidos", val)} />
            </Field>
            <Field label="Limitación funcional">
              <TI value={v.atm_limitacion} onChange={val => set("atm_limitacion", val)} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="2. Dolor cabeza">
              <TI value={v.atm_dolor_cabeza} onChange={val => set("atm_dolor_cabeza", val)} />
            </Field>
            <Field label="Dolor cara">
              <TI value={v.atm_dolor_cara} onChange={val => set("atm_dolor_cara", val)} />
            </Field>
            <Field label="Dolor cuello">
              <TI value={v.atm_dolor_cuello} onChange={val => set("atm_dolor_cuello", val)} />
            </Field>
          </div>
          <Field label="3. Enfermedad sistémica de importancia">
            <TI value={v.atm_enf_sistemica} onChange={val => set("atm_enf_sistemica", val)} />
          </Field>
          <Field label="4. Medicamento actual">
            <TI value={v.atm_medicamento} onChange={val => set("atm_medicamento", val)} />
          </Field>
          <Field label="5. Momentos de stress">
            <TI value={v.atm_stress} onChange={val => set("atm_stress", val)} />
          </Field>
        </div>

        <p className="text-xs font-medium mb-2">Palpación muscular</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Field label="Lado derecho">
            <Textarea value={v.palpacion_der} onChange={e => set("palpacion_der", e.target.value)}
              rows={3} className="resize-none text-sm"
              placeholder="Temporal ant/med/post, masetero, pterigoídeos..." />
          </Field>
          <Field label="Lado izquierdo">
            <Textarea value={v.palpacion_izq} onChange={e => set("palpacion_izq", e.target.value)}
              rows={3} className="resize-none text-sm"
              placeholder="Supra/infrahioideos, ECM, cervicales, trapecio..." />
          </Field>
        </div>

        <div className="flex items-end gap-4 mb-4">
          <Field label="Laxitud ligamentosa sistémica">
            <RadioGroup
              value={v.laxitud}
              onChange={val => set("laxitud", val)}
              options={[{ value: "no", label: "No" }, { value: "si", label: "Sí" }]}
            />
          </Field>
          {v.laxitud === "si" && (
            <Field label="Grado" className="w-24">
              <TI value={v.laxitud_grado} onChange={val => set("laxitud_grado", val)} />
            </Field>
          )}
        </div>

        <p className="text-xs font-medium mb-2">Examen clínico</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-2">
          <Field label="Manipulación mandibular">
            <RadioGroup
              value={v.manipulacion}
              onChange={val => set("manipulacion", val)}
              options={[
                { value: "facil",         label: "Fácil" },
                { value: "termino_medio", label: "Término medio" },
                { value: "dificil",       label: "Difícil" },
                { value: "muy_dificil",   label: "Muy difícil" },
              ]}
            />
          </Field>
          <Field label="Cierre labial">
            <RadioGroup
              value={v.cierre_forzado}
              onChange={val => set("cierre_forzado", val)}
              options={[
                { value: "forzado",           label: "Forzado" },
                { value: "levemente_forzado", label: "Levemente forzado" },
                { value: "no_forzado",        label: "No forzado" },
              ]}
            />
          </Field>
          <Field label="Labio superior">
            <RadioGroup
              value={v.labio_sup}
              onChange={val => set("labio_sup", val)}
              options={[{ value: "normal", label: "Normal" }, { value: "corto", label: "Corto" }]}
            />
          </Field>
          <Field label="Hipertrofia muscular">
            <TI value={v.hipertrofia} onChange={val => set("hipertrofia", val)} />
          </Field>
        </div>
        <Field label="Otros">
          <TI value={v.otros_clinico} onChange={val => set("otros_clinico", val)} />
        </Field>
      </div>

      {/* ── 10. Mapa del dolor articular ── */}
      <div>
        <SectionTitle>Mapa del dolor articular</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {([
            ["mapa_1", "1. Sinovial Antero Inferior"],
            ["mapa_2", "2. Sinovial Antero Superior"],
            ["mapa_3", "3. Ligamento Colateral Lateral"],
            ["mapa_4", "4. Ligamento Témporomandibular"],
            ["mapa_5", "5. Sinovial Postero Inferior"],
            ["mapa_6", "6. Sinovial Postero Superior"],
            ["mapa_7", "7. —"],
            ["mapa_8", "8. Retrodisco"],
          ] as [keyof OrtodonciaData, string][]).map(([key, label]) => (
            <Field key={key} label={label}>
              <TI value={v[key] as string} onChange={val => set(key, val as any)}
                placeholder="Normal / Sensible / Dolor" />
            </Field>
          ))}
        </div>
        <Field label="Otros" className="mb-3">
          <TI value={v.mapa_otros} onChange={val => set("mapa_otros", val)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Al morder palito — lado derecho">
            <RadioGroup
              value={v.mapa_palito_der}
              onChange={val => set("mapa_palito_der", val)}
              options={[{ value: "duele", label: "Duele" }, { value: "no_duele", label: "No duele" }]}
            />
          </Field>
          <Field label="Al morder palito — lado izquierdo">
            <RadioGroup
              value={v.mapa_palito_izq}
              onChange={val => set("mapa_palito_izq", val)}
              options={[{ value: "duele", label: "Duele" }, { value: "no_duele", label: "No duele" }]}
            />
          </Field>
        </div>
      </div>

      {/* ── 11. Dinámica mandibular ── */}
      <div>
        <SectionTitle>Dinámica mandibular</SectionTitle>
        <div className="space-y-2">
          {([
            ["din_protusion", "Protrusión"],
            ["din_lat_der",   "Lateralidad derecha"],
            ["din_lat_izq",   "Lateralidad izquierda"],
            ["din_apertura",  "Apertura"],
          ] as [keyof OrtodonciaData, string][]).map(([key, label]) => (
            <Field key={key} label={label}>
              <TI value={v[key] as string} onChange={val => set(key, val as any)}
                placeholder="normal / disminuida / aumentada / deflectiva — ruido — otro" />
            </Field>
          ))}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Salto articular derecho (mm)">
              <TI value={v.din_salto_der} onChange={val => set("din_salto_der", val)} placeholder="mm" />
            </Field>
            <Field label="Salto articular izquierdo (mm)">
              <TI value={v.din_salto_izq} onChange={val => set("din_salto_izq", val)} placeholder="mm" />
            </Field>
          </div>
          <Field label="Otros">
            <TI value={v.din_otros} onChange={val => set("din_otros", val)} />
          </Field>
        </div>
      </div>

      {/* ── 12. Rango y trayecto mandibular ── */}
      <div>
        <SectionTitle>Rango y trayecto mandibular — Cóndilo / Imagen</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Lado derecho">
            <TI value={v.condilo_der} onChange={val => set("condilo_der", val)}
              placeholder="Normal / otro" />
          </Field>
          <Field label="Lado izquierdo">
            <TI value={v.condilo_izq} onChange={val => set("condilo_izq", val)}
              placeholder="Normal / otro" />
          </Field>
        </div>
      </div>

    </div>
  )
}
