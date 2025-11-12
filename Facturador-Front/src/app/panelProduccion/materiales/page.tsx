'use client';
import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useInventoryEntryStore, CreateOrchestrationEntryPayload, ProductPayload, LotPayload } from '@/store/Inventario/useInventoryEntryStore';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import { useProductStore } from '@/store/Inventario/useProductStore';
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
import { useCategoryStore } from '@/store/Inventario/useCategoryStore';
import ModalCrearProducto from '@/features/Inventarios/CreateProduct';
const RecepcionMercanciasPage = () => {
  const { createInventoryEntry, isLoading: isCreatingEntry, error: createError } = useInventoryEntryStore();
  const { locations, fetchLocations } = useLocationStore();
  const { products, fetchProducts } = useProductStore();
  const { suppliers, fetchSuppliers } = useSuppliersStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productDetails, setProductDetails] = useState<ProductPayload>({ sku: '', name: '', barcode: '', category_id: ''});
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [supplierNit, setSupplierNit] = useState('');
  const [lotDetails, setLotDetails] = useState<LotPayload>({ lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 });
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [serialsInput, setSerialsInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  useEffect(() => {
    fetchLocations();
    fetchProducts();
    fetchSuppliers();
    fetchCategories();
  }, [fetchLocations, fetchProducts, fetchSuppliers, fetchCategories]); 
  useEffect(() => {
    if (selectedProductId && !isNewProduct) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setProductDetails({
          sku: product.sku,
          name: product.name,
          barcode: product.barcode || '',
          category_id: product.category_id
        });
      }
    } else if (!selectedProductId && !isNewProduct) {
      setProductDetails({ sku: '', name: '', barcode: '', category_id: '' });
    }
  }, [selectedProductId, isNewProduct, products]);
  const validateForm = () => {
    const errors: Record<string, string> = {}; 
    if (!selectedLocationId) errors.location_id = 'La ubicación es obligatoria.';
    if (quantity <= 0) errors.quantity = 'La cantidad debe ser mayor a 0.';
    if (isNewProduct) {
      if (!productDetails.name.trim() || !productDetails.sku.trim() || !productDetails.category_id) {
        errors.newProductDetails = 'Debe crear un nuevo producto con todos sus detalles requeridos.';
      }
    } else {
      if (!selectedProductId) errors.selectedProduct = 'Seleccionar un producto existente es obligatorio.';
    }
    if (lotDetails.lot_number.trim()) {
        if (!lotDetails.manufacture_date) errors.manufacture_date = 'La fecha de fabricación es obligatoria para el lote.';
        if (!lotDetails.expiration_date) errors.expiration_date = 'La fecha de caducidad es obligatoria para el lote.';
        if (lotDetails.initial_quantity <= 0) errors.lotQuantity = 'La cantidad inicial del lote debe ser mayor a 0.';
        if (quantity > lotDetails.initial_quantity) errors.quantityMismatch = 'La cantidad a ingresar no puede ser mayor a la cantidad inicial del lote.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    if (isNewProduct && (!productDetails.name || !productDetails.sku || !productDetails.category_id)) {
        setFormErrors(prev => ({...prev, newProductDetails: 'Debe crear y seleccionar un producto nuevo antes de registrar la entrada.'}));
        return;
    }
    const serialsArray = serialsInput
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(s => s !== '');
    const payload: CreateOrchestrationEntryPayload = {
      product: productDetails, 
      supplier_nit: supplierNit || undefined,
      location_id: selectedLocationId,
      movement: {
        movement_type: 'reception', 
        quantity: quantity,
        movement_date: new Date().toISOString().split('T')[0],
      },
    };
    if (lotDetails.lot_number.trim()) {
        payload.lot = {
            lot_number: lotDetails.lot_number,
            manufacture_date: lotDetails.manufacture_date,
            expiration_date: lotDetails.expiration_date,
            initial_quantity: lotDetails.initial_quantity,
        };
    }
    if (serialsArray.length > 0) {
      payload.serials = serialsArray;
    }

    try {
      await createInventoryEntry(payload);
      setSelectedProductId('');
      setProductDetails({ sku: '', name: '', barcode: '', category_id: '' });
      setIsNewProduct(false); 
      setSupplierNit('');
      setLotDetails({ lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 });
      setSelectedLocationId('');
      setQuantity(0);
      setSerialsInput('');
      setFormErrors({});
      fetchProducts(); 
    } catch (err) {
      console.error('Error al enviar la entrada:', err);
    }
  };
  const handleProductCreated = (productId: string, productName: string, productSku: string, productBarcode: string | null, categoryId: string) => {
    fetchProducts();
    setSelectedProductId(productId); 
    setProductDetails({ 
      sku: productSku,
      name: productName,
      barcode: productBarcode || '',
      category_id: categoryId,
    });
    setIsCreateProductModalOpen(false); 
  };
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-8 bg-[#F7F7F7] min-h-screen">
          <h1 className="text-3xl font-bold mb-8 text-gray-700 text-center">Recepción de materiales</h1>
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Detalles de la Entrada</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Material/Producto:</label>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isNewProduct"
                  checked={isNewProduct}
                  onChange={(e) => {
                    setIsNewProduct(e.target.checked);
                    setSelectedProductId('');
                    setProductDetails({ sku: '', name: '', barcode: '', category_id: '' });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isNewProduct" className="text-sm text-gray-600">Crear nuevo producto o material</label>
              </div>
              {!isNewProduct ? (
                <div>
                  <select
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.selectedProduct ? 'border-red-500' : ''}`}
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const product = products.find(p => p.id === e.target.value);
                      if (product) {
                        setProductDetails({
                          sku: product.sku,
                          name: product.name,
                          barcode: product.barcode || '',
                          category_id: product.category_id,
                        });
                      } else {
                        setProductDetails({ sku: '', name: '', barcode: '', category_id: '' });
                      }
                    }}
                  >
                    <option value="">Selecciona un producto existente</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
                    ))}
                  </select>
                  {formErrors.selectedProduct && <p className="text-red-500 text-xs italic mt-1">{formErrors.selectedProduct}</p>}
                </div>
              ) : (
                <div className="mt-2">
                    <button
                        type="button"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={() => setIsCreateProductModalOpen(true)}
                    >
                        Abrir Creador de Producto
                    </button>
                    {formErrors.newProductDetails && <p className="text-red-500 text-xs italic mt-1">{formErrors.newProductDetails}</p>}
                    {productDetails.name && (
                        <p className="mt-2 text-sm text-gray-700">Producto para entrada: **{productDetails.name}** (SKU: {productDetails.sku})</p>
                    )}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="supplierNit" className="block text-gray-700 text-sm font-bold mb-2">NIT Proveedor (Opcional):</label>
              <select
                id="supplierNit"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={supplierNit}
                onChange={(e) => setSupplierNit(e.target.value)}
              >
                <option value="">Selecciona un proveedor (opcional)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.nit}>{supplier.name} ({supplier.nit})</option>
                ))}
              </select>
            </div>
            <div className="mb-4 border p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Información del Lote (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lotNumber" className="block text-gray-700 text-sm font-bold mb-2">Número de Lote:</label>
                  <input
                    type="text"
                    id="lotNumber"
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.lot_number ? 'border-red-500' : ''}`}
                    value={lotDetails.lot_number}
                    onChange={(e) => setLotDetails({ ...lotDetails, lot_number: e.target.value })}
                  />
                  {formErrors.lot_number && <p className="text-red-500 text-xs italic mt-1">{formErrors.lot_number}</p>}
                </div>
                <div>
                  <label htmlFor="manufactureDate" className="block text-gray-700 text-sm font-bold mb-2">Fecha Fabricación:</label>
                  <input
                    type="date"
                    id="manufactureDate"
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.manufacture_date ? 'border-red-500' : ''}`}
                    value={lotDetails.manufacture_date}
                    onChange={(e) => setLotDetails({ ...lotDetails, manufacture_date: e.target.value })}
                  />
                   {formErrors.manufacture_date && <p className="text-red-500 text-xs italic mt-1">{formErrors.manufacture_date}</p>}
                </div>
                <div>
                  <label htmlFor="expirationDate" className="block text-gray-700 text-sm font-bold mb-2">Fecha Caducidad:</label>
                  <input
                    type="date"
                    id="expirationDate"
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.expiration_date ? 'border-red-500' : ''}`}
                    value={lotDetails.expiration_date}
                    onChange={(e) => setLotDetails({ ...lotDetails, expiration_date: e.target.value })}
                  />
                   {formErrors.expiration_date && <p className="text-red-500 text-xs italic mt-1">{formErrors.expiration_date}</p>}
                </div>
                <div>
                  <label htmlFor="lotInitialQuantity" className="block text-gray-700 text-sm font-bold mb-2">Cantidad Inicial del Lote:</label>
                  <input
                    type="number"
                    id="lotInitialQuantity"
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.lotQuantity ? 'border-red-500' : ''}`}
                    value={lotDetails.initial_quantity}
                    onChange={(e) => setLotDetails({ ...lotDetails, initial_quantity: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                   {formErrors.lotQuantity && <p className="text-red-500 text-xs italic mt-1">{formErrors.lotQuantity}</p>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Ubicación de Destino:</label>
                <select
                  id="location"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.location_id ? 'border-red-500' : ''}`}
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  <option value="">Selecciona una ubicación</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {formErrors.location_id && <p className="text-red-500 text-xs italic mt-1">{formErrors.location_id}</p>}
              </div>
              <div>
                <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Cantidad a Ingresar:</label>
                <input
                  type="number"
                  id="quantity"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.quantity ? 'border-red-500' : ''}`}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  min="0"
                />
                {formErrors.quantity && <p className="text-red-500 text-xs italic mt-1">{formErrors.quantity}</p>}
                {formErrors.quantityMismatch && <p className="text-red-500 text-xs italic mt-1">{formErrors.quantityMismatch}</p>}
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="serials" className="block text-gray-700 text-sm font-bold mb-2">Números de Serie (uno por línea o separados por comas):</label>
              <textarea
                id="serials"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={serialsInput}
                onChange={(e) => setSerialsInput(e.target.value)}
                rows={4}
                placeholder="Ej: SERIE001, SERIE002&#10;SERIE003"
              />
              <p className="text-xs text-gray-500 mt-1">Ingresa cada número de serie en una nueva línea o sepáralos por comas.</p>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition duration-300 w-full"
              disabled={isCreatingEntry} 
            >
              {isCreatingEntry ? 'Registrando entrada...' : 'Registrar Entrada de Inventario'}
            </button>
            {createError && <p className="text-red-500 text-center mt-4">{createError}</p>}
          </form>
        </div>
      </LayoutAdmi>
          <ModalCrearProducto
            isOpen={isCreateProductModalOpen}
            onClose={() => {
                setIsCreateProductModalOpen(false);
            }}
            onProductCreated={handleProductCreated}
          />
    </PrivateRoute>
  );
};

export default RecepcionMercanciasPage;