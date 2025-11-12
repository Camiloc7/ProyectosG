import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { RUTA } from '../renderer/src/helpers/rutas'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'


// ====== VARIABLES GLOBALES ======
let mainWindow: BrowserWindow | null = null
const dataFilePath = path.join(app.getPath('userData'), 'store.json')
let store: Record<string, any> = {}

// ====== CARGAR STORE ======
try {
  const data = fs.readFileSync(dataFilePath, 'utf-8')
  store = JSON.parse(data)
} catch {
  store = {}
}

function saveStoreToDisk() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(store, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error saving store:', err)
  }
}

// ====== DEVICE ID ======
let deviceId = store['deviceId']
if (!deviceId) {
  deviceId = uuidv4()
  store['deviceId'] = deviceId
  saveStoreToDisk()
}

// ====== CREAR VENTANA PRINCIPAL ======
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })
  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ====== IPC PARA COMUNICACIÓN RENDERER ↔ MAIN ======
ipcMain.handle('storeSet', (_event, key: string, value: any) => {
  store[key] = value
  saveStoreToDisk()
  return true
})
ipcMain.handle('storeGet', (_event, key: string) => store[key])
ipcMain.handle('storeDelete', (_event, key: string) => {
  delete store[key]
  saveStoreToDisk()
  return true
})
ipcMain.handle('storeGetAll', () => store)
ipcMain.handle('storeClearAll', () => {
  store = {}
  saveStoreToDisk()
  return true
})

// ====== IPC PARA OBTENER IMPRESORAS DEL SISTEMA (NOMBRE) ======
ipcMain.handle('getSystemPrinters', async () => {
  if (mainWindow) {
    const printers = mainWindow.webContents.getPrintersAsync();
    return (await printers).map(p => p.name);
  }
  return []; 
});

// ====== IPC PARA OBTENER PUERTOS SERIALES (COM) - COMENTADO ======
// Esto ya no se usará por la premura
/*
ipcMain.handle('getAvailablePorts', async () => {
  try {
    const ports = await SerialPort.list();
    return ports.map(port => ({
      label: `${port.path} (${port.manufacturer || 'Dispositivo Serial'})`,
      value: port.path 
    }));
  } catch (error) {
    console.error("Error al listar puertos seriales:", error);
    return [];
  }
});
*/

ipcMain.handle('saveDataToDisk', (_event, data: any, filename = 'division_backup.json') => {
  const dir = path.join(os.homedir(), '.mi-cajero-datos')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Error guardando datos:', err)
    return false
  }
})

// // ====== FUNCIÓN DE IMPRESIÓN RAW - AHORA POR NOMBRE DE IMPRESORA (WINDOWS) ======
// ipcMain.handle('printRaw', async (_event, printerName: string, dataBase64: string) => {
//     try {
//         if (!printerName) {
//             const errorMsg = 'No se proporcionó el nombre de la impresora.';
//             log.error(`[PRINT-RAW] ERROR: ${errorMsg}`);
//             return { success: false, error: errorMsg };
//         }

//         // La nueva librería espera el nombre de la impresora y los datos en formato Base64
//         const result = printRaw({
//             printerName: printerName,
//             data: dataBase64,
//             dataType: 'base64', // Indica que los datos son base64 (ESC/POS)
//         });

//         if (result === true) {
//             log.info(`[PRINT-RAW] Envío exitoso a la impresora: ${printerName}`);
//             return { success: true };
//         } else {
//             const errorMsg = `La librería reportó un fallo al imprimir: ${result}`;
//             log.error(`[PRINT-RAW] FALLO AL IMPRIMIR: ${errorMsg}`);
//             return { success: false, error: errorMsg };
//         }

//     } catch (error: any) {
//         const errorMsg = `Error fatal al llamar a printRaw: ${error.message || error}`;
//         log.error(`[PRINT-RAW] ERROR FATAL: ${errorMsg}`);
//         return { success: false, error: errorMsg };
//     }
// });

