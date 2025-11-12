import { useState, useEffect } from 'react';
import { useProductionInputStore } from '@/store/Inventario/useProductionInputStore';
import { useProductStore } from '@/store/Inventario/useProductStore';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import type { CreateProductionInputPayload, Product, Location } from '@/types/inventory'; 

interface ModalRegistrarProductionInputProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrderId: string | null; 
}

export default function ModalRegistrarProductionInput({ isOpen, onClose, productionOrderId }: ModalRegistrarProductionInputProps) {
  const { createInput, isLoading: isCreatingInput, error: inputError } = useProductionInputStore();
  const { products, fetchProducts, isLoading: areProductsLoading } = useProductStore();
  const { locations, fetchLocations, isLoading: areLocationsLoading } = useLocationStore();
  const [formData, setFormData] = useState<CreateProductionInputPayload>({
    production_order_id: productionOrderId || '',
    material_product_id: '',
    from_location_id: '',
    quantity_consumed: 0.0001, 
    notes: '',
    consumption_date: new Date().toISOString().split('T')[0], 
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    if (isOpen && productionOrderId) {
      setFormData(prev => ({
        ...prev,
        production_order_id: productionOrderId,
      }));
      fetchProducts(); 
      fetchLocations(); 
      setFormErrors({}); 
    }
  }, [isOpen, productionOrderId, fetchProducts, fetchLocations]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue: string | number | null = value;
    if (name === 'quantity_consumed') {
      newValue = parseFloat(value);
      if (isNaN(newValue)) {
        newValue = 0;
      }
    } else if (value === '') {
      newValue = null;
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
    if (!formData.material_product_id) errors.material_product_id = 'El material a consumir es requerido.';
    if (!formData.from_location_id) errors.from_location_id = 'La ubicación de origen es requerida.';
    const quantity = formData.quantity_consumed ?? 0;
    if (quantity <= 0.0001) errors.quantity_consumed = 'La cantidad a consumir debe ser mayor a 0.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: CreateProductionInputPayload = {
      ...formData,
      product_lot_id: formData.product_lot_id || undefined, 
      product_serial_id: formData.product_serial_id || undefined, 
      consumption_date: formData.consumption_date || undefined,
      notes: formData.notes || undefined,
    };
    let success = false;
    success = (await createInput(payload)) !== null;
    if (success) {
      onClose(); 
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Consumo de Materiales</h2>
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
                value={productionOrderId || ''} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                disabled
              />
            </div>
            <div>
              <label htmlFor="material_product_id" className="block text-sm font-medium text-gray-700">
                Material a Consumir <span className="text-red-500">*</span>
              </label>
              <select
                id="material_product_id"
                name="material_product_id"
                value={formData.material_product_id || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.material_product_id ? 'border-red-500' : ''}`}
                disabled={isCreatingInput || areProductsLoading}
              >
                <option value="">Selecciona un material</option>
                {products.map((product: Product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku})
                  </option>
                ))}
              </select>
              {formErrors.material_product_id && <p className="mt-1 text-sm text-red-500">{formErrors.material_product_id}</p>}
            </div>
            <div>
              <label htmlFor="from_location_id" className="block text-sm font-medium text-gray-700">
                Ubicación de Origen <span className="text-red-500">*</span>
              </label>
              <select
                id="from_location_id"
                name="from_location_id"
                value={formData.from_location_id || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.from_location_id ? 'border-red-500' : ''}`}
                disabled={isCreatingInput || areLocationsLoading}
              >
                <option value="">Selecciona una ubicación</option>
                {locations.map((location: Location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {formErrors.from_location_id && <p className="mt-1 text-sm text-red-500">{formErrors.from_location_id}</p>}
            </div>
            <div>
              <label htmlFor="quantity_consumed" className="block text-sm font-medium text-gray-700">
                Cantidad a Consumir <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity_consumed"
                name="quantity_consumed"
                value={formData.quantity_consumed}
                onChange={handleChange}
                min="0.0001"
                step="any"
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.quantity_consumed ? 'border-red-500' : ''}`}
                disabled={isCreatingInput}
              />
              {formErrors.quantity_consumed && <p className="mt-1 text-sm text-red-500">{formErrors.quantity_consumed}</p>}
            </div>
            <div>
              <label htmlFor="product_lot_id" className="block text-sm font-medium text-gray-700">
                Lote de Material (opcional)
              </label>
              <input
                type="text" 
                id="product_lot_id"
                name="product_lot_id"
                value={formData.product_lot_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isCreatingInput}
              />
            </div>
            <div>
              <label htmlFor="product_serial_id" className="block text-sm font-medium text-gray-700">
                Serie de Material (opcional)
              </label>
              <input
                type="text"
                id="product_serial_id"
                name="product_serial_id"
                value={formData.product_serial_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isCreatingInput}
              />
            </div>
            <div>
              <label htmlFor="consumption_date" className="block text-sm font-medium text-gray-700">
                Fecha de Consumo (opcional)
              </label>
              <input
                type="date"
                id="consumption_date"
                name="consumption_date"
                value={formData.consumption_date || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isCreatingInput}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
              disabled={isCreatingInput}
            ></textarea>
          </div>

          {inputError && (
            <div className="mb-4 text-red-600 text-sm">
              Error: {inputError}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isCreatingInput}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A7E1] rounded-3xl hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
              disabled={isCreatingInput}
            >
              {isCreatingInput ? 'Registrando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}