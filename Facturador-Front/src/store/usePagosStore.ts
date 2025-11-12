import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { InfoListaPagos } from '@/types/types';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface CrearCuentaData {
  numeroDeCuenta: string;
  tipoDeCuenta: string;
  banco: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
}

interface Cuenta {
  id: string;
  nombre: string;
}

interface PagosStore {
  loading: boolean;
  codigoNuevaCuenta: string;
  listaDePagos: InfoListaPagos[];
  listaDeCuentas: Cuenta[];
  datosForm: {};
  listaDeBancos: [];
  loadingListaPagos: boolean;
  loadingInfoFormPagada: boolean;
  error: string | null;
  success: boolean;
  fetchListaDePagos: () => Promise<void>;
  fetchCuentas: () => Promise<void>;
  fetchInfoFormPagos: (id: string) => Promise<void>;
  fetchBancos: () => Promise<void>;
  actualizarDatosLista: (valor: string, clave: string) => Promise<void>;
  sendFormPagada: (fecha: string, codigo: string, id: string) => Promise<void>;
  generarCausativo: (cuenta: any, id: string) => Promise<void>;
  fetchCodigoCuentaNueva: () => Promise<void>;
  crearCuenta: (data: CrearCuentaData) => Promise<void>;
}

export const usePagosStore = create<PagosStore>((set) => ({
  listaDePagos: [],
  listaDeBancos: [],
  listaDeCuentas: [],
  datosForm: {},
  codigoNuevaCuenta: '',
  loading: false,
  loadingListaPagos: false,
  loadingInfoFormPagada: false,
  error: null,
  success: false,

  fetchListaDePagos: async () => {
    set({ loadingListaPagos: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loadingListaPagos: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(`${BASE_URL}api/pagos`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error al obtener la lista de pagos: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data.facturas)) {
        set({ error: 'Datos inválidos recibidos', loadingListaPagos: false });
        return;
      }

      const listaDePagos = Array.isArray(data.facturas)
        ? data.facturas.map((factura: any) => {
            const cuenta1305 = Array.isArray(data.cuenta130505)
              ? data.cuenta130505.find(
                  (cuenta: any) =>
                    cuenta.Numero_Documento === factura.Numero_factura
                ) || {}
              : {}; // Si no es un array, asigna un objeto vacío

            const cuenta1110 = Array.isArray(data.cuenta111005)
              ? data.cuenta111005.find(
                  (cuenta: any) =>
                    cuenta.Numero_Documento === factura.Numero_factura
                ) || {}
              : {};

            const diferencia = Array.isArray(data.diferencia)
              ? data.diferencia.find(
                  (cuenta: any) =>
                    cuenta.Numero_Documento === factura.Numero_factura
                ) || {}
              : {};

            return {
              anulado:
                factura.ANULADO === '0'
                  ? 'Activa'
                  : factura.ANULADO === '1'
                  ? 'Anulado'
                  : factura.ANULADO,
              contingencia: factura.CONTINGENCIA,
              estado: factura.ESTADO || '---',
              numeroDefactura: factura.Numero_factura,
              xml: factura.XML,
              consecutivo: factura.consecutivo,
              contrato: factura.contrato || '---',
              pagada:
                factura.pagada === '0'
                  ? 'No'
                  : factura.pagada === '1'
                  ? 'Si'
                  : factura.pagada,
              pdfFactura: factura.pdf_factura
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${factura.pdf_factura.replace(/^[\.\/]+/, '')}`
                : 'No disponible',
              prefijo: factura.prefijo,
              fecha: factura.fecha,
              clave1305: cuenta1305 ? cuenta1305.CLAVE : '',
              valor1305:
                cuenta1305?.DEBITO !== '0.00'
                  ? cuenta1305.DEBITO
                  : cuenta1305.CREDITO,
              clave1110: cuenta1110 ? cuenta1110.CLAVE : '',
              valor1110:
                cuenta1110?.DEBITO !== '0.00'
                  ? cuenta1110.DEBITO
                  : cuenta1110.CREDITO,
              causativo: factura.CAUSATIVO_PAGO
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${factura.CAUSATIVO_PAGO.replace(/^[\.\/]+/, '')}`
                : '---',
              diferencia: diferencia ? diferencia.Diferencia : '---',
              idDeCuenta: factura.cuenta_pago || '---',
            };
          })
        : [];

      set({ listaDePagos, success: true, loadingListaPagos: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Error desconocido',
        loadingListaPagos: false,
      });
    }
  },

  fetchCuentas: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/cuentaUsuario/obtenerCuentas`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error al obtener las cuentas');

      const data = await response.json();
      if (!data.status)
        throw new Error(data.message || 'Error en la respuesta del servidor');

      const listaDeCuentas = data.data.map((cuenta: any) => ({
        id: cuenta.ID,
        nombre: cuenta.N_CUENTA,
      }));

      set({ listaDeCuentas, success: true, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Error desconocido', loading: false });
    }
  },

  fetchBancos: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/bancos/listabancos`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error al obtener los bancos');

      const data = await response.json();
      if (!data.status)
        throw new Error(data.message || 'Error en la respuesta del servidor');

      const listaDeBancos = data.data.map((banco: any) => ({
        id: banco.Codigo,
        nombre: banco.Nombre,
      }));

      set({ listaDeBancos, success: true, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Error desconocido', loading: false });
    }
  },

  crearCuenta: async (data: CrearCuentaData) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      showErrorToast('Error: Token no disponible');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('ncuenta', data.numeroDeCuenta);
      formData.append('tipo', data.tipoDeCuenta);
      formData.append('idbanco', data.banco);

      const response = await fetchWithTimeout(
        `${BASE_URL}api/cuentaUsuario/crearCuenta`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Usamos formData en lugar de data directamente
        }
      );

      if (!response.ok) {
        throw new Error('Error al crear cuenta');
      }

      const info: ApiResponse = await response.json();

      if (!info.status) {
        showErrorToast(info.message);

        throw new Error(info.message || 'Error en la respuesta del servidor');
      }

      showTemporaryToast(info.message);
      const state = usePagosStore.getState();
      await state.fetchCuentas();

      set({ success: true, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchCodigoCuentaNueva: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/cuentaUsuario/codigoCuentaNuevo`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error al obtener los bancos');

      const data = await response.json();

      if (!data.success)
        throw new Error(data.message || 'Error en la respuesta del servidor');

      const codigoNuevaCuenta = data.Codigo_Nuevo_Cuenta;

      set({ codigoNuevaCuenta, success: true, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Error desconocido', loading: false });
    }
  },

  generarCausativo: async (cuenta: string, id: string) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      showErrorToast('Error: Token no disponible');
      return;
    }
    const formData = new FormData();
    formData.append('ncuenta', cuenta);

    // Mostrar el contenido del FormData en la consola (depuración)
    for (const [key, value] of formData.entries()) {
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/causativo/generarpagos/${id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al crear cuenta');
      }

      // Convertir la respuesta en un Blob (archivo)
      const blob = await response.blob();

      // Crear una URL para el Blob
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${id}.xlsx`; // Nombre del archivo
      document.body.appendChild(a);
      a.click();

      // Liberar memoria
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const state = usePagosStore.getState();
      await state.fetchListaDePagos();

      set({ success: true, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      set({ error: errorMessage, loading: false });
    }
  },

  actualizarDatosLista: async (valor: string, clave: string) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      showErrorToast('Error: Token no disponible');
      return;
    }

    const infoParaBack = JSON.stringify({ VALOR: valor }); // Convertir a JSON

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/pagos/actualizarBanco/${clave}`,
        {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json', // Asegurar el tipo de contenido
          },
          body: infoParaBack, // Enviar como JSON
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar la lista');
      }

      const data = await response.json();

      if (!data.success)
        throw new Error(data.message || 'Error en la respuesta del servidor');

      set({ success: true, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      set({ error: errorMessage, loading: false });
    }
  },

  sendFormPagada: async (fecha: string, codigo: string, id: string) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      showErrorToast('Error: Token no disponible');
      return;
    }
    const formData = new FormData();
    formData.append('FECHAPAGO', fecha);
    formData.append('CODPAGO', codigo);

    for (const [key, value] of formData.entries()) {
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/pagos/guardarCodPagoFecha/${id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al crear cuenta');
      }

      const data = await response.json();

      if (data) {
        showTemporaryToast('Pago registrado exitosamente');
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      set({ error: errorMessage, loading: false });
    }
  },

  fetchInfoFormPagos: async (id: string) => {
    set({ loadingInfoFormPagada: true, error: null });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loadingInfoFormPagada: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(`${BASE_URL}api/factura/${id}`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener la factura: ${response.statusText}`);
      }

      const data = await response.json();

      // Buscar la factura con el ID específico
      const facturaEncontrada = data.facturas.find(
        (factura: any) => factura.NUMERO === id
      );

      if (!facturaEncontrada) {
        set({
          loadingInfoFormPagada: false,
        });
        return;
      }

      // Extraer FECHAPAGO y CODPAGO
      const { FECHAPAGO, CODPAGO } = facturaEncontrada;

      const datosForm = {
        fechaDePago: FECHAPAGO,
        codigoDePago: CODPAGO,
      };

      set({
        success: true,
        loadingInfoFormPagada: false,
        datosForm,
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Error desconocido',
        loadingInfoFormPagada: false,
      });
    }
  },
}));
