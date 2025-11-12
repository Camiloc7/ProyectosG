import { useState } from 'react'
import { useFacturasStore } from '../store/facturasStore'
import PdfViewer from '../helpers/pdfViewer'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

export default function ImprimirTicket({
  pedido,
  onImpresionExitosa
}: {
  pedido: any
  onImpresionExitosa?: (pedidoId: string) => void
}) {
  const { imprimirComanda, loading } = useFacturasStore()
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  const handleImprimir = async (e) => {
    e.stopPropagation() // Evita que se dispare el click del contenedor padre
    try {
      const result = await imprimirComanda(pedido.id)

      if (result instanceof Blob && result.type === 'application/pdf') {
        setPdfBlob(result)
        setShowPdfModal(true)
        if (onImpresionExitosa) {
          onImpresionExitosa(pedido.id) // Notifica al componente padre
        }
        toast.success('Comanda generada para impresión')
      } else {
        toast.error('No se pudo generar la comanda')
      }
    } catch (err) {
      console.error('Error al invocar impresión:', err)
      toast.error('Error al generar la comanda')
    }
  }

  return (
    <>
      <button
        onClick={handleImprimir}
        disabled={loading}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        <Printer size={20} />
      </button>
      {showPdfModal && pdfBlob && (
        <PdfViewer
          blob={pdfBlob}
          onClose={() => {
            setShowPdfModal(false)
            setPdfBlob(null)
          }}
        />
      )}
    </>
  )
}
