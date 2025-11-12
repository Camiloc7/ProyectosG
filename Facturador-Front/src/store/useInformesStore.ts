import { create } from 'zustand';
import { BASE_URL, INFORMES_IA } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { InformeDataExel, InformeDataPDF } from '@/types/types';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { showErrorToast } from '@/components/feedback/toast';
import { object } from 'prop-types';
import { handleApiResponse } from '@/helpers/handleApiResponse';

interface DataFechas {
  fechaInicial: string;
  fechaFinal: string;
}

interface DataIA {
  análisis: string;
  análisis_general: string;
  clientes: ClientesIA[];
}

interface IInformesTotales {
  'totalComprasConstructor ': string;
  'totalComprasNoConstructor ': string;
  totalRetegarantiasCompras: string;
  totalIvaSobreUtilidadCompras: string;
  totalIvaSobreSubtotalCompras: string;
  totalVentasConstructor: string;
  totalVentasMixtas: string;
  totalVentasNoConstructor: string;
  totalRetegarantiasVentas: string;
  totalIvaSobreUtilidadVentas: string;
  totalIvaSobreSubtotalVentas: string;
  ivaPorPagarConstructor: string;
  ivaPorPagarNoConstructor: string;
  ivaPorPagarTotal: string;
}
interface ClientesIA {
  nombre: string;
  porcentaje: string;
  total_anio_anterior: string;
  total_ultimo_anio: string;
  variacion: string;
}

interface InformesStore {
  loading: boolean;
  infoIA: DataIA | null;
  error: string | null;
  informesTotales: IInformesTotales | null;
  success: boolean;
  informeComparativoExel: (data: InformeDataExel) => Promise<void>;
  traerInformesTotales: (
    fechaInicial: string,
    fechaFinal: string
  ) => Promise<void>;
  informeComparativoPDF: (data: InformeDataPDF) => Promise<void>;
  imprimirInformeComparativoPDF: (data: InformeDataPDF) => Promise<void>;
  resumenDeVentas: (data: DataFechas) => Promise<void>;
  resumenDeCompras: (data: DataFechas) => Promise<void>;
  actualizarVariacion: () => Promise<void>;
  informesIA: (
    firstYear: string,
    secondYear: string,
    nit: string
  ) => Promise<void>;
  reporteIVA: (data: DataFechas) => Promise<void>;
}

export const useInformesStore = create<InformesStore>((set, get) => ({
  loading: false,
  infoIA: null,
  error: null,
  success: false,
  informesTotales: null,

  // Función para crear informe comparativo Excel
  informeComparativoExel: async (data: InformeDataExel) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/informes/informeExcel/undefined/undefined/undefined/undefined/informecomparativo/${data.fechaInicial1}/${data.fechaFinal1}/${data.fechaInicial2}/${data.fechaFinal2}`,
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

  informeComparativoPDF: async (data: InformeDataPDF) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/informes/informefacturas/${data.fechaInicial}/${data.fechaFinal}`,
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

  imprimirInformeComparativoPDF: async (data: InformeDataPDF) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/informes/informefacturas/${data.fechaInicial}/${data.fechaFinal}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error('Error al obtener el informe');
      }

      // Convertir la respuesta en un Blob de tipo PDF
      const pdfBlob = await response.blob();

      // Crear una URL temporal para el Blob
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Abrir el PDF en una nueva ventana
      const pdfWindow = window.open(pdfUrl);

      if (pdfWindow) {
        // Intentar imprimir el PDF automáticamente
        pdfWindow.onload = () => {
          pdfWindow.print();
        };
      } else {
        throw new Error('No se pudo abrir el PDF en una nueva ventana');
      }

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

  informesIA: async (firstYear, secondYear, nit) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    const data = {
      añoA: firstYear,
      añoB: secondYear,
      nitEmpresa: nit,
    };

    try {
      const response = await fetchWithTimeout(
        `${INFORMES_IA}api/informe/nota-cuatro`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error('Error al obtener el informe');
      }

      const respuestaData = await response.json();

      set({ loading: false, success: true, infoIA: respuestaData });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear informe:', error.message);
    }
  },

  resumenDeVentas: async (data) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    const { fechaInicial: fechaA, fechaFinal: fechaB } = data;
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/reportes/obtenerResumenVentas/${fechaA}/${fechaB}`,

        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
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
        a.download = `resumen-compras-${fechaA}_a_${fechaB}.xls`; // extensible a xlsx si lo deseas
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

  resumenDeCompras: async (data) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    const { fechaInicial: fechaA, fechaFinal: fechaB } = data;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/reportes/obtenerResumenCompras/${fechaA}/${fechaB}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

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
        a.download = `resumen-compras-${fechaA}_a_${fechaB}.xls`; // extensible a xlsx si lo deseas
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

  actualizarVariacion: async () => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/reportes/actualizarVariacion`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      const contentType = response.headers.get('content-type');

      // if (!response.ok) {
      //   throw new Error('Error al obtener el informe');
      // }
      const responseData = await response.json();
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear informe:', error.message);
    }
  },

  reporteIVA: async (data) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    const { fechaInicial: fechaA, fechaFinal: fechaB } = data;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/reportes/reporteIva/${fechaA}/${fechaB}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

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
        a.download = `resumen-compras-${fechaA}_a_${fechaB}.xls`; // extensible a xlsx si lo deseas
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

  traerInformesTotales: async (fechaInicio, fechaFinal) => {
    set({ loading: true });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    console.warn('COmo mando la data: ');
    console.warn('fechaInicial:', fechaInicio);
    console.warn('Fecha final:', fechaFinal);

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/informes/totales/${fechaInicio}/${fechaFinal}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener el informe');
      }
      const jsonData = await response.json();

      // aquí va SOLO la data
      set({ informesTotales: jsonData });
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
    } finally {
      set({ loading: false });
    }
  },
}));
