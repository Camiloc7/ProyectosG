import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { create } from 'zustand'

export type IMediosDePago = {
  id: string
  es_efectivo: boolean
  nombre: string
}

// Tipado para el estado de la store
type MediosDePagoState = {
  loading: boolean
  mediosDePago: IMediosDePago[]
  traerMediosDePago: () => Promise<void>
}

export const useMediosDePagoStore = create<MediosDePagoState>((set) => ({
  loading: false,
  mediosDePago: [],

  traerMediosDePago: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })
    try {
      const res = await fetch(`${RUTA}/medios-pago`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message)
      }
      set({
        loading: false,
        mediosDePago: responseData.data
      })
    } catch (error: any) {
      const mensajeDev = 'No se pudo traer los medios de pago:'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  }
}))
