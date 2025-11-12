// src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './views/Login/Login'
import Cambio from './views/Cambio'
import DivisionCuentas from './views/DivisionCuentas'
import Pedidos from './views/ListaDePedidos'
import CreacionDePedidos from './views/CreacionDePedido'
import PagoElectronico from './views/PagoElectronico'
import { ConfirmProvider } from './components/confirmModal'
import Cocina from './views/Cocina'
import Mesero from './views/Mesero'
import TerminosYCondiciones from './views/Terminos'
import ListaDeCierresDeCaja from './views/ListaDeCierresDeCaja'
import { useEffect, useState } from 'react'
import UpdateProgressModal from '../src/components/UpdateProgressModal'
import GlobalHeader from './layout/GlobalHeader'
import { useSocket } from './hooks/useSocket'
import { LicenseWrapper } from './components/LicenseWrapper'
function App() {
  const [updateProgress, setUpdateProgress] = useState<number | null>(null)
  const { socket } = useSocket()
  useEffect(() => {
    if (updateProgress === 100) {
      const timeout = setTimeout(() => setUpdateProgress(null), 1500)
      return () => clearTimeout(timeout)
    }
    return
  }, [updateProgress])
  useEffect(() => {
    window.electron?.onUpdateProgress?.((percent: number) => {
      setUpdateProgress(percent)
    })
    return () => {
      window.electron?.removeUpdateProgressListeners?.()
    }
  }, [])

  useEffect(() => {
    if (socket) {
      const handlePrintJob = async (payload: {
        tipoImpresion: 'COCINA' | 'CAJA' | 'FACTURA' | 'COMANDAS'
        dataBase64: string
      }) => {
        const { tipoImpresion, dataBase64 } = payload
        const storeKey = `printerConfig_${tipoImpresion}`
        try {
          const printerConfig = await window.electron.storeGet(storeKey)
          if (!printerConfig || !printerConfig.name) {
            console.error(
              `[PRINT ERROR] No se encontró una impresora configurada para el uso: ${tipoImpresion} (clave: ${storeKey})`
            )
            return
          }
          const printerName = printerConfig.name
          const result = await window.electron.printRaw(printerName, dataBase64)
          if (result.success) {
          } else {
            console.error(
              `[PRINT FAILED] El proceso principal reportó un error al imprimir:`,
              result.error
            )
          }
        } catch (error) {
          console.error(
            '[PRINT FATAL] Error durante el proceso de impresión en el renderer:',
            error
          )
        }
      }
      socket.on('printJob', handlePrintJob)
      return () => {
        socket.off('printJob', handlePrintJob)
      }
    }
    return
  }, [socket])

  const location = useLocation()
  const mostrarHeaderGlobal = location.pathname !== '/'

  return (
    <>
      {updateProgress !== null && <UpdateProgressModal progress={updateProgress} />}

      <ConfirmProvider>
        <LicenseWrapper>
          {mostrarHeaderGlobal && <GlobalHeader />}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pagar" element={<DivisionCuentas />} />
            <Route path="/cambio" element={<Cambio />} />
            <Route path="/creacion-de-pedidos" element={<CreacionDePedidos />} />
            <Route path="/pagoElectronico" element={<PagoElectronico />} />
            <Route path="/cocina" element={<Cocina />} />
            <Route path="/mesero" element={<Mesero />} />
            <Route path="/terminos" element={<TerminosYCondiciones />} />
            <Route path="/cierre-caja" element={<ListaDeCierresDeCaja />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </LicenseWrapper>
      </ConfirmProvider>
    </>
  )
}

export default App
