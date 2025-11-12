import { create } from 'zustand'
import { RUTA } from '../helpers/rutas'
import { handleApiResponse } from '../helpers/handleApiResponse'
import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { toast } from 'sonner'

interface DataDineroExtra {
  monto: number
  descripcion: string
  cierre_caja_id: string
}

type DineroExtraState = {
  loading: boolean
  ingresoExtra: (data: DataDineroExtra) => Promise<boolean>
  gastoExtra: (data: DataDineroExtra) => Promise<boolean>
}

export const useDineroExtraStore = create<DineroExtraState>((set) => ({
  loading: false,

  ingresoExtra: async (data) => {
    set({ loading: true })
    try {
      const token = await getTokenFromStore()
      console.warn('Raw ingreso extra: ', data)
      const res = await fetch(`${RUTA}/ingresos-extra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: 'No se pudo mandar el registro de ingreso extra',
        debugg: true
      })

      toast.success(responseData.message || 'Operacion Exitosa')
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al traer impresoras')
      return false
    } finally {
      set({ loading: false })
    }
  },

  gastoExtra: async (data) => {
    set({ loading: true })
    try {
      const token = await getTokenFromStore()
      console.warn('Raw gasto extra: ', data)
      const res = await fetch(`${RUTA}/gastos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: 'No se pudo mandar el registro de ingreso extra',
        debugg: true
      })
      toast.success(responseData.message || 'Operacion Exitosa')
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al traer impresoras')
      return false
    } finally {
      set({ loading: false })
    }
  }
}))
