import { useNavigate } from 'react-router-dom'
import '../styles/tailwind.css'
import { FONDO, FONDO_COMPONENTES, ORANGE } from '../styles/colors'
import { useEffect, useState } from 'react'
import { formatearPedidos, IPedidos, usePedidosStore } from '../store/pedidosStore'
import OrangeButton from '../components/OrangeButton'
import FormCancelacion from '../features/listaDePedidos/FormCancelacion'
import { useAuthStore } from '../store/authStore'
import { useConfirm } from '../components/confirmModal'
import { Box, CircleDollarSign, Flag, RefreshCcw } from 'lucide-react'
import Spinner from '../components/feedback/Spinner'
import { conectarSocket } from '../helpers/socket'
import { getUserInfo } from '../helpers/getuserInfo'
import { Lock } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import FormCierreCaja from '../features/listaDePedidos/FormCierreDeCaja'
import FormAperturaDeCaja from '../features/listaDePedidos/FormAperturaDeCaja'

import { useCajaStore } from '../store/cajaStore'
import { toast } from 'sonner'
import FormExtraMoney from '../components/FormIngresosEgresos'
import PdfViewer from '../helpers/pdfViewer'
import ImprimirTicket from '../components/ImprimirPedido'
import CajaStatus from '../features/listaDePedidos/CajaStatus'
import ConfigImpresoras from '../components/modales/ConfigImpresoras'
import './listapedidos.css'

