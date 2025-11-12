import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { InfoRepresentante, InfoFirma } from '@/types/types';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface RepresentanteStore {
  infoRepresentante: InfoRepresentante;
  infoFirma: InfoFirma;
  loading: boolean;
  error: string | null;
  success: boolean;
  sendRepresentanteForm: (formData: object) => Promise<void>;
  getRepresentantes: () => Promise<void>;
  getFirmaRepresentante: () => Promise<void>;
  sendFirmaRepresentante: (file: File) => Promise<void>;
}

export const useRepresentanteStore = create<RepresentanteStore>((set, get) => ({
  infoRepresentante: {} as InfoRepresentante,
  infoFirma: {} as InfoFirma,
  loading: false,
  error: null,
  success: false,

  sendRepresentanteForm: async (formData: any) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    // Convertir formData al formato `FormData` requerido por el backend
    const formDataToSend = new FormData();

    // Campos de texto
    formDataToSend.append('NOMBRE1_3', formData.primerNombre);
    formDataToSend.append('NOMBRE2_3', formData.segundoNombre);
    formDataToSend.append('APELLIDO1_3', formData.primerApellido);
    formDataToSend.append('APELLIDO2_3', formData.segundoApellido);
    formDataToSend.append('TIPODOC3', formData.tipoDeDocumento);
    formDataToSend.append('CEDULA3', formData.numeroDeDocumento);
    formDataToSend.append('EXPEDICION3', formData.fechaDeExpedicion);
    formDataToSend.append('FECHANACI3', formData.fechaDeNacimiento);
    formDataToSend.append('NACIONALIDAD1_3', formData.nacionalidad1);
    formDataToSend.append('NACIONALIDAD2_3', formData.nacionalidad2);
    formDataToSend.append('CORREO3', formData.correo);
    formDataToSend.append('DIRECCION3', formData.direccion);
    formDataToSend.append('DEPARTAMENTO3', formData.departamento);
    formDataToSend.append('CIUDAD3', formData.municipio);
    formDataToSend.append('TELEFONO3', formData.telefono);
    formDataToSend.append('LUGAREXP3', formData.lugarDeExpedicion);
    formDataToSend.append('LUGARNACI3', formData.lugarDeNacimiento);
    //---
    formDataToSend.append(
      'FECHA_INICIO_CERTIFICADO',
      formData.fechaCertificado
    );

    formDataToSend.append(
      'FECHA_FIN_CERTIFICADO',
      formData.fechaVencimientoCertificado
    );

    // Archivos
    if (formData.cedulaRL) {
      formDataToSend.append('archivoRL', formData.cedulaRL);
    }
    if (formData.certificadoCC) {
      formDataToSend.append('certificadoCC', formData.certificadoCC);
    }
    if (formData.rut) {
      formDataToSend.append('archivoRut', formData.rut);
    }

    // Depuración: Log de los datos en FormData
    for (let [key, value] of formDataToSend.entries()) {
      console.warn(`${key}:`, value);
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/representante/guardarinfo`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en el servidor:', errorText);
        throw new Error('Error al guardar la información del representante');
      }

      const data = await response.json();

      showTemporaryToast('Datos actualizados con exito');
      await get().getRepresentantes();

      set({ success: true, loading: false });
    } catch (error: any) {
      console.error('Error durante el envío:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  getRepresentantes: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    try {
      const response = await fetchWithTimeout(`${BASE_URL}api/representante`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en el servidor:', errorText);
        throw new Error('Error al traer la información del representante');
      }
      const data = await response.json();

      let infoRepresentante: InfoRepresentante;
      if (Array.isArray(data.data) && data.data.length > 0) {
        // ✅ Caso normal: el backend devuelve array con info
        const rep = data.data[0];
        infoRepresentante = {
          primerNombre: rep.NOMBRE1_3 || '',
          segundoNombre: rep.NOMBRE2_3 || '',
          primerApellido: rep.APELLIDO1_3 || '',
          segundoApellido: rep.APELLIDO2_3 || '',
          tipoDeDocumento: rep.TIPODOC3 || '',
          numeroDeDocumento: rep.CEDULA3 || '',
          fechaDeExpedicion: rep.EXPEDICION3 || '',
          fechaDeNacimiento: rep.FECHANACI3 || '',
          nacionalidad1: rep.NACIONALIDAD1_3 || '',
          nacionalidad2: rep.NACIONALIDAD2_3 || '',
          correo: rep.CORREO3 || '',
          direccion: rep.DIRECCION3 || '',
          departamento: rep.DEPARTAMENTO3 || '',
          municipio: rep.CIUDAD3 || '',
          telefono: rep.TELEFONO3 || '',
          lugarDeExpedicion: rep.LUGAREXP3 || '',
          lugarDeNacimiento: rep.LUGARNACI3 || '',
          cedulaRL: null,
          certificadoCC: null,
          rut: null,
          fechaCertificado: rep.FECHA_INICIO_CERTIFICADO,
          fechaVencimientoCertificado: rep.FECHA_FIN_CERTIFICADO,
          cedulaRLURL: rep.archivoRL || '',
          certificadoCCURL: rep.certificadoCC || '',
          rutURL: rep.archivoRut || '',
        };
      } else {
        // ⚠️ Caso usuario nuevo: backend devuelve objeto "vacío"
        infoRepresentante = {
          primerNombre: '',
          segundoNombre: '',
          primerApellido: '',
          segundoApellido: '',
          tipoDeDocumento: '',
          numeroDeDocumento: '',
          fechaDeExpedicion: '',
          fechaDeNacimiento: '',
          nacionalidad1: '',
          nacionalidad2: '',
          correo: '',
          direccion: '',
          departamento: data.current_departamento || '',
          municipio: data.current_municipio || '',
          telefono: '',
          lugarDeExpedicion: '',
          lugarDeNacimiento: '',
          cedulaRL: null,
          certificadoCC: null,
          rut: null,
          fechaCertificado: '',
          fechaVencimientoCertificado: '',
          cedulaRLURL: data.archivoRL || '',
          certificadoCCURL: data.certificadoCC || '',
          rutURL: data.archivoRut || '',
        };
      }

      set({ infoRepresentante, success: true, loading: false });
    } catch (error: any) {
      console.error('Error al hacer fetch:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendFirmaRepresentante: async (file: File) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    // Convertir formData al formato `FormData` requerido por el backend
    const formDataToSend = new FormData();

    formDataToSend.append('archivo', file);
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/representante/solicitar-firma`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        //Primero revisamos el content type
        const contentType = response.headers.get('Content-Type');
        //Si es que tiene un json sacamos el json toasteamos el error y consologueamos todo el json
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          showErrorToast(respuestaJson.message);
          throw new Error(respuestaJson);
        } else {
          //Si no es json solo lo volvemos texto y lo lazamos como error
          const respuestaJson = await response.text();
          showErrorToast(
            'Hubo una respuesta inesperada del servidor. Porfavor contactate con el servicio tecnico.s'
          );
          throw new Error(respuestaJson);
        }
      }

      const contentType = response.headers.get('content-type');

      // const errorText = await response.text();
      const data = await response.json();
      if (data.success) {
        await get().getRepresentantes();

        showTemporaryToast(data.message);
      } else if (!data.success) {
        showErrorToast(data.message);
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      console.error('Error durante el envío:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  getFirmaRepresentante: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/representante_usuario/getRepresentantesUsuarios`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en el servidor:', errorText);
        throw new Error('Error al guardar la información del representante');
      }

      // const errorText = await response.text();
      // console.error('Error en el servidor:', errorText);

      const data = await response.json();

      // Asignar manualmente cada campo en camelCase
      const representante = data.data[0];
      const infoFirma: InfoFirma = {
        id: representante.id,
        idUsuario: representante.id_usuario,
        idRepresentante: representante.id_representante,
        fechaCertificado: representante.fecha_certificado,
        fechaVencimientoCertificado:
          representante.fecha_vencimiento_certificado,
        rutaCertificado: representante.ruta_certificado,
      };

      set({ success: true, loading: false, infoFirma });
    } catch (error: any) {
      console.error('Error durante el envío:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