// ...existing code...
ipcMain.handle('printRaw', async (_event, printerName: string, dataBase64: string) => {
    console.log('[PRINT-RAW] Iniciando proceso de impresión.');
    console.log(`[PRINT-RAW] Impresora recibida: ${printerName}`);

    if (!printerName || !dataBase64) {
        console.error('[PRINT-RAW] Error: Faltan parámetros (printerName o dataBase64).');
        return { success: false, error: 'Faltan parámetros.' };
    }

    let printWindow: BrowserWindow | null = null;
    let tempFilePath = '';

    try {
        console.log('[PRINT-RAW] Decodificando datos Base64 a PDF.');
        const pdfBuffer = Buffer.from(dataBase64, 'base64');
        const userDataPath = app.getPath('userData');
        tempFilePath = path.join(userDataPath, `temp_print_${Date.now()}.pdf`);
        console.log(`[PRINT-RAW] Creando archivo PDF temporal en: ${tempFilePath}`);
        fs.writeFileSync(tempFilePath, pdfBuffer);

        console.log('[PRINT-RAW] Creando ventana de impresión oculta.');
        printWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
        await printWindow!.loadURL(`file://${tempFilePath}`);
        console.log('[PRINT-RAW] Archivo PDF cargado en la ventana oculta.');

        await new Promise<void>(resolve => printWindow!.webContents.on('did-finish-load', () => {
            console.log('[PRINT-RAW] Evento did-finish-load disparado.');
            resolve();
        }));

        console.log(`[PRINT-RAW] Enviando a la impresora "${printerName}"...`);
        await printWindow!.webContents.print({
            silent: true,
            printBackground: true,
            deviceName: printerName,
        });
        console.log('[PRINT-RAW] Comando de impresión enviado con éxito.');

        return { success: true };

    } catch (error: any) {
        console.error('[PRINT-RAW] Ocurrió un error en el proceso de impresión:', error);
        return { success: false, error: error.message || 'Error desconocido al imprimir' };

    } finally {
        console.log('[PRINT-RAW] Bloque finally: Limpiando recursos.');
        if (printWindow) {
            console.log('[PRINT-RAW] Cerrando ventana de impresión.');
            printWindow.close();
            printWindow = null;
        }
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            console.log(`[PRINT-RAW] Eliminando archivo temporal: ${tempFilePath}`);
            fs.unlinkSync(tempFilePath);
        }
        console.log('[PRINT-RAW] Proceso de impresión finalizado.');
    }
});

// ...existing code...
// ====== IPC PARA VALIDAR LICENCIA ======
ipcMain.handle('validateLicense', async (_event, licenseKey: string) => {
  try {
    const response = await axios.post(`${RUTA}/establecimientos/activar-licencia`, {
      licenciaKey: licenseKey,
      dispositivoId: deviceId
    })
    if (response.status === 200) {
      store['license'] = { key: licenseKey, valid: true, dateValidated: new Date().toISOString() }
      saveStoreToDisk()
      return { success: true, message: 'Licencia válida' }
    }
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 401) {
        return { success: false, message: 'La licencia ha expirado o no está activa' }
      } else if (err.response.status === 404) {
        return { success: false, message: 'Clave de licencia no encontrada' }
      } else if (err.response.status === 409) {
        return { success: false, message: 'La licencia ya está activa en otro dispositivo' }
      }
    } else if (err.request) {
      console.error('Error de red al validar licencia:', err.request)
      return { success: false, message: 'Error de conexión al validar la licencia' }
    } else {
      console.error('Error desconocido al validar licencia:', err.message)
      return { success: false, message: 'Error desconocido al validar licencia' }
    }
  }
  return { success: false, message: 'Error desconocido al validar licencia' }
})

ipcMain.handle('verifyLicense', async (_event, establecimientoId: string, deviceId: string) => {
  try {
    const response = await axios.get(
      `${RUTA}/establecimientos/verificar-licencia/${establecimientoId}`,
      {
        headers: { 'x-device-id': deviceId }
      }
    )
    if (response.status === 200) {
      return { success: true }
    }
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 401) {
        return { success: false, message: err.response.data.message }
      }
    } else if (err.request) {
      return { success: false, message: 'Error de conexión' }
    }
  }
  return { success: false, message: 'Error de conexión' }
})

// ===== IPC PARA IMPRIMIR FACTURA (PDF) =====
ipcMain.handle('imprimirFactura', async (_event, pdfBuffer: Buffer) => {
  try {
    const printWindow = new BrowserWindow({ show: false })
    const base64Data = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Data}`
    await printWindow.loadURL(dataUrl)
    return new Promise((resolve) => {
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(
          { silent: true, printBackground: true },
          (success, failureReason) => {
            printWindow.close()
            if (!success) {
              console.error('Error al imprimir:', failureReason)
              resolve({ success: false, error: failureReason })
            } else {
              resolve({ success: true })
            }
          }
        )
      })
    })
  } catch (err: any) {
    console.error('Error al imprimir factura:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.on('print-pdf', async (_event, buffer) => {
  try {
    const filePath = path.join(app.getPath('temp'), 'ticket-z.pdf')
    fs.writeFileSync(filePath, buffer)
    const win = new BrowserWindow({ show: false })
    await win.loadURL(`file://${filePath}`)
    win.webContents.print({ silent: true, printBackground: true }, (success, errorType) => {
      if (!success) console.error('Error al imprimir:', errorType)
      win.close()
    })
  } catch (err) {
    console.error('Error al imprimir PDF:', err)
  }
})

