import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { create } from 'zustand'

export type IDenominacionesEfectivo = {
  '100': number
  '200': number
  '500': number
  '1000': number
  '2000': number
  '5000': number
  '10000': number
  '20000': number
  '50000': number
  '100000': number
}

export type IFormPagoCuenta = {
  pedido_id: string
  numero_documento: string
  nombre_completo: string
  correo_electronico: string
  tipo_documento: string
  direccion?: string
  telefono?: string
  DV?: string
  descuentos: number
  propina: number
  notas: string
  monto_pagado: number
  es_efectivo: boolean
  cuenta_id?: string
  denominaciones_efectivo?: IDenominacionesEfectivo
}

export interface FacturaEntity {
  id: string
  establecimiento_id: string
  usuario_cajero_id: string
  tipo_factura: 'TOTAL' | 'PARCIAL'
  subtotal: string
  impuestos: string
  descuentos: string
  propina: string
  total_factura: string
  sales_code: string
  estado_envio_api: string
  pdf_factura_data?: string | null
  error_envio_api?: string | null
  notas?: string | null
  fecha_hora_factura: string
  created_at: string
  updated_at: string
  cierre_caja_id?: string | null
}

type UseFacturasStore = {
  facturas: FacturaEntity[]
  loading: boolean
  error: string | null
  pagarPedido: (payload: unknown) => Promise<FacturaEntity | null>
  getFacturaPdf: (facturaId: string) => Promise<Blob | null>
  imprimirComanda: (facturaId: string) => Promise<Blob | null>
}
export const useFacturasStore = create<UseFacturasStore>((set) => ({
  facturas: [],
  loading: false,
  error: null,

  pagarPedido: async (data) => {
    const token = await getTokenFromStore()
    set({ loading: true, error: null })

    console.warn('Payload enviado al backend: ', data)

    try {
      const res = await fetch(`${RUTA}/facturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()
      if (!res.ok) {
        throw new Error(responseData.message || 'Error al pagar el pedido')
      }

      // La clave del cambio está aquí:
      // Ahora accedemos a la propiedad `data` para obtener la factura real
      const factura: FacturaEntity = responseData.data

      if (!factura || !factura.id) {
        throw new Error('La respuesta del servidor no contiene un objeto de factura válido con ID.')
      }

      set((state) => ({
        facturas: [...state.facturas, factura],
        loading: false
      }))
      toast.success('Pedido pagado y factura creada con éxito.')
      return factura
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al pagar el pedido.'
      set({ error: message, loading: false })
      toast.error(message)
      console.error(message)
      return null
    }
  },

  getFacturaPdf: async (facturaId) => {
    set({ loading: true, error: null })
    try {
      const token = await getTokenFromStore()
      const response = await fetch(`${RUTA}/facturas/${facturaId}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      } // La corrección está aquí: Obtenemos la respuesta como un Blob directamente

      const pdfBlob = await response.blob()
      if (!pdfBlob) {
        throw new Error('La respuesta del servidor no contiene un archivo PDF válido.')
      }

      set({ loading: false })
      toast.success('PDF obtenido con éxito.')
      return pdfBlob
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al obtener el PDF.'
      set({ error: message, loading: false })
      toast.error(message)
      console.error(message)
      return null
    }
  },

  imprimirComanda: async (pedidoID) => {
    set({ loading: true, error: null })
    try {
      const token = await getTokenFromStore()
      const response = await fetch(`${RUTA}/impresoras/comanda/${pedidoID}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      } // La corrección está aquí: Obtenemos la respuesta como un Blob directamente

      const pdfBlob = await response.blob()
      if (!pdfBlob) {
        throw new Error('La respuesta del servidor no contiene un archivo PDF válido.')
      }

      set({ loading: false })
      toast.success('PDF obtenido con éxito.')
      return pdfBlob
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al obtener el PDF.'
      set({ error: message, loading: false })
      toast.error(message)
      console.error(message)
      return null
    }
  }
}))
