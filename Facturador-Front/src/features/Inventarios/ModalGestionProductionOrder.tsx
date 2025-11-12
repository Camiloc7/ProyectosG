// 'use client';

// import { useState, useEffect } from 'react';
// import { useProductStore } from '@/store/Inventario/useProductStore'; 
// import type { ProductionOrder, CreateProductionOrderPayload, UpdateProductionOrderPayload } from '@/types/inventory';
// import type { BillOfMaterial, Product } from '@/types/inventory'; 
// import type { Location } from '@/types/inventory'; 
// import { useProductionOrderStore } from '@/store/Inventario/useProductionOrderStore';
// import { useBomStore } from '@/store/Inventario/useBomStore';
// import { useLocationStore } from '@/store/Inventario/useLocationsStore';

// interface ModalGestionProductionOrderProps {
//   isOpen: boolean;
//   onClose: () => void;
//   orderToEdit: ProductionOrder | null;
// }
// export default function ModalGestionProductionOrder({ isOpen, onClose, orderToEdit }: ModalGestionProductionOrderProps) {
//   const { createOrder, updateOrder, isLoading, error } = useProductionOrderStore();
//   const { products, fetchProducts } = useProductStore(); 
//   const { boms, fetchBoms } = useBomStore();
//   const { locations, fetchLocations } = useLocationStore();
//   const [formData, setFormData] = useState<CreateProductionOrderPayload | UpdateProductionOrderPayload>({
//     product_id: '',
//     bom_id: null,
//     quantity_to_produce: 0,
//     status: 'pending',
//     production_location_id: null,
//     start_date: '',
//     end_date: '',
//     notes: '',
//   });
//   const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
//   useEffect(() => {
//     if (isOpen) {
//       fetchProducts();
//       fetchBoms();
//       fetchLocations(); 
//     }
//   }, [isOpen, fetchProducts, fetchBoms, fetchLocations]);


//   useEffect(() => {
//     if (orderToEdit) {
//       setFormData({
//         product_id: orderToEdit.product_id || '',
//         bom_id: orderToEdit.bom_id || null,
//         quantity_to_produce: orderToEdit.quantity_to_produce,
//         status: orderToEdit.status || 'pending',
//         production_location_id: orderToEdit.production_location_id || null,
//         start_date: orderToEdit.start_date || '',
//         end_date: orderToEdit.end_date || '',
//         notes: orderToEdit.notes || '',
//       });
//     } else {
//       setFormData({
//         product_id: '',
//         bom_id: null,
//         quantity_to_produce: 0,
//         status: 'pending',
//         production_location_id: null,
//         start_date: '',
//         end_date: '',
//         notes: '',
//       });
//     }
//     setFormErrors({}); 
//   }, [orderToEdit, isOpen]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value === '' ? null : value, 
//     }));
//     setFormErrors((prev) => ({ ...prev, [name]: '' })); 
//   };
//   const validateForm = () => {
//     const errors: { [key: string]: string } = {};
    
//     if (!formData.product_id) errors.product_id = 'El producto a producir es requerido.';
//     const quantity = formData.quantity_to_produce ?? 0; 
//     if (quantity <= 0) errors.quantity_to_produce = 'La cantidad a producir debe ser mayor a 0.';
  
//     if (!formData.status) errors.status = 'El estado de la orden es requerido.';
//     if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
//       errors.end_date = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
//     }
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     let success = false;
//     if (orderToEdit) {
//       success = (await updateOrder(orderToEdit.id, formData)) !== null;
//     } else {
//       success = (await createOrder(formData as CreateProductionOrderPayload)) !== null;
//     }

