import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ====== IPC PERSONALIZADO ======
const customAPI = {
  storeSet: (key: string, value: any) => ipcRenderer.invoke('storeSet', key, value),
  storeGet: (key: string) => ipcRenderer.invoke('storeGet', key),
  storeDelete: (key: string) => ipcRenderer.invoke('storeDelete', key),
  storeGetAll: () => ipcRenderer.invoke('storeGetAll'),
  storeClearAll: () => ipcRenderer.invoke('storeClearAll'),
  saveDataToDisk: (data: any, filename?: string) =>
    ipcRenderer.invoke('saveDataToDisk', data, filename),
  printPdfData: (pdfData: string) => ipcRenderer.invoke('print-pdf-data', pdfData),
  validateLicense: (licenseKey: string) => ipcRenderer.invoke('validateLicense', licenseKey),
  verifyLicense: (establecimientoId: string, deviceId: string) =>
    ipcRenderer.invoke('verifyLicense', establecimientoId, deviceId),
  imprimirFactura: (pdfData: Blob) => ipcRenderer.invoke('imprimirFactura', pdfData),
  printPdf: (pdfData: Blob) => ipcRenderer.invoke('printPdf', pdfData),
  
  // 1. Se mantiene: Obtener la lista de impresoras por nombre (Windows)
  getSystemPrinters: () => ipcRenderer.invoke('getSystemPrinters'),
  
  // 2. ❌ Se ELIMINA: Ya no necesitamos exponer la función para obtener puertos COM/Serial.
  // getAvailablePorts: () => ipcRenderer.invoke('getAvailablePorts'), 
  
  // 3. Se mantiene: La función de impresión RAW (ahora usa el nombre de la impresora de Windows)
  printRaw: (printerName: string, dataBase64: string) =>
    ipcRenderer.invoke('printRaw', printerName, dataBase64),
    
  onUpdateProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update-download-progress', (_event, percent) => callback(percent))
  },
  removeUpdateProgressListeners: () => {
    ipcRenderer.removeAllListeners('update-download-progress')
  }
}

// ====== EXPONER EN RENDERER ======
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...customAPI
    })
  } catch (error) {
    console.error('Error exponiendo API en contexto aislado:', error)
  }
} else {
  // Por si acaso no hay aislamiento
  // @ts-ignore
  window.electron = {
    ...electronAPI,
    ...customAPI
  }
}



// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // ====== IPC PERSONALIZADO ======
// const customAPI = {
//   storeSet: (key: string, value: any) => ipcRenderer.invoke('storeSet', key, value),
//   storeGet: (key: string) => ipcRenderer.invoke('storeGet', key),
//   storeDelete: (key: string) => ipcRenderer.invoke('storeDelete', key),
//   storeGetAll: () => ipcRenderer.invoke('storeGetAll'),
//   storeClearAll: () => ipcRenderer.invoke('storeClearAll'),
//   saveDataToDisk: (data: any, filename?: string) =>
//     ipcRenderer.invoke('saveDataToDisk', data, filename),
//   printPdfData: (pdfData: string) => ipcRenderer.invoke('print-pdf-data', pdfData),
//   validateLicense: (licenseKey: string) => ipcRenderer.invoke('validateLicense', licenseKey),
//   verifyLicense: (establecimientoId: string, deviceId: string) =>
//     ipcRenderer.invoke('verifyLicense', establecimientoId, deviceId),
//   imprimirFactura: (pdfData: Blob) => ipcRenderer.invoke('imprimirFactura', pdfData),
//   printPdf: (pdfData: Blob) => ipcRenderer.invoke('printPdf', pdfData),
//   getSystemPrinters: () => ipcRenderer.invoke('getSystemPrinters'),
//   getAvailablePorts: () => ipcRenderer.invoke('getAvailablePorts'), 
//   printRaw: (printerName: string, dataBase64: string) =>
//     ipcRenderer.invoke('printRaw', printerName, dataBase64),
    
//   onUpdateProgress: (callback: (percent: number) => void) => {
//     ipcRenderer.on('update-download-progress', (_event, percent) => callback(percent))
//   },
//   removeUpdateProgressListeners: () => {
//     ipcRenderer.removeAllListeners('update-download-progress')
//   }
// }
// // ====== EXPONER EN RENDERER ======
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', {
//       ...electronAPI,
//       ...customAPI
//     })
//   } catch (error) {
//     console.error('Error exponiendo API en contexto aislado:', error)
//   }
// } else {
//   // Por si acaso no hay aislamiento
//   // @ts-ignore
//   window.electron = {
//     ...electronAPI,
//     ...customAPI
//   }
// }
