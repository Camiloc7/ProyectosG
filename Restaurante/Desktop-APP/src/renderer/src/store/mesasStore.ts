import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { create } from 'zustand'
import { usePedidosStore } from './pedidosStore'

export type IMesas = {
  id: string
  nombre: string
}

// Tipado para el estado de la store
type MesasState = {
  loading: boolean
  mesas: IMesas[]
  traerMesas: () => Promise<void>
  transferirPedidoDeMesa: (newMesaId: string, idPedido: string) => Promise<boolean>
}

export const useMesasStore = create<MesasState>((set, _get) => ({
  loading: false,
  categorias: [],
  mesas: [],

  traerMesas: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/mesas`, {
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

      // ✅ Filtrar mesas con estado "LIBRE"
      const mesasLibres = responseData.data.filter((mesa: any) => mesa.estado === 'LIBRE')

      // ✅ Formatear solo id y nombre
      const mesasFormateadas = mesasLibres.map((mesa: any) => ({
        id: mesa.id,
        nombre: mesa.numero
      }))
      set({
        mesas: mesasFormateadas,
        loading: false
      })
    } catch (error: any) {
      const mensajeDev = 'Fetch mesas fallido:'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },

  transferirPedidoDeMesa: async (newMesaId, idPedido) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const url = `${RUTA}/pedidos/${idPedido}/transfer-table`
      console.warn('URL: ', url)
      console.warn('Lo que mando para transferir: ', newMesaId, idPedido)
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newMesaId: newMesaId })
      })
      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message)
      }
      if (responseData.status) toast.success(responseData.message)

      await usePedidosStore.getState().traerPedidos()
      await usePedidosStore.getState().traerListaPedidos()
      return true
    } catch (error: any) {
      const mensajeDev = 'La Transferencia de mesa fallo:'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      return false
    } finally {
      set({
        loading: false
      })
    }
  }
}))
