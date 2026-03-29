import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ZONE_COLORS = {
  green:  '#1D9E75',
  yellow: '#BA7517',
  red:    '#E24B4A',
} as const

export const ZONE_BG = {
  green:  'bg-[#1D9E75]/10 border-[#1D9E75]/30',
  yellow: 'bg-[#BA7517]/10 border-[#BA7517]/30',
  red:    'bg-[#E24B4A]/10 border-[#E24B4A]/30',
} as const

export const ZONE_TEXT = {
  green:  'text-[#1D9E75]',
  yellow: 'text-[#BA7517]',
  red:    'text-[#E24B4A]',
} as const
