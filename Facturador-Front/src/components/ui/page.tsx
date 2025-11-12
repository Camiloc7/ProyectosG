import React, { useState } from 'react';

interface BotonAnularProps {
  id: string; // ID de la factura que se anula
  buttonClass?: string; // Clases opcionales para el botón
}

const BotonAnular: React.FC<BotonAnularProps> = ({
  id,
  buttonClass = 'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCancel = () => setModalVisible(false);

  const handleConfirm = () => {
    setModalVisible(false); // Cierra el modal después de confirmar
  };

  return (
    <>
      {/* Botón que abre el modal */}
      <button className={buttonClass} onClick={() => setModalVisible(true)}>
        Anular
      </button>

      {/* Modal de Confirmación */}
      {modalVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
          onClick={handleCancel}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-xl max-h-[90vh] "
            onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
          >
            <h2 className="text-sm font-bold text-gray-800 mb-4 md:text-lg">
              ¿Estás seguro de anular esta factura?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                className="bg-blueQ text-white h-11 hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                onClick={handleConfirm}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BotonAnular;
