import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FONDO, ORANGE } from '../styles/colors'
import Spinner from '../components/feedback/Spinner'
import { useEmpleadosStore } from '../store/empleadosStore'
import { useCajaStore } from '../store/cajaStore'

export default function ListaDeCierresDeCaja() {
  const navigate = useNavigate()
  const {
    traerCierresDeCaja,
    cierresDeCaja,
    traerCajaActiva,
    cajaActiva,
    loading: loadingCajas
  } = useCajaStore()
  const { traerEmpleados, empleados, loading: loadingEmpleados } = useEmpleadosStore()

  const [visibleCount, setVisibleCount] = useState(3)
  const [search, setSearch] = useState('')
  const [detallesId, setDetallesId] = useState(null)

  useEffect(() => {
    traerCajaActiva()
    traerCierresDeCaja()
    traerEmpleados()
  }, [traerCajaActiva, traerCierresDeCaja, traerEmpleados])

  const usuariosMap = new Map()
  const establecimientosMap = new Map()

  empleados.forEach((emp) => {
    usuariosMap.set(emp.id, emp)
    if (!establecimientosMap.has(emp.establecimiento.id)) {
      establecimientosMap.set(emp.establecimiento.id, { nombre: emp.establecimiento.nombre })
    }
  })

  const filteredCaja = cierresDeCaja.filter((item) => {
    const establecimiento = establecimientosMap.get(item.establecimiento_id)?.nombre || ''
    const usuario = usuariosMap.get(item.usuario_cajero_id)
    const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellido}` : ''

    return (
      establecimiento.toLowerCase().includes(search.toLowerCase()) ||
      nombreUsuario.toLowerCase().includes(search.toLowerCase())
    )
  })

  const visibleCaja = filteredCaja.slice(0, visibleCount)

  const toggleDetalles = (id) => {
    setDetallesId(detallesId === id ? null : id)
  }

  const isLoading = loadingCajas || loadingEmpleados

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
        <ArrowLeft
          size={24}
          onClick={() => navigate('/pedidos')}
          style={{ cursor: 'pointer', stroke: ORANGE }}
        />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', margin: 0 }}>
          Lista de Cierres de caja
        </h1>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32
        }}
      >
        <input
          type="text"
          placeholder="Buscar por establecimiento o cajero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            border: '1px solid #ccc',
            borderRadius: 20,
            padding: '8px 16px',
            fontSize: 14,
            color: '#555',
            outline: 'none'
          }}
        />
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 16 }}>
            Caja Activa
          </h2>
          {cajaActiva ? (
            <div
              style={{
                border: '1px solid #4caf50',
                backgroundColor: '#e8f5e9',
                borderRadius: 8,
                padding: 24,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              <p style={{ fontSize: 14, color: '#2e7d32' }}>Hay una caja activa en este momento.</p>
              <p>
                <strong>Establecimiento:</strong>{' '}
                {establecimientosMap.get(cajaActiva.establecimiento_id)?.nombre || 'Desconocido'}
              </p>
              <p>
                <strong>Cajero:</strong>{' '}
                {usuariosMap.get(cajaActiva.usuario_cajero_id)
                  ? `${usuariosMap.get(cajaActiva.usuario_cajero_id)?.nombre} ${usuariosMap.get(cajaActiva.usuario_cajero_id)?.apellido}`
                  : 'Desconocido'}
              </p>
              <p>
                <strong>Saldo inicial:</strong> ${cajaActiva.saldo_inicial_caja}
              </p>
              <p>
                <strong>Fecha de apertura:</strong>{' '}
                {new Date(cajaActiva.fecha_hora_apertura).toLocaleString()}
              </p>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                color: '#777'
              }}
            >
              No hay una caja activa en este momento.
            </div>
          )}
        </div>
      )}

      {!isLoading && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 16 }}>
            Cierres Anteriores
          </h2>
          {visibleCaja.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#777' }}>
              No se encontraron cierres de caja.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {visibleCaja.map((item) => {
                const usuario = usuariosMap.get(item.usuario_cajero_id)
                const establecimiento = establecimientosMap.get(item.establecimiento_id)
                return (
                  <li
                    key={item.id}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      padding: 16,
                      backgroundColor: '#fff',
                      marginBottom: 16,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <p>
                      <strong>Establecimiento:</strong> {establecimiento?.nombre || 'Desconocido'}
                    </p>
                    <p>
                      <strong>Cajero:</strong>{' '}
                      {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido'}
                    </p>
                    <p>
                      <strong>Fecha apertura:</strong>{' '}
                      {new Date(item.fecha_hora_apertura).toLocaleString()}
                    </p>
                    <p>
                      <strong>Saldo inicial:</strong> ${item.saldo_inicial_caja}
                    </p>
                    <p>
                      <strong>Cerrado:</strong> {item.cerrado ? 'Sí' : 'No'}
                    </p>

                    <button
                      onClick={() => toggleDetalles(item.id)}
                      style={{
                        marginTop: 8,
                        background: 'none',
                        border: 'none',
                        color: ORANGE,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {detallesId === item.id ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>

                    {detallesId === item.id && (
                      <div
                        style={{
                          marginTop: 16,
                          backgroundColor: '#f5f5f5',
                          padding: 12,
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      >
                        <p>
                          <strong>Fecha cierre:</strong>{' '}
                          {item.fecha_hora_cierre
                            ? new Date(item.fecha_hora_cierre).toLocaleString()
                            : 'No cerrado'}
                        </p>
                        <p>
                          <strong>Saldo final contado:</strong> ${item.saldo_final_contado}
                        </p>
                        <p>
                          <strong>Total ventas brutas:</strong> ${item.total_ventas_brutas}
                        </p>
                        <p>
                          <strong>Total descuentos:</strong> ${item.total_descuentos}
                        </p>
                        <p>
                          <strong>Total impuestos:</strong> ${item.total_impuestos}
                        </p>
                        <p>
                          <strong>Total propina:</strong> ${item.total_propina}
                        </p>
                        <p>
                          <strong>Total neto ventas:</strong> ${item.total_neto_ventas}
                        </p>
                        <p>
                          <strong>Total pagos efectivo:</strong> ${item.total_pagos_efectivo}
                        </p>
                        <p>
                          <strong>Total pagos tarjeta:</strong> ${item.total_pagos_tarjeta}
                        </p>
                        <p>
                          <strong>Total pagos otros:</strong> ${item.total_pagos_otros}
                        </p>
                        <p>
                          <strong>Total recaudado:</strong> ${item.total_recaudado}
                        </p>
                        <p>
                          <strong>Diferencia caja:</strong> ${item.diferencia_caja}
                        </p>
                        <p>
                          <strong>Observaciones:</strong> {item.observaciones ?? 'Ninguna'}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {visibleCount < filteredCaja.length && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setVisibleCount(visibleCount + 3)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Ver más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
