import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { NotaDebito } from '@/types/types';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { showTemporaryToast } from '@/components/feedback/toast';

interface NotasStore {
  loading: boolean;
  error: string | null;
  success: boolean;
  listaDeNotasDeDebito: NotaDebito[]; // Agregado aquí
  crearNotaDebito: (formData: Record<string, any>) => Promise<void>;
  fetchNotasDeDebito: () => Promise<void>; // No olvides agregar este método
}

export const useNotasDebitoStore = create<NotasStore>((set) => ({
  listaDeNotasDeDebito: [] as NotaDebito[],
  facturaInfo: null,
  loading: false,
  error: null,
  success: false,

  crearNotaDebito: async (formData: Record<string, any>) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    // Crear el objeto FormData
    const formDataToSend = new FormData();

    // Agregar cada par clave-valor al FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'object' && !(value instanceof Blob)) {
        // Serializar objetos anidados como JSON
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        // Agregar el valor directamente si no es un objeto o es un archivo (Blob)
        formDataToSend.append(key, value as string | Blob);
      }
    });

    try {
      // Realizar la solicitud fetch
      const response = await fetchWithTimeout(`${BASE_URL}api/enviarndcon`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`, // Incluir el token de autenticación
          // NO especificar 'Content-Type' aquí
        },
        body: formDataToSend, // Enviar el FormData como cuerpo
      });

      if (!response.ok) {
        throw new Error('Error al enviar los datos del formulario');
      }

      showTemporaryToast('Nota creada exitosamente');
      set({ loading: false, success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al enviar los datos:', errorMessage);
      set({
        error: errorMessage,
        loading: false,
        success: false,
      });
    }
  },

  // Función para obtener notas de débito
  fetchNotasDeDebito: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/listanotas/obtenerNotasDebito`,
        {
          method: 'GET',

          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text(); // Obtener el texto de la respuesta si no es JSON
        console.error('Error response: ', errorText);
        throw new Error('Error al obtener las notas de débito');
      }

      const data = await response.json();

      console.log('Notas debito back', data);

      // const notasDeDebito = Array.isArray(data.notas)
      //   ? data.notas.map((nota: any) => ({
      //       id: nota.ID,
      //       prefijo: nota.NUMERO || '',
      //       consecutivo: parseInt(nota.NUMERO2, 10) || 0,
      //       fecha: nota.FECHA,
      //       ver: '', // Asigna valores adecuados si se requieren
      //       anular: '',
      //       xml: nota.XML,
      //       enviar: '',
      //       nit: nota.ID_USUARIO,
      //     }))
      //   : [];
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
