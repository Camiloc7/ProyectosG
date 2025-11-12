import { useState } from 'react'
import Modal from '@/components/modals/Modal'
import Spinner from '@/components/feedback/Spinner'
import BotonRestaurante from '@/components/ui/Boton'
import { ORANGE } from '@/styles/colors'
import { IProductoConfigurableCompleto } from '@/stores/productosStore'

interface PedidoItem {
  id: string
  nombre: string
  precio: number
  cantidad: number
  nota?: string
  categoria?: string
  tipo?: 'simple' | 'configurable'
  opcionesSeleccionadas?: { nombreOpcion: string; valor: string; precio: number }[]
}

interface ModalConfigurableProps {
  producto: IProductoConfigurableCompleto | null
  onClose: () => void
  onAdd: (item: PedidoItem) => void
  loading?: boolean
}

const ModalConfigurable = ({ producto, onClose, onAdd, loading }: ModalConfigurableProps) => {
  if (loading || !producto) {
    return (
      <Modal onClose={onClose} isOpen={true} title="Cargando...">
        <div className="p-6 flex justify-center items-center">
          <Spinner />
        </div>
      </Modal>
    )
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {}
    producto.opciones.forEach((opcion) => {
      initialState[opcion.id] = opcion.es_multiple ? [] : null
    })
    return initialState
  })

  const handleOptionChange = (optionId: string, valor: any) => {
    const opcion = producto.opciones.find((opt) => opt.id === optionId)
    if (!opcion) return

    if (opcion.es_multiple) {
      setSelectedOptions((prev) => {
        const currentValues = prev[optionId] || []
        const isSelected = currentValues.some((v: any) => v.id === valor.id)
        const newValues = isSelected ? currentValues.filter((v: any) => v.id !== valor.id) : [...currentValues, valor]
        return {
          ...prev,
          [opcion.id]: newValues,
        }
      })
    } else {
      setSelectedOptions((prev) => ({
        ...prev,
        [opcion.id]: valor,
      }))
    }
  }

  const calculatePrice = () => {
    let finalPrice = Number(producto.precio_base)
    Object.values(selectedOptions).forEach((optionValue: any) => {
      if (Array.isArray(optionValue)) {
        optionValue.forEach((v: any) => (finalPrice += Number(v.precios?.[0]?.precio || 0)))
      } else if (optionValue) {
        finalPrice += Number(optionValue.precios?.[0]?.precio || 0)
      }
    })
    return finalPrice
  }

  const handleAddToOrder = () => {
    const finalPrice = calculatePrice()
    const opcionesSeleccionadas = Object.values(selectedOptions).flatMap((optionValue: any) => {
      if (Array.isArray(optionValue)) {
        return optionValue.map((v: any) => ({
          nombreOpcion: v.configuracion_opcion_id,
          valor: v.nombre,
          precio: Number(v.precios?.[0]?.precio || 0),
        }))
      } else if (optionValue) {
        return [
          {
            nombreOpcion: optionValue.configuracion_opcion_id,
            valor: optionValue.nombre,
            precio: Number(optionValue.precios?.[0]?.precio || 0),
          },
        ]
      }
      return []
    })
    const newPedidoItem: PedidoItem = {
      id: producto.id,
      nombre: producto.nombre,
      precio: finalPrice,
      cantidad: 1,
      tipo: 'configurable',
      opcionesSeleccionadas,
    }
    onAdd(newPedidoItem)
    onClose()
  }

  return (
    <Modal onClose={onClose} isOpen={true} title={`Configurar ${producto.nombre}`}>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">Configurar {producto.nombre}</h2>
        <hr className="border-b border-gray-200 mb-4" />
        <div className="px-2">
          <h3 className="text-gray-600 mb-4">Precio base: ${Number(producto.precio_base).toFixed(2)}</h3>
          {producto.opciones.map((opcion) => (
            <div key={opcion.id} className="mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-2">{opcion.nombre}</h4>
              {opcion.es_multiple ? (
                <div className="flex flex-col gap-2">
                  {opcion.valores.map((valor: any) => (
                    <div key={valor.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={valor.id}
                        checked={selectedOptions[opcion.id]?.some((v: any) => v.id === valor.id) || false}
                        onChange={() => handleOptionChange(opcion.id, valor)}
                        className="form-checkbox h-5 w-5 text-orange-500 rounded-md transition-colors duration-200"
                        style={{ borderColor: ORANGE }}
                      />
                      <label htmlFor={valor.id} className="text-gray-700">
                        {valor.nombre} (+${Number(valor.precios?.[0]?.precio || 0).toFixed(2)})
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {opcion.valores.map((valor: any) => (
                    <div key={valor.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={opcion.id}
                        id={`${opcion.id}-${valor.id}`}
                        checked={selectedOptions[opcion.id]?.id === valor.id}
                        onChange={() => handleOptionChange(opcion.id, valor)}
                        className="form-radio h-5 w-5 text-orange-500 rounded-full transition-colors duration-200"
                        style={{ borderColor: ORANGE }}
                      />
                      <label htmlFor={`${opcion.id}-${valor.id}`} className="text-gray-700">
                        {valor.nombre} (+${Number(valor.precios?.[0]?.precio || 0).toFixed(2)})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <BotonRestaurante onClick={handleAddToOrder} label={`Agregar al pedido ($${calculatePrice().toFixed(2)})`} />
        </div>
      </div>
    </Modal>
  )
}

export default ModalConfigurable
