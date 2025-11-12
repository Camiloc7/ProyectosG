'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import type { Location, InventoryItem } from '@/types/inventory';
import { Search } from 'lucide-react'; 
interface InventoryTableColumn {
    key: keyof InventoryItem | 'product_name' | 'product_sku' | 'product_variant_name' | 'product_lot_number' | 'product_serial_number';
    label: string;
    visible: boolean;
}
interface InventorySortConfig {
    key: InventoryTableColumn['key'] | null;
    direction: 'asc' | 'desc';
}
const LocationDetailPage = () => {
    const { id } = useParams();
    const { fetchLocations, locations, isLoading, error } = useLocationStore();
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [inventorySortConfig, setInventorySortConfig] = useState<InventorySortConfig>({ key: null, direction: 'asc' });
    const inventoryColumns: InventoryTableColumn[] = useMemo(() => [
        { key: 'product_name', label: 'Producto', visible: true },
        { key: 'product_sku', label: 'SKU', visible: true },
        { key: 'product_variant_name', label: 'Variante', visible: true },
        { key: 'quantity', label: 'Cantidad', visible: true },
        { key: 'product_lot_number', label: 'Lote', visible: true },
        { key: 'product_serial_number', label: 'Número de Serie', visible: true },
    ], []);
    useEffect(() => {
        if (id) {
            if (locations.length === 0) {
                fetchLocations();
            } else {
                const foundLocation = locations.find(loc => loc.id === id);
                setCurrentLocation(foundLocation || null);
            }
        }
    }, [id, locations, fetchLocations]);
    const sortInventory = (key: InventoryTableColumn['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (inventorySortConfig.key === key && inventorySortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setInventorySortConfig({ key, direction });
    };
    const filteredAndSortedInventory: InventoryItem[] = useMemo(() => {
        if (!currentLocation || !currentLocation.inventoryItems) return [];

        let items = [...currentLocation.inventoryItems];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            items = items.filter(item =>
                (item.product?.name?.toLowerCase().includes(lowerCaseSearchTerm) ?? false) ||
                (item.product?.sku?.toLowerCase().includes(lowerCaseSearchTerm) ?? false) ||
                (item.productVariant?.name?.toLowerCase().includes(lowerCaseSearchTerm) ?? false) ||
                (item.productLot?.lot_number?.toLowerCase().includes(lowerCaseSearchTerm) ?? false) ||
                (item.productSerial?.serial_number?.toLowerCase().includes(lowerCaseSearchTerm) ?? false)
            );
        }
        if (inventorySortConfig.key) {
            items.sort((a, b) => {
                let aValue: string | number | undefined;
                let bValue: string | number | undefined;
                const sortKey = inventorySortConfig.key;

                switch (sortKey) {
                    case 'product_name':
                        aValue = a.product?.name || '';
                        bValue = b.product?.name || '';
                        break;
                    case 'product_sku':
                        aValue = a.product?.sku || '';
                        bValue = b.product?.sku || '';
                        break;
                    case 'product_variant_name':
                        aValue = a.productVariant?.name || '';
                        bValue = b.productVariant?.name || '';
                        break;
                    case 'product_lot_number':
                        aValue = a.productLot?.lot_number || '';
                        bValue = b.productLot?.lot_number || '';
                        break;
                    case 'product_serial_number':
                        aValue = a.productSerial?.serial_number || '';
                        bValue = b.productSerial?.serial_number || '';
                        break;
                    case 'quantity':
                        aValue = a.quantity;
                        bValue = b.quantity;
                        break;
                    default:
                        aValue = (a[sortKey as keyof InventoryItem] as string | number | undefined) || '';
                        bValue = (b[sortKey as keyof InventoryItem] as string | number | undefined) || '';
                        break;
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return inventorySortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return inventorySortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0; 
            });
        }
        return items;
    }, [currentLocation, searchTerm, inventorySortConfig]);
    const estilosTitulosTabla: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter';
    if (isLoading && !currentLocation) {
        return (
            <PrivateRoute>
                <LayoutAdmi>
                    <div className="p-6 max-w-full mx-auto min-h-screen flex items-center justify-center">
                        <p className="text-gray-500 font-inter">Cargando detalles de la ubicación...</p>
                    </div>
                </LayoutAdmi>
            </PrivateRoute>
        );
    }
    if (error) {
        return (
            <PrivateRoute>
                <LayoutAdmi>
                    <div className="p-6 max-w-full mx-auto min-h-screen flex items-center justify-center">
                        <p className="text-red-500 font-inter">Error: {error}</p>
                    </div>
                </LayoutAdmi>
            </PrivateRoute>
        );
    }
    if (!currentLocation) {
        return (
            <PrivateRoute>
                <LayoutAdmi>
                    <div className="p-6 max-w-full mx-auto min-h-screen flex items-center justify-center">
                        <p className="text-gray-400 font-inter">Ubicación no encontrada.</p>
                    </div>
                </LayoutAdmi>
            </PrivateRoute>
        );
    }
    return (
        <PrivateRoute>
            <LayoutAdmi>
                <div className="p-6 max-w-full mx-auto min-h-screen">
                   <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                        Detalle de Ubicación: {currentLocation.name}
                    </h1>
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 lg:w-2/3">
                            <div className="w-full mb-6">
                                <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                                    <input
                                        type="text"
                                        placeholder="Buscar producto en el inventario..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full border-none outline-none font-inter"
                                    />
                                    <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
                                </div>
                            </div>
                            {filteredAndSortedInventory.length > 0 ? (
                                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-[#FCFCFD]">
                                            <tr>
                                                {inventoryColumns.map((col) => (
                                                    <th
                                                        key={col.key}
                                                        onClick={() => sortInventory(col.key)}
                                                        className={`${estilosTitulosTabla} cursor-pointer hover:bg-gray-100`}
                                                        role="button"
                                                    >
                                                        {col.label}{' '}
                                                        {(inventorySortConfig.key === col.key)
                                                            ? (inventorySortConfig.direction === 'asc' ? '↑' : '↓')
                                                            : '↑'}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAndSortedInventory.map((item) => (
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
                            ) : (
                                <p className="text-center text-gray-400 mt-8 font-inter">
                                    {searchTerm ? 'No se encontraron ítems de inventario que coincidan con la búsqueda.' : 'Esta ubicación no tiene inventario registrado.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </LayoutAdmi>
        </PrivateRoute>
    );
};

export default LocationDetailPage;