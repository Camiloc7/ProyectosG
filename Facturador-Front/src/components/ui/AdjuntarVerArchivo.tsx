'use client';
import React, { useState } from 'react';
import BotonSubirArchivos from '@/components/ui/botonSubirArchivos';
import { BASE_URL } from '@/helpers/ruta';
interface AdjuntarVerArchivoProps {
  file: File | null;
  setFile: (file: File | null) => void;
  fileUrl: string;
}

const AdjuntarVerArchivo: React.FC<AdjuntarVerArchivoProps> = ({
  file,
  setFile,
  fileUrl,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerArchivo = () => {
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setIsModalOpen(true);
      return;
    }
    if (fileUrl) {
      const sanitizedBaseURL = BASE_URL.replace('/index.php', '');
      const fullURL = `${sanitizedBaseURL}${fileUrl.replace('./', '')}`;
      window.open(fullURL, '_blank');
      return;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <div className="flex gap-2">
      <BotonSubirArchivos onSubmit={setFile} />
      <button
        className="w-full sm:w-auto min-w-[150px] bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl text-[12px] hover:bg-[#008ec1]"
        onClick={handleVerArchivo}
      >
        Ver Archivo
      </button>

      {isModalOpen && previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[201]"
          onClick={closeModal}
        >
          <div
            className="bg-white p-4 rounded-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Previsualización</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 text-base"
              >
                x
              </button>
            </div>
            <iframe
              src={previewUrl}
              width="100%"
              height="600px"
              frameBorder="0"
              title="Vista previa"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjuntarVerArchivo;
