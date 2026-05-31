// Renpho CSV parser — maps Renpho scale export columns to BodyMetric fields.
// Export obtenu depuis l'app Renpho : Profil → Exporter les données → CSV

export interface RenphoRow {
  date:                    Date
  weightKg:                number | undefined
  bodyFatPct:              number | undefined
  muscleMassKg:            number | undefined
  renphoBmi:               number | undefined
  renphoFatFreeMassKg:     number | undefined
  renphoSubcutaneousFatPct: number | undefined
  renphoVisceralFat:       number | undefined
  renphoBodyWaterPct:      number | undefined
  renphoSkeletalMusclePct: number | undefined
  renphoBoneMassKg:        number | undefined
  renphoProteinPct:        number | undefined
  renphoBmr:               number | undefined
  renphoMetabolicAge:      number | undefined
}

const COL_MAP: Record<string, keyof RenphoRow | null> = {
  'Time of Measurement':      null, // handled separately as date
  'Weight(kg)':               'weightKg',
  'BMI':                      'renphoBmi',
  'Body Fat(%)':              'bodyFatPct',
  'Fat-free Body Weight(kg)': 'renphoFatFreeMassKg',
  'Subcutaneous Fat(%)':      'renphoSubcutaneousFatPct',
  'Visceral Fat':             'renphoVisceralFat',
  'Body Water(%)':            'renphoBodyWaterPct',
  'Skeletal Muscle(%)':       'renphoSkeletalMusclePct',
  'Muscle Mass(kg)':          'muscleMassKg',
  'Bone Mass(kg)':            'renphoBoneMassKg',
  'Protein(%)':               'renphoProteinPct',
  'BMR(kcal)':                'renphoBmr',
  'Metabolic Age':            'renphoMetabolicAge',
}

function parseNum(val: string): number | undefined {
  const n = parseFloat(val.trim())
  return isNaN(n) ? undefined : n
}

export function parseRenphoCSV(csvText: string): RenphoRow[] {
  const lines = csvText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) throw new Error('CSV vide ou invalide')

  const sep     = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''))

  const dateIdx = headers.indexOf('Time of Measurement')
  if (dateIdx === -1) throw new Error('Colonne "Time of Measurement" introuvable — vérifiez que le fichier provient de l\'app Renpho')

  const rows: RenphoRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 2) continue

    const date = new Date(cols[dateIdx])
    if (isNaN(date.getTime())) continue

    const row: RenphoRow = {
      date,
      weightKg: undefined, bodyFatPct: undefined, muscleMassKg: undefined,
      renphoBmi: undefined, renphoFatFreeMassKg: undefined, renphoSubcutaneousFatPct: undefined,
      renphoVisceralFat: undefined, renphoBodyWaterPct: undefined, renphoSkeletalMusclePct: undefined,
      renphoBoneMassKg: undefined, renphoProteinPct: undefined, renphoBmr: undefined,
      renphoMetabolicAge: undefined,
    }

    headers.forEach((header, idx) => {
      const val   = cols[idx] ?? ''
      const field = COL_MAP[header]
      if (field && val) {
        (row as unknown as Record<string, unknown>)[field] = parseNum(val)
      }
    })

    if (row.weightKg !== undefined || row.bodyFatPct !== undefined) {
      rows.push(row)
    }
  }

  if (rows.length === 0) throw new Error('Aucune mesure valide trouvée dans le fichier')
  return rows
}
