import { create } from 'zustand'
import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'

type TipoDocumento = {
  id: string
  nombre: string
  codigo: string
}
export type ClienteInfo = {
  cliente_nombre: string
  cliente_telefono: string
  cliente_direccion: string
}

type ClienteState = {
  loading: boolean
  tiposDocumentos: TipoDocumento[]
  traerTiposDeDocumento: () => Promise<void>
  traerInfoCliente: (cliente_telefono: string) => Promise<ClienteInfo | null>
}

export const useClienteStore = create<ClienteState>((set) => ({
  loading: false,
  tiposDocumentos: [],

  traerTiposDeDocumento: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/clientes/tipos-documento`, {
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
        tiposDocumentos: responseData.data as TipoDocumento[],
        loading: false
      })
    } catch (error: any) {
      const mensajeDev = 'No se pudo traer los tipos de documentos'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },
  traerInfoCliente: async (cliente_telefono) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const url = `${RUTA}/pedidos/buscar-cliente?query=${cliente_telefono}`
      console.warn(url)
      const res = await fetch(url, {
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
        loading: false
      })
      return responseData.data[0]
    } catch (error: any) {
      const mensajeDev = 'No se pudo traer la info del cliente'
      console.error(mensajeDev, error)
      set({ loading: false })
      return null
    }
  }
}))
