'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import InputField from './InputField'
import Checkbox from './CheckBox'
import OrangeButton from './OrangeButton'
import { useCajaStore } from '../store/cajaStore'
import { useDineroExtraStore } from '../store/dineroExtraStore'
import Spinner from './feedback/Spinner'

export type FormExtraMoney = {
  cantidad: string
  razon: string
  tipo: 'Ingresos' | 'Egresos' | ''
}

interface ModalFormProps {
  isOpen: boolean
  onClose: () => void
}

interface Errors {
  cantidad: boolean
  razon: boolean
}

const FormExtraMoney: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const { cajaActiva } = useCajaStore()
  const { ingresoExtra, gastoExtra, loading } = useDineroExtraStore()
  const [formData, setFormData] = useState<FormExtraMoney>({
    cantidad: '',
    razon: '',
    tipo: 'Ingresos'
  })

  const [errors, setErrors] = useState<Errors>({
    cantidad: false,
    razon: false
  })

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Errors = {
      cantidad: formData.cantidad === '',
      razon: formData.razon === ''
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Por favor completa todos los campos.')
      return
    }

    if (!formData.tipo) {
      toast.error('Selecciona Ingresos o Egresos.')
      return
    }

    const formattedData = {
      monto: Number(formData.cantidad),
      descripcion: formData.razon,
      cierre_caja_id: cajaActiva?.id || ''
    }
    if (formData.tipo === 'Ingresos') {
      const response = await ingresoExtra(formattedData)
      if (!response) return
    } else {
      const response = await gastoExtra(formattedData)
      if (!response) return
    }

    handleVolverAtras()
  }
  const handleVolverAtras = () => {
    setFormData({
      cantidad: '',
      razon: '',
      tipo: 'Ingresos'
    })
    setErrors({
      cantidad: false,
      razon: false
    })
    onClose()
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
      onClick={() => onClose()}
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
          <button
            onClick={handleVolverAtras}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={24} color="#4B5563" />
          </button>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#374151',
              margin: 0
            }}
          >
            Ingresos / Egresos Extra de caja
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <InputField
              label="Cantidad"
              name="cantidad"
              placeholder="Ingrese la cantidad de dinero"
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              error={errors.cantidad}
            />
            <InputField
              label="Razon"
              name="razon"
              placeholder="Ingrese la razon"
              value={formData.razon}
              onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
              error={errors.razon}
            />{' '}
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 16
              }}
            >
              <Checkbox
                label="Ingresos"
                onChange={() => setFormData({ ...formData, tipo: 'Ingresos' })}
                checked={formData.tipo === 'Ingresos'}
              />
              <Checkbox
                label="Egresos"
                onChange={() => setFormData({ ...formData, tipo: 'Egresos' })}
                checked={formData.tipo === 'Egresos'}
              />
            </div>
          </div>

          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}
          >
            <OrangeButton label="Volver Atras" variacion="claro" onClick={handleVolverAtras} />
            <OrangeButton type="submit" label="Agregar al registro" />
          </footer>
        </form>
        {loading && <Spinner />}
      </div>
    </div>
  )
}

export default FormExtraMoney
