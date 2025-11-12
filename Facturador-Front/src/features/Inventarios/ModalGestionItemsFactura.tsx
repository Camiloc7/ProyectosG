'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceItem, Product } from '@/types/inventory';
import { useProductStore } from '@/store/Inventario/useProductStore';
import ModalCrearProducto from '@/features/Inventarios/CreateProduct';

enum ItemMappingStatus {
  EXISTING = 'existing',
  NEW = 'new',
  UNPROCESSED = 'unprocessed',
  IGNORED = 'ignored',
}

interface ItemMapping {
  productId: string | null;
  status: ItemMappingStatus;
}

interface ModalGestionItemsFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const ModalGestionItemsFactura: React.FC<ModalGestionItemsFacturaProps> = ({ isOpen, onClose, invoice }) => {
  const { products, fetchProducts } = useProductStore();
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);
  const [itemProductMapping, setItemProductMapping] = useState<Record<number, ItemMapping>>({});

  useEffect(() => {
    if (isOpen) {
      fetchProducts().then(() => {
      });
    }
  }, [isOpen, fetchProducts]);

  useEffect(() => {
  }, [invoice, products]);

  useEffect(() => {
    if (!invoice || !invoice.items || products.length === 0) {
      setItemProductMapping({});
      return;
    }

    const initialMapping: Record<number, ItemMapping> = {};
    invoice.items.forEach(item => {
      const matchedProduct = products.find(
        (p) =>
          (item.descripcion && p.sku && p.sku.toLowerCase() === item.descripcion.toLowerCase()) ||
          (item.descripcion && p.name.toLowerCase() === item.descripcion.toLowerCase())
      );

      initialMapping[item.id] = matchedProduct
        ? { productId: matchedProduct.id, status: ItemMappingStatus.EXISTING }
        : { productId: null, status: ItemMappingStatus.UNPROCESSED };
    });

    setItemProductMapping(initialMapping);
  }, [invoice, products]);

  const handleOpenCreateProductModal = useCallback((item: InvoiceItem) => {
    setSelectedItem(item);
    setIsCreateProductModalOpen(true);
  }, []);

  const handleCloseCreateProductModal = useCallback(() => {
    setIsCreateProductModalOpen(false);
    setSelectedItem(null);
    fetchProducts();
  }, [fetchProducts]);

  const handleProductCreated = useCallback(
    (newProductId: string) => {
      if (selectedItem) {
        setItemProductMapping((prev) => ({
          ...prev,
          [selectedItem.id]: { productId: newProductId, status: ItemMappingStatus.NEW },
        }));
      }
      handleCloseCreateProductModal();
    },
    [selectedItem, handleCloseCreateProductModal]
  );

  const handleAssociateExistingProduct = useCallback((itemId: number, productId: string) => {
    setItemProductMapping((prev) => ({
      ...prev,
      [itemId]: { productId: productId, status: ItemMappingStatus.EXISTING },
    }));
  }, []);

  const handleUnassociateItem = useCallback((itemId: number) => {
    setItemProductMapping((prev) => ({
      ...prev,
      [itemId]: { productId: null, status: ItemMappingStatus.UNPROCESSED },
    }));
  }, []);

  const handleIgnoreItem = useCallback((itemId: number) => {
    setItemProductMapping((prev) => ({
      ...prev,
      [itemId]: { productId: null, status: ItemMappingStatus.IGNORED },
    }));
  }, []);

  const handleProcessItems = () => {
    alert('Procesamiento simulado. Se cerrarían las ventanas.');
    onClose();
  };

  const allItemsManaged = Object.values(itemProductMapping).every(
    (m) =>
      m.status === ItemMappingStatus.EXISTING ||
      m.status === ItemMappingStatus.NEW ||
      m.status === ItemMappingStatus.IGNORED
  );

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Ítems de Factura: {invoice.numero_factura}</h2>

        <p className="mb-4 text-gray-700">
          Revisa cada ítem de esta factura. Puedes **crear un nuevo producto** si no existe, **asociarlo a un producto existente** en tu inventario, o **ignorar** el ítem si no es relevante.
        </p>

        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unitario</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto Asociado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item) => {
                  const currentMapping = itemProductMapping[item.id];
                  const associatedProduct = currentMapping?.productId ? products.find((p) => p.id === currentMapping.productId) : null;

                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm text-gray-700">{item.descripcion}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.cantidad}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.valor_unitario?.toFixed(0) || '0.00'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.valor_total?.toFixed(0) || '0.00'}</td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {associatedProduct ? `${associatedProduct.name} (SKU: ${associatedProduct.sku})` : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {currentMapping?.status === ItemMappingStatus.EXISTING || currentMapping?.status === ItemMappingStatus.NEW ? (
                          <button
                            onClick={() => handleUnassociateItem(item.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Desvincular
                          </button>
                        ) : currentMapping?.status === ItemMappingStatus.IGNORED ? (
                          <button
                            onClick={() => handleUnassociateItem(item.id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Revertir Ignorado
                          </button>
                        ) : (
                          <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                            <button
                              onClick={() => handleOpenCreateProductModal(item)}
                              className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-3 py-1 rounded-md text-xs transition-colors w-full sm:w-auto"
                            >
                              Crear Producto
                            </button>
                            <select
                              onChange={(e) => handleAssociateExistingProduct(item.id, e.target.value)}
                              className="border border-gray-300 rounded-md text-xs py-1 px-2 w-full sm:w-auto"
                              value={currentMapping?.productId || ''}
                            >
                              <option value="">Asociar Existente</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} (SKU: {product.sku})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleIgnoreItem(item.id)}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md text-xs transition-colors w-full sm:w-auto"
                            >
                              Ignorar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {currentMapping?.status === ItemMappingStatus.EXISTING && (
                          <span className="text-green-600 font-medium">Asociado</span>
                        )}
                        {currentMapping?.status === ItemMappingStatus.NEW && (
                          <span className="text-purple-600 font-medium">Nuevo (Creado)</span>
                        )}
                        {currentMapping?.status === ItemMappingStatus.UNPROCESSED && (
                          <span className="text-red-600 font-medium">Pendiente</span>
                        )}
                        {currentMapping?.status === ItemMappingStatus.IGNORED && (
                          <span className="text-gray-600 font-medium">Ignorado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-2 text-center text-gray-500">
                    No hay ítems para esta factura.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
          >
            Cerrar
          </button>
          <button
            onClick={handleProcessItems}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            disabled={!allItemsManaged}
          >
            Procesar Factura
          </button>
        </div>
      </div>
      <ModalCrearProducto
        isOpen={isCreateProductModalOpen}
        onClose={handleCloseCreateProductModal}
        onProductCreated={handleProductCreated}
        initialData={selectedItem ? { name: selectedItem.descripcion, sku: '', barcode: '', category_id: null } : undefined}
      />
    </div>
  );
};

export default ModalGestionItemsFactura;
