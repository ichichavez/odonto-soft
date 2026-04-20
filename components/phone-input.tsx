"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Países de América Latina + España + EEUU
const COUNTRY_CODES = [
  { code: "+595", flag: "🇵🇾", label: "PY +595" },
  { code: "+54",  flag: "🇦🇷", label: "AR +54"  },
  { code: "+56",  flag: "🇨🇱", label: "CL +56"  },
  { code: "+55",  flag: "🇧🇷", label: "BR +55"  },
  { code: "+598", flag: "🇺🇾", label: "UY +598" },
  { code: "+591", flag: "🇧🇴", label: "BO +591" },
  { code: "+51",  flag: "🇵🇪", label: "PE +51"  },
  { code: "+52",  flag: "🇲🇽", label: "MX +52"  },
  { code: "+57",  flag: "🇨🇴", label: "CO +57"  },
  { code: "+58",  flag: "🇻🇪", label: "VE +58"  },
  { code: "+593", flag: "🇪🇨", label: "EC +593" },
  { code: "+1",   flag: "🇺🇸", label: "US +1"   },
  { code: "+34",  flag: "🇪🇸", label: "ES +34"  },
]

const DEFAULT_CODE = "+595"

/** Descompone un valor almacenado en código de país + número local. */
export function parsePhone(value: string): { countryCode: string; localNumber: string } {
  if (!value) return { countryCode: DEFAULT_CODE, localNumber: "" }
  if (value.startsWith("+")) {
    // Busca el código más largo que coincida primero (ej: +595 antes que +5)
    const match = COUNTRY_CODES.slice().sort((a, b) => b.code.length - a.code.length)
      .find(c => value.startsWith(c.code))
    if (match) {
      return {
        countryCode: match.code,
        localNumber: value.slice(match.code.length).trimStart(),
      }
    }
  }
  // Sin prefijo → asumir Paraguay
  return { countryCode: DEFAULT_CODE, localNumber: value }
}

/** Combina código de país + número local para almacenamiento. */
export function formatPhone(countryCode: string, localNumber: string): string {
  const n = localNumber.trim()
  if (!n) return ""
  return `${countryCode} ${n}`
}

type PhoneInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function PhoneInput({ id, value, onChange, placeholder, disabled }: PhoneInputProps) {
  const { countryCode, localNumber } = parsePhone(value)

  return (
    <div className="flex gap-2">
      <Select
        value={countryCode}
        onValueChange={(code) => onChange(formatPhone(code, localNumber))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[110px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        value={localNumber}
        onChange={(e) => onChange(formatPhone(countryCode, e.target.value))}
        placeholder={placeholder ?? "Número de teléfono"}
        disabled={disabled}
      />
    </div>
  )
}
