'use client';
import { useEffect, useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import CreateLocationModal from '@/features/Inventarios/CreateLocationModal';
import Link from 'next/link';
import { Search } from 'lucide-react'; 
const LocationsPage = () => {
  const { locations, fetchLocations, isLoading, error } = useLocationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchLocations(); 
  };
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto"> 
          <div className="w-full mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar ubicaciones"
                  className="w-full border-none outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px] cursor-pointer" />
              </div>
              <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                Ubicaciones
              </h1>
              <button
                onClick={handleOpenModal}
                className="ml-auto bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1] w-full sm:w-auto"
              >
                + Crear ubicación
              </button>
            </div>
          </div>
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando ubicaciones...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : filteredLocations.length === 0 ? (
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron ubicaciones para su búsqueda.' : 'No hay ubicaciones registradas.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
              {filteredLocations.map((location) => (
                <Link key={location.id} href={`/panelProduccion/ubicaciones/${location.id}`} passHref>
                  <div className="bg-white rounded-xl shadow p-4 border border-gray-200 flex flex-col justify-between h-full cursor-pointer hover:shadow-lg transition duration-300">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-1 font-montserrat">{location.name}</h2> 
                      <p className="text-sm text-gray-500 mb-2 font-inter">{location.description}</p> 
                      {location.address && <p className="text-sm text-gray-500 font-inter">Dirección: {location.address}</p>}
                      <p className={`text-xs font-medium font-inter ${location.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        Estado: {location.is_active ? 'Activa' : 'Inactiva'}
                      </p>
                      {location.is_production_site && (
                          <p className="text-xs font-medium font-inter text-blue-600">Sitio de Producción</p>
                      )}
                    </div>
                    {location.inventoryItems && location.inventoryItems.length > 0 ? (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-600 font-inter">Contenido:</p>
                            <ul className="text-xs text-gray-500 max-h-20 overflow-y-auto font-inter">
                                {location.inventoryItems.slice(0, 3).map((item) => (
                                    <li key={item.id}>
                                        - {item.product?.name} ({item.quantity} unid.)
                                    </li>
                                ))}
                                {location.inventoryItems.length > 3 && (
                                    <li className="text-xs text-gray-400 font-inter">Y {location.inventoryItems.length - 3} más...</li>
                                )}
                            </ul>
                            <p className="text-xs text-blue-500 mt-2 font-inter">Ver inventario completo</p>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 mt-4 font-inter">Vacía</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <CreateLocationModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};
export default LocationsPage;