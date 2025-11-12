import { create } from 'zustand';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { Review } from '@/types/types';
import { BASE_URL } from '@/helpers/ruta';

interface ReviewsStore {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchReviews: () => Promise<void>;
  sendReviewUX: (comentario: string, ratingUX: number) => Promise<void>;
}

export const useReviewStore = create<ReviewsStore>((set) => ({
  reviews: [],
  loading: false,
  error: null,
  success: false,

  fetchReviews: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/calificacion/getComentarios`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al hacer fetch a las reviews');
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error('Error al hacer fetch a las reviews');
      }

      // Mapeamos los datos para asegurarnos de que tienen la estructura correcta
      const reviews: Review[] = Array.isArray(data.data)
        ? data.data.map((data: any) => ({
            calificacion: data.CALIFICACION,
            comentario: data.COMENTARIO,
            idUsuario: data.ID_USUARIO,
            nombre: data.nombre_usuario || '', // Si NOMBRE no está disponible, asignamos una cadena vacía
            // id: data.ID,
          }))
        : [];

      set({ reviews, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendReviewUX: async (comentario: string, ratingUX: number) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    const formData = new FormData();
    formData.append('comentario', comentario);
    formData.append('calificacion', ratingUX.toString());

    // Mostrar el contenido del FormData en la consola (depuración)
    for (const [key, value] of formData.entries()) {
    }
    try {
      const response = await fetch(
        `${BASE_URL}api/calificacion/insertarComentario`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener la información del usuario');
      }

      const objetos = await response.json();

      // Aquí almacenamos la información del usuario en el estado global
      set({ loading: false });
    } catch (error) {
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      set({ error: errorMessage, loading: false });
    }
  },
}));
