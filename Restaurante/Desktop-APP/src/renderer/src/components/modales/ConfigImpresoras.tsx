'use client'

import { ArrowLeft, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import SelectConSearch from '../SelectConSearch'
import Checkbox from '../CheckBox'
import InputField from '../InputField'
import OrangeButton from '../OrangeButton'

const USE_MAP = {
  'Cocina': 'printerConfig_COCINA',
  'Comandas': 'printerConfig_COMANDAS', 
  'Tickets en caja': 'printerConfig_CAJA',
  'Factura': 'printerConfig_FACTURA' 
}

interface PrinterConfig {
  name: string 
  connectionType: 'LOCAL_NAME'
}

interface ActiveConfig {
  useName: string 
  storeKey: string
  printerName: string 
}

interface ModalFormProps {
  isOpen: boolean
  onClose: () => void
}

const ConfigImpresoras: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const [activeConfigs, setActiveConfigs] = useState<ActiveConfig[]>([]); 
  
  const [selectedUseKey, setSelectedUseKey] = useState('') 
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customUse, setCustomUse] = useState('') 

  const [systemPrinters, setSystemPrinters] = useState<string[]>([]); 
  const [selectedPrinterName, setSelectedPrinterName] = useState(''); 

 const loadSystemPrinters = async () => { 
      setIsLoading(true);
      setError(null);
      try {
          const printers = await window.electron.getSystemPrinters(); 
          setSystemPrinters(printers || []);
      } catch (err) {
          setError('Error al cargar impresoras del sistema.');
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  const loadActiveConfigs = async () => {
    const loadedConfigs: ActiveConfig[] = [];
    
    for (const [useName, storeKey] of Object.entries(USE_MAP)) {
      try {
        const config: PrinterConfig = await window.electron.storeGet(storeKey);
        
        if (config && config.name) {
          loadedConfigs.push({
            useName: useName,
            storeKey: storeKey, 
            printerName: config.name, 
          });
        }
      } catch (err) {
        console.error(`Error al cargar configuración para ${useName}:`, err);
      }
    }
    
    setActiveConfigs(loadedConfigs);
  };
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadSystemPrinters(); 
      loadActiveConfigs(); 
    } else {
      document.body.style.overflow = 'auto';
      setSelectedPrinterName(''); 
      setSelectedUseKey('');
      setCustomUse('');
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleVolverAtras = () => {
    onClose()
  }

  const handleSave = async () => {
    if (!selectedPrinterName || !selectedUseKey) { 
        alert("Por favor, selecciona una impresora y un uso.");
        return;
    }
    
    const storeKey = USE_MAP[selectedUseKey];
    const configToSave: PrinterConfig = {
      name: selectedPrinterName, 
      connectionType: 'LOCAL_NAME' 
    };
    
    try {
        await window.electron.storeSet(storeKey, configToSave);        
        alert(`Configuración guardada:\nUso: ${selectedUseKey}\nImpresora: ${selectedPrinterName}`);
        loadActiveConfigs(); 
        setSelectedPrinterName(''); 
        setSelectedUseKey('');
        setCustomUse('');
        
    } catch (error) {
        setError("Error al guardar la configuración en el sistema.");
        console.error(error);
    }
  }

  const handleDeleteConfig = async (configToDelete: ActiveConfig) => {
    if (window.confirm(`¿Estás seguro de que quieres desasignar la impresora ${configToDelete.printerName} del uso ${configToDelete.useName}?`)) {
      try {
        await window.electron.storeDelete(configToDelete.storeKey); 
        alert(`Configuración eliminada para el uso: ${configToDelete.useName}`);
        loadActiveConfigs();
      } catch (error) {
        setError("Error al eliminar la configuración.");
        console.error(error);
      }
    }
  };

  if (!isOpen) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 201
      }}
      onClick={handleVolverAtras}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: 24,
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          minHeight: '40vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}
        >
        
          <button onClick={handleVolverAtras} style={{ background: 'none', border: 'none' }}>
            <ArrowLeft size={24} color="#4B5563" />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
            Configuración de Impresoras
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <div style={{ marginBottom: 24, border: '1px solid #E5E7EB', padding: 16, borderRadius: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                Impresoras Actualmente Configuradas:
            </h3>
            {activeConfigs.length > 0 ? (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {activeConfigs.map((config) => (
                        <li 
                            key={config.useName} 
                            style={{ 
                                marginBottom: 8, 
                                padding: 6, 
                                backgroundColor: '#F9FAFB', 
                                borderRadius: 6, 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <span style={{ fontWeight: 600, color: '#10B981' }}>{config.useName}:</span> {config.printerName}
                            </div>
                            <button 
                                onClick={() => handleDeleteConfig(config)}
                                title={`Eliminar asignación de ${config.useName}`}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    color: '#EF4444' 
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ color: '#6B7280', fontStyle: 'italic' }}>Aún no hay impresoras configuradas.</p>
            )}
        </div>

        {isLoading && <p>Cargando impresoras...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Selector de Impresoras del Sistema */}
        <div style={{ marginBottom: 20 }}>
          <SelectConSearch
            label="Seleccionar Impresora Instalada en Windows (por nombre):"
            options={systemPrinters} 
            value={selectedPrinterName}
            onChange={(name) => {
                setSelectedPrinterName(name);
            }}
          />
          {systemPrinters.length === 0 && !isLoading && !error && (
              <p style={{ color: '#F59E0B', fontSize: 14, marginTop: 10 }}>
                No se detectaron impresoras instaladas en Windows. Asegúrate de que los drivers estén instalados.
              </p>
          )}
        </div>

        {/* Selector de Uso */}
        {selectedPrinterName && ( 
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              ¿Dónde se usará esta impresora? (Para editar, selecciona el uso deseado y guarda)
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.keys(USE_MAP).map((useName) => (
                  <Checkbox
                      key={useName}
                      label={useName}
                      onChange={() => {
                          setSelectedUseKey(useName);
                          setCustomUse('');
                      }}
                      checked={selectedUseKey === useName}
                  />
              ))}

            </div>
            <InputField
              value={customUse}
              label="Otros (No usado para impresión principal)"
              onChange={(e) => {
                setCustomUse(e.target.value)
                setSelectedUseKey('') 
              }}
              placeholder="Otro uso (ej: Bar, Delivery...)"
            />
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <OrangeButton onClick={handleVolverAtras} variacion="claro" label="Cancelar" />
          <OrangeButton
            onClick={handleSave}
            disabled={!selectedPrinterName || (!selectedUseKey)} 
            label="Guardar Configuración"
          />
        </div>
      </div>
    </div>
  )
}

export default ConfigImpresoras


// 'use client'

// import { ArrowLeft, Trash2 } from 'lucide-react'
// import React, { useEffect, useState } from 'react'
// import SelectConSearch from '../SelectConSearch'
// import Checkbox from '../CheckBox'
// import InputField from '../InputField'
// import OrangeButton from '../OrangeButton'

// const USE_MAP = {
//   'Cocina': 'printerConfig_COCINA',
//   'Comandas': 'printerConfig_COMANDAS', 
//   'Tickets en caja': 'printerConfig_CAJA',
//   'Factura': 'printerConfig_FACTURA' 
// }

// interface PrinterConfig {
//   name: string
//   connectionType: 'LOCAL_NAME'
// }

// interface ActiveConfig {
//   useName: string 
//   storeKey: string
//   printerName: string 
// }

// interface ModalFormProps {
//   isOpen: boolean
//   onClose: () => void
// }

// const ConfigImpresoras: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
//   const [activeConfigs, setActiveConfigs] = useState<ActiveConfig[]>([]); 
//   
//   const [selectedUseKey, setSelectedUseKey] = useState('') 
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [customUse, setCustomUse] = useState('') 

//   const [availablePorts, setAvailablePorts] = useState<Array<{ label: string, value: string }>>([]); 
//   const [selectedPrinterPath, setSelectedPrinterPath] = useState(''); 

// // ----------------------------------------------------------------------
// // FUNCIONES DE CARGA
// // ----------------------------------------------------------------------

//  const loadAvailablePorts = async () => { 
//       setIsLoading(true);
//       setError(null);
//       try {
//           const ports = await window.electron.getAvailablePorts(); 
//           setAvailablePorts(ports || []);
//       } catch (err) {
//           setError('Error al cargar puertos seriales.');
//           console.error(err);
//       } finally {
//           setIsLoading(false);
//       }
//   };

//   const loadActiveConfigs = async () => {
//     const loadedConfigs: ActiveConfig[] = [];
//     
//     for (const [useName, storeKey] of Object.entries(USE_MAP)) {
//       try {
//         const config: PrinterConfig = await window.electron.storeGet(storeKey);
//         
//         if (config && config.name) {
//           loadedConfigs.push({
//             useName: useName,
//             storeKey: storeKey, 
//             printerName: config.name,
//           });
//         }
//       } catch (err) {
//         console.error(`Error al cargar configuración para ${useName}:`, err);
//       }
//     }
//     
//     setActiveConfigs(loadedConfigs);
//   };

// // ----------------------------------------------------------------------
// // EFECTOS Y HANDLERS
// // ----------------------------------------------------------------------

//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//       loadAvailablePorts(); 
//       loadActiveConfigs(); 
//     } else {
//       document.body.style.overflow = 'auto';
//       setSelectedPrinterPath('');
//       setSelectedUseKey('');
//       setCustomUse('');
//     }
//     return () => {
//       document.body.style.overflow = 'auto'
//     }
//   }, [isOpen])

//   const handleVolverAtras = () => {
//     onClose()
//   }

//   const handleSave = async () => {
//     // 🚨 CORREGIDO: Usar selectedPrinterPath para la validación y el guardado
//     if (!selectedPrinterPath || !selectedUseKey) { 
//         alert("Por favor, selecciona un puerto y un uso.");
//         return;
//     }
//     
//     const storeKey = USE_MAP[selectedUseKey];
//     const configToSave: PrinterConfig = {
//       name: selectedPrinterPath, // 🚨 CORREGIDO: Guardar la ruta del puerto
//       connectionType: 'LOCAL_NAME' 
//     };
//     
//     try {
//         await window.electron.storeSet(storeKey, configToSave);        
//         alert(`Configuración guardada:\nUso: ${selectedUseKey}\nPuerto: ${selectedPrinterPath}`);
//         loadActiveConfigs(); 
//         setSelectedPrinterPath(''); // 🚨 CORREGIDO: Limpiar la variable correcta
//         setSelectedUseKey('');
//         setCustomUse('');
//         
//     } catch (error) {
//         setError("Error al guardar la configuración en el sistema.");
//         console.error(error);
//     }
//   }

//   const handleDeleteConfig = async (configToDelete: ActiveConfig) => {
//     if (window.confirm(`¿Estás seguro de que quieres desasignar el puerto ${configToDelete.printerName} del uso ${configToDelete.useName}?`)) {
//       try {
//         await window.electron.storeDelete(configToDelete.storeKey); 
//         alert(`Configuración eliminada para el uso: ${configToDelete.useName}`);
//         loadActiveConfigs();
//       } catch (error) {
//         setError("Error al eliminar la configuración.");
//         console.error(error);
//       }
//     }
//   };

//   if (!isOpen) return null

// // ----------------------------------------------------------------------
// // RENDERIZADO (JSX)
// // ----------------------------------------------------------------------
//   return (
//     <div
//       style={{
//         position: 'fixed',
//         inset: 0,
//         backdropFilter: 'blur(8px)',
//         backgroundColor: 'rgba(255, 255, 255, 0.3)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 201
//       }}
//       onClick={handleVolverAtras}
//     >
//       <div
//         style={{
//           backgroundColor: '#ffffff',
//           padding: 24,
//           borderRadius: 20,
//           boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//           width: '100%',
//           maxWidth: 480,
//           maxHeight: '90vh',
//           minHeight: '40vh',
//           overflowY: 'auto',
//           boxSizing: 'border-box'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         
//         <header
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: 24
//           }}
//         >
//         
//           <button onClick={handleVolverAtras} style={{ background: 'none', border: 'none' }}>
//             <ArrowLeft size={24} color="#4B5563" />
//           </button>
//           <h2 style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
//             Configuración de Impresoras
//           </h2>
//           <div style={{ width: 24 }} />
//         </header>

//         <div style={{ marginBottom: 24, border: '1px solid #E5E7EB', padding: 16, borderRadius: 10 }}>
//             <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
//                 Puertos Actualmente Configurados:
//             </h3>
//             {activeConfigs.length > 0 ? (
//                 <ul style={{ listStyleType: 'none', padding: 0 }}>
//                     {activeConfigs.map((config) => (
//                         <li 
//                             key={config.useName} 
//                             style={{ 
//                                 marginBottom: 8, 
//                                 padding: 6, 
//                                 backgroundColor: '#F9FAFB', 
//                                 borderRadius: 6, 
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center'
//                             }}
//                         >
//                             <div>
//                                 <span style={{ fontWeight: 600, color: '#10B981' }}>{config.useName}:</span> {config.printerName}
//                             </div>
//                             <button 
//                                 onClick={() => handleDeleteConfig(config)}
//                                 title={`Eliminar asignación de ${config.useName}`}
//                                 style={{ 
//                                     background: 'none', 
//                                     border: 'none', 
//                                     cursor: 'pointer',
//                                     color: '#EF4444' 
//                                 }}
//                             >
//                                 <Trash2 size={18} />
//                             </button>
//                         </li>
//                     ))}
//                 </ul>
//             ) : (
//                 <p style={{ color: '#6B7280', fontStyle: 'italic' }}>Aún no hay puertos configurados.</p>
//             )}
//         </div>

//         {isLoading && <p>Cargando puertos...</p>}
//         {error && <p style={{ color: 'red' }}>{error}</p>}

//         {/* Selector de Puertos */}
//         <div style={{ marginBottom: 20 }}>
//           <SelectConSearch
//             label="Seleccionar Puerto de Impresora POS:"
//             options={availablePorts.map(p => p.label)} 
//             value={selectedPrinterPath}
//             onChange={(label) => {
//                 const selectedPort = availablePorts.find(p => p.label === label);
//                 setSelectedPrinterPath(selectedPort ? selectedPort.value : '');
//             }}
//           />
//           {availablePorts.length === 0 && !isLoading && !error && (
//               <p style={{ color: '#F59E0B', fontSize: 14, marginTop: 10 }}>
//                 No se detectaron puertos seriales (COM/USB-Serial). Asegúrate de que la impresora esté conectada.
//               </p>
//           )}
//         </div>

//         {/* Selector de Uso */}
//         {selectedPrinterPath && ( // 🚨 CORREGIDO: Condición basada en selectedPrinterPath
//           <div style={{ marginBottom: 20 }}>
//             <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
//               ¿Dónde se usará este puerto? (Para editar, selecciona el uso deseado y guarda)
//             </label>

//             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//               {Object.keys(USE_MAP).map((useName) => (
//                   <Checkbox
//                       key={useName}
//                       label={useName}
//                       onChange={() => {
//                           setSelectedUseKey(useName);
//                           setCustomUse('');
//                       }}
//                       checked={selectedUseKey === useName}
//                   />
//               ))}

//             </div>
//             <InputField
//               value={customUse}
//               label="Otros (No usado para impresión principal)"
//               onChange={(e) => {
//                 setCustomUse(e.target.value)
//                 setSelectedUseKey('') 
//               }}
//               placeholder="Otro uso (ej: Bar, Delivery...)"
//             />
//           </div>
//         )}

//         {/* Botones */}
//         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
//           <OrangeButton onClick={handleVolverAtras} variacion="claro" label="Cancelar" />
//           <OrangeButton
//             onClick={handleSave}
//             disabled={!selectedPrinterPath || (!selectedUseKey)} // 🚨 CORREGIDO: Deshabilitar basado en selectedPrinterPath
//             label="Guardar Configuración"
//           />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ConfigImpresoras


// 'use client'

// import { ArrowLeft, Trash2 } from 'lucide-react'
// import React, { useEffect, useState } from 'react'
// import SelectConSearch from '../SelectConSearch'
// import Checkbox from '../CheckBox'
// import InputField from '../InputField'
// import OrangeButton from '../OrangeButton'


// // ====== MAPEO DE USOS ======
// const USE_MAP = {
//   'Cocina': 'printerConfig_COCINA',
//   'Comandas': 'printerConfig_COMANDAS', 
//   'Tickets en caja': 'printerConfig_CAJA',
//   'Factura': 'printerConfig_FACTURA' 
// }

// // ====== INTERFACES ======
// interface PrinterConfig {
//   name: string
//   connectionType: 'LOCAL_NAME'
// }

// interface ActiveConfig {
//   useName: string 
//   storeKey: string
//   printerName: string 
// }

// interface ModalFormProps {
//   isOpen: boolean
//   onClose: () => void
// }

// const ConfigImpresoras: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
// //   const [systemPrinters, setSystemPrinters] = useState<string[]>([]) 
//   const [activeConfigs, setActiveConfigs] = useState<ActiveConfig[]>([]); 
//   
//   const [selectedPrinter, setSelectedPrinter] = useState('')
//   const [selectedUseKey, setSelectedUseKey] = useState('') 
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [customUse, setCustomUse] = useState('') 


//   const [availablePorts, setAvailablePorts] = useState<Array<{ label: string, value: string }>>([]); 
//   const [selectedPrinterPath, setSelectedPrinterPath] = useState(''); // Usaremos 'selectedPrinterPath'


//   // ====== FUNCIONES DE CARGA ======

//  const loadAvailablePorts = async () => { 
//       setIsLoading(true);
//       setError(null);
//       try {
//           const ports = await window.electron.getAvailablePorts(); 
//           setAvailablePorts(ports || []);
//       } catch (err) {
//           setError('Error al cargar puertos seriales.');
//           console.error(err);
//       } finally {
//           setIsLoading(false);
//       }
//   };

// //   const loadSystemPrinters = async () => {
// //       setIsLoading(true);
// //       setError(null);
// //       try {
// //           const printers = await window.electron.getSystemPrinters();
// //           setSystemPrinters(printers || []);
// //       } catch (err) {
// //           setError('Error al cargar impresoras del sistema.');
// //           console.error(err);
// //       } finally {
// //           setIsLoading(false);
// //       }
// //   };

//   const loadActiveConfigs = async () => {
//     const loadedConfigs: ActiveConfig[] = [];
//     
//     for (const [useName, storeKey] of Object.entries(USE_MAP)) {
//       try {
//         const config: PrinterConfig = await window.electron.storeGet(storeKey);
//         
//         if (config && config.name) {
//           loadedConfigs.push({
//             useName: useName,
//             storeKey: storeKey, 
//             printerName: config.name,
//           });
//         }
//       } catch (err) {
//         console.error(`Error al cargar configuración para ${useName}:`, err);
//       }
//     }
//     
//     setActiveConfigs(loadedConfigs);
//   };

//   // ====== EFECTO DE APERTURA DEL MODAL ======
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
// //       loadSystemPrinters(); 
//       loadAvailablePorts(); 
//       loadActiveConfigs(); 
//     } else {
//       document.body.style.overflow = 'auto';
// //       setSelectedPrinter('');
//       setSelectedPrinterPath('');

//       setSelectedUseKey('');
//       setCustomUse('');
//     }
//     return () => {
//       document.body.style.overflow = 'auto'
//     }
//   }, [isOpen])

//   const handleVolverAtras = () => {
//     onClose()
//   }

//   // ====== FUNCIÓN DE GUARDAR / EDITAR ======
//   const handleSave = async () => {
//     if (!selectedPrinter || !selectedUseKey) {
//         alert("Por favor, selecciona una impresora y un uso.");
//         return;
//     }
//     const storeKey = USE_MAP[selectedUseKey];
//     const configToSave: PrinterConfig = {
//       name: selectedPrinter,
//       connectionType: 'LOCAL_NAME' 
//     };
//     
//     try {
//         await window.electron.storeSet(storeKey, configToSave);        
//         alert(`Configuración guardada:\nUso: ${selectedUseKey}\nImpresora: ${selectedPrinter}`);
//         loadActiveConfigs(); 
//         setSelectedPrinter('');
//         setSelectedUseKey('');
//         setCustomUse('');
//         
//     } catch (error) {
//         setError("Error al guardar la configuración en el sistema.");
//         console.error(error);
//     }
//   }

//   // ====== FUNCIÓN DE ELIMINAR / DESASIGNAR ======
//   const handleDeleteConfig = async (configToDelete: ActiveConfig) => {
//     if (window.confirm(`¿Estás seguro de que quieres desasignar la impresora ${configToDelete.printerName} del uso ${configToDelete.useName}?`)) {
//       try {
//         await window.electron.storeDelete(configToDelete.storeKey); 
//         alert(`Configuración eliminada para el uso: ${configToDelete.useName}`);
//         loadActiveConfigs();
//       } catch (error) {
//         setError("Error al eliminar la configuración.");
//         console.error(error);
//       }
//     }
//   };

//   if (!isOpen) return null

//   // ====== RENDERIZADO (JSX) ======
//   return (
//     <div
//       style={{
//         position: 'fixed',
//         inset: 0,
//         backdropFilter: 'blur(8px)',
//         backgroundColor: 'rgba(255, 255, 255, 0.3)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 201
//       }}
//       onClick={handleVolverAtras}
//     >
//       <div
//         style={{
//           backgroundColor: '#ffffff',
//           padding: 24,
//           borderRadius: 20,
//           boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//           width: '100%',
//           maxWidth: 480,
//           maxHeight: '90vh',
//           minHeight: '40vh',
//           overflowY: 'auto',
//           boxSizing: 'border-box'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <header
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: 24
//           }}
//         >
//         
//           <button onClick={handleVolverAtras} style={{ background: 'none', border: 'none' }}>
//             <ArrowLeft size={24} color="#4B5563" />
//           </button>
//           <h2 style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
//             Configuración de Impresoras
//           </h2>
//           <div style={{ width: 24 }} />
//         </header>

//         <div style={{ marginBottom: 24, border: '1px solid #E5E7EB', padding: 16, borderRadius: 10 }}>
//             <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
//                 Impresoras Actualmente Configuradas:
//             </h3>
//             {activeConfigs.length > 0 ? (
//                 <ul style={{ listStyleType: 'none', padding: 0 }}>
//                     {activeConfigs.map((config) => (
//                         <li 
//                             key={config.useName} 
//                             style={{ 
//                                 marginBottom: 8, 
//                                 padding: 6, 
//                                 backgroundColor: '#F9FAFB', 
//                                 borderRadius: 6, 
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center'
//                             }}
//                         >
//                             <div>
//                                 <span style={{ fontWeight: 600, color: '#10B981' }}>{config.useName}:</span> {config.printerName}
//                             </div>
//                             <button 
//                                 onClick={() => handleDeleteConfig(config)}
//                                 title={`Eliminar asignación de ${config.useName}`}
//                                 style={{ 
//                                     background: 'none', 
//                                     border: 'none', 
//                                     cursor: 'pointer',
//                                     color: '#EF4444' 
//                                 }}
//                             >
//                                 <Trash2 size={18} />
//                             </button>
//                         </li>
//                     ))}
//                 </ul>
//             ) : (
//                 <p style={{ color: '#6B7280', fontStyle: 'italic' }}>Aún no hay impresoras configuradas.</p>
//             )}
//         </div>

//         {isLoading && <p>Cargando impresoras...</p>}
//         {error && <p style={{ color: 'red' }}>{error}</p>}

//         {/* Selector de Impresoras */}
// {/*         <div style={{ marginBottom: 20 }}>
//           <SelectConSearch
//             label="Seleccionar impresora detectada:"
//             options={systemPrinters} 
//             value={selectedPrinter}
//             onChange={(e) => setSelectedPrinter(e)}
//           />
//           {systemPrinters.length === 0 && !isLoading && !error && (
//               <p style={{ color: '#F59E0B', fontSize: 14, marginTop: 10 }}>
//                 No se detectaron impresoras locales. Asegúrate de que estén instaladas en el sistema.
//               </p>
//           )}
//         </div> */}


//   {/* Selector de Impresoras / Puertos */}
//         <div style={{ marginBottom: 20 }}>
//           <SelectConSearch
//             label="Seleccionar Puerto de Impresora POS:"
//             // 🚨 Mapeamos los puertos al formato de opciones si no vienen así
//             options={availablePorts.map(p => p.label)} 
//             value={selectedPrinterPath}
//             // 🚨 Cuando cambia, guardamos el VALOR real (port.path)
//             onChange={(label) => {
//                 const selectedPort = availablePorts.find(p => p.label === label);
//                 setSelectedPrinterPath(selectedPort ? selectedPort.value : ''); // Guardar 'COM7'
//             }}
//           />
//           {availablePorts.length === 0 && !isLoading && !error && (
//               <p style={{ color: '#F59E0B', fontSize: 14, marginTop: 10 }}>
//                 No se detectaron puertos seriales (COM/USB-Serial). Asegúrate de que la impresora esté conectada.
//               </p>
//           )}
//         </div>





//         {/* Selector de Uso */}
//         {selectedPrinter && (
//           <div style={{ marginBottom: 20 }}>
//             <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
//               ¿Dónde se usará esta impresora? (Para editar, selecciona el uso deseado y guarda)
//             </label>

//             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//               {Object.keys(USE_MAP).map((useName) => (
//                   <Checkbox
//                       key={useName}
//                       label={useName}
//                       onChange={() => {
//                           setSelectedUseKey(useName);
//                           setCustomUse('');
//                       }}
//                       checked={selectedUseKey === useName}
//                   />
//               ))}

//             </div>
//             <InputField
//               value={customUse}
//               label="Otros (No usado para impresión principal)"
//               onChange={(e) => {
//                 setCustomUse(e.target.value)
//                 setSelectedUseKey('') 
//               }}
//               placeholder="Otro uso (ej: Bar, Delivery...)"
//             />
//           </div>
//         )}

//         {/* Botones */}
//         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
//           <OrangeButton onClick={handleVolverAtras} variacion="claro" label="Cancelar" />
//           <OrangeButton
//             onClick={handleSave}
//             disabled={!selectedPrinter || (!selectedUseKey)} 
//             label="Guardar Configuración"
//           />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ConfigImpresoras