export interface UsuarioData {
  id: string
  establecimiento_id: string
  rol: string
  // agrega otras propiedades si es necesario
}
export default function Pedidos() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { traerCajaActiva, cajaActiva, generarTicketX, loading: loadingCaja } = useCajaStore()
  const { traerPedidos, pedidos, loading } = usePedidosStore()

  const [cancelarOpen, setCancelarOpen] = useState<boolean>(false)
  const [cierreDeCajaModalOpen, setCierreDeCajaModalOpen] = useState<boolean>(false)
  const [aperturaDeCajaModalOpen, setAperturaDeCajaModalOpen] = useState<boolean>(false)
  const [configImpresorasOpen, setConfigImpresorasOpen] = useState<boolean>(false)

  const [rol, setRol] = useState<string>('')
  const [blobPdf, setBlobPdf] = useState<Blob | null>(null)

  const [idCancelar, setIdCancelar] = useState<string>('')
  const [pedidosGuardados, setPedidosGuardados] = useState<any[]>([])
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<IPedidos | null>()
  const [ingresosEgresosOpen, setIngresosEgresosOpen] = useState<boolean>(false)
  const [pedidosImpresos, setPedidosImpresos] = useState<Record<string, boolean>>({})

  const { logout } = useAuthStore()

  const getUser = async () => {
    const user = await getUserInfo()
    if (!user) {
      return
    }
    if (user.rol === 'MESERO') {
      navigate('/mesero')
    }
    setRol(user.rol)
  }

  useEffect(() => {
    getUser()
    handleFetch()
    traerCajaActiva()
  }, [])

  //Conexion con web socket
  useEffect(() => {
    async function init() {
      const user = await getUserInfo()
      if (!user?.establecimiento_id) return

      const socket = await conectarSocket(user.establecimiento_id)
      socket.on('pedidoCreated', ({ pedidoId }) => {
        console.warn('[WS] Nuevo pedido recibido:', pedidoId)
        usePedidosStore.getState().traerPedidos()
      })

      socket.on('pedidos_actualizados', (nuevosPedidos: any[]) => {
        const pedidosFormateados = formatearPedidos(nuevosPedidos)
        const pedidosFiltrados = pedidosFormateados.filter(
          (pedido) => pedido.estado !== 'PAGADO' && pedido.estado !== 'CANCELADO'
        )
        usePedidosStore.setState({ pedidos: pedidosFiltrados })
      })
    }

    init()
  }, [])

  const handleCancelPedido = async (_razon: string) => {
    await usePedidosStore.getState().actualizarEstadoPedido(idCancelar, 'CANCELADO')
  }

  useEffect(() => {
    const checkPedidosEnProceso = async () => {
      const all = (await window.electron.storeGetAll()) as Record<string, any>

      const pedidosEnProceso = Object.entries(all)
        .filter(([key]) => key.startsWith('respaldo_'))
        .map(([_, value]) => value)

      if (pedidosEnProceso.length > 0) {
        const confirmado = await confirm({
          title: 'Hay pedidos en proceso de pago',
          description: '¿Deseas continuar con el pago del pedido pendiente?',
          confirmText: 'Sí, continuar',
          cancelText: 'No, guardar como pendiente'
        })

        if (confirmado) {
          const pedido = pedidosEnProceso[0].pedido
          navigate('/pagar', { state: { pedido } })
          window.location.reload()
        } else {
          // Marcar como pendiente visualmente
          setPedidosGuardados(pedidosEnProceso)
        }
      }
    }
    checkPedidosEnProceso()
  }, [])

  const handleEliminarPedidoPendiente = async (pedidoId: string) => {
    const confirmado = await confirm({
      title: '¿Cancelar proceso de pago?',
      description:
        '¿Estás seguro de que quieres cancelar el proceso de pago de este pedido? Podria no cuadrar los pagos y se notificara al administrador',
      confirmText: 'Sí, cancelar',
      cancelText: 'No'
    })

    if (!confirmado) return

    if (!pedidoId) {
      toast.error('No se encontro el id del pedido')
      return
    }

    await window.electron.storeDelete(`respaldo_${pedidoId}`)

    setPedidosGuardados((prev) => prev.filter((pedido) => pedido.pedido.id !== pedidoId))
  }

  const handleImpresionExitosa = (pedidoId: string) => {
    setPedidosImpresos((prev) => ({ ...prev, [pedidoId]: true }))
  }

  const handleLogout = async () => {
    const confirmado = await confirm({
      title: '¿Deseas cerrar sesión?',
      description: 'Deberás volver a ingresar tus credenciales',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar'
    })
    if (confirmado) {
      await logout()
      navigate('/')
    }
  }

  const handleFetch = () => {
    traerPedidos()
  }

  const handleBotonCajaClick = () => {
    if (cajaActiva) {
      setCierreDeCajaModalOpen(true)
    } else {
      setAperturaDeCajaModalOpen(true)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: FONDO,
        fontFamily: 'Lato, sans-serif',
        padding: 32,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ margin: '0 auto' }}>
        <header className="header">
          <h2>Lista de Pedidos</h2>
          <CajaStatus cajaActiva={cajaActiva} />

          <div className="header-buttons">
            {loading ? (
              <h1>Cargando...</h1>
            ) : (
              <>
                <span data-tooltip-id="tooltip" data-tooltip-content="Refrescar">
                  <RefreshCcw className="icon-button" onClick={handleFetch} />
                </span>

                <span data-tooltip-id="tooltip" data-tooltip-content="Abrir/Cerrar Caja">
                  <Lock
                    className="icon-button"
                    color={cajaActiva ? 'green' : 'red'}
                    onClick={handleBotonCajaClick}
                  />
                </span>

                {rol === 'ADMIN' && (
                  <div onClick={() => navigate('/cierre-caja')}>
                    <span data-tooltip-id="tooltip" data-tooltip-content="Lista de cierres de caja">
                      <Box className="icon-button" />
                    </span>
                  </div>
                )}

                <span data-tooltip-id="tooltip" data-tooltip-content="Ingresos Egresos">
                  <CircleDollarSign
                    className="icon-button"
                    onClick={() => setIngresosEgresosOpen(true)}
                  />
                </span>

                <span data-tooltip-id="tooltip" data-tooltip-content="Reporte de caja">
                  <Flag
                    className="icon-button"
                    onClick={async () => {
                      const blob = await generarTicketX()
                      setBlobPdf(blob)
                    }}
                  />
                  <PdfViewer blob={blobPdf} />
                </span>

                <OrangeButton
                  label="IMPRESORAS"
                  variacion="claro"
                  onClick={() => setConfigImpresorasOpen(true)}
                />
                <ConfigImpresoras
                  onClose={() => setConfigImpresorasOpen(false)}
                  isOpen={configImpresorasOpen}
                />

                <OrangeButton
                  label="Agregar Pedido"
                  onClick={() => {
                    if (!cajaActiva) {
                      toast.error('Debes abrir la caja primero')
                      setAperturaDeCajaModalOpen(true)
                      return
                    }
                    navigate('/creacion-de-pedidos')
                  }}
                />
                <OrangeButton label="Cerrar Sesión" variacion="claro" onClick={handleLogout} />

                <Tooltip id="tooltip" place="bottom" />
              </>
            )}
          </div>
        </header>

        {['MESA', 'PARA_LLEVAR', 'DOMICILIO'].map((tipo) => {
          const pedidosFiltrados = pedidos.filter((p) => p.tipo_pedido === tipo)
          if (pedidosFiltrados.length === 0) {
            const titulo =
              tipo === 'MESA'
                ? '🪑 Pedidos en Mesa'
                : tipo === 'PARA_LLEVAR'
                  ? '🥡 Pedidos Para Llevar'
                  : '🛵 Pedidos a Domicilio'

            const mensaje =
              tipo === 'MESA'
                ? 'No hay pedidos en mesa por ahora.'
                : tipo === 'PARA_LLEVAR'
                  ? 'No hay pedidos para llevar todavía.'
                  : 'No hay pedidos a domicilio por el momento.'

            return (
              <div key={tipo} style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 16,
                    borderBottom: '2px solid #E5E7EB',
                    paddingBottom: 8
                  }}
                >
                  {titulo}
                </h2>
                <div
                  style={{
                    backgroundColor: FONDO_COMPONENTES,
                    borderRadius: 24,
                    padding: 24,
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: 16,
                    maxWidth: 800,
                    margin: '0 auto'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={ORANGE}
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      style={{ marginRight: 8 }}
                    >
                      <path d="M6 2L3 6v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4H6zM5 6h14v14H5V6zm7 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                    <span style={{ fontWeight: 600 }}>{mensaje}</span>
                  </div>
                </div>
              </div>
            )
          }

          const titulo =
            tipo === 'MESA'
              ? '🪑 Pedidos en Mesa'
              : tipo === 'PARA_LLEVAR'
                ? '🥡 Pedidos Para Llevar'
                : '🛵 Pedidos a Domicilio'

          return (
            <div key={tipo} style={{ marginBottom: 48 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 16,
                  borderBottom: '2px solid #E5E7EB',
                  paddingBottom: 8
                }}
              >
                {titulo}
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 24
                }}
              >
                {pedidosFiltrados.map((pedido) => {
                  const estaImpreso = pedidosImpresos[pedido.id] === true
                  const mensajeImpresion = estaImpreso ? 'Orden impresa' : 'Orden por imprimir'
                  const colorMensaje = estaImpreso ? '#10B981' : '#F59E0B' // Verde o Ámbar

                  return (
                    <div
                      key={pedido.id}
                      style={{
                        backgroundColor: FONDO_COMPONENTES,
                        border: `2px solid ${pedido.estado === 'FINALIZADO' ? ORANGE : '#D1D5DB'}`,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        borderRadius: 24,
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: 300,
                        maxWidth: 350,
                        width: '100%',
                        cursor: 'pointer'
                      }}
                      onClick={() => setPedidoSeleccionado(pedido)}
                    >
                      {/* Contenedor de productos con fade */}
                      <div
                        style={{
                          maxHeight: 220,
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <ImprimirTicket
                          pedido={pedido}
                          onImpresionExitosa={() => handleImpresionExitosa(pedido.id)}
                        />

                        <h3
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: '#333',
                            marginBottom: 12
                          }}
                        >
                          {pedido.tipo_pedido === 'MESA'
                            ? pedido.mesa_numero
                            : pedido.tipo_pedido === 'PARA_LLEVAR'
                              ? 'Para llevar'
                              : 'Domicilio'}
                        </h3>

                        <div style={{ fontSize: 12, fontWeight: 'bold', color: colorMensaje }}>
                          {mensajeImpresion}
                        </div>

                        <h4
                          style={{ fontSize: 16, fontWeight: 500, color: '#333', marginBottom: 12 }}
                        >
                          Estado: {pedido.estado}
                        </h4>

                        {pedido.tipo_pedido === 'DOMICILIO' && (
                          <div style={{ marginBottom: 12, fontSize: 14, color: '#374151' }}>
                            <p>
                              <strong>Nombre:</strong> {pedido.cliente_nombre}
                            </p>
                            <p>
                              <strong>Celular:</strong> {pedido.cliente_telefono}
                            </p>
                            <p>
                              <strong>Dirección:</strong> {pedido.cliente_direccion}
                            </p>
                          </div>
                        )}

                        <div>
                          {pedido.pedidoItems.map((item, indx) => (
                            <div
                              key={indx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                                borderBottom: '1px solid #E5E7EB',
                                paddingBottom: 6,
                                marginBottom: 6,
                                flexWrap: 'wrap'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  width: '100%'
                                }}
                              >
                                <span>{item.nombre}</span>
                                <span style={{ fontWeight: 600 }}>x{item.cantidad}</span>
                              </div>

                              {item.tipo === 'configurable' &&
                                Array.isArray(item.opcionesSeleccionadas) &&
                                item.opcionesSeleccionadas.length > 0 && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#6B7280',
                                      marginLeft: 16,
                                      width: '100%'
                                    }}
                                  >
                                    {item.opcionesSeleccionadas.map((opcion, opIndex) => (
                                      <p key={opIndex} style={{ margin: '2px 0' }}>
                                        - {opcion.nombreOpcion}: {opcion.valor}
                                      </p>
                                    ))}
                                  </div>
                                )}

                            {item.notas && (
                              <em
                                style={{
                                  fontSize: 12,
                                  color: '#6B7280',
                                  fontStyle: 'italic',
                                  marginTop: 2,
                                  width: '100%'
                                }}
                              >
                                Nota: {item.notas}
                              </em>
                            )}
                          </div>
                        ))}
                        </div>

                        {/* Fade gradient */}
                        {pedido.pedidoItems.length > 3 && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 24,
                              background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))'
                            }}
                          />
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          marginTop: 12
                        }}
                      >
                        <OrangeButton
                          label="Cancelar"
                          onClick={(e) => {
                            e.stopPropagation()

                            setCancelarOpen(true)
                            setIdCancelar(pedido.id)
                          }}
                          variacion="peligro"
                        />

                        <OrangeButton
                          label="Editar"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/creacion-de-pedidos', { state: { pedido } })
                          }}
                          variacion="claro"
                        />
                        <OrangeButton
                          label="Pagar"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!cajaActiva) {
                              toast.error('Debes abrir la caja primero')
                              setAperturaDeCajaModalOpen(true)
                              return
                            }
                            navigate('/pagar', { state: { pedido } })
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* //MODAL DE INFO DE PEDIDO */}
                {pedidoSeleccionado && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backdropFilter: 'blur(6px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      padding: '16px' // evita que se pegue a los bordes en pantallas pequeñas
                    }}
                    onClick={() => setPedidoSeleccionado(null)}
                  >
                    <div
                      style={{
                        backgroundColor: '#fff',
                        padding: 24,
                        borderRadius: 16,
                        boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                        maxWidth: 400,
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #E5E7EB', // sutil borde para dar más profundidad
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px' // separación consistente entre secciones
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          paddingBottom: 8,
                          marginBottom: 8
                        }}
                      >
                        <h2 style={{ margin: 0, fontSize: 22, color: '#111827' }}>
                          Mesa {pedidoSeleccionado.mesa_numero}
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                          Estado: <strong>{pedidoSeleccionado.estado}</strong>
                        </p>
                      </div>

                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#111827' }}>
                          Productos:
                        </h3>
                        {pedidoSeleccionado.pedidoItems.map((item, indx) => (
                          <div
                            key={indx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              fontSize: 14,
                              borderBottom: '1px solid #F3F4F6',
                              paddingBottom: 6,
                              marginBottom: 6
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%',
                                fontWeight: 500,
                                color: '#111827'
                              }}
                            >
                              <span>{item.nombre}</span>
                              <span style={{ fontWeight: 600 }}>x{item.cantidad}</span>
                            </div>

                            {item.tipo === 'configurable' &&
                              Array.isArray(item.opcionesSeleccionadas) &&
                              item.opcionesSeleccionadas.length > 0 && (
                                <div style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                                  {item.opcionesSeleccionadas.map((opcion, opIndex) => (
                                    <p key={opIndex} style={{ margin: '2px 0' }}>
                                      - {opcion.nombreOpcion}: {opcion.valor}
                                    </p>
                                  ))}
                                </div>
                              )}

                            {item.notas && (
                              <em
                                style={{
                                  fontSize: 12,
                                  color: '#6B7280',
                                  fontStyle: 'italic',
                                  marginTop: 2
                                }}
                              >
                                Nota: {item.notas}
                              </em>
                            )}
                          </div>
                        ))}
                      </div>

                      <OrangeButton label="Cerrar" onClick={() => setPedidoSeleccionado(null)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {pedidosGuardados.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 16,
                borderBottom: '2px solid #E5E7EB',
                paddingBottom: 8
              }}
            >
              💳 Pedidos por pagar
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {pedidosGuardados.map((ped) => (
                <div
                  key={ped.pedido.id}
                  style={{
                    position: 'relative',
                    backgroundColor: FONDO_COMPONENTES,
                    border: `2px dashed ${ORANGE}`,
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
                    borderRadius: 24,
                    padding: 24,
                    height: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <button
                    onClick={() => handleEliminarPedidoPendiente(ped.pedido.id)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 12,
                      background: 'transparent',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: '#DC2626',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    aria-label="Eliminar pedido pendiente"
                  >
                    ×
                  </button>

                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                    Pedido #{ped.pedido_id}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6B7280' }}>
                    Estado: <strong>Pendiente de pago</strong>
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <OrangeButton
                      label="Reanudar pago"
                      onClick={() => {
                        const pedido = ped.pedido
                        navigate('/pagar', { state: { pedido } })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <FormExtraMoney
          onClose={() => setIngresosEgresosOpen(false)}
          isOpen={ingresosEgresosOpen}
        />
        <FormCancelacion
          onClose={() => setCancelarOpen(false)}
          onSave={(razon) => handleCancelPedido(razon)}
          isOpen={cancelarOpen}
        />
        <FormAperturaDeCaja
          onClose={() => setAperturaDeCajaModalOpen(false)}
          isOpen={aperturaDeCajaModalOpen}
        />
        <FormCierreCaja
          onClose={() => setCierreDeCajaModalOpen(false)}
          isOpen={cierreDeCajaModalOpen}
          onSave={(e) => setBlobPdf(e)}
        />
      </div>
      {loading && <Spinner />}
      {loadingCaja && <Spinner />}
    </div>
  )
}