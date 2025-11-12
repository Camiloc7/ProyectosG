import { useState, useEffect } from 'react'

const CajaStatus = ({ cajaActiva }: { cajaActiva: any }) => {
  const [isWide, setIsWide] = useState<boolean>(true)

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth >= 1400)
    }

    handleResize() // inicial
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isWide) return null // no renderiza si pantalla < 1100px

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: cajaActiva ? '#22c55e' : '#ef4444'
      }}
    >
      {cajaActiva ? 'Caja Abierta' : 'Caja Cerrada'}
    </div>
  )
}

export default CajaStatus
