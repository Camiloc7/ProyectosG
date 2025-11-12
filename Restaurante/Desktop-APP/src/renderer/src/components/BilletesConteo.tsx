import React, { useState } from 'react'

interface MoneyInputProps {
  initialCounts?: Record<number, number>
  onChange?: (counts: Record<number, number>, total: number) => void
  styles?: {
    grid?: React.CSSProperties
    cell?: React.CSSProperties
    input?: React.CSSProperties
  }
}

const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50]

export default function MoneyInput({ initialCounts = {}, onChange, styles = {} }: MoneyInputProps) {
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts)

  const defaultStyles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: 16,
      marginBottom: 20,
      marginTop: 20,
      ...styles.grid
    },
    cell: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center' as const,
      ...styles.cell
    },
    input: {
      width: '60px',
      padding: 8,
      border: '1px solid #ccc',
      borderRadius: 4,
      textAlign: 'right' as const,
      ...styles.input
    }
  }

  const handleCountChange = (denom: number, value: string) => {
    const num = Math.max(0, Math.floor(Number(value) || 0))
    const newCounts = { ...counts, [denom]: num }
    setCounts(newCounts)
    if (onChange) {
      const total = DENOMINATIONS.reduce((sum, d) => sum + (newCounts[d] || 0) * d, 0)
      onChange(newCounts, total)
    }
  }

  const total = DENOMINATIONS.reduce((sum, d) => sum + (counts[d] || 0) * d, 0)

  return (
    <div>
      <div style={defaultStyles.grid}>
        {DENOMINATIONS.map((denom) => (
          <div key={denom} style={defaultStyles.cell}>
            <div>{denom.toLocaleString()}</div>
            <input
              type="number"
              min={0}
              style={defaultStyles.input}
              value={counts[denom] || ''}
              onChange={(e) => handleCountChange(denom, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1>Total: {total.toLocaleString()}</h1>
      </div>
    </div>
  )
}
