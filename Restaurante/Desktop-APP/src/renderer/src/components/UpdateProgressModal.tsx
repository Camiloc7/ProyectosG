import React from 'react'

export default function UpdateProgressModal({ progress }: { progress: number }) {
  const roundedProgress = Math.min(Math.round(progress), 100)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '32px 24px',
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        {/* Título con animación sutil */}
        <h2 style={{ marginBottom: 12, fontSize: '1.25rem', fontWeight: 600 }}>
          {roundedProgress < 100 ? 'Descargando actualización...' : '¡Actualización completa!'}
        </h2>

        {/* Barra de progreso accesible */}
        <div
          role="progressbar"
          aria-valuenow={roundedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            width: '100%',
            height: 18,
            background: '#f1f1f1',
            borderRadius: 9,
            overflow: 'hidden',
            marginBottom: 12
          }}
        >
          <div
            style={{
              width: `${roundedProgress}%`,
              height: '100%',
              background:
                roundedProgress < 100
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #3b82f6, #2563eb)',
              transition: 'width 0.4s ease-in-out'
            }}
          />
        </div>

        {/* Porcentaje */}
        <div
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: 8,
            color: roundedProgress < 100 ? '#22c55e' : '#2563eb'
          }}
        >
          {roundedProgress}%
        </div>

        {/* Microcopy dinámico */}
        <p style={{ marginTop: 8, fontSize: '0.9rem', color: '#666' }}>
          {roundedProgress < 100
            ? 'Estamos preparando todo para ti 🚀. No cierres la aplicación.'
            : 'Finalizando la instalación...'}
        </p>
      </div>
    </div>
  )
}
