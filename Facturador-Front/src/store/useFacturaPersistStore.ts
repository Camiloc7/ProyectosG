import { create } from 'zustand';
import { BASE_URL, BASE_URL_NEW } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/ConfirmOption';
import { persist } from 'zustand/middleware';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FacturaState {
  showLoading: boolean;
  startTime: number;
  loadingSend: boolean;
  error: string | null;
  success: boolean;
  setShowLoading: (v: boolean) => void;
  setStartTime: (t: number) => void;
  // generarPdf: (formData: any, onFinish?: () => void) => Promise<void>;
  sendFacturaData: (
    formData: Record<string, any>,
    onFinish?: () => void
  ) => Promise<void>;
}

export const useFacturaPersistStore = create<FacturaState>()(
  persist(
    (set, get) => ({
      showLoading: false,
      startTime: 0,
      loadingSend: false,
      error: null,
      success: false,

      setShowLoading: (v) => set({ showLoading: v }),
      setStartTime: (t) => set({ startTime: t }),

      sendFacturaData: async (
        formData: Record<string, any>,
        onFinish?: () => void
      ) => {
        // start spinner and progress bar
        set({
          showLoading: true,
          startTime: Date.now(),
          loadingSend: true,
          error: null,
          success: false,
        });
        const token = getTokenFromCookies();
        if (!token) {
          set({ loadingSend: false, error: 'Token no disponible' });
          window.location.href = '/login';
          set({ showLoading: false });
          return;
        }

        const formDataInstance = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (Array.isArray(value))
            formDataInstance.append(key, JSON.stringify(value));
          else if (typeof value === 'boolean')
            formDataInstance.append(key, value ? 'true' : 'false');
          else if (value instanceof Date)
            formDataInstance.append(key, value.getTime().toString());
          else if (value != null) formDataInstance.append(key, value);
        });

        for (const [key, value] of formDataInstance.entries()) {
          console.log(`${key}: ${value}`);
        }
        //!ESTO ES SOLO PARA DEBUG
        // await sleep(10000);
        //TODO NO BORRAR, ES PARA DEBUG
        // set({ loadingSend: false, success: true });
        // set({ showLoading: false });
        // if (onFinish) onFinish();

        try {
          const response = await fetch(`${BASE_URL_NEW}api/factura-aiu`, {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
            body: formDataInstance,
          });
          if (!response.ok)
            throw new Error('Error al enviar los datos del formulario');

          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.includes('application/pdf')) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (onFinish) onFinish();
            const confirmado = await confirm({
              title: 'PDF generado. ¿Descargar?',
            });
            if (confirmado) {
              const a = document.createElement('a');
              a.href = url;
              a.download = 'factura.pdf';
              a.click();
              URL.revokeObjectURL(url);
            }
            const count = parseInt(
              localStorage.getItem('facturasGeneradas') || '0',
              10
            );
            localStorage.setItem('facturasGeneradas', String(count + 1));
            set({ loadingSend: false, success: true });
          } else if (contentType.includes('application/json')) {
            const result = await response.json();
            console.log(result);
            showErrorToast(result.message);
            set({ loadingSend: false, success: true });
            if (onFinish) onFinish();
          } else if (contentType.includes('text/html')) {
            const htmlText = await response.text();
            console.log(htmlText);
            const viewer = document.createElement('div');
            viewer.innerHTML = htmlText;
            document.body.appendChild(viewer);
            set({ loadingSend: false, success: true });
            if (onFinish) onFinish();
          } else {
            throw new Error('Tipo de respuesta inesperado');
          }
        } catch (error: any) {
          set({
            loadingSend: false,
            error: error.message || 'Error desconocido',
            success: false,
          });
          if (onFinish) onFinish();
        } finally {
          // hide spinner/progress
          set({ showLoading: false });
        }
      },
    }),
    {
      name: 'factura-store',
      partialize: (state) => ({
        showLoading: state.showLoading,
        startTime: state.startTime,
      }),
    }
  )
);
