'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header }       from '@/components/layout/Header'
import { PageWrapper }  from '@/components/layout/PageWrapper'
import { WeightChart }  from '@/components/dashboard/WeightChart'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Plus, Scale, Target, TrendingDown, TrendingUp, Activity, Trash2, Ruler, Footprints, Moon, Droplets, Battery, Brain, Camera, Heart, Wind, Zap, HeartPulse } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

interface BodyMetric {
  id:               string
  date:             string
  // Composition corporelle
  weightKg?:        number | null
  bodyFatPct?:      number | null
  muscleMassKg?:    number | null
  // Daily activity
  steps?:           number | null
  caloriesActive?:  number | null
  // Recovery
  sleepHours?:      number | null
  waterLiters?:     number | null
  energyLevel?:     number | null
  stressLevel?:     number | null
  // Cardiovasculaire (Apple Health / Apple Watch)
  heartRateAvg?:     number | null
  restingHeartRate?: number | null
  vo2Max?:           number | null
  hrv?:              number | null
  spo2?:             number | null
  // Divers
  progressPhotoUrl?: string | null
}
interface WeightPoint { date: string; weight: number }

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Progress tracking page: displays body weight history chart, allows logging new weight entries, and shows BMI and body composition metrics. */
export default function ProgressPage() {
  const { locale, t } = useLocale()
  const { profile }         = useUserStore()
  const [form, setForm] = useState({
    weightKg: '',
    bodyFatPct: '',
    steps: '',
    sleepHours: '',
    waterLiters: '',
    energyLevel: '',
    stressLevel: '',
    progressPhotoUrl: '',
  })
  const [saving, setSaving]         = useState(false)
  const [metrics, setMetrics]       = useState<BodyMetric[]>([])
  const [loading, setLoading]       = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMetrics = useCallback(() => {
    fetch('/api/user/metrics?limit=90')
      .then(res => res.json())
      .then((data: BodyMetric[]) => {
        if (Array.isArray(data)) setMetrics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const optionalNumber = (value: string) => value.trim() === '' ? undefined : Number(value)
  const hasAnyMetricInput = Object.values(form).some(value => value.trim() !== '')

  const handleAddMetric = async () => {
    if (!hasAnyMetricInput) { toast.error(t('progress.addAtLeastOne')); return }
    const val = optionalNumber(form.weightKg)
    if (val !== undefined && (isNaN(val) || val < 30 || val > 300)) { toast.error(t('progress.invalidWeight')); return }
    setSaving(true)
    try {
      // Also send recovery signals so the AI can better explain variations.
      const payload = {
        weightKg: val,
        bodyFatPct: optionalNumber(form.bodyFatPct),
        steps: optionalNumber(form.steps),
        sleepHours: optionalNumber(form.sleepHours),
        waterLiters: optionalNumber(form.waterLiters),
        energyLevel: optionalNumber(form.energyLevel),
        stressLevel: optionalNumber(form.stressLevel),
        progressPhotoUrl: form.progressPhotoUrl.trim() || undefined,
      }
      const res = await fetch('/api/user/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(t('progress.saved'))
        setForm({
          weightKg: '',
          bodyFatPct: '',
          steps: '',
          sleepHours: '',
          waterLiters: '',
          energyLevel: '',
          stressLevel: '',
          progressPhotoUrl: '',
        })
        fetchMetrics()
      } else {
        toast.error(t('progress.outOfRange'))
      }
    } catch { toast.error(t('progress.networkError')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/metrics?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success(t('progress.deleted')); fetchMetrics() }
      else toast.error(t('progress.deleteError'))
    } catch { toast.error(t('progress.networkError')) }
    finally { setDeletingId(null) }
  }

  const sortedAsc = [...metrics].reverse()
  const chartData: WeightPoint[] = sortedAsc
    .filter((m): m is BodyMetric & { weightKg: number } => typeof m.weightKg === 'number')
    .map(m => ({
      date:   new Date(m.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit' }),
      weight: m.weightKg,
    }))

  const weightMetrics = metrics.filter((m): m is BodyMetric & { weightKg: number } => typeof m.weightKg === 'number')
  const lastWeight  = weightMetrics[0]?.weightKg ?? null
  const todayKey = localDateKey(new Date())
  const lastMetric  = metrics.find(metric => localDateKey(new Date(metric.date)) === todayKey) ?? null
  const firstWeight = weightMetrics[weightMetrics.length - 1]?.weightKg ?? null
  const delta = lastWeight !== null && firstWeight !== null && weightMetrics.length > 1
    ? Math.round((lastWeight - firstWeight) * 10) / 10
    : null
  const bmi = profile?.bmi ?? null

  return (
    <>
      <Header titleKey="progress.title" />
      <PageWrapper>
        <div className="space-y-6">

          {/* Goal */}
          {profile?.fitnessGoal && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="size-4 text-[#C8F135]" />
                <h3 className="text-sm font-semibold text-white">{t('progress.primaryGoal')}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">{t('progress.objective')}</p>
                  <p className="font-medium text-[#C8F135]">{GOAL_LABEL_KEYS[profile.fitnessGoal] ? t(GOAL_LABEL_KEYS[profile.fitnessGoal]) : profile.fitnessGoal}</p>
                </div>
                {profile.targetWeightKg ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">{t('progress.targetWeight')}</p>
                    <p className="font-medium text-white">{profile.targetWeightKg} kg</p>
                  </div>
                ) : null}
                {profile.tdee ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">{t('progress.caloricExpenditure')}</p>
                    <p className="font-medium text-white">{Math.round(profile.tdee)} {t('progress.kcalPerDay')}</p>
                  </div>
                ) : null}
                {profile.recommendedCalories ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">{t('progress.calories')}</p>
                    <p className="font-medium text-white">{Math.round(profile.recommendedCalories)} {t('progress.kcalPerDay')}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              title={t('progress.currentWeight')}
              value={lastWeight ?? '—'}
              unit={lastWeight ? 'kg' : ''}
              icon={<Scale className="size-4" />}
              isLoading={loading}
            />
            <MetricCard
              title={t('progress.weightObjective')}
              value={profile?.targetWeightKg ?? '—'}
              unit={profile?.targetWeightKg ? 'kg' : ''}
              icon={<Target className="size-4" />}
              accentColor="#38bdf8"
            />
            <MetricCard
              title={t('progress.progression')}
              value={delta !== null ? (delta > 0 ? `+${delta}` : String(delta)) : '—'}
              unit={delta !== null ? 'kg' : ''}
              icon={delta !== null
                ? (delta < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />)
                : <Activity className="size-4" />
              }
              accentColor={delta !== null && delta < 0 ? '#4ade80' : delta !== null ? '#f87171' : '#C8F135'}
              isLoading={loading}
            />
            <MetricCard
              title={t('progress.bmi')}
              value={bmi ? bmi.toFixed(1) : '—'}
              unit={bmi
                ? (bmi < 18.5 ? t('progress.bmiUnderweight') : bmi < 25 ? t('progress.bmiNormal') : bmi < 30 ? t('progress.bmiOverweight') : t('progress.bmiObesity'))
                : ''
              }
              icon={<Ruler className="size-4" />}
              accentColor={bmi
                ? (bmi < 18.5 || bmi >= 30 ? '#f87171' : bmi < 25 ? '#4ade80' : '#fbbf24')
                : '#C8F135'
              }
            />
          </div>

          {/* Ajout mesure */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">{t('progress.addMeasurement')}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricInput label={t('progress.weightKg')} value={form.weightKg} onChange={value => updateForm('weightKg', value)} min={30} max={300} step="0.1" />
              <MetricInput label={t('progress.bodyFatPct')} value={form.bodyFatPct} onChange={value => updateForm('bodyFatPct', value)} min={1} max={70} step="0.1" />
              <MetricInput label={t('progress.steps')} value={form.steps} onChange={value => updateForm('steps', value)} min={0} max={100000} step="1" />
              <MetricInput label={t('progress.sleepHours')} value={form.sleepHours} onChange={value => updateForm('sleepHours', value)} min={0} max={24} step="0.25" />
              <MetricInput label={t('progress.waterLiters')} value={form.waterLiters} onChange={value => updateForm('waterLiters', value)} min={0} max={15} step="0.1" />
              <MetricInput label={t('progress.energyLevel')} value={form.energyLevel} onChange={value => updateForm('energyLevel', value)} min={1} max={5} step="1" />
              <MetricInput label={t('progress.stressLevel')} value={form.stressLevel} onChange={value => updateForm('stressLevel', value)} min={1} max={5} step="1" />
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('progress.photoUrl')}</span>
                <input
                  type="url"
                  placeholder={t('common.urlPlaceholder')}
                  value={form.progressPhotoUrl}
                  onChange={e => updateForm('progressPhotoUrl', e.target.value)}
                  className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm text-white outline-none transition-colors focus:border-[#C8F135]"
                />
              </label>
              <button
                type="button" onClick={handleAddMetric}
                disabled={saving || !hasAnyMetricInput}
                aria-label={t('progress.saveMeasurement')}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50 sm:col-span-2 lg:col-span-4"
              >
                <Plus className="size-4" /> {t('common.save')}
              </button>
            </div>
          </div>

          {/* Daily recovery */}
          {lastMetric && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <MetricCard title={t('progress.steps')} value={lastMetric.steps ?? '—'} icon={<Footprints className="size-4" />} accentColor="#38bdf8" />
              <MetricCard title={t('progress.sleep')} value={lastMetric.sleepHours ?? '—'} unit={lastMetric.sleepHours ? 'h' : ''} icon={<Moon className="size-4" />} accentColor="#a78bfa" />
              <MetricCard title={t('progress.waterLiters')} value={lastMetric.waterLiters ?? '—'} unit={lastMetric.waterLiters ? 'L' : ''} icon={<Droplets className="size-4" />} accentColor="#22d3ee" />
              <MetricCard title={t('progress.energy')} value={lastMetric.energyLevel ?? '—'} unit={lastMetric.energyLevel ? '/5' : ''} icon={<Battery className="size-4" />} accentColor="#4ade80" />
              <MetricCard title={t('progress.stress')} value={lastMetric.stressLevel ?? '—'} unit={lastMetric.stressLevel ? '/5' : ''} icon={<Brain className="size-4" />} accentColor="#f87171" />
            </div>
          )}

          {/* Apple Health: cardiovascular data */}
          {lastMetric && (
            lastMetric.heartRateAvg || lastMetric.restingHeartRate || lastMetric.caloriesActive ||
            lastMetric.vo2Max || lastMetric.hrv || lastMetric.spo2 || lastMetric.muscleMassKg
          ) && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                {/* Logo Apple Health */}
                <div className="size-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Heart className="size-3 text-white fill-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">Apple Health</h3>
                <span className="text-xs text-zinc-500 ml-auto">
                  {lastMetric.date
                    ? new Date(lastMetric.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
                    : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {lastMetric.heartRateAvg != null && (
                  <MetricCard title={t('progress.avgHeartRate')} value={lastMetric.heartRateAvg} unit="bpm"
                    icon={<HeartPulse className="size-4" />} accentColor="#f87171" />
                )}
                {lastMetric.restingHeartRate != null && (
                  <MetricCard title={t('progress.restingHeartRate')} value={lastMetric.restingHeartRate} unit="bpm"
                    icon={<Heart className="size-4" />} accentColor="#fb923c" />
                )}
                {lastMetric.caloriesActive != null && (
                  <MetricCard title={t('progress.activeCalories')} value={lastMetric.caloriesActive} unit="kcal"
                    icon={<Zap className="size-4" />} accentColor="#fbbf24" />
                )}
                {lastMetric.vo2Max != null && (
                  <MetricCard title="VO₂ max" value={lastMetric.vo2Max.toFixed(1)} unit="ml/kg/min"
                    icon={<Wind className="size-4" />} accentColor="#34d399" />
                )}
                {lastMetric.hrv != null && (
                  <MetricCard title={t('progress.hrvTitle')} value={Math.round(lastMetric.hrv)} unit="ms"
                    icon={<Activity className="size-4" />} accentColor="#a78bfa" />
                )}
                {lastMetric.spo2 != null && (
                  <MetricCard title="SpO₂" value={lastMetric.spo2.toFixed(1)} unit="%"
                    icon={<Droplets className="size-4" />} accentColor="#60a5fa" />
                )}
                {lastMetric.muscleMassKg != null && (
                  <MetricCard title={t('progress.muscleMassShort')} value={lastMetric.muscleMassKg.toFixed(1)} unit="kg"
                    icon={<Activity className="size-4" />} accentColor="#C8F135" />
                )}
              </div>

              {/* HRV interpretation */}
              {lastMetric.hrv != null && (
                <p className={`text-xs mt-3 ${
                  lastMetric.hrv >= 60 ? 'text-emerald-400' : lastMetric.hrv >= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {lastMetric.hrv >= 60
                    ? t('progress.hrvHigh')
                    : lastMetric.hrv >= 40
                    ? t('progress.hrvModerate')
                    : t('progress.hrvLow')}
                </p>
              )}
              {/* Resting heart rate interpretation */}
              {lastMetric.restingHeartRate != null && (
                <p className={`text-xs mt-1 ${
                  lastMetric.restingHeartRate < 60 ? 'text-emerald-400' : lastMetric.restingHeartRate < 70 ? 'text-zinc-400' : 'text-red-400'
                }`}>
                  {lastMetric.restingHeartRate < 50
                    ? t('progress.restingHeartExcellent')
                    : lastMetric.restingHeartRate < 60
                    ? t('progress.restingHeartVeryGood')
                    : lastMetric.restingHeartRate < 70
                    ? t('progress.restingHeartNormal')
                    : t('progress.restingHeartHigh')}
                </p>
              )}
            </div>
          )}

          {/* Graphique */}
          {chartData.length > 0 ? (
            <WeightChart data={chartData} targetWeight={profile?.targetWeightKg} />
          ) : !loading ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center">
              <Scale className="size-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">{t('progress.noData')}</p>
              <p className="text-sm text-zinc-600 mt-1">{t('progress.noDataDescription')}</p>
            </div>
          ) : null}

          {/* Macros */}
          {profile?.recommendedProteinG ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('progress.recommendedMacros')}</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t('nutrition.protein'), value: Math.round(profile.recommendedProteinG), color: 'text-[#C8F135]', bg: 'bg-[#C8F135]/10' },
                  { label: t('nutrition.carbs'),  value: Math.round(profile.recommendedCarbsG ?? 0), color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: t('nutrition.fat'),   value: Math.round(profile.recommendedFatG ?? 0), color: 'text-pink-400', bg: 'bg-pink-400/10' },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl p-4 text-center ${m.bg}`}>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}g</p>
                    <p className="text-xs text-zinc-400 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Historique */}
          {metrics.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">{t('progress.history')}</h3>
              <div className="space-y-1">
                {metrics.map((m, i) => (
                  <div key={m.id ?? i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 group">
                    <span className="text-xs text-zinc-400">
                      {new Date(m.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      {typeof m.weightKg === 'number' ? <span className="text-sm font-semibold text-white">{m.weightKg} kg</span> : null}
                      {m.bodyFatPct    ? <span className="text-xs text-zinc-500">{m.bodyFatPct}% {t('progress.bodyFatShort')}</span>          : null}
                      {m.muscleMassKg  ? <span className="text-xs text-zinc-500">{m.muscleMassKg}kg {t('progress.muscleShort')}</span>     : null}
                      {m.steps         ? <span className="text-xs text-zinc-600">{m.steps.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} {t('progress.steps').toLowerCase()}</span> : null}
                      {m.heartRateAvg  ? <span className="text-xs text-red-400/70">{m.heartRateAvg} bpm</span>      : null}
                      {m.restingHeartRate ? <span className="text-xs text-orange-400/70">{m.restingHeartRate} bpm↓</span> : null}
                      {m.vo2Max        ? <span className="text-xs text-emerald-400/70">VO₂ {m.vo2Max.toFixed(1)}</span> : null}
                      {m.hrv           ? <span className="text-xs text-violet-400/70">HRV {Math.round(m.hrv)}ms</span> : null}
                      {m.spo2          ? <span className="text-xs text-blue-400/70">SpO₂ {m.spo2}%</span>          : null}
                      {m.progressPhotoUrl ? <Camera className="size-3.5 text-zinc-500" aria-label={t('progress.photoSaved')} /> : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        aria-label={t('progress.deleteMeasurement')}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </PageWrapper>
    </>
  )
}

function MetricInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  max: number
  step: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        required={required}
        onChange={e => onChange(e.target.value)}
        className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm text-white outline-none transition-colors focus:border-[#C8F135]"
      />
    </label>
  )
}
