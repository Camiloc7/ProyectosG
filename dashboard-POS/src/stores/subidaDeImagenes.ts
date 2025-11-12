import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { compressImage } from "@/helpers/CompressImage";
import { useAuthStore } from "./authStore";

type SubidaDeImagenesState = {
  loading: boolean;
  subirImagen: (imagen: File) => Promise<string>;
};

export const useSubidaDeImagenes = create<SubidaDeImagenesState>(
  (set, get) => ({
    loading: false,

    subirImagen: async (imagen) => {
      set({ loading: true });
      const token = useAuthStore.getState().token;

      const originalName = imagen.name;
      const originalType = imagen.type;
      const compressedBlob = await compressImage(imagen, 2);

      const fileToUpload = new File([compressedBlob], originalName, {
        type: originalType,
      });

      const formData = new FormData();
      formData.append("file", fileToUpload);

      try {
        const res = await fetch(`${RUTA}/archivos/subir/imagen`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.message);
        }

        return responseData.data.publicUrl;
      } catch (error: any) {
        const mensajeDelDev = "No se pudo subir la imagen";
        console.error(mensajeDelDev, error);
        toast.error(error.message || mensajeDelDev);
        set({ loading: false });
      }
    },
  })
);
