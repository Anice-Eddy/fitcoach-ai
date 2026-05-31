// Renpho CSV parser — maps Renpho scale export columns to BodyMetric fields.
// Export obtenu depuis l'app Renpho : Profil → Exporter les données → CSV

export interface RenphoRow {
  date:         Date
  weightKg:     number | undefined
  bodyFatPct:   number | undefined
  muscleMassKg: number | undefined
  notes:        string | undefined
}

// Renpho CSV columns mapped to our schema.
const COL_MAP: Record<string, keyof RenphoRow | null> = {
  'Time of Measurement': null, // handled separately as date
  'Weight(kg)':          'weightKg',
  'Body Fat(%)':         'bodyFatPct',
  'Muscle Mass(kg)':     'muscleMassKg',
  // Parsed but stored in notes as extra context
  'BMI':                 null,
  'Visceral Fat':        null,
  'Body Water(%)':       null,
  'Skeletal Muscle(%)':  null,
  'Bone Mass(kg)':       null,
  'Protein(%)':          null,
  'BMR(kcal)':           null,
  'Metabolic Age':       null,
}

const EXTRA_NOTES_COLS = ['BMI', 'Visceral Fat', 'Body Water(%)', 'Skeletal Muscle(%)', 'Bone Mass(kg)', 'Protein(%)', 'BMR(kcal)', 'Metabolic Age']

function parseNum(val: string): number | undefined {
  const n = parseFloat(val.trim())
  return isNaN(n) ? undefined : n
}

export function parseRenphoCSV(csvText: string): RenphoRow[] {
  const lines = csvText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) throw new Error('CSV vide ou invalide')

  // Detect separator (comma or semicolon)
  const sep  = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''))

  const dateIdx = headers.indexOf('Time of Measurement')
  if (dateIdx === -1) throw new Error('Colonne "Time of Measurement" introuvable — vérifiez que le fichier provient de l\'app Renpho')

  const rows: RenphoRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 2) continue

    const rawDate = cols[dateIdx]
    const date    = new Date(rawDate)
    if (isNaN(date.getTime())) continue

    const row: RenphoRow = { date, weightKg: undefined, bodyFatPct: undefined, muscleMassKg: undefined, notes: undefined }

    // Extra data packed into notes
    const extras: string[] = []

    headers.forEach((header, idx) => {
      const val = cols[idx] ?? ''
      const field = COL_MAP[header]
      if (field && field !== null && val) {
        (row as unknown as Record<string, unknown>)[field] = parseNum(val)
      }
      if (EXTRA_NOTES_COLS.includes(header) && val) {
        extras.push(`${header}: ${val}`)
      }
    })

    if (extras.length) row.notes = `Renpho — ${extras.join(' | ')}`

    // Only include rows that have at least weight or body fat
    if (row.weightKg !== undefined || row.bodyFatPct !== undefined) {
      rows.push(row)
    }
  }

  if (rows.length === 0) throw new Error('Aucune mesure valide trouvée dans le fichier')
  return rows
}
