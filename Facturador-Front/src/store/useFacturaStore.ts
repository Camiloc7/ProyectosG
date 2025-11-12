import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/ConfirmOption';
import { EstadosCliente, Nota } from '@/app/facturas/page';
import { FormExogenas } from '@/features/facturas/ExogenasModal';
import { handleApiResponse } from '@/helpers/handleApiResponse';
// import { useUIStore } from '@/store/ui/ui';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Factura {
  id: string;
  nombre: string;
}

interface FacturaInfo {
  ACTA: string;
  MEDIO_PAGO: string;
  LISTA_ITEMS: string;
  FECHA: string;
  TIPO_NEGOCIACION: string;
  TIPO_OPERACION: string;
  VENCIMIENTO: string;
  ADMINISTRACION: string;
  ANTICIPO: string;
  CONTRATO: string;
  ELECTRONICA: string;
  ID_CLIENTE: string;
  IMPREVISTOS: string;
  IVA: string;
  OBSERVACIONES: string;
  OTROS: string;
  RETEFUENTE: string;
  RETEGARANTIA: string;
  RETEICA: string;
  RETEIVA: string;
  UTILIDAD: string;
  V_ADMINISTRACION: string;
  V_ANTICIPO: string;
  V_IMPREVISTOS: string;
  V_IVA: string;
  V_RETEFUENTE: string;
  V_RETEGARANTIA: string;
  V_RETEICA: string;
  V_RETEIVA: string;
  V_UTILIDAD: string;
  cantidad1: string;
  codigo1: string;
  contador: number;
  descripcion1: string;
  valor1: string;
}

interface Resolucion {
  id: string;
  nombre: string;
}

interface FacturaStore {
  facturas: Factura[];
  listaDeFacturas: Nota[];
  resoluciones: Resolucion[]; // Add this line to declare resoluciones
  facturaInfo: FacturaInfo | null;
  loading: boolean;
  loadingSend: boolean;
  error: string | null;
  success: boolean;
  // sendFacturaData: (
  //   formData: Record<string, any>,
  //   onFinish?: () => void
  // ) => Promise<void>;
  vistaPreviaPDF: (formData: Record<string, any>) => Promise<void>;
  fetchFacturas: () => Promise<void>;
  anularFactura: (id: number) => Promise<void>;
  fetchListaDeFacturas: () => Promise<void>;
  checkEstadoCliente: (info: string[]) => Promise<EstadosCliente[] | null>;

  fetchFacturaById: (id: string) => Promise<void>;
  checkEstadoDian: (cufe: string) => Promise<void>;
  informeExogenas: (data: FormExogenas) => Promise<void>;
  importarFacturas: (file: File) => Promise<void>;
  sendFacturaMail: (email: string, id: number) => Promise<void>;
  reset: () => void;
}

