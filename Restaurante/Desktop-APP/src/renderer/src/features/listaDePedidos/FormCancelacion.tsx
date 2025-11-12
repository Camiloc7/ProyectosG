'use client'
import InputField from '../../components/InputField'
import OrangeButton from '../../components/OrangeButton'
import { ArrowLeft } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

export type FormCancelacion = {
  razon: string
}

interface ModalFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: string) => void | Promise<void>
}

interface Errors {
  razon: boolean
}

const FormCancelacion: React.FC<ModalFormProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormCancelacion>({
    razon: ''
  })
  const [errors, setErrors] = useState<Errors>({
    razon: false
  })

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Errors = {
      razon: formData.razon === ''
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Por favor completa el campo.')
      return
    }

    onSave(formData.razon)
    handleVolverAtras() //Reseteamos el form
  }

  const handleVolverAtras = () => {
    setFormData({
      razon: ''
    })
    setErrors({
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
            Cancelar Pedido
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <InputField
              label="Razon"
              name="razon"
              placeholder="Ingrese la razon de la cancelacion"
              value={formData.razon}
              onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
              error={errors.razon}
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
            <OrangeButton label="Volver Atras" variacion="claro" onClick={handleVolverAtras} />
            <OrangeButton type="submit" label="Cancelar Pedido" />
          </footer>
        </form>
      </div>
    </div>
  )
}

export default FormCancelacion