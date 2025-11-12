'use client'
import InputField from '../../components/InputField'
import OrangeButton from '../../components/OrangeButton'
import { ArrowLeft } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import MoneyInput from '../../components/BilletesConteo'
import { useCajaStore } from '../../store/cajaStore'
import Spinner from '../../components/feedback/Spinner'
import { usePedidosStore } from '../../store/pedidosStore'

export type IFormCierreCaja = {
  saldoFinal: number
  observaciones: string
}

interface ModalFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (blob: Blob | null) => void
}

const FormCierreCaja: React.FC<ModalFormProps> = ({ isOpen, onClose, onSave }) => {
  const { cierreDeCaja, loading, generarTicketZ, cajaActiva } = useCajaStore()
  const { pedidos } = usePedidosStore()
  const [saldoInicial, setSaldoInicial] = useState<number>(0)
  const [loadingCierre, setLoadingCierre] = useState<boolean>(false)

  const [denominaciones, setDenominaciones] = useState<any>(0)
  const [formData, setFormData] = useState<IFormCierreCaja>({
    saldoFinal: 0,
    observaciones: ''
  })

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pedidos.length > 0) {
      toast.error('No se puede cerrar la caja con pedidos pendientes')
      return
    }
    if (saldoInicial <= 0) {
      toast.error('El Saldo final no puede ser 0')
      setLoadingCierre(false)
      return
    }
    const formattedData = {
      denominaciones_cierre: denominaciones,
      observaciones: formData.observaciones
    }
    const response = await cierreDeCaja(formattedData)
    if (!response) return
    const responseZ = await generarTicketZ(cajaActiva?.id || '')
    handleVolverAtras() //Reseteamos el form
    onSave(responseZ)
  }

  const handleVolverAtras = () => {
    setFormData({
      observaciones: '',
      saldoFinal: 0
    })
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
            Cierre de caja
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <MoneyInput onChange={handleMoneyChange} />

            <InputField
              label="Observaciones"
              name="observaciones"
              placeholder="Ingrese las observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

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
        {loadingCierre && <Spinner />}
        {loading && <Spinner />}
      </div>
    </div>
  )
}

export default FormCierreCaja
