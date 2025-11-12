'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import { useUserStore } from '@/store/useUser';
import OnlyAdminRoute from '@/helpers/OnlyAdminRoute';
import { useAdminStore } from '@/store/useAdminStore';
import { FaFileInvoiceDollar } from 'react-icons/fa'; // Asegúrate de tener instalado react-icons
import { useReviewStore } from '@/store/useReviewStore';
import { ReviewCard } from '@/features/admin/ReviewCard';
import { FaStar } from 'react-icons/fa6';

const BarChart = dynamic(() => import('../../features/admin/barChar'), {
  ssr: false,
});

export default function Dashboard() {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'];
  const { infoDelUsuario } = useUserStore();
  const { fetchReviews, reviews } = useReviewStore();
  const { fetchCantidadDeFacturas, numeroDeFacturasEmitidas } = useAdminStore();

  useEffect(() => {
    fetchCantidadDeFacturas();
    fetchReviews();
  }, []);

  const salesData = {
    label: 'Ventas',
    data: [170, 130, 70, 130, 115],
  };

  const purchasesData = {
    label: 'Compras',
    data: [200, 80, 90, 100, 70],
  };

  // Estado para la página actual
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5;

  // Ordenar los comentarios, por ejemplo, por calificación o por fecha
  const sortedReviews = [...reviews].sort(
    (a, b) => b.calificacion - a.calificacion
  );

  // Dividir los comentarios por páginas
  const indexOfLastReview = currentPage * commentsPerPage;
  const indexOfFirstReview = indexOfLastReview - commentsPerPage;
  const currentReviews = sortedReviews.slice(
    indexOfFirstReview,
    indexOfLastReview
  );

  // Funciones para cambiar de página
  const nextPage = () => {
    if (currentPage < Math.ceil(reviews.length / commentsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <OnlyAdminRoute>
      <LayoutDashboard>
        <div className="container mx-auto px-[6rem] py-8">
          <div className="px-4 sm:px-12 pb-14 pt-8 mx-auto bg-white rounded-[20px]">
            <h1 className="w-full h-10 text-3xl font-bold font-montserrat text-[#6F6F6F] mb-[20px] ">
              {infoDelUsuario?.nombre ?? 'Nombre del administrador'}
            </h1>
            <h2 className="w-full min-[525px]:mt-[30px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-[20px] font-montserrat font-[500] text-[#6F6F6F]">
              Gráfico Comparativo de Ventas y Compras
            </h2>
            <BarChart
              labels={months}
              datasets={[salesData, purchasesData]}
              barThickness={0.6}
            />

            <div className="bg-gradient-to-r from-blue-500 to-blueQ text-white p-6 rounded-lg shadow-lg flex items-center mt-10">
              <div className="mr-4">
                {/* Icono representativo */}
                <FaFileInvoiceDollar size={40} />
              </div>
              {/* Facturas  */}
              <div>
                <p className="text-lg font-semibold">Facturas Emitidas</p>
                <p className="text-4xl font-bold">
                  {numeroDeFacturasEmitidas || 0}
                </p>
              </div>
            </div>

            <div>
              <h1 className="w-full h-10 text-3xl font-bold font-montserrat text-[#6F6F6F] mb-[20px] mt-20">
                Reviews
              </h1>
              {currentReviews.map((review, index) => (
                <div
                  key={index}
                  className="px-4 sm:px-12 pb-14 pt-8 mx-auto bg-white rounded-[20px] shadow-lg mb-4 mt-10"
                >
                  <h1 className="w-full h-10 text-3xl font-bold font-montserrat text-[#6F6F6F] mb-[20px]">
                    {review.nombre ?? 'id del administrador'}
                  </h1>

                  {/* Calificación de estrellas */}
                  {(() => {
                    const estrellas = Array.from(
                      { length: 5 },
                      (_, index) => index < review.calificacion
                    );
                    return (
                      <div className="flex space-x-1 mb-[10px]">
                        {estrellas.map((estrella, index) => (
                          <FaStar
                            key={index}
                            size={20}
                            color={estrella ? '#FFD700' : '#E0E0E0'}
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Comentario de la reseña */}
                  <p className="text-[16px] font-montserrat text-[#6F6F6F] mt-[10px]">
                    {review.comentario ?? 'Comentario no disponible'}
                  </p>
                </div>
              ))}

              {/* Paginación */}
              <div className="flex flex-col items-center mt-4">
                <div className="flex justify-between w-full">
                  <button
                    onClick={prevPage}
                    className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={nextPage}
                    className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
                    disabled={
                      currentPage ===
                      Math.ceil(reviews.length / commentsPerPage)
                    }
                  >
                    Siguiente
                  </button>
                </div>
                {/* Información de la página */}
                <p className="mt-2 text-sm text-gray-700">
                  Página {currentPage} de{' '}
                  {Math.ceil(reviews.length / commentsPerPage)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </LayoutDashboard>
    </OnlyAdminRoute>
  );
}
