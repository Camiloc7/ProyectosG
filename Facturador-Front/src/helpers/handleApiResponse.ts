// Manejador de respuestas HTML, JSON, o respuestas vacías
export async function handleApiResponse(
  response: any,
  defaultErrorMessage: string
) {
  const contentType = response.headers.get('Content-Type')?.toLowerCase() || '';

  // === RESPUESTA NO JSON (ej. HTML de error del servidor) ===
  if (!contentType.includes('application/json')) {
    const errorText = await response.text();
    console.error('RESPUESTA INESPERADA DEL SERVIDOR: ', errorText);
    throw new Error(defaultErrorMessage);
  }

  // === RESPUESTA JSON ===
  const rawText = await response.text();

  if (!rawText || rawText.trim() === '') {
    throw new Error('El Servidor devolvió una respuesta vacía');
  }

  // Devolver el JSON **exactamente tal cual llegó**, sin parsear
  return JSON.parse(rawText);
}
