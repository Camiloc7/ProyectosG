import React from 'react'
import OrangeButton from './OrangeButton'
import { IPedidos } from '../store/pedidosStore'

interface PedidoInfoModalProps {
  pedido: IPedidos | null
  isOpen: boolean
  onClose: () => void
}

const tiposDeOrigen = {
  MESA: { icon: '/mesa.svg', label: 'Mesa' },
  DOMICILIO: { icon: '/domiciliario.svg', label: 'Domicilio' },
  PARA_LLEVAR: { icon: '/para_llevar.svg', label: 'Para llevar' }
}

const PedidoInfoModal: React.FC<PedidoInfoModalProps> = ({ pedido, isOpen, onClose }) => {
  if (!isOpen || !pedido) return null

  const renderHeader = () => {
    const origen = tiposDeOrigen[pedido.tipo_pedido as keyof typeof tiposDeOrigen]

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={origen.icon} alt={origen.label} width={22} height={22} />
        {pedido.tipo_pedido === 'MESA' ? (
          <h2 style={{ margin: 0, fontSize: 22, color: '#111827' }}>Mesa {pedido.mesa_numero}</h2>
        ) : (
          <h2 style={{ margin: 0, fontSize: 22, color: '#111827' }}>{origen.label}</h2>
        )}
      </div>
    )
  }

  const renderClienteInfo = () => {
    if (pedido.tipo_pedido === 'DOMICILIO') {
      return (
        <div style={{ fontSize: 14, color: '#374151', marginTop: 8 }}>
          <p>
            <strong>Cliente:</strong> {pedido.cliente_nombre || '—'}
          </p>
          <p>
            <strong>Teléfono:</strong> {pedido.cliente_telefono || '—'}
          </p>
          <p>
            <strong>Dirección:</strong> {pedido.cliente_direccion || '—'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
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
          border: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 8, marginBottom: 8 }}>
          {renderHeader()}
          <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
            Estado: <strong>{pedido.estado}</strong>
          </p>
          {renderClienteInfo()}
        </div>

        {/* Productos */}
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#111827' }}>Productos:</h3>
          {pedido.pedidoItems.map((item) => (
            <div
              key={item.id}
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
                    {item.opcionesSeleccionadas.map((opcion, idx) => (
                      <p key={idx} style={{ margin: '2px 0' }}>
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

        {/* Botón cerrar */}
        <OrangeButton label="Cerrar" onClick={onClose} />
      </div>
    </div>
  )
}

export default PedidoInfoModal