//     if (success) {
//       onClose();
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
//       <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">
//           {orderToEdit ? 'Editar Orden de Producción' : 'Crear Nueva Orden de Producción'}
//         </h2>
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
//                 Producto a Producir <span className="text-red-500">*</span>
//               </label>
//               <select
//                 id="product_id"
//                 name="product_id"
//                 value={formData.product_id || ''}
//                 onChange={handleChange}
//                 className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.product_id ? 'border-red-500' : ''}`}
//                 disabled={isLoading}
//               >
//                 <option value="">Selecciona un producto</option>
//                 {products.map((product: Product) => (
//                   <option key={product.id} value={product.id}>
//                     {product.name} (SKU: {product.sku})
//                   </option>
//                 ))}
//               </select>
//               {formErrors.product_id && <p className="mt-1 text-sm text-red-500">{formErrors.product_id}</p>}
//             </div>
//             <div>
//               <label htmlFor="bom_id" className="block text-sm font-medium text-gray-700">
//                 BOM Asociada (opcional)
//               </label>
//               <select
//                 id="bom_id"
//                 name="bom_id"
//                 value={formData.bom_id || ''}
//                 onChange={handleChange}
//                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
//                 disabled={isLoading}
//               >
//                 <option value="">Ninguna</option>
//                 {boms.map((bom: BillOfMaterial) => (
//                   <option key={bom.id} value={bom.id}>
//                     {bom.name} (Producto: {bom.product?.name ?? 'N/A'})
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label htmlFor="quantity_to_produce" className="block text-sm font-medium text-gray-700">
//                 Cantidad a Producir <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="number"
//                 id="quantity_to_produce"
//                 name="quantity_to_produce"
//                 value={formData.quantity_to_produce}
//                 onChange={handleChange}
//                 min="0"
//                 className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.quantity_to_produce ? 'border-red-500' : ''}`}
//                 disabled={isLoading}
//               />
//               {formErrors.quantity_to_produce && <p className="mt-1 text-sm text-red-500">{formErrors.quantity_to_produce}</p>}
//             </div>
//             <div>
//               <label htmlFor="status" className="block text-sm font-medium text-gray-700">
//                 Estado <span className="text-red-500">*</span>
//               </label>
//               <select
//                 id="status"
//                 name="status"
//                 value={formData.status || ''}
//                 onChange={handleChange}
//                 className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.status ? 'border-red-500' : ''}`}
//                 disabled={isLoading}
//               >
//                 <option value="pending">Pendiente</option>
//                 <option value="in_progress">En Progreso</option>
//                 <option value="completed">Completada</option>
//                 <option value="cancelled">Cancelada</option>
//               </select>
//               {formErrors.status && <p className="mt-1 text-sm text-red-500">{formErrors.status}</p>}
//             </div>
//             <div>
//               <label htmlFor="production_location_id" className="block text-sm font-medium text-gray-700">
//                 Ubicación de Producción (opcional)
//               </label>
//               <select
//                 id="production_location_id"
//                 name="production_location_id"
//                 value={formData.production_location_id || ''}
//                 onChange={handleChange}
//                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
//                 disabled={isLoading}
//               >
//                 <option value="">Selecciona una ubicación</option>
//                 {locations.map((location: Location) => (
//                   <option key={location.id} value={location.id}>
//                     {location.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
//                 Fecha de Inicio (opcional)
//               </label>
//               <input
//                 type="date"
//                 id="start_date"
//                 name="start_date"
//                 value={formData.start_date || ''}
//                 onChange={handleChange}
//                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
//                 disabled={isLoading}
//               />
//             </div>
//             <div>
//               <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
//                 Fecha de Fin (opcional)
//               </label>
//               <input
//                 type="date"
//                 id="end_date"
//                 name="end_date"
//                 value={formData.end_date || ''}
//                 onChange={handleChange}
//                 className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.end_date ? 'border-red-500' : ''}`}
//                 disabled={isLoading}
//               />
//               {formErrors.end_date && <p className="mt-1 text-sm text-red-500">{formErrors.end_date}</p>}
//             </div>
//           </div>
//           <div className="mb-4">
//             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
//               Notas (opcional)
//             </label>
//             <textarea
//               id="notes"
//               name="notes"
//               rows={3}
//               value={formData.notes || ''}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
//               disabled={isLoading}
//             ></textarea>
//           </div>

//           {error && (
//             <div className="mb-4 text-red-600 text-sm">
//               Error: {error}
//             </div>
//           )}

//           <div className="flex justify-end space-x-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
//               disabled={isLoading}
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 text-sm font-medium text-white bg-[#00A7E1] rounded-3xl hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
//               disabled={isLoading}
//             >
//               {isLoading ? 'Guardando...' : (orderToEdit ? 'Actualizar Orden' : 'Crear Orden')}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }














// // 'use client';
// // src/components/Modals/ModalGestionProductionOrder.tsx
import { useState, useEffect } from 'react';
import { useProductStore } from '@/store/Inventario/useProductStore';
import type { ProductionOrder, CreateProductionOrderPayload, UpdateProductionOrderPayload } from '@/types/inventory';
import type { BillOfMaterial, Product } from '@/types/inventory';
import type { Location } from '@/types/inventory';
import { useProductionOrderStore } from '@/store/Inventario/useProductionOrderStore';
import { useBomStore } from '@/store/Inventario/useBomStore';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';

interface ModalGestionProductionOrderProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit: ProductionOrder | null;
}

