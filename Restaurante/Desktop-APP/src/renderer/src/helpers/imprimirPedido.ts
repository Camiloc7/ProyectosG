export async function imprimirFactura(pdfBlob: Blob) {
  if (!(pdfBlob instanceof Blob) || pdfBlob.type !== 'application/pdf') {
    console.error('Error en imprimirComanda, no llegó un PDF')
    return
  }

  // Convertir Blob a ArrayBuffer para enviarlo por IPC
  const arrayBuffer = await pdfBlob.arrayBuffer()

  // Llamar al main para imprimir
  window.electron.imprimirFactura(arrayBuffer)
}
