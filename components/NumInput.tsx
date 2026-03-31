'use client'
import { useState, useEffect, useRef } from 'react'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (n: number) => void
  float?: boolean
}

/**
 * Numeric input with clean UX:
 * - Backspace to empty → shows "" (not stuck), blur → restores "0"
 * - Focus on "0" → clears to "" so next keystroke replaces it
 * - Float mode allows "75." intermediate state while typing
 * - Syncs display when parent value changes externally (e.g. API load)
 */
export default function NumInput({ value, onChange, float, className, ...rest }: Props) {
  const [raw, setRaw] = useState(() => value === 0 ? '' : String(value))
  const prevExternal = useRef(value)

  useEffect(() => {
    if (value === prevExternal.current) return
    prevExternal.current = value
    // Only update display if it doesn't already represent the same number
    const parsed = float ? parseFloat(raw) : parseInt(raw, 10)
    if ((isNaN(parsed) ? 0 : parsed) !== value) {
      setRaw(value === 0 ? '' : String(value))
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filtered = e.target.value.replace(float ? /[^\d.]/g : /\D/g, '')
    setRaw(filtered)
    const n = float ? parseFloat(filtered) : parseInt(filtered, 10)
    const num = isNaN(n) ? 0 : n
    prevExternal.current = num
    onChange(num)
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (raw === '0' || raw === '') setRaw('')
    // Select so the user can type over remaining text
    requestAnimationFrame(() => e.target.select())
  }

  function handleBlur() {
    if (!raw || raw === '.') {
      setRaw('0')
      onChange(0)
    }
  }

  return (
    <input
      type="text"
      inputMode={float ? 'decimal' : 'numeric'}
      value={raw}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  )
}
