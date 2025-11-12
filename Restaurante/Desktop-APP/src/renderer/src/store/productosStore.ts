import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { create } from 'zustand'

export type IProductoConfigurableCompleto = {
  id: string
  nombre: string
  descripcion: string
  categoria_id: string
  imagen_url: string | null
  activo: boolean
  precio_base: number
  opciones: any[]
  tipo: 'configurable'
}
export type IProductoConfigurableBasico = {
  id: string
  nombre: string
  categoria: string
  precio: 0
  imagen_url: string | null
  tipo: 'configurable'
}

export type IProductoSimple = {
  id: string
  nombre: string
  categoria: string
  precio: number
  imagen_url: string | null
  tipo: 'simple'
}

export type IProducto = (IProductoSimple | IProductoConfigurableBasico) & {
  cantidad: number
  nota: string
}

type Categoria = {
  id: string
  nombre: string
}

type ProductosState = {
  loading: boolean
  productos: IProducto[]
  categorias: Categoria[]
  traerCategorias: () => Promise<void>
  traerProductos: () => Promise<void>
  traerProductoConfigurable: (id: string) => Promise<IProductoConfigurableCompleto | undefined>
}

export const useProductosStore = create<ProductosState>((set) => ({
  loading: false,
  categorias: [],
  productos: [],

  traerCategorias: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/categorias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }

      const categoriasFormateadas: Categoria[] = data.data.map((categoria: any) => ({
        id: categoria.id,
        nombre: categoria.nombre
      }))

      set({
        loading: false,
        categorias: categoriasFormateadas
      })
    } catch (error: any) {
      const mensajeDev = 'Fetch categorías fallido:'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },

  traerProductos: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/productos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }

      const productos = data.data.map((producto: any) => ({
        ...producto,
        precio: producto.tipo === 'simple' ? Number(producto.precio) : 0,
        cantidad: 0,
        nota: ''
      }))

      set({
        productos,
        loading: false
      })
    } catch (error: any) {
      const mensajeDev = 'Fetch productos fallido:'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },

  traerProductoConfigurable: async (id: string) => {
    const token = await getTokenFromStore()

    try {
      const res = await fetch(`${RUTA}/productos/configurable/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }
      const productoConfigurable: IProductoConfigurableCompleto = {
        ...data.data,
        precio_base: Number(data.data.precio_base)
      }

      return productoConfigurable
    } catch (error: any) {
      const mensajeDev = `Fetch del producto configurable ${id} fallido:`
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      return undefined
    }
  }
}))
