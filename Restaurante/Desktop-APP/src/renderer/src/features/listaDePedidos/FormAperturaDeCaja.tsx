'use client'
import OrangeButton from '../../components/OrangeButton'
import { ArrowLeft } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import MoneyInput from '../../components/BilletesConteo'
import { useCajaStore } from '../../store/cajaStore'
import Spinner from '../../components/feedback/Spinner'

interface ModalFormProps {
  isOpen: boolean
  onClose: () => void
}

const FormAperturaDeCaja: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const [saldoInicial, setSaldoInicial] = useState<number>(0)
  const [denominaciones, setDenominaciones] = useState<any>(0)

  const { aperturaDeCaja, loading: loadingCaja } = useCajaStore()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saldoInicial <= 0) {
      toast.error('El Saldo inicial no puede ser 0')
      return
    }
    const formattedData = {
      denominaciones_apertura: denominaciones
    }
    await aperturaDeCaja(formattedData)

    handleVolverAtras() //Reseteamos el form
  }

  const handleVolverAtras = () => {
    setSaldoInicial(0)
    onClose()
  }

  const handleMoneyChange = (counts: Record<number, number>, total: number) => {
    setDenominaciones(counts)
    setSaldoInicial(total)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 201
      }}
      onClick={handleVolverAtras}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: 24,
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}
        >
          <button onClick={handleVolverAtras}>
            <ArrowLeft size={24} color="#4B5563" />
          </button>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#374151'
            }}
          >
            Apertura de caja
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <MoneyInput onChange={handleMoneyChange} />
          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}
          >
            <OrangeButton label="Cancelar" variacion="claro" onClick={handleVolverAtras} />
            <OrangeButton type="submit" label="Aceptar" />
          </footer>
        </form>
      </div>
      {loadingCaja && <Spinner />}
    </div>
  )
}

export default FormAperturaDeCaja
