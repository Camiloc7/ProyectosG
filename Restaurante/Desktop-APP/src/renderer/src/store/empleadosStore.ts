import { create } from 'zustand'

import { useAuthStore } from './authStore'
import { toast } from 'sonner'
import { RUTA } from '../helpers/rutas'
import { getTokenFromStore } from '../helpers/getTokenFromStore'

export type EmpleadoFormData = {
  id?: string
  establecimiento_id: string
  rol_id: string
  nombre: string
  password?: string
  apellido: string
  username: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export type Empleado = {
  id: string
  establecimiento_id: string
  rol_id: string
  nombre: string
  apellido: string
  username: string
  activo: boolean
  created_at: string
  updated_at: string
  establecimiento: {
    id: string
    nombre: string
    direccion: string
    telefono: string
    activo: boolean
    impuesto_porcentaje: string
    created_at: string
    updated_at: string
  }
  rol: {
    id: string
    nombre: string
    created_at: string
    updated_at: string
  }
}

type EmpleadosState = {
  empleados: Empleado[]
  loading: boolean
  crearEmpleado: (data: EmpleadoFormData) => Promise<boolean>
  actualizarEmpleado: (data: EmpleadoFormData) => Promise<boolean>
  traerEmpleados: () => Promise<void>
  eliminarEmpleados: (id: string) => Promise<void>
}

export const useEmpleadosStore = create<EmpleadosState>((set, get) => ({
  empleados: [],
  loading: false,
  traerEmpleados: async () => {
    const token = await getTokenFromStore()
    set({ loading: true })

    try {
      const res = await fetch(`${RUTA}/usuarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener empleados')
      }

      set({ empleados: data.data, loading: false })
    } catch (error: any) {
      console.error('Fetch empleados fallido:', error)
      // toast.error(error.message || 'No se pudieron cargar los empleados')
      set({ loading: false })
    }
  },

  crearEmpleado: async (formData) => {
    set({ loading: true })
    const token = useAuthStore.getState().token
    const { id, establecimiento_id, rol_id, created_at, updated_at, ...datosPermitidos } = formData
    console.warn('Lo que mando al back: ', datosPermitidos)
    try {
      const res = await fetch(`${RUTA}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosPermitidos)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }
      await get().traerEmpleados()

      toast.success('Empleado creado exitosamente')
      set({ loading: false })
      return true
    } catch (error: any) {
      console.error('Error al crear el empleado', error)
      toast.error(error.message || 'No se pudo crear el empleado')
      set({ loading: false })
      return false
    }
  },

  actualizarEmpleado: async (formData) => {
    set({ loading: true })
    const token = useAuthStore.getState().token

    // Clonamos formData y eliminamos las props que no deben enviarse
    const { id, establecimiento_id, rol_id, password, created_at, updated_at, ...datosPermitidos } =
      formData

    console.warn('Lo que mando al back PARA EDITAR: ', datosPermitidos)

    try {
      const res = await fetch(`${RUTA}/usuarios/${formData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosPermitidos)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }
      await get().traerEmpleados()

      toast.success('Empleado actualizado exitosamente')
      set({ loading: false })
      return true
    } catch (error: any) {
      const mensajeDev = 'Error al actualizar el empleado'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
      return false
    }
  },

  eliminarEmpleados: async (id) => {
    set({ loading: true })
    const token = useAuthStore.getState().token

    try {
      const res = await fetch(`${RUTA}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }
      // Verificamos si hay contenido en la respuesta
      let responseData = null
      const contentLength = res.headers.get('Content-Length')
      const isJsonResponse = res.headers.get('Content-Type')?.includes('application/json')

      if (res.status !== 204 && isJsonResponse && contentLength !== '0') {
        responseData = await res.json()
      }

      if (!res.ok) {
        throw new Error(responseData || 'Error desconocido')
      }

      await get().traerEmpleados()
      toast.success('Ingrediente eliminado exitosamente')

      set({ loading: false })
    } catch (error: any) {
      const mensajeDev = 'Error al actualizar el empleado'
      console.error(mensajeDev, error)
      toast.error(error.message || mensajeDev)
      set({ loading: false })
    }
  }
}))