ipcMain.on('app-ready-for-socket', () => {
});

// ====== CONFIGURAR AUTO-UPDATER ======
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = true

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    title: 'Actualización disponible',
    message: 'Se ha detectado una nueva versión. Comenzando descarga...',
    buttons: ['Aceptar']
  })
})

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) mainWindow.setProgressBar(progress.percent / 100)
})

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.setProgressBar(-1)
  dialog
    .showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Actualización lista',
      message: 'La actualización se ha descargado. La aplicación se reiniciará para instalarla.',
      buttons: ['Reiniciar ahora']
    })
    .then(() => autoUpdater.quitAndInstall())
})

// ====== FUNCION PARA CHEQUEAR ACTUALIZACIONES ======
function checkForUpdates() {
  autoUpdater.checkForUpdates()
}

// ====== CICLO DE VIDA ======
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  createWindow()
  checkForUpdates()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
























// import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
// import { join } from 'path'
// import { electronApp, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import fs from 'fs'
// import path from 'path'
// import os from 'os'
// import { v4 as uuidv4 } from 'uuid'
// import axios from 'axios'
// import { RUTA } from '../renderer/src/helpers/rutas'
// import { autoUpdater } from 'electron-updater'
// import log from 'electron-log'
// import printer from 'node-printer'; 
// import { SerialPort } from 'serialport'
// // ====== VARIABLES GLOBALES ======
// let mainWindow: BrowserWindow | null = null
// const dataFilePath = path.join(app.getPath('userData'), 'store.json')
// let store: Record<string, any> = {}
// // ====== CARGAR STORE ======
// try {
//   const data = fs.readFileSync(dataFilePath, 'utf-8')
//   store = JSON.parse(data)
// } catch {
//   store = {}
// }
// function saveStoreToDisk() {
//   try {
//     fs.writeFileSync(dataFilePath, JSON.stringify(store, null, 2), 'utf-8')
//   } catch (err) {
//     console.error('Error saving store:', err)
//   }
// }
// // ====== DEVICE ID ======
// let deviceId = store['deviceId']
// if (!deviceId) {
//   deviceId = uuidv4()
//   store['deviceId'] = deviceId
//   saveStoreToDisk()
// }
// // ====== CREAR VENTANA PRINCIPAL ======
// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 900,
//     height: 670,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false,
//       contextIsolation: true
//     }
//   })
//   mainWindow.on('ready-to-show', () => mainWindow?.show())
//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }
// // ====== IPC PARA COMUNICACIÓN RENDERER ↔ MAIN ======
// ipcMain.handle('storeSet', (_event, key: string, value: any) => {
//   store[key] = value
//   saveStoreToDisk()
//   return true
// })
// ipcMain.handle('storeGet', (_event, key: string) => store[key])
// ipcMain.handle('storeDelete', (_event, key: string) => {
//   delete store[key]
//   saveStoreToDisk()
//   return true
// })
// ipcMain.handle('storeGetAll', () => store)
// ipcMain.handle('storeClearAll', () => {
//   store = {}
//   saveStoreToDisk()
//   return true
// })


// // ====== NUEVO IPC PARA OBTENER IMPRESORAS DEL SISTEMA ======


// // ipcMain.handle('getSystemPrinters', async () => {
// //   if (mainWindow) {
// //     const printers = mainWindow.webContents.getPrintersAsync();
// //     return (await printers).map(p => p.name);
// //   }
// //   return []; 
// // })





// ipcMain.handle('getSystemPrinters', async () => {
//   if (mainWindow) {
//     const printers = mainWindow.webContents.getPrintersAsync();
//     return (await printers).map(p => p.name);
//   }
//   return []; 
// });
// ipcMain.handle('getAvailablePorts', async () => {
//   try {
//     const ports = await SerialPort.list();
//     return ports.map(port => ({
//       label: `${port.path} (${port.manufacturer || 'Dispositivo Serial'})`,
//       value: port.path 
//     }));
//   } catch (error) {
//     console.error("Error al listar puertos seriales:", error);
//     return [];
//   }
// });












