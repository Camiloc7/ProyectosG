import React, { useState, useId } from 'react';
import { showErrorToast } from '../feedback/toast';

interface BotonSubirArchivosProps {
  onSubmit: (file: File | null) => void;
}

const BotonSubirArchivos: React.FC<BotonSubirArchivosProps> = ({
  onSubmit,
}) => {
  const [fileSelected, setFileSelected] = useState(false);
  const inputId = useId(); // Genera un ID único para esta instancia

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    // Solo marca como seleccionado si es un PDF
    if (selectedFile) {
      setFileSelected(true);
      onSubmit(selectedFile);
    } else {
      // setFileSelected(false);
      // onSubmit(null); // Limpia el archivo si no es un PDF
      showErrorToast('Porfavor, selecciona un archivo PDF.');
    }
  };

  return (
    <div className={`relative flex items-center space-x-3`}>
      {/* Botón de subir archivo */}
      <button
        className="w-full sm:w-auto min-w-36  bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] "
        onClick={() => document.getElementById(inputId)?.click()} // Usa el ID único
      >
        Subir Archivo
      </button>

      {/* Icono de confirmación */}
      {fileSelected && (
        <div className="relative group" title="Archivo subido">
          <span className="inline-flex items-center justify-center w-6 h-6 text-white bg-green-500 rounded-full shadow-md cursor-pointer transition-transform">
            <span>✔</span>
          </span>
        </div>
      )}

      {/* Input oculto */}
      <input
        id={inputId} // Asigna un ID único
        type="file"
        // accept="application/pdf" // Solo permite archivos PDF
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default BotonSubirArchivos;
