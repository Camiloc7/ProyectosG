import { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from '../helpers/socket'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)

  useEffect(() => {
    // getSocket() devuelve la instancia del socket una vez que se ha creado.
    // Necesitamos comprobar periódicamente si ya está disponible.
    const interval = setInterval(() => {
      const currentSocket = getSocket()
      if (currentSocket) {
        setSocket(currentSocket)
        clearInterval(interval) // Dejamos de comprobar una vez que lo encontramos
      }
    }, 500) // Comprueba cada 500ms

    // Limpieza al desmontar el componente
    return () => clearInterval(interval)
  }, [])

  return { socket }
}