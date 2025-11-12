/* store/tarjetasStore.ts */
import { create } from 'zustand'

export type Tarjeta = {
  name: string
  cedula: string
  items: { id: string; nombre: string; cantidad: number; precio: number }[]
  total: number
  paid?: boolean
}

type TarjetasState = {
  tarjetas: Tarjeta[]
  setTarjetas: (tarjetas: Tarjeta[]) => void
  markPaid: (index: number) => void
  reset: () => void
}

export const useTarjetasStore = create<TarjetasState>((set) => ({
  tarjetas: [],
  setTarjetas: (tarjetas) =>
    set({
      tarjetas: tarjetas.map((t) => ({
        ...t,
        paid: false // mantenemos t.total intacto
      }))
    }),

  markPaid: (index) =>
    set((state) => {
      const updated = [...state.tarjetas]
      updated[index] = { ...updated[index], paid: true }
      return { tarjetas: updated }
    }),
  reset: () => set({ tarjetas: [] })
}))
