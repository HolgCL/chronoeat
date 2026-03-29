'use client'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface Props {
  consumed: number
  goal: number
  label?: string
}

export default function MacroRing({ consumed, goal, label = 'ккал' }: Props) {
  const pct = Math.min((consumed / goal) * 100, 100)

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="65%" outerRadius="90%"
          startAngle={90} endAngle={-270}
          data={[{ value: pct, fill: '#1D9E75' }]}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#333' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-neutral-100">{consumed}</span>
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-500">из {goal}</span>
      </div>
    </div>
  )
}
