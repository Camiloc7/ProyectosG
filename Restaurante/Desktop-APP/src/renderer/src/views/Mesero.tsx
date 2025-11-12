import { useNavigate } from 'react-router-dom'
import '../styles/tailwind.css'
import { FONDO, FONDO_COMPONENTES, ORANGE } from '../styles/colors'
import { useEffect, useState } from 'react'
import { IPedidos, usePedidosStore } from '../store/pedidosStore'
import OrangeButton from '../components/OrangeButton'
import { useAuthStore } from '../store/authStore'
import { useConfirm } from '../components/confirmModal'
import { RefreshCcw } from 'lucide-react'
import Spinner from '../components/feedback/Spinner'
import { conectarSocket } from '../helpers/socket'
import { getUserInfo } from '../helpers/getuserInfo'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import PedidoInfoModal from '../components/PedidoInfoModa'
import { useFacturasStore } from '../store/facturasStore'
// import { useCajaStore } from '../store/cajaStore'
export interface UsuarioData {
  id: string
  establecimiento_id: string
  rol: string
}
export default function Mesero() {
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { pedidosMeseros, loading, traerListaPedidos, actualizarEstadoPedido } = usePedidosStore()
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<IPedidos | null>()
  const [pedidosMesa, setPedidosMesa] = useState<IPedidos[]>([])
  const { imprimirComanda, loading: loadingFacturas } = useFacturasStore()
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string>('')

  const handleImprimir = async (id: string) => {
    try {
      const pdfBlob = await imprimirComanda(id)

      if (pdfBlob instanceof Blob && pdfBlob.type === 'application/pdf') {
        const url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)
        setShowPdfModal(true)
      }
    } catch (err) {
      console.error('Error al invocar impresión:', err)
    }
  }

  const { logout } = useAuthStore()

  useEffect(() => {
    // traerCajaActiva()

    handleFetch()
  }, [])

  useEffect(() => {
    const filtradosYOrdenados = pedidosMeseros
      .filter((p) => p.tipo_pedido === 'MESA' || p.tipo_pedido === 'PARA_LLEVAR')
      .sort((a, b) =>
        a.estado === 'LISTO_PARA_ENTREGAR' ? -1 : b.estado === 'LISTO_PARA_ENTREGAR' ? 1 : 0
      )
    setPedidosMesa(filtradosYOrdenados)
  }, [pedidosMeseros])

  //Conexion con web socket
  useEffect(() => {
    let socket: any

    async function init() {
      const user = await getUserInfo()
      if (!user?.establecimiento_id) return

      socket = await conectarSocket(user.establecimiento_id)

      socket.on('pedidoStatusUpdated', ({ pedidoId, newStatus }) => {
        console.warn('[WS] Estado de pedido actualizado:', pedidoId, newStatus)
        traerListaPedidos()
      })

      socket.on('pedidoCreated', ({ pedidoId }) => {
        console.warn('[WS] Nuevo pedido creado:', pedidoId)
        traerListaPedidos()
      })
    }

    init()

    return () => {
      if (socket) {
        socket.off('pedidoStatusUpdated')
        socket.off('pedidoCreated')
        socket.off('pedidos_actualizados')
      }
    }
  }, [])

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
    traerListaPedidos()
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
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            color: '#333'
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: '#333'
            }}
          >
            Lista de Pedidos para MESERO
          </h2>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Refrescar */}
            {loading ? (
              <h1>Cargando...</h1>
            ) : (
              <>
                <span data-tooltip-id="tooltip" data-tooltip-content="Refrescar">
                  <RefreshCcw
                    onClick={handleFetch}
                    style={{ cursor: 'pointer', color: '#666' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#28a745')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
                  />
                </span>
              </>
            )}

            {/* Botones tradicionales */}
            <OrangeButton label="Agregar Pedido" onClick={() => navigate('/creacion-de-pedidos')} />
            <OrangeButton label="Cerrar Sesión" variacion="claro" onClick={handleLogout} />

            {/* Tooltip global */}
            <Tooltip id="tooltip" place="bottom" />
          </div>
        </header>
        {/* ================= Pedidos de Mesa ================= */}
        {/* //En caso de que no haya nada:  */}
        {pedidosMesa.length === 0 && (
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
              <span style={{ fontWeight: 600 }}>No hay pedidos en mesa por ahora.</span>
            </div>
          </div>
        )}

        {/* cards de pedidos */}
        {pedidosMesa.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
              padding: 12
            }}
          >
            {pedidosMesa.map((pedido) => (
              <div
                key={pedido.id}
                style={{
                  // backgroundColor: pedido.estado === 'LISTO_PARA_ENTREGAR' ? '#ECFDF5' : '#FFFFFF',
                  backgroundColor: '#FFFFFF',
                  position: 'relative',

                  border: `2px solid ${
                    pedido.estado === 'LISTO_PARA_ENTREGAR'
                      ? '#22C55E'
                      : pedido.estado === 'FINALIZADO'
                        ? '#F97316'
                        : '#D1D5DB'
                  }`,
                  boxShadow:
                    pedido.estado === 'LISTO_PARA_ENTREGAR'
                      ? '0 8px 20px rgba(34,197,94,0.2)'
                      : '0 4px 15px rgba(0,0,0,0.08)',
                  borderRadius: 20,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 300,
                  maxWidth: 350,
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => setPedidoSeleccionado(pedido)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow =
                    pedido.estado === 'LISTO_PARA_ENTREGAR'
                      ? '0 8px 20px rgba(34,197,94,0.2)'
                      : '0 4px 15px rgba(0,0,0,0.08)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImprimir(pedido.id)
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#6B7280',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#F97316')} // naranja
                  onMouseOut={(e) => (e.currentTarget.style.color = '#6B7280')}
                  aria-label="Imprimir comanda"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                  </svg>
                </button>

                {/* Título de mesa */}
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                  {pedido.mesa_numero || 'Para llevar'}
                </h3>

                {/* Estado */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 25,
                    backgroundColor:
                      pedido.estado === 'LISTO_PARA_ENTREGAR' ? '#22C55E' : '#F3F4F6',
                    marginBottom: 14
                  }}
                >
                  <span
                    style={{
                      color: pedido.estado === 'LISTO_PARA_ENTREGAR' ? '#FFFFFF' : '#374151',
                      fontWeight: 500,
                      fontSize: 13
                    }}
                  >
                    {pedido.estado}
                  </span>
                </div>

                {/* Lista de items */}
                <div style={{ maxHeight: 200, overflow: 'hidden', position: 'relative' }}>
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
                      <span>{item.nombre}</span>
                      <span style={{ fontWeight: 600 }}>x{item.cantidad}</span>

                      {item.notas && (
                        <em style={{ fontSize: 12, color: '#6B7280', width: '100%', marginTop: 2 }}>
                          Nota: {item.notas}
                        </em>
                      )}
                    </div>
                  ))}

                  {/* Fade gradient */}
                  {pedido.pedidoItems.length > 3 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 24,
                        background: 'linear-gradient(rgba(255,255,255,0), #FFFFFF)'
                      }}
                    />
                  )}
                </div>

                {/* Botones */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12
                  }}
                >
                  {pedido.estado === 'LISTO_PARA_ENTREGAR' && (
                    <OrangeButton
                      label="Marcar como entregado"
                      onClick={(e) => {
                        e.stopPropagation()
                        actualizarEstadoPedido(pedido.id, 'ENTREGADO')
                      }}
                    />
                  )}
                  {pedido.estado !== 'LISTO_PARA_ENTREGAR' && (
                    <OrangeButton
                      label="Editar"
                      variacion="claro"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/creacion-de-pedidos', { state: { pedido } })
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {loadingFacturas && <Spinner />}

        {showPdfModal && pdfUrl && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: '#fff',
                width: '80%',
                height: '80%',
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: 8, textAlign: 'right' }}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 18,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPdfModal(false)
                  }}
                >
                  ✖
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  title="Factura PDF"
                  style={{ border: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de info de pedido */}
        <PedidoInfoModal
          pedido={pedidoSeleccionado || null}
          isOpen={!!pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
        />
      </div>
      {loading && <Spinner />}
    </div>
  )
}
