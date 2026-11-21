'use client'

import React, { useState } from 'react'

const EMISSION_FACTORS: Record<string, Record<string, number>> = {
  India:         { Transportation: 0.14, Electricity: 0.82, Diet: 1.25, Waste: 0.10 },
  'United States': { Transportation: 0.25, Electricity: 0.45, Diet: 2.50, Waste: 0.20 },
  Germany:       { Transportation: 0.18, Electricity: 0.38, Diet: 2.00, Waste: 0.15 },
  Brazil:        { Transportation: 0.13, Electricity: 0.10, Diet: 1.80, Waste: 0.12 },
  China:         { Transportation: 0.21, Electricity: 0.65, Diet: 2.20, Waste: 0.18 },
  Australia:     { Transportation: 0.24, Electricity: 0.70, Diet: 2.10, Waste: 0.19 },
  Canada:        { Transportation: 0.26, Electricity: 0.50, Diet: 2.30, Waste: 0.16 },
  UK:            { Transportation: 0.19, Electricity: 0.33, Diet: 2.00, Waste: 0.14 },
  France:        { Transportation: 0.17, Electricity: 0.10, Diet: 1.90, Waste: 0.13 },
  Japan:         { Transportation: 0.20, Electricity: 0.45, Diet: 2.10, Waste: 0.15 },
}

const CO2_AVERAGES: Record<string, number> = {
  India: 1.9, 'United States': 15.0, Germany: 8.4, Brazil: 2.2,
  China: 7.6, Australia: 16.8, Canada: 14.2, UK: 5.2, France: 4.6, Japan: 8.7,
}

const COUNTRIES = Object.keys(EMISSION_FACTORS)

const CHATBOT_QA: Record<string, string> = {
  'What is a carbon footprint?': 'A carbon footprint is the total greenhouse gas emissions caused by an individual, expressed as CO₂ equivalents.',
  'How can I reduce my carbon footprint?': 'Use public transport, reduce meat consumption, conserve energy, recycle, and use renewable energy sources.',
  'Which activity contributes most?': 'Usually transportation and electricity, depending on lifestyle and location.',
  'What are CO₂ equivalents?': 'They standardize the impact of various greenhouse gases (methane, nitrous oxide, etc.) as equivalent CO₂.',
  'Why does diet affect emissions?': 'Animal-based diets, especially red meat, produce significantly higher emissions than plant-based diets.',
  "What's the global average?": 'Approximately 4.7 tonnes per person per year (varies by year and source).',
  'Is recycling effective?': 'Yes — it reduces raw material extraction and manufacturing emissions substantially.',
}

type Results = {
  emissions: Record<string, number>
  total: number
  avg: number
  country: string
}

function RangeInput({
  label, min, max, value, onChange, unit,
}: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="cfc-range-group">
      <div className="cfc-range-header">
        <label className="cfc-range-label">{label}</label>
        <span className="cfc-range-value">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={max > 50 ? 5 : 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cfc-range"
      />
    </div>
  )
}

function EmissionBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = value > max * 0.5 ? '#f87171' : value > max * 0.25 ? '#fbbf24' : '#4ade80'
  return (
    <div className="cfc-bar-row">
      <span className="cfc-bar-label">{label}</span>
      <div className="cfc-bar-track">
        <div className="cfc-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="cfc-bar-amount">{value.toFixed(2)}t</span>
    </div>
  )
}

