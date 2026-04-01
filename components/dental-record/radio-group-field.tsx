"use client"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupFieldProps {
  name: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  columns?: 1 | 2 | 3 | 4
}

export function RadioGroupField({ name, options, value, onChange, columns = 2 }: RadioGroupFieldProps) {
  return (
    <div
      className={cn("gap-2", {
        "grid grid-cols-1": columns === 1,
        "grid grid-cols-2": columns === 2,
        "grid grid-cols-3": columns === 3,
        "grid grid-cols-4": columns === 4,
      })}
    >
      {options.map((opt) => {
        const id = `${name}-${opt.value}`
        return (
          <div key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              id={id}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 shrink-0 accent-primary cursor-pointer"
            />
            <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
              {opt.label}
            </Label>
          </div>
        )
      })}
    </div>
  )
}
