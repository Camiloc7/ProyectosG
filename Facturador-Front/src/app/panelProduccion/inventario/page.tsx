'use client';
import { useEffect, useState, useMemo } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useInventoryStore } from '@/store/Inventario/useInventoryStore';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import { useProductStore } from '@/store/Inventario/useProductStore';
import SimpleSelect from '@/components/ui/SimpleSelect'; 
import { Search } from 'lucide-react';
const InventoryPage = () => {
  const { inventoryItems, fetchInventory, isLoading: isLoadingInventory, error } = useInventoryStore();
  const { locations, fetchLocations, isLoading: isLoadingLocations } = useLocationStore(); 
  const { products, fetchProducts, isLoading: isLoadingProducts } = useProductStore();  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  useEffect(() => {
    fetchInventory();
    fetchLocations();
    fetchProducts();
  }, [fetchInventory, fetchLocations, fetchProducts]);
  const locationOptions = useMemo(() => { 
    const options = locations.map(loc => ({
      value: loc.id,
      label: loc.name,
    }));
    return [{ value: '', label: 'Todas las Ubicaciones' }, ...options];
  }, [locations]); 
  const productOptions = useMemo(() => {
    const options = products.map(prod => ({
      value: prod.id,
      label: `${prod.name} (${prod.sku})`, 
    }));
    return [{ value: '', label: 'Todos los Productos' }, ...options];
  }, [products]);
  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchTermsArray = lowerCaseSearchTerm.split(' ').filter(term => term.length > 0);
      const matchesSearch = searchTermsArray.every(term =>
        item.product?.name?.toLowerCase().includes(term) ||
        item.product?.sku?.toLowerCase().includes(term) ||
        item.productVariant?.name?.toLowerCase().includes(term) ||
        item.productLot?.lot_number?.toLowerCase().includes(term) ||
        item.productSerial?.serial_number?.toLowerCase().includes(term) ||
        item.location?.name?.toLowerCase().includes(term)
      );
      const matchesLocation = selectedLocationId
        ? item.location_id === selectedLocationId
        : true;
      const matchesProduct = selectedProductId
        ? item.product_id === selectedProductId
        : true;
      return matchesSearch && matchesLocation && matchesProduct;
    });
  }, [inventoryItems, searchTerm, selectedLocationId, selectedProductId]);
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto min-h-screen">
          <div className="w-full mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar ítem por nombre, SKU, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-none outline-none font-inter"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
                Inventario General
              </h1>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-6 items-center justify-center lg:justify-start">
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] relative">
              <label className="text-gray-700 font-inter font-medium block mb-2">Filtrar por Ubicación</label>
              <div>
                {isLoadingLocations ? ( 
                  <div className="text-gray-500 font-inter py-2">Cargando ubicaciones...</div>
                ) : (
                  <SimpleSelect
                    options={locationOptions} 
                    width={'100%'}
                    value={selectedLocationId}
                    onChange={(value) => {
                      setSelectedLocationId(value);
                    }}
                    placeholder="Seleccione una Ubicación"
                  />
                )}
              </div>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] relative">
              <label className="text-gray-700 font-inter font-medium block mb-2">Filtrar por Producto</label>
              <div>
                {isLoadingProducts ? ( 
                  <div className="text-gray-500 font-inter py-2">Cargando productos...</div>
                ) : (
                  <SimpleSelect
                    options={productOptions} 
                    width={'100%'}
                    value={selectedProductId}
                    onChange={(value) => {
                      setSelectedProductId(value);
                    }}
                    placeholder="Seleccione un Producto"
                  />
                )}
              </div>
            </div>
          </div>
          {isLoadingInventory ? ( 
            <p className="text-center text-gray-500 font-inter mt-8">Cargando inventario...</p>
          ) : error ? (
            <p className="text-center text-red-500 font-inter mt-8">Error al cargar el inventario: {error}</p>
          ) : filteredInventory.length === 0 ? (
            <p className="text-center text-gray-400 font-inter mt-8">
              {searchTerm || selectedLocationId || selectedProductId
                ? 'No se encontraron ítems de inventario con los filtros aplicados.'
                : 'No hay ítems en el inventario.'}
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mt-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#FCFCFD]">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Producto
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      SKU
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Variante
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Ubicación
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Cantidad
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Lote
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Número de Serie
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-inter">
                        {item.product?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.product?.sku || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.productVariant?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.location?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.productLot?.lot_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                        {item.productSerial?.serial_number || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};
export default InventoryPage;