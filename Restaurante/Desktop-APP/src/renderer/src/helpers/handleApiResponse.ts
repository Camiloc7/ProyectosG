// Manejador de respuestas html, json, o respuestas vacías
export async function handleApiResponse({
  backResponse,
  mensajeDeFallo,
  debugg = false
}: {
  backResponse: Response
  mensajeDeFallo: string
  debugg?: boolean
}) {
  const contentType = backResponse.headers.get('Content-Type')?.toLowerCase() || ''

  // === RESPUESTA NO JSON (ej. HTML de error del servidor) ===
  if (!contentType.includes('application/json')) {
    const errorText = await backResponse.text()
    console.error('RESPUESTA INESPERADA DEL SERVIDOR: ', errorText)
    throw new Error(mensajeDeFallo)
  }

  // === RESPUESTA JSON ===
  const rawText = await backResponse.text()

  if (!rawText || rawText.trim() === '') {
    throw new Error('El Servidor devolvió una respuesta vacía')
  }

  if (debugg) {
    //!NO BORRAR ESTE CONSOLE.LOG()
    console.log('INFORMACION CRUDA DEL BACK: ', rawText)
  }

  let data: { status: boolean; message?: string; data?: any }
  try {
    data = JSON.parse(rawText)
  } catch (err) {
    console.error('ERROR CRUDO: ', rawText)
    throw new Error(mensajeDeFallo)
  }

  if (!data.status) {
    throw new Error(data.message || mensajeDeFallo)
  }

  // Retorna el JSON tal cual lo manda el back
  return data
}
