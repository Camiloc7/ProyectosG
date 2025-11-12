'use client';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import Link from 'next/link';
export default function ProductionDashboardPage() {
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestión de Producción</h1>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Bienvenido al Módulo de Producción</h2>
            <p className="text-gray-600 leading-relaxed">
              Aquí puedes gestionar todos los aspectos relacionados con la fabricación de tus productos. Define la composición de tus artículos con las Listas de Materiales (BOMs), crea y supervisa órdenes de producción, y mantente al tanto del inventario necesario para tus operaciones.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/panelProduccion/produccion/boms" className="block">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center justify-center text-center h-48 border border-gray-200 hover:border-[#00A7E1]">
                <svg className="w-16 h-16 text-[#00A7E1] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Listas de Materiales (BOMs)</h3>
                <p className="text-sm text-gray-600">Define la composición de tus productos.</p>
              </div>
            </Link>
            <Link href="/panelProduccion/produccion/ordenes" className="block">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center justify-center text-center h-48 border border-gray-200 hover:border-[#00A7E1]">
                <svg className="w-16 h-16 text-[#00A7E1] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2H10a2 2 0 01-2-2v-4m0 0l-4 4m4-4l4 4"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Órdenes de Producción</h3>
                <p className="text-sm text-gray-600">Crea y gestiona tus ciclos de producción.</p>
              </div>
            </Link>
            <Link href="/panelProduccion/produccion/calidad" className="block">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center justify-center text-center h-48 border border-gray-200 hover:border-[#00A7E1]">
                <svg className="w-16 h-16 text-[#00A7E1] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6H16M4 10H16M4 14H16M4 18H16M2 6h.01M2 10h.01M2 14h.01M2 18h.01"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Controles de Calidad</h3>
                <p className="text-sm text-gray-600">Gestiona y revisa los controles de calidad de los productos.</p>
              </div>
            </Link>
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}