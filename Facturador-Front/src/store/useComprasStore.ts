import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
// import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/ConfirmOption';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { handleApiResponse } from '@/helpers/handleApiResponse';
import { EstadosCliente } from '@/app/facturas/page';

interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number | null; // Permitir null
  contrato: string;
  estado: string;
  xml: string;
  cufe: string;
  enviar: string;
  opciones: string;
  dian: string;
  pagada: string;
  fecha: string;
  factura: string;
  tipoDeFactura: string; // Propiedad opcional
  electronica: string;
  contingencia: string;
  pdfURL: string;
  proveedor: string;
}

interface ComprasStore {
  listaDeFacturas: Nota[];
  loading: boolean;
  loadingSend: boolean;
  error: string | null;
  success: boolean;
  informeReteica: (fecha: string) => Promise<void>;
  fetchListaDeFacturas: () => Promise<void>;
  postFacturaCompra: (formData: any) => Promise<void>;
  checkEstadoFactura: (info: string[]) => Promise<any>;

  importarFacturaCompra: (file: any) => Promise<void>;
  aceptarRechazarFactura: (accept: boolean, cufe: string) => Promise<void>;

  // generarPdf: (formData: any, onFinish?: () => void) => Promise<void>;
  reset: () => void;
}

export const useComprasStore = create<ComprasStore>((set, get) => ({
  listaDeFacturas: [],
  loading: false,
  loadingSend: false,
  error: null,
  success: false,

  fetchListaDeFacturas: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetch(`${BASE_URL}api/compras/vercompras`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      const listaDeFacturas = Array.isArray(data)
        ? data.map((factura: any) => {
            return {
              id: factura.ID || '',
              prefijo: factura.Prefijo || 'Sin prefijo',
              consecutivo: factura.CONSECUTIVO
                ? Number(factura.CONSECUTIVO)
                : null,
              // Consultar si el codigo es el contrato
              contrato: factura.CODIGO || 'Sin código',
              proveedor: factura.PROVEEDOR || 'No disponible',
              estado:
                factura.ANULADO === '1'
                  ? 'Anulada'
                  : factura.ANULADO === '0'
                  ? 'Activa'
                  : 'Desconocido',
              xml: factura.XML
                ? `${BASE_URL}/${factura.XML.replace(/^[\.\/]+/, '')}`
                : 'No disponible',
              pagada:
                factura.PAGARON >= 1
                  ? 'Pagada'
                  : factura.PAGARON === '0'
                  ? 'No pagada'
                  : 'Estado desconocido',
              factura: factura.ID || 'Sin número',
              fecha: factura.FECHA || 'Fecha no disponible',
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
              contingencia: factura.contingencia || 'No especificado',
              opciones: factura.opciones || 'No disponible',
              causativo: factura.CAUSATIVO || false,
              cufe: factura.CUFE,
            };
          })
        : [];

      set({ listaDeFacturas, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  //Postear Nueva Factura
  postFacturaCompra: async (formData) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/compras/insertarCompra`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  importarFacturaCompra: async (file) => {
    set({ loading: true, error: null });
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
        `${BASE_URL}api/fileuploadcontroller/comprasExcel`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las facturas');
      }

      const data = await response.json();

      get().fetchListaDeFacturas();
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  informeReteica: async (fecha) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    const ruta = `${BASE_URL}api/reporte/informe-ica/${fecha}`;
    try {
      const response = await fetchWithTimeout(ruta, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener el informe');
      }

      const contentType = response.headers.get('content-type');

      const esExcel =
        contentType &&
        (contentType.includes('application/vnd.ms-excel') ||
          contentType.includes(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ) ||
          contentType.includes('application/octet-stream'));

      if (esExcel) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resumen-compras-reteica-${fecha}.xls`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        set({ loading: false, success: true });
      } else {
        const text = await response.text();
        console.warn('Respuesta inesperada del servidor:', text);
        showErrorToast('No se pudo descargar el Excel');
        set({ loading: false, success: false });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear informe:', error.message);
    }
  },

  checkEstadoFactura: async (cufes) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    const forBack = { cufes };
    console.warn('forBack', forBack);
    try {
      const response = await fetch(`${BASE_URL}api/compras/consultar-estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(forBack),
      });
      const responseData = await handleApiResponse(
        response,
        'No se pudo checkear el estado de la factura'
      );

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

  aceptarRechazarFactura: async (accepted, cufe) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    // Cambiamos event_id según accepted
    const forBack = {
      cufe,
      event_id: accepted ? '4' : '2',
    };
    console.warn('forBack', forBack);

    try {
      const response = await fetch(`${BASE_URL}api/compras/aceptar-rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(forBack),
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo cambiar el estado de la factura'
      );

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

  reset: () => set({ listaDeFacturas: [] }),
}));