export default function ModalGestionProductionOrder({ isOpen, onClose, orderToEdit }: ModalGestionProductionOrderProps) {
  const { createOrder, updateOrder, isLoading, error } = useProductionOrderStore();
  const { products, fetchProducts } = useProductStore();
  const { boms, fetchBoms } = useBomStore();
  const { locations, fetchLocations } = useLocationStore();

  const [formData, setFormData] = useState<CreateProductionOrderPayload | UpdateProductionOrderPayload>({
    product_id: '',
    bom_id: null,
    quantity_to_produce: 1,
    production_location_id: null,
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchBoms();
      fetchLocations();
      if (orderToEdit) {
        setFormData({
          product_id: orderToEdit.product_id || '',
          bom_id: orderToEdit.bom_id || null,
          quantity_to_produce: orderToEdit.quantity_to_produce,
          start_date: orderToEdit.start_date ? new Date(orderToEdit.start_date).toISOString().split('T')[0] : '',
          end_date: orderToEdit.end_date ? new Date(orderToEdit.end_date).toISOString().split('T')[0] : '',
          notes: orderToEdit.notes || '',
        });
      } else {
        setFormData({
          product_id: '',
          bom_id: null,
          quantity_to_produce: 1, 
          production_location_id: null,
          start_date: '',
          end_date: '',
          notes: '',
        });
      }
      setFormErrors({});
    }
  }, [isOpen, orderToEdit, fetchProducts, fetchBoms, fetchLocations]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue: string | number | null = value;

    if (name === 'quantity_to_produce') {
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

    if (!formData.product_id) errors.product_id = 'El producto a producir es requerido.';
    const quantity = formData.quantity_to_produce ?? 0;
    if (quantity <= 0) errors.quantity_to_produce = 'La cantidad a producir debe ser mayor a 0.';
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payloadToSend: CreateProductionOrderPayload | UpdateProductionOrderPayload = { ...formData };
    let success = false;
    if (orderToEdit) {
      success = (await updateOrder(orderToEdit.id, payloadToSend as UpdateProductionOrderPayload)) !== null;
    } else {
      success = (await createOrder(payloadToSend as CreateProductionOrderPayload)) !== null;
    }
    if (success) {
      onClose();
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {orderToEdit ? 'Editar Orden de Producción' : 'Crear Nueva Orden de Producción'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                Producto a Producir <span className="text-red-500">*</span>
              </label>
              <select
                id="product_id"
                name="product_id"
                value={formData.product_id || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.product_id ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product: Product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku})
                  </option>
                ))}
              </select>
              {formErrors.product_id && <p className="mt-1 text-sm text-red-500">{formErrors.product_id}</p>}
            </div>
            <div>
              <label htmlFor="bom_id" className="block text-sm font-medium text-gray-700">
                BOM Asociada (opcional)
              </label>
              <select
                id="bom_id"
                name="bom_id"
                value={formData.bom_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isLoading}
              >
                <option value="">Ninguna</option>
                {boms.map((bom: BillOfMaterial) => (
                  <option key={bom.id} value={bom.id}>
                    {bom.name} (Producto: {bom.product?.name ?? 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantity_to_produce" className="block text-sm font-medium text-gray-700">
                Cantidad a Producir <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity_to_produce"
                name="quantity_to_produce"
                value={formData.quantity_to_produce}
                onChange={handleChange}
                min="1" 
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.quantity_to_produce ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {formErrors.quantity_to_produce && <p className="mt-1 text-sm text-red-500">{formErrors.quantity_to_produce}</p>}
            </div>
            <div>
              <label htmlFor="production_location_id" className="block text-sm font-medium text-gray-700">
                Ubicación de Producción (opcional)
              </label>
              <select
                id="production_location_id"
                name="production_location_id"
                value={formData.production_location_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isLoading}
              >
                <option value="">Selecciona una ubicación</option>
                {locations.map((location: Location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Fecha de Inicio (opcional)
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Fecha de Fin (opcional)
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${formErrors.end_date ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {formErrors.end_date && <p className="mt-1 text-sm text-red-500">{formErrors.end_date}</p>}
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
              disabled={isLoading}
            ></textarea>
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-3xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A7E1] rounded-3xl hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : (orderToEdit ? 'Actualizar Orden' : 'Crear Orden')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}