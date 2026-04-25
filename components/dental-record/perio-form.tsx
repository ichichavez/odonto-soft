"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ToothSvg } from "@/components/dental-record/tooth-svg"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerioMeasurement { mesial: string; center: string; distal: string }
export interface PerioToothData {
  ni_top: PerioMeasurement
  ss_top: PerioMeasurement   // "x" = sangrado al sondaje
  ps_top: PerioMeasurement
  ps_bot: PerioMeasurement
  ss_bot: PerioMeasurement
  ni_bot: PerioMeasurement
}
export type PerioTeeth = Record<string, PerioToothData>

export interface PerioData {
  // Ficha
  fecha: string; fase: string; num_ficha: string
  // Clínica
  motivo: string; habitos: string; fuma: string; fuma_cant: string
  enf_sistemicas: string; medicacion: string
  // Extraoral
  sellado_labial: string; asimetria_facial: string; apertura_bucal: string
  sonrisa_gingival: string; sonrisa_dental: string; desv_linea_media: string
  // Intraoral
  biotipo: string
  encias_color: string; encias_contorno: string; encias_consistencia: string
  encias_textura: string; encias_hemorragia: string; encias_supuracion: string
  recesion: string; recesion_piezas: string
  mucosa_labios: string; mucosa_lengua: string; mucosa_piso: string
  mucosa_paladar: string; mucosa_yugal: string
  erosion: string; abrasion: string; atriccion: string; abfraccion: string
  furca: string; furca_grado: string; movilidad: string; movilidad_grado: string
  // Higiene
  sarro: string; sarro_suprag: string; sarro_subg: string
  materia_alba: string; placa_bact: string
  protesis_oper: string; ortod_hig: string; otras_causas: string
  trauma_prim: string; trauma_sec: string
  // Periodontograma (4 vistas)
  sup_vest: PerioTeeth; sup_pal: PerioTeeth
  inf_vest: PerioTeeth; inf_ling: PerioTeeth
  // Índices
  idx_placa: Array<{ fecha: string; pct: string }>
  idx_sangrado: Array<{ fecha: string; pct: string }>
  // Diagnóstico
  diag_clinico: string; etiologia: string; diag_radio: string; fecha_aprob_diag: string
  // Pronóstico
  pron_general: string; pron_individual: string
  // Plan de tratamiento
  plan_emergencia: boolean; plan_ajuste_oclusal: boolean; plan_endodoncia: boolean
  plan_restauraciones: boolean; plan_profilaxis: boolean; plan_instrucciones: boolean
  plan_caries: boolean; plan_estabilizacion: boolean; plan_raspaje: boolean
  plan_extraccion: boolean; plan_reevaluacion: boolean
  plan_fase2: string; plan_fase3: string; plan_fase4: string; fecha_aprob_plan: string
  // Registro de actividades
  actividades: Array<{ fecha: string; trabajo: string; firma: string }>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const MIDLINE_UPPER = 7   // after index 7 (tooth 11) insert thick border
const MIDLINE_LOWER = 7   // after index 7 (tooth 41) insert thick border

// ─── Defaults ─────────────────────────────────────────────────────────────────

const emptyM  = (): PerioMeasurement => ({ mesial: "", center: "", distal: "" })
const emptyTd = (): PerioToothData  => ({
  ni_top: emptyM(), ss_top: emptyM(), ps_top: emptyM(),
  ps_bot: emptyM(), ss_bot: emptyM(), ni_bot: emptyM(),
})
const emptyTeeth = (list: number[]): PerioTeeth =>
  Object.fromEntries(list.map(n => [String(n), emptyTd()]))

export function defaultPerio(): PerioData {
  return {
    fecha: new Date().toISOString().slice(0, 10), fase: "", num_ficha: "",
    motivo: "", habitos: "", fuma: "", fuma_cant: "", enf_sistemicas: "", medicacion: "",
    sellado_labial: "", asimetria_facial: "", apertura_bucal: "",
    sonrisa_gingival: "", sonrisa_dental: "", desv_linea_media: "",
    biotipo: "",
    encias_color: "", encias_contorno: "", encias_consistencia: "",
    encias_textura: "", encias_hemorragia: "", encias_supuracion: "",
    recesion: "", recesion_piezas: "",
    mucosa_labios: "", mucosa_lengua: "", mucosa_piso: "", mucosa_paladar: "", mucosa_yugal: "",
    erosion: "", abrasion: "", atriccion: "", abfraccion: "",
    furca: "", furca_grado: "", movilidad: "", movilidad_grado: "",
    sarro: "", sarro_suprag: "", sarro_subg: "", materia_alba: "", placa_bact: "",
    protesis_oper: "", ortod_hig: "", otras_causas: "", trauma_prim: "", trauma_sec: "",
    sup_vest: emptyTeeth(UPPER_TEETH),
    sup_pal:  emptyTeeth(UPPER_TEETH),
    inf_vest: emptyTeeth(LOWER_TEETH),
    inf_ling: emptyTeeth(LOWER_TEETH),
    idx_placa:    [{ fecha: "", pct: "" }, { fecha: "", pct: "" }, { fecha: "", pct: "" }],
    idx_sangrado: [{ fecha: "", pct: "" }, { fecha: "", pct: "" }, { fecha: "", pct: "" }],
    diag_clinico: "", etiologia: "", diag_radio: "", fecha_aprob_diag: "",
    pron_general: "", pron_individual: "",
    plan_emergencia: false, plan_ajuste_oclusal: false, plan_endodoncia: false,
    plan_restauraciones: false, plan_profilaxis: false, plan_instrucciones: false,
    plan_caries: false, plan_estabilizacion: false, plan_raspaje: false,
    plan_extraccion: false, plan_reevaluacion: false,
    plan_fase2: "", plan_fase3: "", plan_fase4: "", fecha_aprob_plan: "",
    actividades: Array.from({ length: 10 }, () => ({ fecha: "", trabajo: "", firma: "" })),
  }
}

// ─── PeriogramTable ───────────────────────────────────────────────────────────

type PRow = "ni_top" | "ss_top" | "ps_top" | "ps_bot" | "ss_bot" | "ni_bot"
type PPos = "mesial" | "center" | "distal"

const ROWS_TOP: PRow[] = ["ni_top", "ss_top", "ps_top"]
const ROWS_BOT: PRow[] = ["ps_bot", "ss_bot", "ni_bot"]

function rowLabel(r: PRow) {
  if (r === "ni_top" || r === "ni_bot") return "NI"
  if (r === "ss_top" || r === "ss_bot") return "SS"
  return "PS"
}

function PeriogramTable({
  label,
  teeth,
  midline,
  data,
  onChange,
  inverted = false,
}: {
  label: string
  teeth: number[]
  midline: number
  data: PerioTeeth
  onChange: (v: PerioTeeth) => void
  inverted?: boolean
}) {
  const getVal = (tooth: number, row: PRow, pos: PPos): string =>
    data[String(tooth)]?.[row]?.[pos] ?? ""

  const setVal = (tooth: number, row: PRow, pos: PPos, val: string) => {
    const t = String(tooth)
    const prev = data[t] ?? emptyTd()
    onChange({
      ...data,
      [t]: { ...prev, [row]: { ...prev[row], [pos]: val } },
    })
  }

  const renderCell = (tooth: number, idx: number, row: PRow, pos: PPos) => {
    const val    = getVal(tooth, row, pos)
    const isSS   = row === "ss_top" || row === "ss_bot"
    const isPS   = row === "ps_top" || row === "ps_bot"
    const isNI   = row === "ni_top" || row === "ni_bot"
    const num    = parseInt(val)
    const isLeft = idx === midline + 1 && pos === "mesial"

    const tdCls = cn(
      "border border-gray-200 p-0",
      isLeft && "border-l-2 border-l-gray-500"
    )

    if (isSS) {
      const active = val === "x"
      return (
        <td
          key={pos}
          className={cn(tdCls, "w-7 h-6 text-center cursor-pointer select-none")}
          onClick={() => setVal(tooth, row, pos, active ? "" : "x")}
          title="Clic para marcar sangrado"
        >
          <span className={cn("text-sm leading-none", active ? "text-red-600" : "text-transparent")}>●</span>
        </td>
      )
    }

    const colorCls = isPS && num >= 4 ? "text-red-600 font-bold"
      : isNI && num >= 4 ? "text-green-700 font-bold"
      : ""

    return (
      <td key={pos} className={cn(tdCls, "w-7 h-6")}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={val}
          onChange={e => setVal(tooth, row, pos, e.target.value.replace(/[^0-9]/g, ""))}
          className={cn(
            "w-full h-6 text-center text-xs bg-transparent focus:bg-primary/5 outline-none",
            colorCls,
          )}
        />
      </td>
    )
  }

  const renderRow = (row: PRow) => {
    const label = rowLabel(row)
    const labelCls = cn(
      "sticky left-0 z-10 bg-background text-[10px] font-semibold px-1 w-8 text-center border-r border-gray-200",
      label === "NI" ? "text-green-700" : label === "PS" ? "text-blue-700" : "text-red-600"
    )
    return (
      <tr key={row}>
        <td className={labelCls}>{label}</td>
        {teeth.map((t, idx) => (
          <React.Fragment key={t}>
            {(["mesial", "center", "distal"] as PPos[]).map(pos => renderCell(t, idx, row, pos))}
          </React.Fragment>
        ))}
      </tr>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="overflow-x-auto rounded border">
        <table className="border-collapse text-xs">
          <thead>
            {/* Tooth numbers */}
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 w-8 border-r border-b border-gray-200" />
              {teeth.map((t, idx) => (
                <th
                  key={t}
                  colSpan={3}
                  className={cn(
                    "text-center font-mono text-[10px] py-0.5 border-b border-gray-200",
                    idx > 0 && "border-l border-gray-200",
                    idx === midline + 1 && "border-l-2 border-l-gray-500",
                  )}
                >
                  {t}
                </th>
              ))}
            </tr>
            {/* M / F / D sub-headers */}
            <tr className="bg-muted/30">
              <th className="sticky left-0 z-10 bg-muted/30 border-r border-b border-gray-200" />
              {teeth.map((t, idx) => (
                <React.Fragment key={t}>
                  {(["M", "F", "D"] as const).map((lbl, pi) => (
                    <th
                      key={lbl}
                      className={cn(
                        "w-7 text-center text-[9px] font-normal border-b border-gray-200",
                        pi === 0 && idx > 0 && "border-l border-gray-200",
                        pi === 0 && idx === midline + 1 && "border-l-2 border-l-gray-500",
                      )}
                    >
                      {lbl}
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS_TOP.map(renderRow)}

            {/* ── Tooth SVG row ── */}
            <tr>
              <td className="sticky left-0 z-10 bg-background w-8 border-r border-gray-200" />
              {teeth.map((t, idx) => (
                <td
                  key={t}
                  colSpan={3}
                  className={cn(
                    "p-0 border-t border-b-2 border-gray-200",
                    idx > 0 && "border-l border-gray-200",
                    idx === midline + 1 && "border-l-2 border-l-gray-500",
                  )}
                >
                  <ToothSvg
                    clipPrefix={`${label.replace(/\s/g, "")}-`}
                    toothNum={t}
                    mesial={data[String(t)]?.ps_top?.mesial ?? ""}
                    center={data[String(t)]?.ps_top?.center ?? ""}
                    distal={data[String(t)]?.ps_top?.distal ?? ""}
                    inverted={inverted}
                  />
                </td>
              ))}
            </tr>

            {ROWS_BOT.map(renderRow)}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/80">
        PS ≥ 4mm en <span className="text-red-600 font-medium">rojo</span> ·
        NI ≥ 4mm en <span className="text-green-700 font-medium">verde</span> ·
        SS: clic para marcar sangrado (●) ·
        barras en diente: PS por posición (M / F / D)
      </p>
    </div>
  )
}

// ─── Section heading helper ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold border-b pb-1 mb-3">{children}</h3>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function TxtInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 text-sm"
    />
  )
}

// ─── Main PerioForm component ─────────────────────────────────────────────────

interface PerioFormProps {
  value: PerioData
  onChange: (v: PerioData) => void
}

export function PerioForm({ value: v, onChange }: PerioFormProps) {
  const set = <K extends keyof PerioData>(key: K, val: PerioData[K]) =>
    onChange({ ...v, [key]: val })

  const bool = (key: keyof PerioData) => (
    <input
      type="checkbox"
      checked={v[key] as boolean}
      onChange={e => set(key, e.target.checked as any)}
      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
    />
  )

  return (
    <div className="space-y-6 text-sm">

      {/* ── 1. Datos de la ficha ── */}
      <div>
        <SectionTitle>Datos de la ficha</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Fecha">
            <Input type="date" value={v.fecha} onChange={e => set("fecha", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Fase">
            <TxtInput value={v.fase} onChange={val => set("fase", val)} placeholder="Ej: Inicial" />
          </Field>
          <Field label="N° Ficha">
            <TxtInput value={v.num_ficha} onChange={val => set("num_ficha", val)} />
          </Field>
        </div>
      </div>

      {/* ── 2. Ficha clínica ── */}
      <div>
        <SectionTitle>Ficha clínica</SectionTitle>
        <div className="space-y-3">
          <Field label="Motivo de consulta">
            <TxtInput value={v.motivo} onChange={val => set("motivo", val)} />
          </Field>
          <Field label="Hábitos nocivos">
            <TxtInput value={v.habitos} onChange={val => set("habitos", val)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="¿Fuma?">
              <TxtInput value={v.fuma} onChange={val => set("fuma", val)} placeholder="Sí / No" />
            </Field>
            <Field label="¿Cuánto?">
              <TxtInput value={v.fuma_cant} onChange={val => set("fuma_cant", val)} placeholder="Ej: 10 cig/día" />
            </Field>
          </div>
          <Field label="Enfermedades sistémicas">
            <TxtInput value={v.enf_sistemicas} onChange={val => set("enf_sistemicas", val)} />
          </Field>
          <Field label="Medicación">
            <TxtInput value={v.medicacion} onChange={val => set("medicacion", val)} />
          </Field>
        </div>
      </div>

      {/* ── 3. Examen extraoral ── */}
      <div>
        <SectionTitle>Examen extraoral</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Sellado labial">
            <TxtInput value={v.sellado_labial} onChange={val => set("sellado_labial", val)} />
          </Field>
          <Field label="Asimetría facial">
            <TxtInput value={v.asimetria_facial} onChange={val => set("asimetria_facial", val)} placeholder="Sí / No" />
          </Field>
          <Field label="Apertura bucal (grado)">
            <TxtInput value={v.apertura_bucal} onChange={val => set("apertura_bucal", val)} />
          </Field>
          <Field label="Sonrisa gingival">
            <TxtInput value={v.sonrisa_gingival} onChange={val => set("sonrisa_gingival", val)} />
          </Field>
          <Field label="Sonrisa dental">
            <TxtInput value={v.sonrisa_dental} onChange={val => set("sonrisa_dental", val)} />
          </Field>
          <Field label="Desviación línea media">
            <TxtInput value={v.desv_linea_media} onChange={val => set("desv_linea_media", val)} placeholder="Sí / No" />
          </Field>
        </div>
      </div>

      {/* ── 4. Examen intraoral ── */}
      <div>
        <SectionTitle>Examen clínico intraoral</SectionTitle>

        <Field label="Biotipo periodontal" className="mb-3">
          <TxtInput value={v.biotipo} onChange={val => set("biotipo", val)} />
        </Field>

        <p className="text-xs font-medium mb-2">Encías</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {(["encias_color","encias_contorno","encias_consistencia","encias_textura","encias_hemorragia","encias_supuracion"] as const).map(k => (
            <Field key={k} label={k.replace("encias_","").replace(/_/g," ").replace(/^\w/, c => c.toUpperCase())}>
              <TxtInput value={v[k]} onChange={val => set(k, val)} />
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Recesión">
            <TxtInput value={v.recesion} onChange={val => set("recesion", val)} placeholder="Sí / No" />
          </Field>
          <Field label="Piezas afectadas">
            <TxtInput value={v.recesion_piezas} onChange={val => set("recesion_piezas", val)} />
          </Field>
        </div>

        <p className="text-xs font-medium mb-2">Mucosa</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {(["mucosa_labios","mucosa_lengua","mucosa_piso","mucosa_paladar","mucosa_yugal"] as const).map(k => (
            <Field key={k} label={k.replace("mucosa_","").replace(/_/g," ").replace(/^\w/, c => c.toUpperCase())}>
              <TxtInput value={v[k]} onChange={val => set(k, val)} />
            </Field>
          ))}
        </div>

        <p className="text-xs font-medium mb-2">Dientes</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["erosion","abrasion","atriccion","abfraccion"] as const).map(k => (
            <Field key={k} label={k.replace(/^\w/, c => c.toUpperCase())}>
              <TxtInput value={v[k]} onChange={val => set(k, val)} />
            </Field>
          ))}
          <Field label="Lesión de furca">
            <TxtInput value={v.furca} onChange={val => set("furca", val)} />
          </Field>
          <Field label="Grado furca">
            <TxtInput value={v.furca_grado} onChange={val => set("furca_grado", val)} />
          </Field>
          <Field label="Movilidad">
            <TxtInput value={v.movilidad} onChange={val => set("movilidad", val)} />
          </Field>
          <Field label="Grado movilidad">
            <TxtInput value={v.movilidad_grado} onChange={val => set("movilidad_grado", val)} />
          </Field>
        </div>
      </div>

      {/* ── 5. Higiene bucal ── */}
      <div>
        <SectionTitle>Higiene bucal — Factores irritativos</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <Field label="Sarro (general)">
            <TxtInput value={v.sarro} onChange={val => set("sarro", val)} />
          </Field>
          <Field label="Sarro supragingival">
            <TxtInput value={v.sarro_suprag} onChange={val => set("sarro_suprag", val)} />
          </Field>
          <Field label="Sarro subgingival">
            <TxtInput value={v.sarro_subg} onChange={val => set("sarro_subg", val)} />
          </Field>
          <Field label="Materia alba">
            <TxtInput value={v.materia_alba} onChange={val => set("materia_alba", val)} />
          </Field>
          <Field label="Placa bacteriana">
            <TxtInput value={v.placa_bact} onChange={val => set("placa_bact", val)} />
          </Field>
          <Field label="Prótesis / Op. dental">
            <TxtInput value={v.protesis_oper} onChange={val => set("protesis_oper", val)} />
          </Field>
          <Field label="Ortodoncia">
            <TxtInput value={v.ortod_hig} onChange={val => set("ortod_hig", val)} />
          </Field>
          <Field label="Otras causas">
            <TxtInput value={v.otras_causas} onChange={val => set("otras_causas", val)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trauma primario">
            <TxtInput value={v.trauma_prim} onChange={val => set("trauma_prim", val)} />
          </Field>
          <Field label="Trauma secundario">
            <TxtInput value={v.trauma_sec} onChange={val => set("trauma_sec", val)} />
          </Field>
        </div>
      </div>

      {/* ── 6. Periodontograma ── */}
      <div>
        <SectionTitle>Periodontograma</SectionTitle>
        <div className="space-y-6">
          <PeriogramTable
            label="Superior Vestibular"
            teeth={UPPER_TEETH}
            midline={MIDLINE_UPPER}
            data={v.sup_vest}
            onChange={val => set("sup_vest", val)}
            inverted={false}
          />
          <PeriogramTable
            label="Superior Palatino"
            teeth={UPPER_TEETH}
            midline={MIDLINE_UPPER}
            data={v.sup_pal}
            onChange={val => set("sup_pal", val)}
            inverted={true}
          />
          <PeriogramTable
            label="Inferior Vestibular"
            teeth={LOWER_TEETH}
            midline={MIDLINE_LOWER}
            data={v.inf_vest}
            onChange={val => set("inf_vest", val)}
            inverted={false}
          />
          <PeriogramTable
            label="Inferior Lingual"
            teeth={LOWER_TEETH}
            midline={MIDLINE_LOWER}
            data={v.inf_ling}
            onChange={val => set("inf_ling", val)}
            inverted={true}
          />
        </div>
      </div>

      {/* ── 7. Índices ── */}
      <div className="grid sm:grid-cols-2 gap-6">
        {(["idx_placa", "idx_sangrado"] as const).map(key => (
          <div key={key}>
            <SectionTitle>{key === "idx_placa" ? "Índice de placa" : "Índice de sangrado"}</SectionTitle>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="border border-gray-200 px-2 py-1 text-left">Fecha</th>
                  <th className="border border-gray-200 px-2 py-1 text-left">Porcentaje (%)</th>
                </tr>
              </thead>
              <tbody>
                {v[key].map((row, i) => (
                  <tr key={i}>
                    <td className="border border-gray-200 p-0.5">
                      <Input
                        type="date"
                        value={row.fecha}
                        onChange={e => {
                          const arr = [...v[key]]
                          arr[i] = { ...arr[i], fecha: e.target.value }
                          set(key, arr)
                        }}
                        className="h-7 text-xs border-0 bg-transparent"
                      />
                    </td>
                    <td className="border border-gray-200 p-0.5">
                      <Input
                        value={row.pct}
                        onChange={e => {
                          const arr = [...v[key]]
                          arr[i] = { ...arr[i], pct: e.target.value }
                          set(key, arr)
                        }}
                        placeholder="%"
                        className="h-7 text-xs border-0 bg-transparent"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── 8. Diagnóstico ── */}
      <div>
        <SectionTitle>Diagnóstico</SectionTitle>
        <div className="space-y-3">
          <Field label="Diagnóstico clínico">
            <Textarea
              value={v.diag_clinico}
              onChange={e => set("diag_clinico", e.target.value)}
              rows={2} className="resize-none text-sm"
            />
          </Field>
          <Field label="Etiología">
            <TxtInput value={v.etiologia} onChange={val => set("etiologia", val)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Diagnóstico radiográfico">
              <TxtInput value={v.diag_radio} onChange={val => set("diag_radio", val)} />
            </Field>
            <Field label="Fecha de aprobación">
              <Input type="date" value={v.fecha_aprob_diag} onChange={e => set("fecha_aprob_diag", e.target.value)} className="h-8 text-sm" />
            </Field>
          </div>
        </div>
      </div>

      {/* ── 9. Pronóstico ── */}
      <div>
        <SectionTitle>Pronóstico</SectionTitle>
        <table className="w-full text-xs border-collapse max-w-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="border border-gray-200 px-3 py-1 text-left" />
              <th className="border border-gray-200 px-3 py-1">Favorable</th>
              <th className="border border-gray-200 px-3 py-1">Desfavorable</th>
            </tr>
          </thead>
          <tbody>
            {(["General", "Individual"] as const).map(row => {
              const key = row === "General" ? "pron_general" : "pron_individual"
              return (
                <tr key={row}>
                  <td className="border border-gray-200 px-3 py-1 font-medium">{row}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={v[key] === "favorable"}
                      onChange={e => set(key, e.target.checked ? "favorable" : "")}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={v[key] === "desfavorable"}
                      onChange={e => set(key, e.target.checked ? "desfavorable" : "")}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── 10. Plan de tratamiento ── */}
      <div>
        <SectionTitle>Plan de tratamiento</SectionTitle>
        <p className="text-xs text-muted-foreground mb-2">Fase I: Terapéutica Inicial</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
          {([
            ["plan_emergencia",        "Tratamiento de emergencia"],
            ["plan_ajuste_oclusal",    "Ajuste oclusal"],
            ["plan_endodoncia",        "Endodoncia"],
            ["plan_restauraciones",    "Eliminación de restauraciones desbordantes"],
            ["plan_profilaxis",        "Profilaxis"],
            ["plan_instrucciones",     "Instrucciones en técnicas de higiene oral"],
            ["plan_caries",            "Control de caries y tratamiento"],
            ["plan_estabilizacion",    "Estabilización temporal"],
            ["plan_raspaje",           "Raspaje y alisado radicular / Pulido"],
            ["plan_extraccion",        "Extracción de dientes insalvables"],
            ["plan_reevaluacion",      "Reevaluación"],
          ] as [keyof PerioData, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
              {bool(key)}
              {label}
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <Field label="Fase II: Terapéutica Periodontal Quirúrgica">
            <Textarea value={v.plan_fase2} onChange={e => set("plan_fase2", e.target.value)} rows={2} className="resize-none text-sm" />
          </Field>
          <Field label="Fase III: Rehabilitación (Restauraciones aconsejadas)">
            <Textarea value={v.plan_fase3} onChange={e => set("plan_fase3", e.target.value)} rows={2} className="resize-none text-sm" />
          </Field>
          <Field label="Fase IV: Mantenimiento Periodontal (frecuencia)">
            <Textarea value={v.plan_fase4} onChange={e => set("plan_fase4", e.target.value)} rows={2} className="resize-none text-sm" />
          </Field>
          <Field label="Fecha de aprobación del Plan de Tratamiento">
            <Input type="date" value={v.fecha_aprob_plan} onChange={e => set("fecha_aprob_plan", e.target.value)} className="h-8 text-sm max-w-xs" />
          </Field>
        </div>
      </div>

      {/* ── 11. Registro de actividades ── */}
      <div>
        <SectionTitle>Registro de actividades</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-muted/40">
                <th className="border border-gray-200 px-2 py-1 w-28 text-left">Fecha</th>
                <th className="border border-gray-200 px-2 py-1 text-left">Trabajo realizado</th>
                <th className="border border-gray-200 px-2 py-1 w-28 text-left">Firma del docente</th>
              </tr>
            </thead>
            <tbody>
              {v.actividades.map((row, i) => (
                <tr key={i}>
                  <td className="border border-gray-200 p-0.5">
                    <Input
                      type="date"
                      value={row.fecha}
                      onChange={e => {
                        const arr = [...v.actividades]
                        arr[i] = { ...arr[i], fecha: e.target.value }
                        set("actividades", arr)
                      }}
                      className="h-7 text-xs border-0 bg-transparent"
                    />
                  </td>
                  <td className="border border-gray-200 p-0.5">
                    <Input
                      value={row.trabajo}
                      onChange={e => {
                        const arr = [...v.actividades]
                        arr[i] = { ...arr[i], trabajo: e.target.value }
                        set("actividades", arr)
                      }}
                      className="h-7 text-xs border-0 bg-transparent"
                    />
                  </td>
                  <td className="border border-gray-200 p-0.5">
                    <Input
                      value={row.firma}
                      onChange={e => {
                        const arr = [...v.actividades]
                        arr[i] = { ...arr[i], firma: e.target.value }
                        set("actividades", arr)
                      }}
                      className="h-7 text-xs border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
