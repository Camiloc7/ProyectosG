import React, { useState } from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, string>) => void;
}

const BusquedaContrato: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation(); // Evita que el clic dentro del formulario cierre el modal
          }}
        >
          <h2 className="text-xl font-bold mb-4">Buscar Contrato</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="nombre" className="block text-gray-700">
                Nombre
              </label>
              <input
                  type="text"
                  name="nombre"
                  placeholder="Ingrese el nombre"
                  value={formData.nombre}
                  className={`mt-4 w-full h-10 px-4 border ${
                    errors.nombre ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={(e) => {
                    const { value } = e.target;
                    setFormData((prev) => ({ ...prev, nombre: value }));
                  }}                                              
                  />
              {errors.nombre && <p className="text-red-500">{errors.nombre}</p>}
            </div>

           {/* Botones de acción */}
           <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusquedaContrato;
