import { COLOR_INPUT_BG, ORANGE } from '../styles/colors'
import React, { useEffect } from 'react'

interface InputFieldProps {
  label: string
  name?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: boolean
  max?: number
  min?: number
  readOnly?: boolean
  disabled?: boolean
  type?: HTMLInputElement['type']
  icon?: React.ElementType // 👈 nuevo: componente de icono (ej: Phone, User, MapPin)
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Ingrese los datos',
  error = false,
  readOnly = false,
  max = undefined,
  disabled = false,
  min = undefined,
  type = 'text',
  icon: Icon
}) => {
  // Bloquear scroll en input tipo number
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const active = document.activeElement as HTMLInputElement | null
      if (active && active.type === 'number' && !event.shiftKey) {
        event.preventDefault()
        active.blur()
      }
    }
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      document.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div style={{ width: '100%', marginBottom: 15 }}>
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
        <span
          style={{
            color: ORANGE,
            marginLeft: 6,
            visibility: error ? 'visible' : 'hidden'
          }}
        >
          *
        </span>
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${readOnly ? '#A0AEC0' : error ? '#f56565' : ORANGE}`,
          borderRadius: 25,
          backgroundColor: readOnly ? '#EDF2F7' : COLOR_INPUT_BG,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          padding: '0 12px',
          height: 42
        }}
      >
        {Icon && (
          <Icon
            size={18}
            color={readOnly ? '#A0AEC0' : error ? '#f56565' : '#555'}
            style={{ marginRight: 8, flexShrink: 0 }}
          />
        )}

        <input
          type={type}
          name={name}
          placeholder={readOnly ? '' : placeholder}
          value={value}
          disabled={disabled}
          onChange={readOnly ? undefined : onChange}
          max={type === 'number' ? max : undefined}
          min={type === 'number' ? min : undefined}
          maxLength={type !== 'number' ? max : undefined}
          minLength={type !== 'number' ? min : undefined}
          readOnly={readOnly}
          onKeyDown={(e) => {
            if (type === 'number' && ['e', 'E', '+', '-', '.'].includes(e.key)) {
              e.preventDefault()
            }
          }}
          style={{
            flex: 1,
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 14,
            fontFamily: 'Lato, sans-serif',
            color: readOnly ? '#A0AEC0' : '#2A2A2A',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {error && (
        <p
          style={{
            color: '#f56565',
            fontSize: 12,
            marginTop: 4,
            fontFamily: 'Lato, sans-serif'
          }}
        >
          El campo es obligatorio.
        </p>
      )}
    </div>
  )
}

export default InputField
