'use client';
import React, { useEffect, useState } from 'react';
import OnlyAdminRoute from '@/helpers/OnlyAdminRoute';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import { useEstablecimientoStore } from '@/store/POS/useEstablecimientoStore';
import FormEstablecimientos, {
  IFormEstablecimientos,
} from '@/features/POS/formEstablecimientos';
import BotonQuality from '@/components/ui/BotonQuality';
import { confirm } from '@/components/feedback/ConfirmOption';
import { Search } from 'lucide-react';

export default function Establecimientos() {
  const { traerEstablecimientos, establecimientos, eliminarEstablecimiento } =
    useEstablecimientoStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 9; // cantidad por página

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [establecimientoSeleccionado, setEstablecimientoSeleccionado] =
    useState<IFormEstablecimientos | null>(null);

  useEffect(() => {
    traerEstablecimientos();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const handleDelete = async (id: string | undefined) => {
    const confirmado = await confirm({
      title: 'Se eliminara el Establecimiento',
    });
    if (!id) return;
    if (!confirmado) return;
    eliminarEstablecimiento(id);
  };

  // Filtrar por búsqueda
  const filteredEstablecimientos = establecimientos.filter((est) =>
    est.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular paginación
  const totalPages = Math.ceil(filteredEstablecimientos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredEstablecimientos.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <OnlyAdminRoute>
      <LayoutDashboard>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-14">
            {/* Barra de búsqueda */}
            <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
              <input
                type="text"
                placeholder="Buscar Establecimiento"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full border-none outline-none"
              />
              <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
            </div>

            {/* Título */}
            <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
              Establecimientos
            </h1>
            <BotonQuality
              label="Nuevo Establecimiento"
              onClick={() => setIsModalOpen(true)}
            />
          </div>

          {/* Lista de Establecimientos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {currentItems.map((est, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition relative cursor-pointer min-h-44 max-h-52 flex flex-col justify-between"
                onClick={() => {
                  setIsModalOpen(true);
                  setEstablecimientoSeleccionado(est);
                }}
              >
                <h2 className="text-lg font-semibold">{est.nombre}</h2>
                <p className="text-gray-500">{est.direccion}</p>
                <p
                  className={`mt-2 font-medium ${
                    est.activo ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {est.activo ? 'Activo' : 'Inactivo'}
                </p>

                <div className="flex justify-between w-44 gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setEstablecimientoSeleccionado(est);
                    }}
                    className="h-6 w-full text-xs font-medium font-inter text-[#00A7E1] bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]"
                  >
                    Ver
                  </button>

                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(est.id);
                    }}
                    className="h-6 w-full text-xs font-medium font-inter text-[#D7263D] bg-[#FFE3E3] rounded-[16px] hover:bg-[#F8D1D1]"
                  >
                    Eliminar
                  </button> */}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
            >
              Siguiente
            </button>
          </div>

          <FormEstablecimientos
            isOpen={isModalOpen}
            onClose={() => {
              setEstablecimientoSeleccionado(null);
              setIsModalOpen(false);
            }}
            establecimiento={establecimientoSeleccionado}
          />
        </div>
      </LayoutDashboard>
    </OnlyAdminRoute>
  );
}
