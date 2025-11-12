import { create } from 'zustand'
import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { handleApiResponse } from '../helpers/handleApiResponse'

// Tipado para un establecimiento
export type Establecimiento = {
  id: string
  nombre: string
  direccion: string
  telefono: string
  activo: boolean
  logo_url: string
  impuesto_porcentaje: string
  created_at: string
  updated_at: string
}

type CamposActualizables = Pick<
  Establecimiento,
  'nombre' | 'direccion' | 'telefono' | 'logo_url' | 'impuesto_porcentaje' | 'activo'
>

// 2. Hazlos opcionales
type EstablecimientoUpdate = Partial<CamposActualizables>

// 3. Usa ese tipo en la store
type EstablecimientosState = {
  loading: boolean
  establecimientoActual: Establecimiento | null
  traerEstablecimientoPorId: (id: string) => Promise<void>
  actualizarEstablecimiento: (id: string, data: EstablecimientoUpdate) => Promise<boolean>
}
export const useEstablecimientosStore = create<EstablecimientosState>((set, get) => ({
  loading: false,
  establecimientoActual: null,
  traerEstablecimientoPorId: async (id) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/establecimientos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: 'Error al traer el establecimiento'
      })
      //toast.success(responseData.message || "Operacion Exitosa");
      set({ establecimientoActual: responseData.data })
    } catch (error: any) {
      console.error(error)
      // toast.error(error.message);
    } finally {
      set({ loading: false })
    }
  },
  actualizarEstablecimiento: async (id, data) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    console.warn('RAW LO QUE MANDO ACTUALIZAR: ', data)
    try {
      const res = await fetch(`${RUTA}/establecimientos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: 'Error al actualizar el establecimiento',
        debugg: true
      })
      toast.success(responseData.message || 'Actualizacion Exitosa')
      await get().traerEstablecimientoPorId(id)

      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
      return false
    } finally {
      set({ loading: false })
    }
  }
}))
