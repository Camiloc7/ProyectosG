import { getTokenFromStore } from '../helpers/getTokenFromStore'
import { RUTA } from '../helpers/rutas'
import { IFormPedidos } from '../views/CreacionDePedido'
import { toast } from 'sonner'
import { create } from 'zustand'

export type IItemsPedidos = {
  id: string
  nombre: string
  cantidad: number
  precio: number
  notas: string
  tipo?: 'simple' | 'configurable'
  opcionesSeleccionadas?: 'simple' | 'configurable'
}
export type IPedidos = {
  id: string
  mesa_id: string
  mesa_numero: string
  usuario_domiciliario_id?: string
  estado: string
  tipo_pedido: string
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_direccion?: string
  total_estimado: string
  descuentos_aplicados: string
  notas?: string
  pedidoItems: IItemsPedidos[]
}
type PedidosState = {
  loading: boolean
  pedidos: IPedidos[]
  pedidosMeseros: IPedidos[]
  pedidosCocina: IPedidos[]
  traerPedidos: () => Promise<void>
  traerListaPedidos: () => Promise<void>
  actualizarEstadoPedido: (id: string, estado: string) => Promise<void>
  crearPedido: (data: object) => Promise<string>
  actualizarPedido: (data: IFormPedidos) => Promise<string>
}

const transformarPedido = (dataOriginal) => {
  return {
    mesa_id: dataOriginal.mesa || null,
    tipo_pedido: dataOriginal.origen,
    cliente_nombre: dataOriginal.nombre || '',
    cliente_telefono: dataOriginal.telefono || '',
    cliente_direccion: dataOriginal.direccion || '',
    notas: dataOriginal.idOrdenExterna || '',
    pedidoItems: dataOriginal.productos.map((prod) => ({
      producto_id: prod.id,
      cantidad: prod.cantidad,
      notas_item: prod.nota || '',
      tipo_producto: 'SIMPLE'
    }))
  }
}

export const formatearPedidos = (dataOriginal: any[]): IPedidos[] => {
  return dataOriginal.map((pedido) => ({
    id: pedido.id,
    mesa_id: pedido.mesa?.id || '',
    mesa_numero: pedido.mesa?.numero || '',
    usuario_domiciliario_id: pedido.usuario_domiciliario_id || '',
    estado: pedido.estado,
    tipo_pedido: pedido.tipo_pedido,
    cliente_nombre: pedido.cliente_nombre || '',
    cliente_telefono: pedido.cliente_telefono || '',
    cliente_direccion: pedido.cliente_direccion || '',
    total_estimado: pedido.total_estimado,
    descuentos_aplicados: pedido.descuentos_aplicados,
    notas: pedido.notas || '',
    pedidoItems: (pedido.pedidoItems || []).map((item) => ({
      id: item.id,
      nombre: item.producto?.nombre || '',
      cantidad: item.cantidad,
      precio: parseFloat(item.precio_unitario_al_momento_venta),
      notas: item.notas_item || ''
    }))
  }))
}

export const formatearPedidosMesero = (dataOriginal: any[]): IPedidos[] => {
  return dataOriginal.map((pedido) => ({
    id: pedido.id,
    mesa_id: pedido.mesa?.id || '',
    mesa_numero: pedido.mesa?.numero || '',
    usuario_domiciliario_id: pedido.usuario_domiciliario_id || '',
    estado: pedido.estado,
    tipo_pedido: pedido.tipo_pedido,
    cliente_nombre: pedido.cliente_nombre || '',
    cliente_telefono: pedido.cliente_telefono || '',
    cliente_direccion: pedido.cliente_direccion || '',
    total_estimado: pedido.total_estimado,
    descuentos_aplicados: pedido.descuentos_aplicados,
    notas: pedido.notas || '',
    pedidoItems: (pedido.pedidoItems || []).map((item) => ({
      id: item.id,
      nombre: item.nombre_producto || '', // <- corregido
      cantidad: item.cantidad,
      precio: parseFloat(item.precio_unitario_al_momento_venta),
      notas: item.notas || ''
    }))
  }))
}

export const usePedidosStore = create<PedidosState>((set, get) => ({
  loading: false,
  pedidos: [],
  pedidosCocina: [],
  pedidosMeseros: [],

  traerPedidos: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/pedidos`, {
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
      const pedidosFormateados = formatearPedidos(data.data)
      const pedidosFiltrados = pedidosFormateados.filter(
        (pedido: any) =>
          pedido.estado !== 'PAGADO' && pedido.estado !== 'CANCELADO' && pedido.estado !== 'CERRADO'
      )
      set({ pedidos: pedidosFiltrados, loading: false })
    } catch (error: any) {
      const mensajeDev = 'Error al traer los pedidos'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },

  crearPedido: async (data) => {
    const token = await getTokenFromStore()
    set({ loading: true })
    const payload = transformarPedido(data)
    console.warn('LO QUE MANDO RAW: ', payload)
    try {
      const res = await fetch(`${RUTA}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message)
      }

      toast.success(responseData.message)

      set({ loading: false })
      return responseData.data.id
    } catch (error: any) {
      const mensajeDev = 'Error al generar el pedido'
      console.error(mensajeDev, error)
      toast.error(error.message)
      set({ loading: false })
      return ''
    }
  },

  actualizarPedido: async (data) => {
    const token = await getTokenFromStore()
    set({ loading: true })
    const payload = transformarPedido(data)
    // Limpiamos propiedades vacías
    const camposOpcionales = ['cliente_nombre', 'cliente_telefono', 'mesa_id', 'notas']
    for (const campo of camposOpcionales) {
      if (!payload[campo] || payload[campo].toString().trim() === '') {
        delete payload[campo]
      }
    }
    try {
      const res = await fetch(`${RUTA}/pedidos/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const responseData = await res.json()
      if (!res.ok) {
        throw new Error(responseData.message)
      }
      toast.success(responseData.message)
      set({ loading: false })
      return data.id || ''
    } catch (error: any) {
      const mensajeDev = 'Error al generar el pedido'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
      return ''
    }
  },

  traerListaPedidos: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/pedidos/lista-pedidos`, {
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

      // Formatear para meseros
      const pedidosFormateados = formatearPedidosMesero(data.data)

      // Formatear para cocina
      const pedidosFiltrados = pedidosFormateados.filter(
        (pedido: any) =>
          pedido.estado !== 'LISTO_PARA_ENTREGAR' &&
          pedido.estado !== 'CANCELADO' &&
          pedido.estado !== 'PENDIENTE_PAGO'
      )
      set({ pedidosMeseros: pedidosFormateados, pedidosCocina: pedidosFiltrados, loading: false })
    } catch (error: any) {
      const mensajeDev = 'Error al traer la lista de los pedidos'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  },

  actualizarEstadoPedido: async (id, estado) => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: estado })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }
      if (data.status) {
        toast.success(data.message)
        await get().traerPedidos() //No eliminar estos
        await get().traerListaPedidos()
      } else {
        toast.error(data.message)
      }

      set({ loading: false })
    } catch (error: any) {
      const mensajeDev = 'Error al cambiar el estado del  pedido'
      console.error(mensajeDev, error)
      toast.error(mensajeDev)
      set({ loading: false })
    }
  }
}))
