'use client';
import React, { useState, useEffect, useMemo } from 'react'; 
import { useMovementStore } from '@/store/Inventario/useMovementStore';
import { useProductStore } from '@/store/Inventario/useProductStore';
import { useLocationStore } from '@/store/Inventario/useLocationsStore'; 
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
import { useInventoryStore } from '@/store/Inventario/useInventoryStore'; 
import type { CreateMovementPayload, Movement } from '@/types/inventory'; 
interface ModalCrearMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementCreated?: (movement: Movement) => void;
}

export default function ModalCrearMovimiento({ isOpen, onClose, onMovementCreated }: ModalCrearMovimientoProps) {
  const { createMovement, isLoading: isCreatingMovement } = useMovementStore();
  const { products, fetchProducts } = useProductStore();
  const { locations, fetchLocations } = useLocationStore();
  const { suppliers, fetchSuppliers } = useSuppliersStore();
  const { inventoryItems, fetchInventoryItemsByProduct, clearInventoryItems } = useInventoryStore(); 

  const [movementType, setMovementType] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductVariantId, setSelectedProductVariantId] = useState<string>('');
  const [fromLocationId, setFromLocationId] = useState<string>('');
  const [toLocationId, setToLocationId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [productLotId, setProductLotId] = useState<string>('');
  const [productSerialId, setProductSerialId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [referenceDocumentId, setReferenceDocumentId] = useState<string>('');
  const [referenceDocumentType, setReferenceDocumentType] = useState<string>('');
  const [userId, setUserId] = useState<string>('TODO: Obtener User ID'); 
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchLocations();
      fetchSuppliers(); 
      clearInventoryItems(); 
      setMovementType('');
      setSelectedProductId('');
      setSelectedProductVariantId('');
      setFromLocationId('');
      setToLocationId('');
      setQuantity(0);
      setProductLotId('');
      setProductSerialId('');
      setNotes('');
      setReferenceDocumentId('');
      setReferenceDocumentType('');
      setMovementDate(new Date().toISOString().split('T')[0]);
      setFormErrors({});
    }
  }, [isOpen, fetchProducts, fetchLocations, fetchSuppliers, clearInventoryItems]); 
  useEffect(() => {
    if (selectedProductId && (movementType === 'dispatch' || movementType === 'transfer' || movementType.includes('adjustment_negative'))) {
      fetchInventoryItemsByProduct(selectedProductId); 
    } else {
      clearInventoryItems(); 
    }
  }, [selectedProductId, movementType, fetchInventoryItemsByProduct, clearInventoryItems]); 
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableVariants = selectedProduct?.variants || [];
  const availableFromLocations = useMemo(() => {
    if (!selectedProductId) return locations; 
    const locationsWithProduct = new Set<string>();
    inventoryItems.forEach(item => {
        if (item.product_id === selectedProductId) {
            locationsWithProduct.add(item.location_id);
        }
    });
    return locations.filter(loc => locationsWithProduct.has(loc.id));
  }, [locations, inventoryItems, selectedProductId]);

  const getAvailableQuantity = (): number => {
    if (!selectedProductId || !fromLocationId) return 0; 
    const relevantItems = inventoryItems.filter(item =>
        item.product_id === selectedProductId &&
        item.location_id === fromLocationId &&
        (selectedProductVariantId ? item.product_variant_id === selectedProductVariantId : true) &&
        (productLotId ? item.product_lot_id === productLotId : true) &&
        (productSerialId ? item.product_serial_id === productSerialId : true)
    );

    return relevantItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const availableQuantity = getAvailableQuantity();


  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!movementType) errors.movementType = 'El tipo de movimiento es obligatorio.';
    if (!selectedProductId) errors.selectedProductId = 'El producto es obligatorio.';
    if (quantity <= 0) errors.quantity = 'La cantidad debe ser mayor a 0.';

    if (movementType === 'reception' && !toLocationId) {
      errors.toLocationId = 'Para recepción, la ubicación de destino es obligatoria.';
    }
    if ((movementType === 'dispatch' || movementType === 'transfer' || movementType === 'adjustment_negative') && !fromLocationId) {
      errors.fromLocationId = 'Para este movimiento, la ubicación de origen es obligatoria.';
    }
    if (movementType === 'transfer') {
      if (!toLocationId) errors.toLocationId = 'Para transferencia, la ubicación de destino es obligatoria.';
      if (fromLocationId === toLocationId) errors.locationConflict = 'Las ubicaciones de origen y destino no pueden ser las mismas.';
    }
    if (movementType.includes('adjustment_positive') && !toLocationId) { 
        errors.toLocationId = 'Para ajuste positivo, la ubicación de destino es obligatoria.';
    }
    if (movementType.includes('adjustment_negative') && !fromLocationId) { 
        errors.fromLocationId = 'Para ajuste negativo, la ubicación de origen es obligatoria.';
    }
    if (!movementDate) errors.movementDate = 'La fecha del movimiento es obligatoria.';

    if ((movementType === 'dispatch' || movementType === 'transfer' || movementType === 'adjustment_negative')) {
        if (quantity > availableQuantity) {
            errors.quantity = `Cantidad insuficiente. Disponible: ${availableQuantity}.`;
        }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: CreateMovementPayload = {
      movement_type: movementType,
      product_id: selectedProductId,
      product_variant_id: selectedProductVariantId || undefined, // undefined en lugar de null para TypeORM
      from_location_id: fromLocationId || undefined,
      to_location_id: toLocationId || undefined,
      quantity: quantity,
      product_lot_id: productLotId || undefined,
      product_serial_id: productSerialId || undefined,
      notes: notes || undefined,
      reference_document_id: referenceDocumentId || undefined,
      reference_document_type: referenceDocumentType || undefined,
      user_id: userId,
      movement_date: new Date(movementDate).toISOString(),
    };

    try {
      const newMovement = await createMovement(payload);
      if (newMovement) {
        onMovementCreated?.(newMovement);
        onClose(); // Cierra el modal al éxito
      }
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      // El store ya maneja el error, aquí podrías mostrar un toast o mensaje al usuario
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Nuevo Movimiento de Inventario</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-semibold"
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de Movimiento */}
          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
            <select
              id="movementType"
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value);
                setFromLocationId(''); // Resetear ubicaciones al cambiar tipo
                setToLocationId('');
                setFormErrors({}); // Limpiar errores al cambiar tipo
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            >
              <option value="">Seleccione un tipo</option>
              <option value="reception">Recepción (Entrada)</option>
              <option value="dispatch">Despacho (Salida)</option>
              <option value="transfer">Transferencia</option>
              <option value="adjustment_positive">Ajuste Positivo</option>
              <option value="adjustment_negative">Ajuste Negativo</option>
            </select>
            {formErrors.movementType && <p className="text-red-500 text-xs mt-1">{formErrors.movementType}</p>}
          </div>

          {/* Producto */}
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700">Producto</label>
            <select
              id="productId"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedProductVariantId(''); // Resetear variante al cambiar producto
                setFromLocationId(''); // Resetear ubicación de origen para filtrar
                setProductLotId('');
                setProductSerialId('');
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            >
              <option value="">Seleccione un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            {formErrors.selectedProductId && <p className="text-red-500 text-xs mt-1">{formErrors.selectedProductId}</p>}
          </div>

          {/* Variante de Producto */}
          {selectedProduct && availableVariants.length > 0 && (
            <div>
              <label htmlFor="productVariantId" className="block text-sm font-medium text-gray-700">Variante de Producto (Opcional)</label>
              <select
                id="productVariantId"
                value={selectedProductVariantId}
                onChange={(e) => setSelectedProductVariantId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
              >
                <option value="">Ninguna</option>
                {availableVariants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                ))}
              </select>
            </div>
          )}

          {/* Ubicación de Origen - Solo si el movimiento implica sacar inventario */}
          {(movementType === 'dispatch' || movementType === 'transfer' || movementType === 'adjustment_negative') && (
            <div>
              <label htmlFor="fromLocationId" className="block text-sm font-medium text-gray-700">Ubicación de Origen</label>
              <select
                id="fromLocationId"
                value={fromLocationId}
                onChange={(e) => {
                  setFromLocationId(e.target.value);
                  setProductLotId(''); // Resetear lote/serie si cambia la ubicación de origen
                  setProductSerialId('');
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
                disabled={!selectedProductId} // Deshabilitar si no hay producto seleccionado
              >
                <option value="">Seleccione ubicación</option>
                {/* Filtrar ubicaciones para mostrar solo donde hay el producto seleccionado */}
                {availableFromLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {formErrors.fromLocationId && <p className="text-red-500 text-xs mt-1">{formErrors.fromLocationId}</p>}
              {selectedProductId && availableFromLocations.length === 0 && (
                <p className="text-red-500 text-xs mt-1">El producto no tiene existencias en ninguna ubicación.</p>
              )}
              {fromLocationId && (movementType === 'dispatch' || movementType === 'transfer' || movementType === 'adjustment_negative') && (
                <p className="text-gray-500 text-xs mt-1">Disp. en origen: {availableQuantity}</p>
              )}
            </div>
          )}

          {/* Ubicación de Destino - Solo si el movimiento implica meter inventario */}
          {(movementType === 'reception' || movementType === 'transfer' || movementType === 'adjustment_positive') && (
            <div>
              <label htmlFor="toLocationId" className="block text-sm font-medium text-gray-700">Ubicación de Destino</label>
              <select
                id="toLocationId"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
              >
                <option value="">Seleccione ubicación</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {formErrors.toLocationId && <p className="text-red-500 text-xs mt-1">{formErrors.toLocationId}</p>}
              {formErrors.locationConflict && <p className="text-red-500 text-xs mt-1">{formErrors.locationConflict}</p>}
            </div>
          )}
          {/* Este error es más general si ninguna ubicación es seleccionada para un ajuste */}
          {formErrors.location && <p className="text-red-500 text-xs mt-1 md:col-span-2">{formErrors.location}</p>}

          {/* Cantidad */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
              min="0.0001"
              step="0.0001"
            />
            {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
          </div>

          {/* Campos Opcionales: Lote, Serie, Documento de Referencia, Notas, Fecha */}
          <div>
            <label htmlFor="productLotId" className="block text-sm font-medium text-gray-700">Lote (Opcional)</label>
            <input
              type="text"
              id="productLotId"
              value={productLotId}
              onChange={(e) => setProductLotId(e.target.value)}
              placeholder="ID del Lote"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="productSerialId" className="block text-sm font-medium text-gray-700">Serie (Opcional)</label>
            <input
              type="text"
              id="productSerialId"
              value={productSerialId}
              onChange={(e) => setProductSerialId(e.target.value)}
              placeholder="ID del Serie"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="referenceDocumentId" className="block text-sm font-medium text-gray-700">Doc. Referencia ID (Opcional)</label>
            <input
              type="text"
              id="referenceDocumentId"
              value={referenceDocumentId}
              onChange={(e) => setReferenceDocumentId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="referenceDocumentType" className="block text-sm font-medium text-gray-700">Tipo Doc. Referencia (Opcional)</label>
            <input
              type="text"
              id="referenceDocumentType"
              value={referenceDocumentType}
              onChange={(e) => setReferenceDocumentType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas (Opcional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="movementDate" className="block text-sm font-medium text-gray-700">Fecha de Movimiento</label>
            <input
              type="date"
              id="movementDate"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#00A7E1] focus:border-[#00A7E1] sm:text-sm"
            />
            {formErrors.movementDate && <p className="text-red-500 text-xs mt-1">{formErrors.movementDate}</p>}
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-3xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
              disabled={isCreatingMovement}
            >
              {isCreatingMovement ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}