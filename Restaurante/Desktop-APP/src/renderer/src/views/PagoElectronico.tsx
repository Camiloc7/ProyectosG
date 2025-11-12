/*
ACLARACION IMPORTANTE ANTES DE CONTINUAR 
.- la variable monto_pagado que recibe el backend se refiere al monto que se va a pagar del pedido dividido, es un auxiliar que utiliza el backend
para comprobar cuanto dinero le falta al front por pagar para ver si ya esta por completar el pedido o no, este monto_pagado no incluye la propina, esta siempre
va en una variable aparte 
*/
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import OrangeButton from '../components/OrangeButton'
import { ArrowLeft } from 'lucide-react'
import { FONDO, FONDO_COMPONENTES, ORANGE } from '../styles/colors'
import { toast } from 'sonner'
import { useCuentasStore } from '../store/cuentaStore'
import { DatosOpcionales, IDataOpcional } from '../components/DatosOpcionales'
import { FacturaEntity, useFacturasStore } from '../store/facturasStore'
import { generarPayloadPago } from '../utils/generarPagoPayload'
import Spinner from '../components/feedback/Spinner'
import { calculateTip } from '../utils/propina'
import Checkbox from '../components/CheckBox'
import { formatearNumero } from '../helpers/betterNumberFormat'

export default function PagoElectronico() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pagarPedido, loading, getFacturaPdf } = useFacturasStore()
  const { traerCuentas, cuentas, loading: loadingCuentas } = useCuentasStore()
  const pedidoPorPagar = location.state?.pedidoPorPagar
  const idDivision = location.state?.id
  const pedido = pedidoPorPagar

  // const { idx, total } = location.state as { idx: number; total: number; propina: number }
  const [cuenta, setCuenta] = useState<string>('')
  const [cuentasSeleccionadas, setCuentasSeleccionadas] = useState<{ id: string; monto: number }[]>(
    []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dividirPago, setDividirPago] = useState<boolean>(false)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [totalAPagar, setTotalAPagar] = useState<number>(0)

  const [division, setDivision] = useState<IDataOpcional>({
    direccion: '',
    telefono: '',
    nota: '',
    dv: ''
  })

  // Maneja el check/uncheck de cuentas
  const handleToggleCuenta = (id: string) => {
    setCuentasSeleccionadas((prev) => {
      const existe = prev.find((c) => c.id === id)
      if (existe) {
        return prev.filter((c) => c.id !== id)
      } else {
        return [...prev, { id, monto: 0 }]
      }
    })
  }

  // Maneja el cambio de monto
  const handleMontoChange = (id: string, monto: number) => {
    setCuentasSeleccionadas((prev) => prev.map((c) => (c.id === id ? { ...c, monto } : c)))
  }

  // Calcula el total ingresado
  const totalIngresado = cuentasSeleccionadas.reduce((sum, c) => sum + (c.monto || 0), 0)

  const calcularTotalAPagar = async () => {
    const respaldo = await window.electron.storeGet(`respaldo_${pedidoPorPagar.id}`)

    if (respaldo?.divisiones.length > 0) {
      const data = respaldo.divisiones.find((p: any) => p.id === idDivision)
      if (!data) return null

      const baseAmount =
        data.customAmount ??
        data.items.reduce((sum: number, it: any) => sum + it.precio * it.cantidad, 0)

      const subtotalConDescuento = baseAmount * (1 - (respaldo.descuento ?? 0) / 100)
      const { totalWithTip } = calculateTip(
        subtotalConDescuento,
        data.tipPercent ?? 0,
        data.tipEnabled ?? true
      )
      setTotalAPagar(totalWithTip)
      return totalWithTip
    }
    setTotalAPagar(respaldo.totalConPropina)
    return respaldo.totalConPropina
  }

  useEffect(() => {
    traerCuentas()
    calcularTotalAPagar()
  }, [])

  const handleUpdateDivision = (upd: Partial<IDataOpcional>) => {
    setDivision((prev) => ({ ...prev, ...upd }))
  }

  const handleClosePdfModal = async () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    setShowPdfModal(false)
    setPdfUrl(null)
    navigate('/pagar', { state: { pedido } })
    window.location.reload()
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    if (!cuenta && !dividirPago) {
      toast.error('Por favor selecciona una cuenta bancaria.')
      return
    }

    setIsSubmitting(true)
    try {
      const divisionFinal: IDataOpcional = {
        direccion: division.direccion === '' ? 'KR 3A 17 98' : division.direccion,
        telefono: division.telefono === '' ? '3503590606' : division.telefono,
        dv: division.dv === '' ? '0' : division.dv,
        nota: division.nota === '' ? 'SIN NOTA' : division.nota
      }

      let result = await generarPayloadPago({
        pedidoId: pedido.id,
        idDivision: idDivision,
        division: divisionFinal,
        esEfectivo: false,
        cuentaId: cuenta
      })

      if (!result) {
        toast.error('No se encontró la información de pago.')
        return
      }
      let factura: FacturaEntity | null = null
      if (dividirPago) {
        // EN CASO DE QUE SE QUIERA PAGAR CON MULTIPLES CUENTAS

        // Filtramos cuentas con monto > 0
        const cuentasConMonto = cuentasSeleccionadas.filter((c) => c.monto > 0)
        const totalCuentas = cuentasConMonto.reduce((sum, c) => sum + c.monto, 0)
        // Permitir 1 peso de tolerancia hacia arriba
        if (totalIngresado < totalAPagar || totalIngresado > totalAPagar + 1) {
          toast.error('El total ingresado no coincide con el total a pagar (tolerancia de 1 peso).')
          return
        }

        for (const c of cuentasConMonto) {
          const proporción = c.monto / totalCuentas
          const propinaCuenta = result.propina * proporción

          const montoPagado = c.monto - propinaCuenta
          let resultCuenta = {
            ...result,
            monto_pagado: montoPagado,
            propina: propinaCuenta,
            cuenta_id: c.id
          }

          // Verificación de EFECTIVO por cada cuenta si es necesario
          if (resultCuenta.cuenta_id === 'EFECTIVO') {
            resultCuenta = {
              ...resultCuenta,
              cuenta_id: '',
              es_efectivo: true
            }
          }
          const facturaTraida: FacturaEntity | null = await pagarPedido(resultCuenta)
          factura = facturaTraida
        }

        setShowPdfModal(true)
      } else {
        // Pago normal
        if (result.cuenta_id === 'EFECTIVO') {
          result = {
            ...result,
            cuenta_id: '',
            es_efectivo: true
          }
        }
        const facturaTraida: FacturaEntity | null = await pagarPedido(result)
        factura = facturaTraida
      }

      if (!factura) {
        setIsSubmitting(false)
        return
      }

      const pdfBlob = await getFacturaPdf(factura.id)
      if (pdfBlob instanceof Blob && pdfBlob.type === 'application/pdf') {
        const url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)
        setShowPdfModal(true)
        toast.success('Factura generada correctamente.')
      } else {
        toast.warning('Factura procesada, pero no se pudo obtener el PDF válido.')
        handleClosePdfModal()
      }

      // Actualizar respaldo
      const respaldo = await window.electron.storeGet(`respaldo_${pedido.id}`)
      if (respaldo) {
        if (respaldo.divisiones && respaldo.divisiones.length > 0) {
          const divisionIdx = respaldo.divisiones.findIndex((d: any) => d.id === idDivision)
          if (divisionIdx !== -1) {
            respaldo.divisiones[divisionIdx].pagada = true
          }
        } else {
          respaldo.singleDivision.pagada = true
        }
        await window.electron.storeSet(`respaldo_${pedido.id}`, respaldo)
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al procesar el pago.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inValido = totalIngresado < totalAPagar || totalIngresado > totalAPagar + 1
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: FONDO,
        padding: 32,
        fontFamily: 'Lato, sans-serif'
      }}
    >
      {loading && <Spinner />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <ArrowLeft
          size={24}
          onClick={() => {
            navigate('/pagar', { state: { pedido } })
            window.location.reload()
          }}
          style={{ cursor: 'pointer', stroke: ORANGE }}
        />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>Pago Electrónico</h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 960,
          margin: '0 auto',
          gap: 16,
          padding: 16
        }}
      >
        {/* Contenedor principal horizontal para escritorio */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            background: FONDO_COMPONENTES,
            padding: 30,
            borderRadius: '2%',
            gap: 24,
            flexWrap: 'wrap' // Para que sea responsive
          }}
        >
          {/* Sección cuentas */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
              Seleccione la cuenta
            </label>

            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 20, marginBottom: 20 }}>
              Total a pagar: <span style={{ color: ORANGE }}>{formatearNumero(totalAPagar)}</span>
            </div>

            <Checkbox
              label="Dividir el pago"
              onChange={() => setDividirPago(!dividirPago)}
              checked={dividirPago}
            />

            {!dividirPago ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {cuentas.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCuenta(c.id)}
                    style={{
                      cursor: 'pointer',
                      padding: 16,
                      borderRadius: 8,
                      border: cuenta === c.id ? '2px solid orange' : '1px solid #ccc',
                      boxShadow:
                        cuenta === c.id
                          ? '0px 4px 10px rgba(0,0,0,0.2)'
                          : '0px 2px 5px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>{c.nombre}</span>
                    {cuenta === c.id && (
                      <span style={{ color: 'orange', fontWeight: 'bold' }}>✔</span>
                    )}
                  </div>
                ))}
                {cuenta === '' && (
                  <p style={{ color: 'red', fontSize: 14, marginTop: 4 }}>
                    Debes seleccionar una cuenta
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {cuentas.map((c) => {
                  const seleccionada = cuentasSeleccionadas.find((cs) => cs.id === c.id)
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 16,
                        borderRadius: 8,
                        border: seleccionada ? '2px solid orange' : '1px solid #ccc',
                        boxShadow: seleccionada
                          ? '0px 4px 10px rgba(0,0,0,0.2)'
                          : '0px 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleToggleCuenta(c.id)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{c.nombre}</span>
                        <Checkbox
                          onChange={() => handleToggleCuenta(c.id)}
                          checked={!!seleccionada}
                        />
                      </div>
                      {seleccionada && (
                        <input
                          type="number"
                          placeholder="Monto a pagar"
                          value={seleccionada.monto === 0 ? '' : seleccionada.monto}
                          min={0}
                          max={totalAPagar}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleMontoChange(c.id, Number(e.target.value))}
                          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      )}
                    </div>
                  )
                })}

                <div style={{ marginTop: 16, fontWeight: 400 }}>
                  Total ingresado:{' '}
                  <span
                    style={{
                      fontWeight: 600,
                      color: inValido ? 'red' : 'green'
                    }}
                  >
                    {totalIngresado} / {totalAPagar}
                  </span>
                  {inValido && (
                    <span style={{ color: 'red', marginLeft: 16 }}>⚠ El total no coincide</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sección datos opcionales */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 12,
                marginTop: 60,
                fontSize: 18,
                fontWeight: 600,
                fontFamily: 'Lato, sans-serif',
                color: '#555'
              }}
            >
              <span>Datos opcionales</span>
            </div>
            <DatosOpcionales division={division} onUpdate={handleUpdateDivision} />
          </div>
        </div>

        {/* Botón de pagar sticky */}
        <div
          style={{
            marginTop: 16,
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            padding: '16px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            borderRadius: '2%'
          }}
        >
          <OrangeButton
            label={isSubmitting ? 'Procesando...' : 'Registrar pago'}
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {loading && <Spinner />}

      {loading || (loadingCuentas && <Spinner />)}

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
                onClick={handleClosePdfModal}
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
    </div>
  )
}
