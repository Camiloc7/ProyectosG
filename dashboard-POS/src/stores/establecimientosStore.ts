import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";
import { handleApiResponse } from "@/helpers/handleApiResponse";

// Tipado para un establecimiento
export type Establecimiento = {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  logo_url: string;
  impuesto_porcentaje: string;
  created_at: string;
  updated_at: string;
};

type CamposActualizables = Pick<
  Establecimiento,
  | "nombre"
  | "direccion"
  | "telefono"
  | "logo_url"
  | "impuesto_porcentaje"
  | "activo"
>;

// 2. Hazlos opcionales
type EstablecimientoUpdate = Partial<CamposActualizables>;

// 3. Usa ese tipo en la store
type EstablecimientosState = {
  loading: boolean;
  establecimientos: Establecimiento[];
  establecimientoActual: Establecimiento | null;
  fetchEstablecimientos: () => Promise<void>;
  traerEstablecimientoPorId: (id: string) => Promise<void>;
  actualizarEstablecimiento: (
    id: string,
    data: EstablecimientoUpdate
  ) => Promise<boolean>;
};
export const useEstablecimientosStore = create<EstablecimientosState>(
  (set, get) => ({
    loading: false,
    establecimientos: [],
    establecimientoActual: null,

    fetchEstablecimientos: async () => {
      const token = useAuthStore.getState().token;
      set({ loading: true });

      try {
        const res = await fetch(`${RUTA}/establecimientos`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al obtener establecimientos");
        }

        set({ establecimientos: data.data, loading: false });
      } catch (error: any) {
        console.error("Fetch establecimientos fallido:", error);
        toast.error(
          error.message || "No se pudieron cargar los establecimientos"
        );
        set({ loading: false });
      }
    },
    traerEstablecimientoPorId: async (id) => {
      const token = useAuthStore.getState().token;
      set({ loading: true });

      try {
        const res = await fetch(`${RUTA}/establecimientos/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = await handleApiResponse({
          backResponse: res,
          mensajeDeFallo: "Error al traer el establecimiento",
          debugg: false,
        });
        //toast.success(responseData.message || "Operacion Exitosa");
        set({ establecimientoActual: responseData.data });
      } catch (error: any) {
        console.error(error);
        // toast.error(error.message);
      } finally {
        set({ loading: false });
      }
    },
    actualizarEstablecimiento: async (id, data) => {
      const token = useAuthStore.getState().token;
      set({ loading: true });

      console.warn("RAW LO QUE MANDO ACTUALIZAR: ", data);
      try {
        const res = await fetch(`${RUTA}/establecimientos/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const responseData = await handleApiResponse({
          backResponse: res,
          mensajeDeFallo: "Error al actualizar el establecimiento",
          debugg: true,
        });
        toast.success(responseData.message || "Actualizacion Exitosa");
        await get().traerEstablecimientoPorId(id);

        return true;
      } catch (error: any) {
        console.error(error);
        toast.error(error.message);
        return false;
      } finally {
        set({ loading: false });
      }
    },
  })
);
