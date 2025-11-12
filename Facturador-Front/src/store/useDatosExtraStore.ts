import { create } from 'zustand';
import { BASE_URL, NODE_API } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { Retefuentes } from '@/types/types';
import { showErrorToast } from '@/components/feedback/toast';

interface SelectOption {
  id: string;
  nombre: string;
  clave?: string;
}

interface SelectOptionCompleja {
  id: string;
  nombre: string;
  clave: string;
}

interface DatosExtraStore {
  documentos: string[];
  selectRetenciones: SelectOption[];
  infoRetenciones: Retefuentes[];
  unidadesDeMedida: [];
  categoriasListas: SelectOptionCompleja[];
  categoriasEmpresariales: SelectOption[];

  categoriasVentas: SelectOption[];
  responsabilidades: string[];
  loading: boolean;
  error: string | null;
  success: boolean;

  fetchCategoriasEmpresariales: () => Promise<void>;
  fetchCategoriasCincoAlOcho: () => Promise<void>;
  fetchCategoriasPuc: () => Promise<void>;
  fetchTiposDeDocumentos: () => Promise<void>;
  fetchUnidadesDeMedida: () => Promise<void>;
  fetchResponsabilidadesFiscales: () => Promise<void>;
  fetchRetenciones: () => Promise<void>;
  fetchCategoriasProductosVenta: () => Promise<void>;
}

export const useDatosExtraStore = create<DatosExtraStore>((set) => ({
  documentos: [],
  selectRetenciones: [],
  categoriasListas: [],
  categoriasEmpresariales: [],
  infoRetenciones: [],
  unidadesDeMedida: [],
  categoriasVentas: [],
  responsabilidades: [],
  loading: false,
  error: null,
  success: false,

  fetchTiposDeDocumentos: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) return;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/leerdocumentos`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener los documentos');
      }

      const data = await response.json();
      const documentos = data.datos;
      set({ documentos, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchResponsabilidadesFiscales: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/leerresponsabilidad`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las responsabulidades');
      }

      const data = await response.json();
      const responsabilidades = data.datos;
      set({ responsabilidades, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchRetenciones: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(`${NODE_API}datos/retenciones`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las retenciones');
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error('Error al obtener las retenciones');
      }
      const retenciones = data.data;

      const selectRetenciones = Array.isArray(retenciones)
        ? retenciones.map((x: any) => {
            return {
              id: String(x.id) || '',
              nombre: x.nombre,
            };
          })
        : [];

      set({
        selectRetenciones,
        infoRetenciones: retenciones,
        success: true,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchCategoriasProductosVenta: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(`${NODE_API}ventas/productos`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al obtener las categorias');
      }
      const data = await response.json();
      if (!data.status) {
        throw new Error('Error al obtener las categorias');
      }

      const categorias = data.data;

      const categoriasVentas = Array.isArray(categorias)
        ? categorias.map((x: any) => {
            return {
              id: String(x.id) || '',
              nombre: x.nombre,
            };
          })
        : [];
      set({ categoriasVentas, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchUnidadesDeMedida: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${NODE_API}datos/unidadesDeMedida`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        console.log(contentType);
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          throw new Error(respuestaJson);
        } else {
          const respuestaJson = await response.text();
          throw new Error(respuestaJson);
        }
      }
      const data = await response.json();

      if (!data.status) {
        throw new Error('Error al obtener los datos');
      }

      const unidades = data.data;
      const unidadesDeMedida = unidades.map((u: any) => ({
        ...u,
        id: u.id.toString(),
      }));
      set({ unidadesDeMedida, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },




  fetchCategoriasCincoAlOcho: async () => {
    set({ loading: true });
    try {
      const response = await fetchWithTimeout(`${NODE_API}datos/select5-8`, {
        method: 'GET',
      });

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          throw new Error(respuestaJson);
        } else {
          const respuestaJson = await response.text();

          throw new Error(respuestaJson);
        }
      }
      const data = await response.json();
      const categorias = data.data;
      const categoriasListas = categorias.map((x: any) => ({
        id: String(x.codigo),
        nombre: x.nombre,
        clave: x.clave,
      }));
      set({ categoriasListas, success: true, loading: false });
    } catch (error: any) {
      console.error('ERROR AL HACER FETCH A las categorias', error);
      set({ loading: false });
    }
  },






  
  fetchCategoriasPuc: async () => {
    set({ loading: true });
    try {
      const response = await fetchWithTimeout(`${NODE_API}datos/select15-16-17`, {
        method: 'GET',
      });

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          throw new Error(respuestaJson);
        } else {
          const respuestaJson = await response.text();

          throw new Error(respuestaJson);
        }
      }
      const data = await response.json();
      const categorias = data.data;
      const categoriasListas = categorias.map((x: any) => ({
        id: String(x.codigo),
        nombre: x.nombre,
        clave: x.clave,
      }));
      set({ categoriasListas, success: true, loading: false });
    } catch (error: any) {
      console.error('ERROR AL HACER FETCH A las categorias', error);
      set({ loading: false });
    }
  },




















  fetchCategoriasEmpresariales: async () => {
    set({ loading: true });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const ruta = `${NODE_API}ventas/empresa`;
      const response = await fetch(ruta, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        console.log(contentType);
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          throw new Error(respuestaJson);
        } else {
          const respuestaJson = await response.text();
          throw new Error(respuestaJson);
        }
      }

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        console.log(contentType);
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          throw new Error(respuestaJson);
        } else {
          const respuestaJson = await response.text();

          throw new Error(respuestaJson);
        }
      }
      const data = await response.json();
      const categoriasEmpresariales = data.data;
      const categoriasListas = categoriasEmpresariales.map((x: any) => ({
        id: x.clave,
        nombre: x.nombre,
        clave: x.clave,
      }));
      set({
        categoriasEmpresariales: categoriasListas,
        success: true,
        loading: false,
      });
    } catch (error: any) {
      console.error('ERROR AL HACER FETCH A las categorias', error);
      set({ loading: false });
    }
  },
}));
