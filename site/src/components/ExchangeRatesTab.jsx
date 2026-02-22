import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import styles from './ExchangeRatesTab.module.css'

const FRANKFURTER_BASE = 'https://api.frankfurter.app'
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const POLL_MS = 5 * 60 * 1000 // 5 minutes to avoid rate limits and reduce load

function useCadUsdSeries(days = 30, refreshTick) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFirst = useRef(true)

  useEffect(() => {
    let cancelled = false
    if (isFirst.current) {
      setLoading(true)
      setError(null)
    }
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)
    const url = `${FRANKFURTER_BASE}/${startStr}..${endStr}?from=CAD&to=USD`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('CAD/USD fetch failed')
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        try {
          const rates = json && typeof json.rates === 'object' ? json.rates : {}
          const series = Object.entries(rates)
            .filter(([, cur]) => cur != null && typeof cur.USD === 'number')
            .map(([date, cur]) => ({
              date,
              time: new Date(date).getTime(),
              rate: cur.USD,
              label: `1 CAD = ${Number(cur.USD).toFixed(4)} USD`,
            }))
          series.sort((a, b) => a.time - b.time)
          setData(series)
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Invalid response')
        }
      })
      .catch((err) => !cancelled && setError(err?.message ?? 'Fetch failed'))
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          isFirst.current = false
        }
      })

    return () => { cancelled = true }
  }, [days, refreshTick])

  return { data, loading, error }
}

function useXrpCadSeries(days = 7, refreshTick) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFirst = useRef(true)

  useEffect(() => {
    let cancelled = false
    if (isFirst.current) {
      setLoading(true)
      setError(null)
    }

    // Fetch slightly more CAD data than requested to ensure we have a 
    // "Friday" fallback for a "Monday" start date.
    const start = new Date()
    start.setDate(start.getDate() - (days + 3)) 
    const startStr = start.toISOString().slice(0, 10)
    
    const cadPromise = fetch(`${FRANKFURTER_BASE}/${startStr}..?from=CAD&to=USD`)
      .then(r => { if (!r.ok) throw new Error('CAD fetch failed'); return r.json() })
    const xrpPromise = fetch(`${COINGECKO_BASE}/coins/ripple/market_chart?vs_currency=usd&days=${days}`)
      .then(r => { if (!r.ok) throw new Error('XRP fetch failed'); return r.json() })

    Promise.all([cadPromise, xrpPromise])
      .then(([cadRes, xrpRes]) => {
        if (cancelled) return
        try {
          const cadRates = cadRes && typeof cadRes.rates === 'object' ? cadRes.rates : {}
          const sortedCadDates = Object.keys(cadRates).sort()
          const rawPrices = Array.isArray(xrpRes?.prices) ? xrpRes.prices : []
          const prices = rawPrices.filter((item) => Array.isArray(item) && item.length >= 2)

          // Frankfurter returns rates as { "date": { USD: number } } – normalize to number
          const getCadUsdNumber = (dateKey) => {
            const val = cadRates[dateKey]
            if (val == null) return null
            const num = typeof val === 'number' ? val : (val && val.USD)
            return typeof num === 'number' && num > 0 ? num : null
          }

          const series = prices.map(([time, usdPrice]) => {
            const t = Number(time)
            const price = Number(usdPrice)
            if (!Number.isFinite(t) || !Number.isFinite(price)) return { time: 0, xrpCad: null, label: 'N/A' }
            const dateStr = new Date(t).toISOString().slice(0, 10)
            let cadUsdNum = getCadUsdNumber(dateStr)
            if (cadUsdNum == null) {
              const previousDates = sortedCadDates.filter(d => d < dateStr)
              const fallbackDate = previousDates[previousDates.length - 1]
              cadUsdNum = getCadUsdNumber(fallbackDate)
            }
            const xrpCad = cadUsdNum != null ? price / cadUsdNum : null
            return {
              time: t,
              xrpCad,
              label: xrpCad != null ? `1 XRP = ${xrpCad.toFixed(4)} CAD` : 'N/A'
            }
          }).filter(item => item.xrpCad != null && Number.isFinite(item.xrpCad))

          setData(series)
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Invalid response')
        }
      })
      .catch((err) => !cancelled && setError(err?.message ?? 'Fetch failed'))
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          isFirst.current = false
        }
      })

    return () => { cancelled = true }
  }, [days, refreshTick])

  return { data, loading, error }
}

function ChartCard({ title, subtitle, data, dataKey, xDataKey = 'date', loading, error, valueFormatter }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  if (error) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.error}>{error}</p>
      </section>
    )
  }
  if (loading && !data.length) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.loading}>Loading…</p>
      </section>
    )
  }
  if (!data.length) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <p className={styles.loading}>No data available.</p>
      </section>
    )
  }
  if (!mounted) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.chartWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className={styles.loading}>Loading chart…</p>
        </div>
      </section>
    )
  }
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={220} minWidth={280} minHeight={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey={xDataKey}
              stroke="var(--text-muted)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => {
                try {
                  const d = new Date(v)
                  const m = d.getMonth()
                  const day = d.getDate()
                  if (Number.isNaN(m) || Number.isNaN(day)) return '–'
                  return `${m + 1}/${day}`
                } catch {
                  return '–'
                }
              }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => {
                try {
                  return v != null && !Number.isNaN(Number(v)) ? valueFormatter(v) : '–'
                } catch {
                  return '–'
                }
              }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
              labelStyle={{ color: 'var(--text)' }}
              formatter={(value) => {
                try {
                  const v = value != null && !Number.isNaN(Number(value)) ? valueFormatter(value) : '–'
                  return [String(v), '']
                } catch {
                  return ['–', '']
                }
              }}
              labelFormatter={(label) => {
                try {
                  if (label == null) return '–'
                  const d = new Date(label)
                  return Number.isNaN(d.getTime()) ? '–' : d.toLocaleString()
                } catch {
                  return '–'
                }
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default function ExchangeRatesTab() {
  const [refreshTick, setRefreshTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setRefreshTick((n) => n + 1), POLL_MS)
    return () => clearInterval(t)
  }, [])

  const cadUsd = useCadUsdSeries(30, refreshTick)
  const xrpCad = useXrpCadSeries(7, refreshTick)

  return (
    <div className={styles.wrapper}>
      <ChartCard
        title="CAD → USD"
        subtitle="1 Canadian dollar in US dollars (last 30 days)"
        data={cadUsd.data}
        dataKey="rate"
        loading={cadUsd.loading}
        error={cadUsd.error}
        valueFormatter={(v) => Number(v).toFixed(4)}
      />
      <ChartCard
        title="XRP → CAD"
        subtitle="1 XRP in Canadian dollars (last 7 days)"
        data={xrpCad.data}
        dataKey="xrpCad"
        xDataKey="time"
        loading={xrpCad.loading}
        error={xrpCad.error}
        valueFormatter={(v) => Number(v).toFixed(4)}
      />
    </div>
  )
}
