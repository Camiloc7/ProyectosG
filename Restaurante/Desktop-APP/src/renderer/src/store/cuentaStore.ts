import { create } from 'zustand'
import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'

export type ICuenta = {
  id: string
  nombre: string
}

type CuentasState = {
  loading: boolean
  cuentas: ICuenta[]
  traerCuentas: () => Promise<void>
}

export const useCuentasStore = create<CuentasState>((set) => ({
  loading: false,
  cuentas: [],
  traerCuentas: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/cuentas-bancarias`, {
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

      const cuentasTransformadas = responseData.data.map((cuenta: any) => ({
        id: cuenta.id,
        nombre: cuenta.nombre_banco
      }))

      // 🔹 Agregar Efectivo al inicio de la lista
      const cuentasConEfectivo = [{ id: 'EFECTIVO', nombre: 'Efectivo' }, ...cuentasTransformadas]

      set({
        cuentas: cuentasConEfectivo,
        loading: false
      })
    } catch (error: any) {
      const mensajeDev = 'Algo falló al traer las cuentas'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  }
}))
