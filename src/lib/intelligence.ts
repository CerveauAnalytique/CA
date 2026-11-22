export type FieldStats = {
  field: string
  count: number
  min: number
  max: number
  mean: number
  std: number
  latest: number
  trend: 'up' | 'down' | 'flat'
  anomalies: { index: number; value: number; at?: string; z: number }[]
}

/** Numeric statistics per field and unusual values (more than 3 standard deviations from the mean). */
export function analyze(records: { data: Record<string, unknown>; at?: string }[], detectAnomalies: boolean): FieldStats[] {
  const fields = new Map<string, { v: number; at?: string }[]>()
  for (const r of records) {
    for (const [k, v] of Object.entries(r.data ?? {})) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        if (!fields.has(k)) fields.set(k, [])
        fields.get(k)!.push({ v, at: r.at })
      }
    }
  }
  const out: FieldStats[] = []
  for (const [field, pts] of fields) {
    if (pts.length < 2) continue
    const vals = pts.map((p) => p.v)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length)
    const half = Math.floor(vals.length / 2)
    const first = vals.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(half, 1)
    const last = vals.slice(half).reduce((a, b) => a + b, 0) / Math.max(vals.length - half, 1)
    const delta = std ? (last - first) / std : 0
    out.push({
      field,
      count: vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      mean,
      std,
      latest: vals[vals.length - 1],
      trend: delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat',
      anomalies: detectAnomalies && std > 0
        ? pts.map((p, index) => ({ index, value: p.v, at: p.at, z: (p.v - mean) / std })).filter((a) => Math.abs(a.z) > 3).slice(-10)
        : [],
    })
  }
  return out
}

/** Is this value unusual compared with earlier values? */
export function isAnomaly(history: number[], value: number) {
  if (history.length < 10) return false
  const mean = history.reduce((a, b) => a + b, 0) / history.length
  const std = Math.sqrt(history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length)
  return std > 0 && Math.abs((value - mean) / std) > 3
}

export function summaryText(name: string, stats: FieldStats[]) {
  return `Data source "${name}":\n` + stats.map((s) =>
    `- ${s.field}: ${s.count} values, latest ${s.latest}, average ${s.mean.toFixed(2)}, min ${s.min}, max ${s.max}, trend ${s.trend}` +
    (s.anomalies.length ? `, ${s.anomalies.length} unusual values` : ''),
  ).join('\n')
}
