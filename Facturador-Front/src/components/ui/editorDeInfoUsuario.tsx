'use-client';
import { useState, useEffect } from 'react';
import { BASE_URL } from '@/helpers/ruta';
import { useUserStore } from '@/store/useUser';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies'; //!No se necesita en este caso
import { showTemporaryToast } from '../feedback/toast';

interface EditorDeInfoUsuarioProps {
  onClose: () => void; // Definir el tipo de onClose
}

const EditorDeInfoUsuario: React.FC<EditorDeInfoUsuarioProps> = ({
  onClose,
}) => {
  const { infoDelUsuario, traerInfoDeUsuarios } = useUserStore();

  // Iniciar el estado de la imagen con la imagen del usuario (infoDelUsuario.imagen)
  const [image, setImage] = useState<string | null>(
    infoDelUsuario?.imagen || null
  );

  // Manejar el cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // Solo para previsualizar la imagen
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      console.log('No image selected');
      return;
    }

    const formData = new FormData();
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (file) {
      formData.append('imagen', file); // Cambié 'file' a 'imagen'

      const token = getTokenFromCookies();

      try {
        const response = await fetch(
          `${BASE_URL}api/configuracion/actualizarFotoPerfil/`,
          {
            method: 'POST',
            body: formData,
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        showTemporaryToast('Imagen subida con exito.');

        await traerInfoDeUsuarios();
        window.location.reload();
      } catch (error) {
        console.error('Error al enviar la foto:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-lg font-semibold text-[#05264E]">Subir imagen</h2>
        <div className="mt-4">
          {image ? (
            <img
              className="w-32 h-32 rounded-full mx-auto"
              src={image}
              alt="Imagen previa"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto flex items-center justify-center">
              <span className="text-white">No image</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:py-2 file:px-4 file:bg-gray-200 file:border file:border-gray-300"
          />
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 border border-gray-300 rounded px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="text-sm text-white bg-[#05264E] rounded px-4 py-2"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorDeInfoUsuario;