export const useFacturaStore = create<FacturaStore>((set) => ({
  facturas: [],
  listaDeFacturas: [],
  resoluciones: [],
  facturaInfo: null,
  loading: false,
  loadingSend: false,
  error: null,
  success: false,

  anularFactura: async (id: number) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('consecutivo', id.toString());

      const response = await fetch(
        `${BASE_URL}api/facturas/anulacionDeFactura`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al anular la factura');
      }

      const contentType = response.headers.get('Content-Type');

      switch (true) {
        case contentType?.includes('application/json'): {
          const data = await response.json();

          showErrorToast(data.message);
          break;
        }

        case contentType?.includes('application/pdf'): {
          showTemporaryToast('Anulada correctamente');

          // 🧠 Descargar el PDF
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `factura-anulada-${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          break;
        }

        default:
          throw new Error('Tipo de respuesta inesperado del servidor');
      }

      const state = useFacturaStore.getState();
      await state.fetchListaDeFacturas();
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
      console.error('Error al anular la factura:', error.message);
    }
  },

  //Nombres, numeros de facturas  y resoluciones
  fetchFacturas: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/factura/index`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      const facturas: Factura[] = Array.isArray(data.facturas)
        ? data.facturas.map((factura: any) => ({
            id: factura.NUMERO,
            nombre: `Factura electrónica - ${factura.PREFIJON} - ${factura.CONSECUTIVON}`,
          }))
        : [];

      // Filtrar las resoluciones de tipo 'ELECTRONICA' y concatenar NOMBRE y NUMERO
      const resoluciones = Array.isArray(data.resoluciones)
        ? data.resoluciones
            .filter((resolucion: any) => resolucion.TIPO === 'ELECTRONICA') // Filtramos por tipo ELECTRONICA
            .map((resolucion: any) => ({
              id: resolucion.ID,
              nombre: `${resolucion.NOMBRE} - ${resolucion.NUMERO}`,
            }))
        : [];

      set({ facturas, resoluciones, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchFacturaById: async (id: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/factura/copiarfactura/${id}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      set({ facturaInfo: data, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  vistaPreviaPDF: async (formData: Record<string, any>) => {
    set({ loadingSend: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loadingSend: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    // Crear instancia de FormData
    const formDataInstance = new FormData();

    // Procesar los datos antes de añadirlos
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Serializar arrays como JSON
        formDataInstance.append(key, JSON.stringify(value));
      } else if (typeof value === 'boolean') {
        // Convertir booleanos a "true" o "false" como strings
        formDataInstance.append(key, value ? 'true' : 'false');
      } else if (value !== null && value !== undefined) {
        // Añadir otros tipos de datos directamente
        formDataInstance.append(key, value);
      }
    });

    // Mostrar el contenido del FormData en la consola (depuración)
    for (const [key, value] of formDataInstance.entries()) {
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/factura/generarpdf`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`, // Añadir el token
          },
          body: formDataInstance, // Enviar los datos en FormData
        }
      );

      if (!response.ok) {
        throw new Error('Error al enviar los datos del formulario');
      }

      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'factura.pdf';
        a.click();
        URL.revokeObjectURL(url);
        // Incrementa el contador en localStorage
        const currentCount = parseInt(
          localStorage.getItem('facturasGeneradas') || '0',
          10
        );
        localStorage.setItem(
          'facturasGeneradas',
          (currentCount + 1).toString()
        );

        set({ loadingSend: false, error: null });
      } else {
        throw new Error('Tipo de respuesta inesperado del servidor');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al enviar los datos:', errorMessage);
      set({
        error: errorMessage,
        loadingSend: false,
        success: false,
      });
    }
  },

  fetchListaDeFacturas: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetch(`${BASE_URL}api/facturas/lista_facturas`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      //!ESTO ES PARA DEPURAR, NO ELIMINAR. GRACIAS
      // const facturaBuscada = data.find((e: any) => e.consecutivo === '1603');

      const listaDeFacturas = Array.isArray(data)
        ? data.map((factura: any) => {
            return {
              id: factura.Numero_factura || '',
              prefijo: factura.prefijo || 'Sin prefijo',
              consecutivo: factura.consecutivo
                ? Number(factura.consecutivo)
                : null,
              contrato: factura.contrato || 'Sin contrato',
              // estadoDIAN:
              //   factura.Numero_factura === '12208' ? '2' : factura.ESTADO,
              estadoDIAN: factura.ESTADO,
              estado:
                factura.ANULADO === '1'
                  ? 'Anulada'
                  : factura.pagada === '0'
                  ? 'Activa'
                  : 'Desconocido',
              xml: factura.XML
                ? `${BASE_URL}/${factura.XML.replace(/^[\.\/]+/, '')}`
                : 'No disponible',
              pagada:
                factura.pagada === '1'
                  ? 'Pagada'
                  : factura.pagada === '0'
                  ? 'No pagada'
                  : 'Estado desconocido',
              factura: factura.Numero_factura || 'Sin número',
              fecha: factura.fecha || 'Fecha no disponible',
              pdfFactura: factura.pdf_factura
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${factura.pdf_factura.replace(/^[\.\/]+/, '')}`
                : 'No disponible',
              pdfURL: factura.pdf_factura
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${factura.pdf_factura.replace(/^[\.\/]+/, '')}`
                : 'No disponible', // 🔹 Agregado para cumplir con 'Nota'
              tipoDeFactura: factura.tipoDeFactura || 'No especificado',
              electronica: factura.electronica || 'No especificado',
              enviar: factura.enviar || 'No especificado',
              dian: factura.dian || 'No especificado',
              contingencia: factura.contingencia || '0',
              cufe: factura.CUFE,
              opciones: factura.opciones || 'No disponible',
              causativo: factura.CAUSATIVO || false,
              descripcionDelContrato:
                factura.descripcion_contrato || 'No especificado',
            };
          })
        : [];

      set({ listaDeFacturas, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendFacturaMail: async (email: string, id: number) => {
    set({ loadingSend: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loadingSend: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    const formData = new FormData();
    formData.append('correoxml', email);
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/facturas/enviarfactura/${id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al enviar la factura');
      }

      const responseData = await response.json();

      if (responseData && responseData.status === false) {
        showErrorToast(`Hubo un error ${responseData.message}`);
        set({ loading: false, error: null, success: false });
        return;
      }

      set({ loading: false, error: null, success: true });
      showTemporaryToast('Factura enviada correctamente');
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

  importarFacturas: async (file: File) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const formData = new FormData();
      formData.append('excel_file', file);

      const response = await fetchWithTimeout(
        //          /api/fileuploadcontroller/ventasExcel
        `${BASE_URL}/api/fileuploadcontroller/ventasExcel`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Usamos FormData para enviar el archivo
        }
      );
      if (!response.ok) {
        const errorText = await response.text(); // Lee el cuerpo de la respuesta como texto
        console.error('Error en el servidor:', errorText); // Logueamos el texto del error
        throw new Error(`Error al importar las facturas: ${errorText}`);
      }

      if (response.status === 200 || response.status === 201) {
        const state = useFacturaStore.getState();
        await state.fetchListaDeFacturas();
        showTemporaryToast('Facturas importadas correctamente');
      } else {
        throw new Error('Error al importar factura');
      }

      // Si la respuesta es un JSON (como un objeto o algo procesado), puedes usar response.json()
      const responseData = await response.json();
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

  checkEstadoDian: async (cufe) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}api/factura/estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cufe }),
      });
      const responseData = await response.json();

      if (
        responseData.StatusCode === '66' ||
        responseData.StatusCode === '00'
      ) {
        const state = useFacturaStore.getState();
        await state.fetchListaDeFacturas();
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

  checkEstadoCliente: async (cufes) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    const forBack = { cufes };
    try {
      const response = await fetch(`${BASE_URL}checkEstadoCliente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(forBack),
      });
      const responseData = await handleApiResponse(
        response,
        'No se pudo chekear el estado del cliente'
      );
      // console.log(responseData);
      return responseData.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al enviar los datos:', errorMessage);
      set({
        error: errorMessage,
      });
    }
  },

  informeExogenas: async (data) => {
    set({ loading: true });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    try {
      const url = `${BASE_URL}api/informes/informeExcel/${data.cliente}/${data.year}/${data.anuladas}/${data.opciones}/${data.informe}/${data.desde}/${data.hasta}/${data.desde2}/${data.hasta2}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get('Content-Type');

      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        console.log('responseData AAAA', responseData);
        set({ loading: false });
      } else if (
        contentType &&
        (contentType.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) ||
          contentType.includes('application/octet-stream'))
      ) {
        const blob = await response.blob();

        const filename = `informe-${Date.now()}.xlsx`;
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        set({ loading: false });
      } else {
        throw new Error('Tipo de respuesta no esperado: ' + contentType);
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

  reset: () => set({ facturas: [], listaDeFacturas: [], resoluciones: [] }),
}));
