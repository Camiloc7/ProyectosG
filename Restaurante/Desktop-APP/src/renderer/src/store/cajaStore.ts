import { create } from 'zustand'
import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'

export type IDataParaCierreDeCaja = {
  denominaciones_cierre: any
  observaciones: string
}

export type DenominacionData = {
  [key: string]: number
}

export interface CajaData {
  id: string
  establecimiento_id: string
  usuario_cajero_id: string
  fecha_hora_apertura: string
  fecha_hora_cierre: string | null
  saldo_inicial_caja: string
  saldo_final_contado: string
  total_ventas_brutas: string
  total_descuentos: string
  total_impuestos: string
  total_propina: string
  total_neto_ventas: string
  total_pagos_efectivo: string
  total_pagos_tarjeta: string
  total_pagos_otros: string
  total_recaudado: string
  diferencia_caja: string
  cerrado: boolean
  observaciones: string | null
  created_at: string
  updated_at: string
  denominaciones_apertura: DenominacionData
  denominaciones_cierre: DenominacionData | null
}

export type IDataParaAperturaDeCaja = {
  denominaciones_apertura: any
}

type CajaState = {
  loading: boolean
  cambio: number
  cajaActiva: CajaData | null
  cierresDeCaja: CajaData[]

  cierreDeCaja: (data: IDataParaCierreDeCaja) => Promise<boolean>
  aperturaDeCaja: (data: IDataParaAperturaDeCaja) => Promise<boolean>

  traerCajaActiva: () => Promise<void>
  traerCierresDeCaja: (
    establecimientoId?: string,
    usuarioCajeroId?: string,
    fechaInicio?: string,
    fechaFin?: string
  ) => Promise<void>
  traerCierrePorId: (id: string) => Promise<CajaData | null>
  generarTicketZ: (idCaja: string) => Promise<Blob | null>
  generarTicketX: () => Promise<Blob | null>
}

export const useCajaStore = create<CajaState>((set, get) => ({
  loading: false,
  cambio: 0,
  cajaActiva: null,
  cierresDeCaja: [],

  cierreDeCaja: async (data) => {
    const token = await getTokenFromStore()
    set({ loading: true })
    console.warn('Raw lo que mando para cerrar caja:', data)
    try {
      const res = await fetch(`${RUTA}/cierres-caja/cierre`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message)
      }

      toast.success('Caja cerrada correctamente')

      set(() => ({
        cajaActiva: null,
        loading: false
      }))

      return true
    } catch (error: any) {
      const mensajeDev = 'No se pudo cerrar la caja'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set(() => ({
        cajaActiva: null,
        loading: false
      }))
      return false
    }
  },

  aperturaDeCaja: async (data) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    console.warn('Lo que mando', data)
    try {
      const res = await fetch(`${RUTA}/cierres-caja/apertura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message)
      }

      toast.success('Caja abierta correctamente')

      set(() => ({
        loading: false
      }))
      await get().traerCajaActiva()
      return true
    } catch (error: any) {
      const mensajeDev = 'No se pudo realizar la apertura de caja'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set(() => ({
        cajaActiva: null,
        loading: false
      }))
      return false
    }
  },
  traerCajaActiva: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })
    try {
      const res = await fetch(`${RUTA}/cierres-caja/activo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.status === 204) {
        set({ cajaActiva: null, loading: false })
        return
      }

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message || 'Error al verificar caja activa.')
      }

      set({ cajaActiva: responseData.data, loading: false })
    } catch (error: any) {
      console.error(error)
      // toast.error(error.message)
      set({ loading: false })
    }
  },

  traerCierresDeCaja: async (establecimientoId, usuarioCajeroId, fechaInicio, fechaFin) => {
    const token = await getTokenFromStore()
    set({ loading: true })
    try {
      const url = new URL(`${RUTA}/cierres-caja`)
      if (establecimientoId) url.searchParams.append('establecimientoId', establecimientoId)
      if (usuarioCajeroId) url.searchParams.append('usuarioCajeroId', usuarioCajeroId)
      if (fechaInicio) url.searchParams.append('fechaInicio', fechaInicio)
      if (fechaFin) url.searchParams.append('fechaFin', fechaFin)

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const responseData = await res.json()
      if (!res.ok) {
        throw new Error(responseData.message || 'Error al obtener cierres de caja.')
      }
      set({ cierresDeCaja: responseData.data, loading: false })
    } catch (error: any) {
      toast.error(error.message)
      set({ loading: false })
    }
  },

  traerCierrePorId: async (id: string) => {
    const token = await getTokenFromStore()
    set({ loading: true })
    try {
      const res = await fetch(`${RUTA}/cierres-caja/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const responseData = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          toast.error(responseData.message || 'Cierre de caja no encontrado.')
          set({ loading: false })
          return null
        }
        throw new Error(responseData.message || 'Error al obtener detalles del cierre.')
      }
      set({ loading: false })
      return responseData.data
    } catch (error: any) {
      toast.error(error.message)
      set({ loading: false })
      return null
    }
  },
  generarTicketZ: async (idCaja: string) => {
    set({ loading: true })
    try {
      const token = await getTokenFromStore()
      const res = await fetch(`${RUTA}/reportes/pdf/ticket-z?cierreCajaId=${idCaja}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Error al generar el PDF')

      const blob = await res.blob()

      return blob
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al generar ticket Z')
      return null
    } finally {
      set({ loading: false })
    }
  },

  generarTicketX: async () => {
    set({ loading: true })
    try {
      const token = await getTokenFromStore()

      const res = await fetch(`${RUTA}/reportes/pdf/ticket-x`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const contentType = res.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        toast.error(data.message || 'Error al generar ticket X')
        return null
      }

      if (!res.ok) throw new Error('Error al generar el PDF')

      // Obtener el blob (PDF)
      const blob = await res.blob()

      return blob
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al generar ticket X')
      return null
    } finally {
      set({ loading: false })
    }
  }
}))
