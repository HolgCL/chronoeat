'use client'
import { motion } from 'framer-motion'
import { ZONE_COLORS } from '@/lib/utils'

type Zone = 'green' | 'yellow' | 'red'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { px: number; stroke: number; fontSize: number }> = {
  sm: { px: 32, stroke: 3,  fontSize: 9 },
  md: { px: 48, stroke: 4,  fontSize: 13 },
  lg: { px: 80, stroke: 5,  fontSize: 20 },
}

interface Props {
  score: number
  zone: Zone
  size?: Size
  showLabel?: boolean
  label?: string
}

export default function ChronoScore({ score, zone, size = 'md', showLabel, label }: Props) {
  const { px, stroke, fontSize } = SIZES[size]
  const color = ZONE_COLORS[zone]
  const r = (px - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <svg width={px} height={px} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={px / 2} cy={px / 2} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Progress */}
          <motion.circle
            cx={px / 2} cy={px / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* Score text */}
          <text
            x={px / 2} y={px / 2}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              transform: 'rotate(90deg)',
              transformOrigin: `${px / 2}px ${px / 2}px`,
              fill: color,
              fontSize,
              fontWeight: 700,
            }}
          >
            {score}
          </text>
        </svg>
      </motion.div>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>
          {label ?? zone}
        </span>
      )}
    </div>
  )
}
