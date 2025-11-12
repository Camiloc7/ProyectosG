// src/features/Inventarios/ModalRegistrarProductionOutput.tsx
import { useState, useEffect } from 'react';
import { useProductionOutputStore } from '@/store/Inventario/useProductionOutputStore';
import type { CreateProductionOutputPayload } from '@/types/inventory';

interface ModalRegistrarProductionOutputProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrderId: string; // Ya no es nullable si siempre se abre con una orden
  orderNumber: string; // Nuevo: para mostrar el número de la orden
  productName: string; // Nuevo: para mostrar el nombre del producto
  productId: string; // Nuevo: para pasar el ID del producto que se produce
}

export default function ModalRegistrarProductionOutput({ isOpen, onClose, productionOrderId, orderNumber, productName, productId }: ModalRegistrarProductionOutputProps) {
  const { createOutput, isLoading: isCreatingOutput, error: outputError } = useProductionOutputStore();

  const [formData, setFormData] = useState<CreateProductionOutputPayload>({
    production_order_id: productionOrderId,
    product_id: productId,
    quantity: 0.0001,
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        production_order_id: productionOrderId,
        product_id: productId,
      }));
      setFormErrors({});
    }
  }, [isOpen, productionOrderId, productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: number = parseFloat(value);
    if (isNaN(newValue)) {
      newValue = 0;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.production_order_id) errors.production_order_id = 'La orden de producción es requerida.';
    if (!formData.product_id) errors.product_id = 'El producto a producir es requerido.';
    const quantity = formData.quantity ?? 0;
    if (quantity <= 0.0001) errors.quantity = 'La cantidad producida debe ser mayor a 0.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let success = false;
    success = (await createOutput(formData)) !== null;

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Producción Terminada</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="production_order_id" className="block text-sm font-medium text-gray-700">
                Orden de Producción
              </label>
              <input
                type="text"
                id="production_order_id"
                name="production_order_id"
                value={orderNumber} // Usa la prop orderNumber
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                disabled
              />
            </div>
            <div>
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                Producto Producido
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={productName} // Usa la prop productName
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                disabled
              />
              <input
                type="hidden"
                name="product_id"
                value={formData.product_id}
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Cantidad Producida <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0.0001"
                step="any"
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.quantity ? 'border-red-500' : ''}`}
                disabled={isCreatingOutput}
              />
              {formErrors.quantity && <p className="mt-1 text-sm text-red-500">{formErrors.quantity}</p>}
            </div>
          </div>

          {outputError && (
            <div className="mb-4 text-red-600 text-sm">
              Error: {outputError}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isCreatingOutput}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A7E1] rounded-3xl hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
              disabled={isCreatingOutput}
            >
              {isCreatingOutput ? 'Registrando...' : 'Registrar Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}