// ipcMain.handle('saveDataToDisk', (_event, data: any, filename = 'division_backup.json') => {
//   const dir = path.join(os.homedir(), '.mi-cajero-datos')
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
//   const filePath = path.join(dir, filename)
//   try {
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
//     return true
//   } catch (err) {
//     console.error('Error guardando datos:', err)
//     return false
//   }
// })



// // ipcMain.handle('printRaw', async (_event, printerName: string, dataBase64: string) => {
// //     if (!printerName) {
// //         return { success: false, error: 'Nombre de impresora no configurado.' };
// //     }
// //     try {
// //         const dataBuffer = Buffer.from(dataBase64, 'base64');
// //         console.log(`[Electron Main] Enviando ${dataBuffer.length} bytes a la impresora: ${printerName}`);
// //         printer.printDirect({
// //             data: dataBuffer,       
// //             printer: printerName,   
// //             type: 'RAW',            
// //             success: (jobId) => {
// //                 console.log(`Impresión RAW enviada con éxito. ID: ${jobId}`);
// //                 return { success: true };
// //             },
// //             error: (err) => {
// //                 console.error(`[Electron Main] Error al imprimir RAW:`, err);
// //                 return { success: false, error: `Fallo al imprimir RAW: ${err}` };
// //             }
// //         });
// //         return new Promise((resolve) => {
// //             printer.printDirect({
// //                 data: dataBuffer,
// //                 printer: printerName,
// //                 type: 'RAW',
// //                 success: (jobId) => resolve({ success: true, jobId: jobId }),
// //                 error: (err) => resolve({ success: false, error: `Fallo al imprimir RAW: ${err}` })
// //             });
// //         });

// //     } catch (error: any) {
// //         console.error(`[Electron Main] Error CRÍTICO en printRaw:`, error.message);
// //         return { success: false, error: error.message };
// //     }
// // });


// // main.ts



// // REEMPLAZAR ESTA FUNCIÓN COMPLETA:
// ipcMain.handle('printRaw', async (_event, printerName: string, dataBase64: string) => {
    
//     // El 'printerName' ahora contiene la ruta del puerto (ej: 'COM7'), que fue seleccionada por el usuario.
//     const portPath = printerName; 
//     const BAUD_RATE = 9600; // Mantenemos la velocidad fija, ya que no se implementó la configuración dinámica

//     if (!portPath) {
//         return { success: false, error: 'La ruta del puerto serial no está configurada.' };
//     }

//     try {
//         const dataBuffer = Buffer.from(dataBase64, 'base64');
//         console.log(`[Electron Main] Enviando ${dataBuffer.length} bytes por SerialPort a: ${portPath}`);
        
//         const port = new SerialPort({ 
//             path: portPath, 
//             baudRate: BAUD_RATE,
//             autoOpen: false 
//         });

//         // Envolvemos la lógica de SerialPort en una promesa para gestionar el flujo asíncrono
//         await new Promise((resolve, reject) => {
//             port.open((err) => {
//                 if (err) {
//                     console.error(`[Electron Main] ERROR al abrir puerto ${portPath}:`, err.message);
//                     return reject(new Error(`Fallo al abrir puerto COM: ${err.message}`));
//                 }
                
//                 // Escribir los datos ESC/POS
//                 port.write(dataBuffer, (writeErr) => {
//                     if (writeErr) {
//                         port.close();
//                         console.error(`[Electron Main] ERROR al escribir datos:`, writeErr.message);
//                         return reject(new Error(`Fallo al escribir datos: ${writeErr.message}`));
//                     }
                    
//                     // Asegurar que todos los datos se envíen antes de cerrar el puerto
//                     port.drain(() => { 
//                         port.close();
//                         resolve(true); 
//                     });
//                 });
//             });
//             port.on('error', (err) => {
//                 reject(new Error(`Error en SerialPort: ${err.message}`));
//             });
//         });
        
//         return { success: true };

//     } catch (error: any) {
//         console.error(`[Electron Main] Error CRÍTICO en printRaw:`, error.message);
//         return { success: false, error: error.message };
//     }
// });





