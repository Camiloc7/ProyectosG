//Manejador de respuestas html o json

import { showErrorToast } from '@/components/feedback/toast';

export async function getTokenPos() {
  const token = sessionStorage.getItem('tokenPOS');
  if (!token) {
    showErrorToast(
      'No se encontro el token de Gastro Pos, porfavor reinicia la sesion'
    );
    console.error('No hay token');
    return false;
  }

  return token;
}
