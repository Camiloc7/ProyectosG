import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Checkbox from '../components/CheckBox'
import { DatosOpcionales, IDataOpcional } from '../components/DatosOpcionales'
import Spinner from '../components/feedback/Spinner'
import OrangeButton from '../components/OrangeButton'
import { FacturaEntity, useFacturasStore } from '../store/facturasStore'
import { ORANGE } from '../styles/colors'
import { generarPayloadPago } from '../utils/generarPagoPayload'
import { ArrowLeft } from 'lucide-react'
import { calculateTip } from '../utils/propina'

const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: 32,
    fontFamily: 'Arial, sans-serif'
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: 20,
    fontSize: 18,
    fontWeight: 600
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 16,
    marginBottom: 20,
    marginTop: 20
  },
  cell: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center' as const
  },
  input: {
    width: '60px',
    padding: 8,
    border: '1px solid #ccc',
    borderRadius: 4,
    textAlign: 'right' as const
  },
  cajaDatosExtra: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: 20
  }
}

export default function Cambio() {
  const location = useLocation()
  const navigate = useNavigate()
  const { pagarPedido, loading, getFacturaPdf } = useFacturasStore()
  const pedidoPorPagar = location.state?.pedidoPorPagar
  const idDivision = location.state?.id
  const [totalAPagar, setTotalAPagar] = useState<number>(0)

  const [counts, setCounts] = useState<Record<number, number>>({})
  const [totalReceived, setTotalReceived] = useState(0)
  const [change, setChange] = useState(0)
  const [declarar, setDeclarar] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [returnBreakdown, setReturnBreakdown] = useState<Record<number, number>>({})
  const [division, setDivision] = useState<IDataOpcional>({
    direccion: '',
    telefono: '',
    nota: '',
    dv: ''
  })

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)

  useEffect(() => {
    setCounts({})
    setTotalReceived(0)
    calcularTotalAPagar()
  }, [declarar])

  useEffect(() => {
    if (!declarar) {
      setTotalReceived(totalAPagar)
      return
    }
    const sum = DENOMINATIONS.reduce((acc, denom) => {
      const cnt = counts[denom] || 0
      return acc + denom * cnt
    }, 0)
    setTotalReceived(sum)
  }, [counts, declarar, totalAPagar])

  useEffect(() => {
    const changeAmount = Math.max(totalReceived - totalAPagar, 0)
    setChange(changeAmount)

    let remaining = changeAmount
    const breakdown: Record<number, number> = {}

    for (const denom of DENOMINATIONS) {
      const cnt = Math.floor(remaining / denom)
      if (cnt > 0) {
        breakdown[denom] = cnt
        remaining -= denom * cnt
      }
    }
    setReturnBreakdown(breakdown)
  }, [totalReceived, totalAPagar])

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

  const handleCountChange = (denom: number, value: string) => {
    const num = Math.max(0, Math.floor(Number(value) || 0))
    setCounts({ ...counts, [denom]: num })
  }

  const handleUpdateDivision = (upd: Partial<IDataOpcional>) => {
    setDivision((prev) => ({ ...prev, ...upd }))
  }

  const cancelar = () => {
    const pedido = pedidoPorPagar
    navigate('/pagar', { replace: true, state: { pedido } })
    window.location.reload()
  }

  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    setShowPdfModal(false)
    setPdfUrl(null)
    const pedido = pedidoPorPagar
    navigate('/pagar', { replace: true, state: { pedido } })
    window.location.reload()
  }

  const finalizar = async () => {
    if (isSubmitting) return
    const recibido = declarar ? totalReceived : totalAPagar

    if (recibido < totalAPagar) {
      toast.error('El dinero entregado no es suficiente.')
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

      const result = await generarPayloadPago({
        pedidoId: pedidoPorPagar.id,
        idDivision: idDivision,
        division: divisionFinal,
        esEfectivo: true,
        denominacionesEfectivo: declarar ? counts : undefined
      })

      if (!result) {
        toast.error('No se encontró la información de pago.')
        return
      }

      const factura: FacturaEntity | null = await pagarPedido(result)

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

      // Obtener el respaldo
      const respaldo = await window.electron.storeGet(`respaldo_${pedidoPorPagar.id}`)

      if (respaldo) {
        if (respaldo.divisiones && respaldo.divisiones.length > 0) {
          // Si hay divisiones, marcar la correspondiente como pagada
          const divisionIdx = respaldo.divisiones.findIndex((d: any) => d.id === idDivision)

          if (divisionIdx !== -1) {
            respaldo.divisiones[divisionIdx].pagada = true
          } else {
            console.warn('No se encontró la división a marcar como pagada.')
          }
        } else {
          // Si no hay divisiones, marcar singleDivision como pagada
          respaldo.singleDivision.pagada = true
        }

        // Guardar nuevamente en el store
        await window.electron.storeSet(`respaldo_${pedidoPorPagar.id}`, respaldo)
      } else {
        console.warn('No se encontró respaldo para este pedido.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al procesar el pago.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <ArrowLeft size={24} onClick={cancelar} style={{ cursor: 'pointer', stroke: ORANGE }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#333', margin: 0 }}>
          Recibir y Devolver Cambio
        </h1>
      </div>

      <div style={styles.summary}>
        Total a Pagar: <span style={{ color: ORANGE }}>{totalAPagar}</span>
      </div>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Checkbox
          label="Declarar billetes"
          checked={declarar}
          onChange={(checked) => setDeclarar(checked)}
        />
      </div>

      {declarar && (
        <>
          <div style={styles.grid}>
            {DENOMINATIONS.map((denom) => (
              <div key={denom} style={styles.cell}>
                <div>{denom.toLocaleString()}</div>
                <input
                  type="number"
                  min={0}
                  style={styles.input}
                  value={counts[denom] || ''}
                  onChange={(e) => handleCountChange(denom, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div style={styles.summary}>
            Total Recibido:{' '}
            <span style={{ color: totalReceived >= totalAPagar ? '#38A169' : '#E53E3E' }}>
              {totalReceived.toLocaleString()}
            </span>
          </div>

          <div style={styles.summary}>
            Cambio: <span style={{ color: '#DD6B20' }}>{change.toLocaleString()}</span>
          </div>

          {change > 0 && (
            <div style={styles.summary}>
              <div>Devolver:</div>
              {Object.entries(returnBreakdown).map(([denom, cnt]) => (
                <div key={denom}>
                  {cnt} x {Number(denom).toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={styles.cajaDatosExtra}>
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 12,
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

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 32
        }}
      >
        <OrangeButton label="Cancelar" variacion="claro" onClick={cancelar} />
        <OrangeButton
          label={isSubmitting ? 'Procesando...' : 'Finalizar'}
          onClick={finalizar}
          disabled={isSubmitting}
        />
      </footer>

      {loading && <Spinner />}

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