// // ====== IPC PARA VALIDAR LICENCIA ======
// ipcMain.handle('validateLicense', async (_event, licenseKey: string) => {
//   try {
//     const response = await axios.post(`${RUTA}/establecimientos/activar-licencia`, {
//       licenciaKey: licenseKey,
//       dispositivoId: deviceId
//     })
//     if (response.status === 200) {
//       store['license'] = { key: licenseKey, valid: true, dateValidated: new Date().toISOString() }
//       saveStoreToDisk()
//       return { success: true, message: 'Licencia válida' }
//     }
//   } catch (err: any) {
//     if (err.response) {
//       if (err.response.status === 401) {
//         return { success: false, message: 'La licencia ha expirado o no está activa' }
//       } else if (err.response.status === 404) {
//         return { success: false, message: 'Clave de licencia no encontrada' }
//       } else if (err.response.status === 409) {
//         return { success: false, message: 'La licencia ya está activa en otro dispositivo' }
//       }
//     } else if (err.request) {
//       console.error('Error de red al validar licencia:', err.request)
//       return { success: false, message: 'Error de conexión al validar la licencia' }
//     } else {
//       console.error('Error desconocido al validar licencia:', err.message)
//       return { success: false, message: 'Error desconocido al validar licencia' }
//     }
//   }
//   return { success: false, message: 'Error desconocido al validar licencia' }
// })
// ipcMain.handle('verifyLicense', async (_event, establecimientoId: string, deviceId: string) => {
//   try {
//     const response = await axios.get(
//       `${RUTA}/establecimientos/verificar-licencia/${establecimientoId}`,
//       {
//         headers: { 'x-device-id': deviceId }
//       }
//     )
//     if (response.status === 200) {
//       return { success: true }
//     }
//   } catch (err: any) {
//     if (err.response) {
//       if (err.response.status === 401) {
//         return { success: false, message: err.response.data.message }
//       }
//     } else if (err.request) {
//       return { success: false, message: 'Error de conexión' }
//     }
//   }
//   return { success: false, message: 'Error de conexión' }
// })
// // ===== IPC PARA IMPRIMIR PEDIDO =====
// ipcMain.handle('imprimirFactura', async (_event, pdfBuffer: Buffer) => {
//   try {
//     const printWindow = new BrowserWindow({ show: false })
//     const base64Data = pdfBuffer.toString('base64')
//     const dataUrl = `data:application/pdf;base64,${base64Data}`
//     await printWindow.loadURL(dataUrl)
//     return new Promise((resolve) => {
//       printWindow.webContents.on('did-finish-load', () => {
//         printWindow.webContents.print(
//           { silent: true, printBackground: true },
//           (success, failureReason) => {
//             printWindow.close()
//             if (!success) {
//               console.error('Error al imprimir:', failureReason)
//               resolve({ success: false, error: failureReason })
//             } else {
//               resolve({ success: true })
//             }
//           }
//         )
//       })
//     })
//   } catch (err: any) {
//     console.error('Error al imprimir factura:', err)
//     return { success: false, error: err.message }
//   }
// })
// ipcMain.on('print-pdf', async (_event, buffer) => {
//   try {
//     const filePath = path.join(app.getPath('temp'), 'ticket-z.pdf')
//     fs.writeFileSync(filePath, buffer)
//     const win = new BrowserWindow({ show: false })
//     await win.loadURL(`file://${filePath}`)
//     win.webContents.print({ silent: true, printBackground: true }, (success, errorType) => {
//       if (!success) console.error('Error al imprimir:', errorType)
//       win.close()
//     })
//   } catch (err) {
//     console.error('Error al imprimir PDF:', err)
//   }
// })
// ipcMain.on('app-ready-for-socket', () => {
// });
// // ====== CONFIGURAR AUTO-UPDATER ======
// log.transports.file.level = 'info'
// autoUpdater.logger = log
// autoUpdater.autoDownload = true
// autoUpdater.on('update-available', () => {
//   dialog.showMessageBox(mainWindow!, {
//     type: 'info',
//     title: 'Actualización disponible',
//     message: 'Se ha detectado una nueva versión. Comenzando descarga...',
//     buttons: ['Aceptar']
//   })
// })
// autoUpdater.on('download-progress', (progress) => {
//   if (mainWindow) mainWindow.setProgressBar(progress.percent / 100)
// })
// autoUpdater.on('update-downloaded', () => {
//   if (mainWindow) mainWindow.setProgressBar(-1)
//   dialog
//     .showMessageBox(mainWindow!, {
//       type: 'info',
//       title: 'Actualización lista',
//       message: 'La actualización se ha descargado. La aplicación se reiniciará para instalarla.',
//       buttons: ['Reiniciar ahora']
//     })
//     .then(() => autoUpdater.quitAndInstall())
// })

// // ====== FUNCION PARA CHEQUEAR ACTUALIZACIONES ======
// function checkForUpdates() {
//   autoUpdater.checkForUpdates()
// }

// // ====== CICLO DE VIDA ======
// app.whenReady().then(() => {
//   electronApp.setAppUserModelId('com.electron')
//   createWindow()
//   checkForUpdates()

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit()
// })