export function CarbonCalculator() {
  const [country, setCountry] = useState('United States')
  const [distance, setDistance] = useState(20)
  const [electricity, setElectricity] = useState(300)
  const [waste, setWaste] = useState(10)
  const [meals, setMeals] = useState(3)
  const [results, setResults] = useState<Results | null>(null)
  const [question, setQuestion] = useState(Object.keys(CHATBOT_QA)[0])
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)

  function calculate() {
    const f = EMISSION_FACTORS[country]
    const annualDist = distance * 365
    const annualElec = electricity * 12
    const annualWaste = waste * 52
    const annualMeals = meals * 365
    const raw = {
      Transportation: f.Transportation * annualDist,
      Electricity: f.Electricity * annualElec,
      Diet: f.Diet * annualMeals,
      Waste: f.Waste * annualWaste,
    }
    const emissions: Record<string, number> = {}
    Object.keys(raw).forEach((k) => { emissions[k] = parseFloat((raw[k as keyof typeof raw] / 1000).toFixed(2)) })
    const total = parseFloat(Object.values(emissions).reduce((a, b) => a + b, 0).toFixed(2))
    setResults({ emissions, total, avg: CO2_AVERAGES[country], country })
  }

  const maxEmission = results ? Math.max(...Object.values(results.emissions)) : 1

  return (
    <div className="cfc-root">
      {/* Inputs */}
      <div className="cfc-panel">
        <div className="cfc-panel-header">
          <span className="cfc-panel-title">⚙️ Configure Inputs</span>
        </div>
        <div className="cfc-panel-body">
          <div className="cfc-form-group">
            <label className="cfc-label">🌎 Country / Region</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="cfc-select">
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <RangeInput label="🚗 Daily commute" min={0} max={100} value={distance} onChange={setDistance} unit="km/day" />
          <RangeInput label="💡 Electricity usage" min={0} max={1000} value={electricity} onChange={setElectricity} unit="kWh/mo" />
          <RangeInput label="🗑️ Weekly waste" min={0} max={100} value={waste} onChange={setWaste} unit="kg/wk" />
          <div className="cfc-form-group">
            <label className="cfc-label">🍽️ Meals per day</label>
            <div className="cfc-stepper">
              <button className="cfc-step-btn" onClick={() => setMeals((m) => Math.max(0, m - 1))}>−</button>
              <span className="cfc-step-val">{meals}</span>
              <button className="cfc-step-btn" onClick={() => setMeals((m) => Math.min(10, m + 1))}>+</button>
            </div>
          </div>
          <button className="cfc-calc-btn" onClick={calculate}>🧮 Calculate Emissions</button>
        </div>
      </div>

      {/* Results */}
      <div className="cfc-results-col">
        {results ? (
          <>
            {/* Score card */}
            <div className="cfc-score-card">
              <div className="cfc-score-main">
                <span className="cfc-score-number">{results.total}</span>
                <span className="cfc-score-unit">t CO₂/yr</span>
              </div>
              <div className={`cfc-score-verdict ${results.total > results.avg ? 'cfc-score-warn' : 'cfc-score-ok'}`}>
                {results.total > results.avg
                  ? `⚠️ ${(results.total - results.avg).toFixed(1)}t above ${results.country} average`
                  : `✅ ${(results.avg - results.total).toFixed(1)}t below ${results.country} average`}
              </div>
              <div className="cfc-score-avg">Country average: {results.avg}t/yr</div>
            </div>

            {/* Breakdown bars */}
            <div className="cfc-panel">
              <div className="cfc-panel-header"><span className="cfc-panel-title">📊 Emissions Breakdown</span></div>
              <div className="cfc-panel-body">
                {Object.entries(results.emissions).map(([k, v]) => (
                  <EmissionBar key={k} label={k} value={v} max={maxEmission} />
                ))}
              </div>
            </div>

            {/* Comparison heatmap (CSS-based) */}
            <div className="cfc-panel">
              <div className="cfc-panel-header"><span className="cfc-panel-title">🌡️ CO₂ Per Capita by Country</span></div>
              <div className="cfc-panel-body cfc-heatmap">
                {Object.entries(CO2_AVERAGES).map(([c, v]) => {
                  const intensity = v / 17
                  const r = Math.round(255 * intensity)
                  const g = Math.round(150 * (1 - intensity))
                  const bg = `rgb(${r},${g},50)`
                  return (
                    <div key={c} className={`cfc-heat-cell ${c === results.country ? 'cfc-heat-active' : ''}`} style={{ background: bg }}>
                      <span className="cfc-heat-country">{c}</span>
                      <span className="cfc-heat-val">{v}t</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="cfc-empty-state">
            <div className="cfc-empty-icon">🌍</div>
            <p className="cfc-empty-text">Configure your inputs and click <strong>Calculate Emissions</strong> to see your carbon footprint analysis.</p>
          </div>
        )}

        {/* Chatbot */}
        <div className="cfc-panel">
          <div className="cfc-panel-header"><span className="cfc-panel-title">💬 Carbon Q&A</span></div>
          <div className="cfc-panel-body">
            <select value={question} onChange={(e) => setQuestion(e.target.value)} className="cfc-select" style={{ marginBottom: '12px' }}>
              {Object.keys(CHATBOT_QA).map((q) => <option key={q}>{q}</option>)}
            </select>
            <button className="cfc-calc-btn cfc-chat-btn" onClick={() => setChatAnswer(CHATBOT_QA[question])}>
              Ask →
            </button>
            {chatAnswer && (
              <div className="cfc-chat-answer">{chatAnswer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
