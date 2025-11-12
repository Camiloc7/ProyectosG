import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast'; // Assuming showToast exists for success messages
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { BASE_URL } from '@/helpers/ruta';
import { create } from 'zustand';

interface InformeState {
  loading: boolean;
  informe1006: (year: string) => Promise<void>;
  informe1005: (year: string) => Promise<void>;
  informe1007: (year: string) => Promise<void>;
}

export const useInformesExogenasStore = create<InformeState>((set) => ({
  loading: false,

  informe1006: async (year) => {
    set({ loading: true });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false });
      window.location.href = '/login';
      return;
    }
    const infoParaBack = {
      anio: year,
    };
    console.log('Lo que mando', infoParaBack);
    try {
      const ruta = `${BASE_URL}api/informes/mil-seis`;
      const response = await fetch(ruta, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infoParaBack),
      });

      // --- New logic starts here ---
      const contentType = response.headers.get('Content-Type');

      if (
        contentType &&
        contentType.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ) {
        // It's an Excel file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_1006_${year}.xlsx`; // You might want a dynamic filename
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showTemporaryToast('El archivo Excel se ha descargado exitosamente.'); // Assuming showToast for success
      } else if (contentType && contentType.includes('application/json')) {
        // It's a JSON response
        const data = await response.json();
        console.error('DATA', data);
        if (data.status === false) {
          showErrorToast(data.message);
          throw new Error(data.message);
        } else if (data.message) {
          showTemporaryToast(data.message); // Show the success message from the backend
        } else {
          showTemporaryToast('Operación exitosa.'); // Generic success if no specific message
        }
      } else {
        // It's a text or unknown type, treat as an error
        const errorText = await response.text();
        console.error(
          'Tipo de respuesta inesperado:',
          contentType,
          'Contenido:',
          errorText
        );
        showErrorToast('No se encontraron compras para ese año');
        set({ loading: false });
      }
      // --- New logic ends here ---

      set({ loading: false });
    } catch (error: any) {
      console.error('ERROR EN PUNTO TEXT .TEXT():', error);
      showErrorToast(
        'Ocurrió un error inesperado. Por favor, contacta al soporte tecnico.'
      );
      set({ loading: false });
    }
  },

  informe1005: async (year) => {
    set({ loading: true });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false });
      window.location.href = '/login';
      return;
    }
    const infoParaBack = {
      anio: year,
    };
    console.log('Lo que mando', infoParaBack);
    try {
      const ruta = `${BASE_URL}api/informes/mil-cinco`;
      const response = await fetch(ruta, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infoParaBack),
      });

      const contentType = response.headers.get('Content-Type');

      if (
        contentType &&
        contentType.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ) {
        // It's an Excel file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_1005_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showTemporaryToast('El archivo Excel se ha descargado exitosamente.'); // Assuming showToast for success
      } else if (contentType && contentType.includes('application/json')) {
        // It's a JSON response
        const data = await response.json();
        if (data.status === false) {
          showErrorToast(data.message);
          throw new Error(data.message);
        } else if (data.message) {
          showTemporaryToast(data.message); // Show the success message from the backend
        } else {
          showTemporaryToast('Operación exitosa.'); // Generic success if no specific message
        }
      } else {
        // It's a text or unknown type, treat as an error
        const errorText = await response.text();
        console.error(
          'Tipo de respuesta inesperado:',
          contentType,
          'Contenido:',
          errorText
        );

        showErrorToast('No se encontraron compras para ese año');
        set({ loading: false });
      }

      set({ loading: false });
    } catch (error: any) {
      console.error('An unexpected error occurred:', error);
      showErrorToast(
        'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'
      );
      set({ loading: false });
    }
  },

  informe1007: async (year) => {
    set({ loading: true });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false });
      window.location.href = '/login';
      return;
    }
    const infoParaBack = {
      anio: year,
    };
    console.log('Lo que mando', infoParaBack);
    try {
      const ruta = `${BASE_URL}api/informes/mil-siete`;
      const response = await fetch(ruta, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infoParaBack),
      });

      const contentType = response.headers.get('Content-Type');

      if (
        contentType &&
        contentType.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ) {
        // It's an Excel file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_1005_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showTemporaryToast('El archivo Excel se ha descargado exitosamente.'); // Assuming showToast for success
      } else if (contentType && contentType.includes('application/json')) {
        // It's a JSON response
        const data = await response.json();
        if (data.status === false) {
          showErrorToast(data.message);
          throw new Error(data.message);
        } else if (data.message) {
          showTemporaryToast(data.message); // Show the success message from the backend
        } else {
          showTemporaryToast('Operación exitosa.'); // Generic success if no specific message
        }
      } else {
        // It's a text or unknown type, treat as an error
        const errorText = await response.text();
        console.error(
          'Tipo de respuesta inesperado:',
          contentType,
          'Contenido:',
          errorText
        );

        showErrorToast('No se encontraron compras para ese año');
        set({ loading: false });
      }

      set({ loading: false });
    } catch (error: any) {
      console.error('An unexpected error occurred:', error);
      showErrorToast(
        'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'
      );
      set({ loading: false });
    }
  },
}));
