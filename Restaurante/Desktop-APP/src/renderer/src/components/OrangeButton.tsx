// OrangeButton.tsx
import { FONDO, COLOR_ERROR } from '../../src/styles/colors'
import React from 'react'

export const ORANGE = '#FF6600'
export const GREEN = '#28a745' // ✅ Verde base

const baseStyle: React.CSSProperties = {
  height: 40,
  minWidth: 80,
  padding: '8px 16px',
  fontWeight: 500,
  borderRadius: 25,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
}

interface OrangeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variacion?: 'default' | 'claro' | 'peligro' | 'verde' // ✅ nueva opción
}

const OrangeButton: React.FC<OrangeButtonProps> = ({ label, variacion = 'default', ...props }) => {
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(variacion === 'claro'
      ? {
          backgroundColor: FONDO,
          color: ORANGE,
          border: `1px solid ${ORANGE}`
        }
      : variacion === 'peligro'
        ? {
            backgroundColor: COLOR_ERROR,
            color: '#ffffff',
            border: 'none'
          }
        : variacion === 'verde'
          ? {
              backgroundColor: GREEN,
              color: '#ffffff',
              border: 'none'
            }
          : {
              backgroundColor: ORANGE,
              color: '#ffffff',
              border: 'none'
            })
  }

  return (
    <button style={style} {...props}>
      {label}
    </button>
  )
}

export default OrangeButton
