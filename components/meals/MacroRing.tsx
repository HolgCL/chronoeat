'use client'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  consumed: number
  goal: number
  label?: string
}

export default function MacroRing({ consumed, goal, label = 'ккал' }: Props) {
  const { lang } = useAppStore()
  const pct = Math.min(consumed / goal, 1)
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = pct * circumference

  const color = pct >= 1 ? '#E24B4A' : pct >= 0.8 ? '#BA7517' : '#1D9E75'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#333" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-neutral-100">{consumed}</span>
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-500">{lang === 'ru' ? 'из' : 'of'} {goal}</span>
      </div>
    </div>
  )
}
