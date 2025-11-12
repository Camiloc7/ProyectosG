import React, { useState, useId, useEffect } from "react";
import BotonRestaurante from "./Boton";

interface InputImagenProps {
  setArchivo: (file: File | null) => void;
  imagenUrl?: string;
}

const InputImagen: React.FC<InputImagenProps> = ({ setArchivo, imagenUrl }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    imagenUrl || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputId = `input-imagen-${useId()}`; // Garantiza que el ID sea válido

  // Actualiza la previsualización si cambia la prop imagenUrl
  useEffect(() => {
    setPreviewUrl(imagenUrl || null);
  }, [imagenUrl]);

  // Limpiar URL temporal al desmontar o cambiar imagen
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    if (selectedFile) {
      setArchivo(selectedFile);

      // Limpiar URL previa si existía
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      // Crear nueva URL de previsualización
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setArchivo(null);
      setPreviewUrl(imagenUrl || null);
    }
  };

  const handleImageClick = () => {
    if (previewUrl) setIsModalOpen(true);
  };

  return (
    <div className="relative flex items-center space-x-3 mt-4">
      {/* Botón para subir archivo */}
      <BotonRestaurante
        type="button"
        onClick={() => document.getElementById(inputId)?.click()}
        label="Subir Archivo"
      />

      {/* Input oculto */}
      <input
        id={inputId}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Cuadrado de previsualización */}
      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center overflow-hidden rounded-sm ml-6">
        {previewUrl ? (
          <img
            onClick={handleImageClick}
            src={previewUrl}
            alt="Preview"
            className="object-cover w-full h-full cursor-pointer"
          />
        ) : (
          <span className="text-gray-500">Sin imagen</span>
        )}
      </div>

      {/* Modal de imagen ampliada */}
      {isModalOpen && previewUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-3xl h-[80%]">
            <img
              src={previewUrl}
              alt="Preview ampliada"
              className="object-contain max-w-full max-h-full"
            />
            <button
              className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputImagen;
