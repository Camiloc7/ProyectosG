import React from 'react'
import { Clock } from 'lucide-react'
import { ORANGE } from '../styles/colors'

interface TimePickerProps {
  /**
   * Label displayed above the time input
   */
  label: string
  /**
   * Current selected time as a Date object (date portion is ignored)
   */
  value: Date | null
  /**
   * Callback receiving updated Date when time changes
   */
  onChange: (date: Date) => void
  /**
   * Display error state styling
   */
  error?: boolean
}

export default function TimePicker({ label, value, onChange, error }: TimePickerProps) {
  // Format date to HH:MM (24h) string
  const timeValue = value
    ? value.toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit' })
    : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hour, minute] = e.target.value.split(':').map(Number)
    const newDate = value ? new Date(value) : new Date()
    newDate.setHours(hour, minute, 0, 0)
    onChange(newDate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        style={{
          display: 'block',
          fontSize: 16,
          fontWeight: 500,
          fontFamily: 'Lato, sans-serif',
          color: '#555',
          marginBottom: 8
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${error ? '#e00' : ORANGE}`,
          borderRadius: 8,
          padding: '8px 12px',
          transition: 'border-color 0.2s ease'
        }}
      >
        <Clock size={20} stroke={error ? '#e00' : ORANGE} />
        <input
          type="time"
          value={timeValue}
          onChange={handleChange}
          style={{
            flex: 1,
            border: 'none',
            borderColor: ORANGE,
            outline: 'none',
            marginLeft: 8,
            color: '#333',
            backgroundColor: 'transparent',
            fontSize: 14,
            fontFamily: 'Lato, sans-serif'
          }}
        />
      </div>
    </div>
  )
}
