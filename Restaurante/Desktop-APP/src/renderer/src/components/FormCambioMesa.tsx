'use client'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SelectConSearch from './SelectConSearch'
import { useMesasStore } from '../store/mesasStore'
import OrangeButton from './OrangeButton'
import { useNavigate } from 'react-router-dom'

export type FormCambioMesa = {
  newMesaId: string
}

interface ModalFormProps {
  isOpen: boolean
  pedidoId: string
  onClose: () => void
}

interface Errors {
  newMesaId: boolean
}

const FormCambioMesa: React.FC<ModalFormProps> = ({ isOpen, onClose, pedidoId }) => {
  const navigate = useNavigate()

  const { traerMesas, mesas, transferirPedidoDeMesa } = useMesasStore()

  const [formData, setFormData] = useState<FormCambioMesa>({
    newMesaId: ''
  })
  const [errors, setErrors] = useState<Errors>({
    newMesaId: false
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
      newMesaId: formData.newMesaId === ''
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Por favor completa el campo.')
      return
    }
    const respuesta = await transferirPedidoDeMesa(formData.newMesaId, pedidoId)
    if (!respuesta) return

    handleVolverAtras() //Reseteamos el form
    navigate('/pedidos')
  }

  const handleVolverAtras = () => {
    setFormData({
      newMesaId: ''
    })
    setErrors({
      newMesaId: false
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
          minHeight: '40vh',
          maxHeight: '120vh',
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
            Transferir el pedido a la mesa:
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            {mesas.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h1 style={{ fontSize: 18, color: '#B91C1C', margin: 0 }}>
                  No hay mesas disponibles
                </h1>
                <button
                  onClick={() => {
                    toast.success('Recargando..')
                    traerMesas()
                  }}
                  style={{
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCcw size={16} />
                  Recargar
                </button>
              </div>
            ) : (
              <SelectConSearch
                label="Mesa"
                options={mesas}
                value={formData.newMesaId}
                onChange={(value: string) => setFormData((prev) => ({ ...prev, newMesaId: value }))}
                error={errors.newMesaId}
              />
            )}
          </div>

          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24,
              marginBottom: 42
            }}
          >
            <OrangeButton label="Volver Atras" variacion="claro" onClick={handleVolverAtras} />
            <OrangeButton type="submit" label="Actualizar la mesa" />
          </footer>
        </form>
      </div>
    </div>
  )
}

export default FormCambioMesa
