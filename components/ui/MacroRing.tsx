'use client'
// Anneau de macros SVG — protéines / glucides / lipides
// Affiché dans le dashboard et la page nutrition

interface MacroRingProps {
  proteinG:  number
  carbsG:    number
  fatG:      number
  targetCalories?: number
  size?:     number
}

const COLORS = {
  protein: '#C8F135',
  carbs:   '#38bdf8',
  fat:     '#f472b6',
}

export function MacroRing({ proteinG, carbsG, fatG, targetCalories, size = 120 }: MacroRingProps) {
  const total = proteinG * 4 + carbsG * 4 + fatG * 9
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const segments = [
    { key: 'protein', value: total ? (proteinG * 4) / total : 0, color: COLORS.protein, label: 'Protéines', g: proteinG },
    { key: 'carbs',   value: total ? (carbsG * 4) / total : 0,   color: COLORS.carbs,   label: 'Glucides',  g: carbsG },
    { key: 'fat',     value: total ? (fatG * 9) / total : 0,      color: COLORS.fat,     label: 'Lipides',   g: fatG },
  ]

  let offset = 0
  const arcs = segments.map((seg) => {
    const strokeDashoffset = circumference * (1 - seg.value)
    const rotation         = offset * 360
    offset += seg.value
    return { ...seg, strokeDashoffset, rotation }
  })

  const totalCalories = Math.round(total)

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Fond */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#27272a" strokeWidth={8} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={arc.strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </svg>

        {/* Calories au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white tabular-nums">{totalCalories}</span>
          <span className="text-xs text-zinc-400">kcal</span>
        </div>
      </div>

      {/* Légende */}
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-zinc-400">{seg.label}</span>
            <span className="text-xs font-semibold text-white tabular-nums ml-auto pl-2">{seg.g}g</span>
          </div>
        ))}
        {targetCalories && (
          <div className="pt-1 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Objectif : {targetCalories} kcal</span>
          </div>
        )}
      </div>
    </div>
  )
}
