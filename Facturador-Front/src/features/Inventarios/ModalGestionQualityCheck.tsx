'use client';

import { useState, useEffect } from 'react';
import { useQualityCheckStore } from '@/store/Inventario/useQualityCheckStore';
import { useProductionOrderStore } from '@/store/Inventario/useProductionOrderStore';
import type {
  QualityCheck,
  CreateQualityCheckPayload,
  UpdateQualityCheckPayload,
} from '@/types/inventory';
import type { ProductionOrder } from '@/types/inventory';

interface ModalGestionQualityCheckProps {
  isOpen: boolean;
  onClose: () => void;
  checkToEdit: QualityCheck | null;
}

export default function ModalGestionQualityCheck({
  isOpen,
  onClose,
  checkToEdit,
}: ModalGestionQualityCheckProps) {
  const { createQualityCheck, updateQualityCheck, isLoading, error } =
    useQualityCheckStore();
  const { orders, fetchOrders } = useProductionOrderStore();

  const [formData, setFormData] = useState<
    CreateQualityCheckPayload | UpdateQualityCheckPayload
  >({
    production_order_id: '',
    checked_by_user_id: '',
    status: 'pending',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Cargar datos necesarios para los selectores cuando el modal se abre
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, fetchOrders]);

  useEffect(() => {
    if (checkToEdit) {
      setFormData({
        production_order_id: checkToEdit.production_order_id || '',
        checked_by_user_id: checkToEdit.checked_by_user_id || '',
        status: checkToEdit.status || 'pending',
        notes: checkToEdit.notes || '',
      });
    } else {
      setFormData({
        production_order_id: '',
        checked_by_user_id: '',
        status: 'pending',
        notes: '',
      });
    }
    setFormErrors({});
  }, [checkToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.production_order_id)
      errors.production_order_id = 'La Orden de Producción es requerida.';
    if (!formData.checked_by_user_id)
      errors.checked_by_user_id = 'El inspector es requerido.';
    if (!formData.status) errors.status = 'El estado del control es requerido.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let success = false;
    if (checkToEdit) {
      success = (await updateQualityCheck(checkToEdit.id, formData)) !== null;
    } else {
      success =
        (await createQualityCheck(formData as CreateQualityCheckPayload)) !==
        null;
    }

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl shadow-lg rounded-md bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {checkToEdit
            ? 'Editar Control de Calidad'
            : 'Crear Nuevo Control de Calidad'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="production_order_id"
                className="block text-sm font-medium text-gray-700"
              >
                Orden de Producción <span className="text-red-500">*</span>
              </label>
              <select
                id="production_order_id"
                name="production_order_id"
                value={formData.production_order_id || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${
                  formErrors.production_order_id ? 'border-red-500' : ''
                }`}
                disabled={isLoading || !!checkToEdit}
              >
                <option value="">Selecciona una orden</option>
                {orders.map((order: ProductionOrder) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} (Producto:{' '}
                    {order.product?.name ?? 'N/A'})
                  </option>
                ))}
              </select>
              {formErrors.production_order_id && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.production_order_id}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="checked_by_user_id"
                className="block text-sm font-medium text-gray-700"
              >
                Realizado Por <span className="text-red-500">*</span>
              </label>
              <select
                id="checked_by_user_id"
                name="checked_by_user_id"
                value={formData.checked_by_user_id || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${
                  formErrors.checked_by_user_id ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              ></select>
              {formErrors.checked_by_user_id && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.checked_by_user_id}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm ${
                  formErrors.status ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              >
                <option value="pending">Pendiente</option>
                <option value="passed">Aprobado</option>
                <option value="failed">Rechazado</option>
                <option value="rework">Requiere Retrabajo</option>
              </select>
              {formErrors.status && (
                <p className="mt-1 text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
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
            <div className="mb-4 text-red-600 text-sm">Error: {error}</div>
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
              {isLoading
                ? 'Guardando...'
                : checkToEdit
                ? 'Actualizar Control'
                : 'Crear Control'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
