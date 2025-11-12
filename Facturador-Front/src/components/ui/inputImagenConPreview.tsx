import React, { useState, useId, useEffect } from 'react';

interface InputImagenConPreviewProps {
  setArchivo: (file: File | null) => void;
  // Prop opcional para recibir la URL de la imagen actual
  imagenUrl?: string;
}

const InputImagenConPreview: React.FC<InputImagenConPreviewProps> = ({
  setArchivo,
  imagenUrl,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    imagenUrl || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputId = useId(); // Genera un ID único para esta instancia

  // Si cambia la imagenUrl de props, actualizamos la previsualización
  useEffect(() => {
    if (imagenUrl) {
      setPreviewUrl(imagenUrl);
    }
  }, [imagenUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setArchivo(selectedFile);
      // Actualizamos la URL de la previsualización con el objeto URL
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleImageClick = () => {
    if (previewUrl) {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="relative flex items-center space-x-3 mt-4">
      {/* Botón para subir archivo */}
      <button
        type="button"
        className="w-full sm:w-auto min-w-36 bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        Subir Archivo
      </button>

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
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-500">Sin imagen</span>
        )}
      </div>

      {/* Modal de imagen ampliada */}
      {isModalOpen && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
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

export default InputImagenConPreview;
