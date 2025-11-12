import { useEffect, useState } from 'react'

interface PdfViewerProps {
  blob: Blob | null
  onClose?: () => void
}

function PdfViewer({ blob, onClose }: PdfViewerProps) {
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleClose = () => {
    setShowPdfModal(false)
    if (onClose) {
      onClose()
    }
  }

  const handleShowPdf = async () => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    setPdfUrl(url)
    setShowPdfModal(true)
  }

  useEffect(() => {
    if (blob) {
      handleShowPdf()
    }
  }, [blob])

  return (
    <div>
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
          onClick={handleClose}
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
            onClick={(e) => e.stopPropagation()} // Evita que el click cierre el modal
          >
            <div style={{ padding: 8, textAlign: 'right' }}>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer'
                }}
                onClick={handleClose}
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

export default PdfViewer
