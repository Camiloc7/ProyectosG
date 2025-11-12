import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { InformeDataExel, InformeDataPDF, NotaCredito } from '@/types/types';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface NotasCreditoStore {
  notasCredito: NotaCredito[];
  loading: boolean;
  error: string | null;
  success: boolean;
  crearNotaCredito: (formData: Record<string, any>) => Promise<void>;
  fetchListaDeNotasCredito: () => Promise<void>;
  adjuntarXMLCredito: (id: string, file: File) => Promise<void>;
  fetchCausativoCredito: (id: string) => Promise<void>;
  sendNotaCredito: (id: string, email: string) => Promise<void>;
  importarNotasCredito: (file: File) => Promise<void>;
  anularNotaDeCredito: (id: string) => Promise<void>;
  informeExelCredito: (data: InformeDataExel) => Promise<void>;
  informePDFCredito: (data: InformeDataPDF) => Promise<void>;
}

export const useNotasCreditoStore = create<NotasCreditoStore>((set) => ({
  notasCredito: [],
  loading: false,
  error: null,
  success: false,

  crearNotaCredito: async (formData: Record<string, any>) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    const formDataToSend = new FormData();
    const debugData: Record<string, any> = {}; // Para depuración

    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Serializar arrays como JSON
        formDataToSend.append(key, JSON.stringify(value));
        debugData[key] = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        // Convertir booleanos a strings
        formDataToSend.append(key, value ? 'true' : 'false');
        debugData[key] = value ? 'true' : 'false';
      } else if (value instanceof Date || key === 'fecha') {
        const dateObject = new Date(value);
        const formatted = dateObject.toISOString().split('T')[0]; // "YYYY-MM-DD"
        formDataToSend.append(key, formatted);
        debugData[key] = formatted;
      } else if (value !== null && value !== undefined) {
        // Añadir otros valores como strings
        formDataToSend.append(key, String(value));
        debugData[key] = value;
      }
    });

    // Depuración: Mostrar datos enviados en consola

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/enviarnccon2/enviarNotaCreditoDescuentos`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );
      if (!response.ok) {
        throw new Error('Error al enviar los datos del formulario');
      }
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        // Manejo de respuesta JSON
        const result = await response.json();

        showErrorToast(`${result.message}`);
        set({ success: true, loading: false });
      } else if (contentType.includes('application/pdf')) {
        // Manejo de respuesta PDF
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nota_credito.pdf';
        a.click();
        URL.revokeObjectURL(url);
        set({ success: true, loading: false });
      } else {
        throw new Error('Tipo de respuesta inesperado del servidor');
      }
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

  fetchListaDeNotasCredito: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/credito/listanotascreditos`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las notas de crédito');
      }

      const data = await response.json();

      const formattedData = data.map((nota: any) => ({
        id: nota.id ? nota.id : '---',
        numeroFactura: nota.numero_factura ? nota.numero_factura : '---',
        fecha: nota.fecha ? nota.fecha : '---',
        consecutivo: nota.consecutivo ? nota.consecutivo : '---',
        xml: nota.xml ? nota.xml : '---',
        idResolucion: nota.id_resolucion ? nota.id_resolucion : '---',
        prefijoNotaCredito: nota.prefijo_nota_credito
          ? nota.prefijo_nota_credito
          : '---',
        rutaXml: nota.Ruta_XML ? nota.Ruta_XML : '---',
        rutaPdf: nota.Ruta_PDF
          ? `${BASE_URL.replace(/index\.php\/?$/, '')}${nota.Ruta_PDF.replace(
              /^[\.\/]+/,
              ''
            )}`
          : 'No disponible',
        rutaCausativo: nota.Ruta_Causativo ? nota.Ruta_Causativo : '---',
        valor: nota.price_amount ? nota.price_amount : '---',
        anulado: nota.ANULADO ? nota.ANULADO : '---',
      }));

      set({ notasCredito: formattedData, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  adjuntarXMLCredito: async (id: string, file: File) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    if (!file) {
      console.error('Archivo no recibido o es null');
      set({
        error: 'No se seleccionó ningún archivo',
        loading: false,
        success: false,
      });
      return;
    }

    try {
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('pdf_prueba', file);
      // formData.append('id', `api/facturas/guardararchivo/${id.toString()}`);

      // Mostrar claves y valores de FormData
      formData.forEach((value, key) => {});

      const response = await fetchWithTimeout(
        `${BASE_URL}api/listanotas/guardararchivo/${id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const responseData = await response.json();

      if (responseData.error) {
        showErrorToast('Algo salio mal, ' + responseData.error);
      } else {
        showTemporaryToast('Se subio correctamente');
      }

      if (response.status === 200 || response.status === 201) {
        const state = useNotasCreditoStore.getState(); // Obtén el estado de la tienda de facturas
        await state.fetchListaDeNotasCredito(); // Realiza el fetch a la lista de facturas
      } else {
        throw new Error('Error traer las facturas');
      }

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al subir el archivo:', error.message);
    }
  },

  fetchCausativoCredito: async (id: string) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/generarcausativo/${id}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const responseData = await response.json();

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al subir el archivo:', error.message);
    }
  },

  sendNotaCredito: async (id: string, email: string) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/listanotas/enviaremail/${id}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const responseData = await response.json();

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al subir el archivo:', error.message);
    }
  },

  importarNotasCredito: async (file: File) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await fetchWithTimeout(
        `${BASE_URL}api/fileuploadcontroller/notasCreditoXMLZIP`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const contentType = response.headers.get('content-type');

      // 🔹 Si la respuesta es un PDF, manejarlo correctamente
      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas_credito.pdf'; // Nombre del archivo a descargar
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showTemporaryToast('Nota importada y PDF descargado exitosamente');
        set({ loading: false, success: true });
        return;
      }

      if (contentType?.includes('application/json')) {
        const responseData = await response.json();

        if (responseData.status === 'error') {
          showErrorToast(responseData.message);
          throw new Error(`Error al importar las notas de crédito`);
        }

        set({ loading: false, success: true });
        return;
      }

      if (contentType?.includes('text/html')) {
        const responseData = await response.json();

        if (responseData.status === 'error') {
          showErrorToast(responseData.message);
          throw new Error(`Error al importar las notas de crédito`);
        }

        set({ loading: false, success: true });
        return;
      }

      // 🔹 Si el tipo de contenido no es reconocido
      throw new Error('Respuesta inesperada del servidor');
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

  anularNotaDeCredito: async (id: string) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('numeroFactura', id); // Aquí se agrega el id con el nombre correcto

      const response = await fetchWithTimeout(
        `${BASE_URL}api/credito/anulacionDeNotaCredito`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseData = await response.text();

      set({ loading: false, success: false });
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

  informeExelCredito: async (data: InformeDataExel) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/informecomparativofalso/${data.fechaInicial1}/${data.fechaFinal1}/${data.fechaInicial2}/${data.fechaFinal2}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      // Descargar el archivo Excel
      const responseData = await response.blob();
      const downloadUrl = URL.createObjectURL(responseData);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'informe_comparativo.xlsx'; // Cambia el nombre del archivo si lo deseas
      a.click();
      URL.revokeObjectURL(downloadUrl);

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear informe:', error.message);
    }
  },

  informePDFCredito: async (data: InformeDataPDF) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}DATOSFALSOS${data.fechaInicial}/${data.fechaFinal}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      );

      // Descargar el archivo PDF
      const responseData = await response.blob();
      const downloadUrl = URL.createObjectURL(responseData);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'informe_comparativo_pdf.pdf';
      a.click();
      URL.revokeObjectURL(downloadUrl);

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear informe:', error.message);
    }
  },
}));
