import React, { useState } from 'react';

interface ButtonWithModalXmlProps {
  buttonText: string;
  onSubmit: (file: File | null) => void; // Función que se ejecuta al enviar el archivo
  modalTitle?: string; // Título opcional para el modal
}

const ButtonWithModalXml: React.FC<ButtonWithModalXmlProps> = ({
  buttonText,
  onSubmit,
  modalTitle = 'Subir Archivo',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onSubmit(selectedFile); // Envía el archivo al padre
    setModalVisible(false); // Cierra el modal después del envío
  };

  return (
    <>
      {/* Botón que abre el modal */}
      <button
        className="h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]"
        onClick={() => setModalVisible(true)}
      >
        {buttonText}
      </button>

      {/* Modal */}
      {modalVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
          onClick={() => setModalVisible(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {modalTitle}
            </h2>
            <form>
              <input
                type="file"
                accept=".zip" // Restringe la selección a archivos ZIP
                onChange={handleFileChange}
              />
              <div className="flex justify-center gap-4 mt-4">
                <button
                  type="button"
                  className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                  onClick={() => setModalVisible(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="bg-blueQ text-white px-4 py-2 text-sm font-normal rounded-[25px] hover:bg-[#008ec1]"
                  onClick={() => setModalVisible(false)}
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ButtonWithModalXml;
