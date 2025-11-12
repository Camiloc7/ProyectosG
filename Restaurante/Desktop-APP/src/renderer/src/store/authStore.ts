// src/stores/useAuthStore.ts
import { RUTA } from '../helpers/rutas'
import { toast } from 'sonner'
import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

// export interface JwtPayload {
//   id: string
//   username: string
//   rol_id: string
//   establecimiento_id: string
// }

export interface UsuarioData {
  id: string
  username: string
  rol: string
  nombre_establecimiento: string
  establecimiento_id: string
  establecimiento_name: string
  nit: string
  iat: string
  exp: string
}
// export type User = UsuarioData

type AuthState = {
  token: string | null
  user?: UsuarioData | null
  loading: boolean
  isAuthenticated: boolean
  isAuthReady: boolean
  logout: () => void
  login: (username: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  loading: false,
  isAuthReady: false,

  logout: async () => {
    await window.electron.storeDelete('token')
    await window.electron.storeDelete('user')
    set({ token: null, isAuthenticated: false, isAuthReady: true })
  },

  login: async (username, password) => {
    set({ loading: true, isAuthReady: false })
    // console.warn('Iniciando login para:', username, password)
    try {
      const res = await fetch(`${RUTA}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Error en el inicio de sesión.')
        throw new Error(data.message)
      }

      const token = data.data.access_token as string
      const decodedUser = jwtDecode<UsuarioData>(token)
      const loggedInUser: UsuarioData = decodedUser

      // 2. Obtener el deviceId del almacenamiento local para la verificación
      const deviceId = await window.electron.storeGet('deviceId')
      if (!deviceId) {
        toast.error('ID de dispositivo no encontrado. Por favor, reinstale la aplicación.')
        throw new Error('ID de dispositivo no encontrado.')
      }

      // 3. ¡Paso crítico! Verificar la licencia con el servidor
      //    antes de permitir el acceso.
      const verificationResult = await window.electron.verifyLicense(
        loggedInUser.establecimiento_id,
        deviceId
      )

      if (!verificationResult.success) {
        // La verificación falló, mostrar el mensaje de error del servidor y bloquear el login
        toast.error(verificationResult.message)
        // Limpiar los datos de la licencia localmente para obligar a una nueva activación
        await window.electron.storeDelete('license')
        set({ loading: false, isAuthReady: true })
        throw new Error('Verificación de licencia fallida.')
      }

      await window.electron.storeSet('token', token)
      await window.electron.storeSet('user', loggedInUser)
      set({
        token,
        user: loggedInUser,
        loading: false,
        isAuthenticated: true,
        isAuthReady: true
      })
    } catch (error) {
      console.error('Login fallido:', error)
      toast.error('Login fallido')
      set({ loading: false, isAuthReady: true })
      throw error
    }
  }
}))
