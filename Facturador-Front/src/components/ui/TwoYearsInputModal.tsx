import React, { useState, useEffect } from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onSubmitData?: (data: { fechaInicial: string; fechaFinal: string }) => void;
}

const YearsInput: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  title = 'Informe Comparativo PDF',
  onSubmitData,
}) => {
  const [formData, setFormData] = useState({
    fechaInicial: '',
    fechaFinal: '',
  });
  const [error, setError] = useState('');

  // useEffect(() => {
  //   if (isOpen) {
  //     const nextYear = formData.fechaInicial + 1;
  //     setFormData({ fechaInicial: '', fechaFinal: nextYear });
  //     setError('');
  //   }
  // }, [isOpen]);

  const validateYear = (value: string): string => {
    if (!/^[0-9]*$/.test(value)) return 'Solo números';
    if (value.length > 4) return 'Máximo 4 dígitos';
    if (value.length > 0 && value.length < 4) return 'Exactamente 4 dígitos';
    return '';
  };

  const handleChange = (value: string) => {
    // Solo números y máximo 4 caracteres
    let sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized.length > 4) sanitized = sanitized.slice(0, 4);

    // Actualiza fecha inicial
    setFormData((prev) => ({ ...prev, fechaInicial: sanitized }));
    // Valida
    const errorMsg = validateYear(sanitized);
    setError(errorMsg);

    // Si es un año válido de 4 dígitos, fija el siguiente
    if (errorMsg === '') {
      const next = String(Number(sanitized) + 1);
      setFormData((prev) => ({ ...prev, fechaFinal: next }));
    } else {
      // Si no es válido, deja el valor por defecto (año siguiente actual)
      setFormData((prev) => ({
        ...prev,
        fechaFinal: (new Date().getFullYear() + 1).toString(),
      }));
    }
  };

  const canSubmit = (): boolean => {
    return formData.fechaInicial.length === 4 && error === '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;
    onSubmitData?.(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div
        className="bg-white p-6 rounded-md shadow-md w-[400px] max-h-[90vh] overflow-y-auto z-[202]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Año inicial editable */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Primer año
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm ${
                error ? 'border-red-500' : ''
              }`}
              value={formData.fechaInicial}
              onChange={(e) => handleChange(e.target.value)}
              required
            />
            {/* {error && <p className="text-red-500 text-sm mt-1">{error}</p>} */}
          </div>

          {/* Año siguiente readonly */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Segundo año
            </label>
            <input
              type="text"
              readOnly
              className="w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm bg-gray-100 cursor-not-allowed border-[#00A7E1] shadow-sm"
              value={formData.fechaFinal}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#333332] text-white h-8 px-4 py-2 font-bold rounded-3xl text-[12px] hover:bg-[#4b4b4b]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit()}
              className={`h-8 px-4 py-2 font-bold rounded-3xl text-[12px] ${
                canSubmit()
                  ? 'bg-[#00A7E1] hover:bg-[#008ec1] text-white'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YearsInput;
