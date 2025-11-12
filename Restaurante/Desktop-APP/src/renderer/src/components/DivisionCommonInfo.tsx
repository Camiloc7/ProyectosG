// src/features/pagar/DivisionCommonInfo.tsx
import React, { useEffect, useState } from 'react'
import InputField from '../components/InputField'
import SimpleSelect from '../components/SimpleSelect'
import Checkbox from '../components/CheckBox'
import { Division, DivisionErrors } from '../features/pagar/DivisionCards'
import { useClienteStore } from '../store/clienteStore'

export interface DivisionCommonInfoProps {
  division: Division
  disabled?: boolean
  errors: DivisionErrors
  onUpdate: (upd: Partial<Division>) => void
}

export const DivisionCommonInfo: React.FC<DivisionCommonInfoProps> = ({
  division,
  errors,
  disabled = false,
  onUpdate
}) => {
  const { traerTiposDeDocumento, tiposDocumentos } = useClienteStore()
  const [clienteGenericoChecked, setClienteGenericoChecked] = useState(false)
  const [consumidorFinalChecked, setConsumidorFinalChecked] = useState(false)

  useEffect(() => {
    traerTiposDeDocumento()
  }, [])

  const { cedula = '', name = '', docType = '', correo = '', electronica = false } = division

  const handleClienteGenericoChange = (checked: boolean) => {
    setClienteGenericoChecked(checked)
    if (checked) {
      setConsumidorFinalChecked(false)
      onUpdate({
        cedula: '111111111111',
        docType: 'Cédula de ciudadanía',
        name: 'Cliente Genérico',
        correo: 'pruebas@ejemplo.com'
      })
    } else {
      onUpdate({
        cedula: '',
        docType: '',
        name: '',
        correo: ''
      })
    }
  }

  const handleConsumidorFinalChange = (checked: boolean) => {
    setConsumidorFinalChecked(checked)
    if (checked) {
      setClienteGenericoChecked(false)
      onUpdate({
        cedula: '222222222222',
        docType: 'Cédula de ciudadanía',
        name: 'Consumidor Final',
        correo: 'no_aplica@ejemplo.com'
      })
    } else {
      onUpdate({
        cedula: '',
        docType: '',
        name: '',
        correo: ''
      })
    }
  }
  return (
    <>
      <div
        style={{
          marginTop: 10,
          marginBottom: 10,
          display: 'flex',
          flexDirection: 'column', // apila los checkboxes
          gap: 8 // espacio entre ellos
        }}
      >
        <Checkbox
          label="Cliente Genérico"
          disabled={disabled}
          checked={clienteGenericoChecked}
          onChange={handleClienteGenericoChange}
        />
        <Checkbox
          label="Consumidor Final"
          disabled={disabled}
          checked={consumidorFinalChecked}
          onChange={handleConsumidorFinalChange}
        />
      </div>

      <InputField
        label="Numero de documento"
        name="cedula"
        type="number"
        disabled={disabled}
        value={cedula}
        onChange={(e) => onUpdate({ cedula: e.target.value })}
        placeholder="Ingrese la cédula"
        error={errors.cedula}
      />
      <SimpleSelect
        label="Tipo De Documento"
        options={tiposDocumentos}
        placeholder="Seleccione una opción"
        width="100%"
        value={docType}
        onChange={(val) => onUpdate({ docType: val })}
        error={errors.docType}
        disabled={clienteGenericoChecked || consumidorFinalChecked || disabled}
      />

      <InputField
        label="Nombre"
        name="name"
        disabled={disabled}
        value={name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Ingrese el Nombre"
        error={errors.name}
      />

      <InputField
        label="Correo"
        name="correo"
        disabled={disabled}
        value={correo}
        onChange={(e) => onUpdate({ correo: e.target.value })}
        placeholder="Ingrese el correo"
        error={errors.correo}
      />

      <Checkbox
        label="Factura Electrónica"
        disabled={disabled}
        checked={electronica}
        onChange={(checked) => onUpdate({ electronica: checked })}
      />
    </>
  )
}
