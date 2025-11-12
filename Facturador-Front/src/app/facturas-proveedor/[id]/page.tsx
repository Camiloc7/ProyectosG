// app/facturas-proveedor/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import Spinner from '@/components/feedback/Spinner';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useParams } from 'next/navigation';
import { showErrorToast } from '@/components/feedback/toast';
import { format } from 'date-fns';
import { INVENTORY_URL } from '@/helpers/ruta'; // Importa la URL base

interface Invoice {
  id: number;
  cufe: string;
  numero_factura: string;
  fecha_emision: string;
  monto_subtotal: number;
  monto_impuesto: number;
  monto_total: number;
  moneda: string;
  nombre_proveedor: string;
  nit_proveedor: string;
  nombre_cliente: string;
  metodo_pago: string;
  revisada_manualmente: boolean;
  proveedor_id: string;
}

const FacturasProveedorPage = () => {
  const params = useParams();
  const proveedorId = params.id as string;

  const [facturas, setFacturas] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacturas = async () => {
      if (!proveedorId) {
        setError('ID de proveedor no proporcionado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${INVENTORY_URL}facturas/by-supplier/${proveedorId}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al obtener las facturas: ${response.status} ${errorText}`);
        }
        const data: Invoice[] = await response.json();
        setFacturas(data);
      } catch (err: any) {
        console.error('Error fetching invoices by supplier:', err);
        setError(err.message || 'Error desconocido al cargar las facturas.');
        showErrorToast(err.message || 'Error al cargar las facturas.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, [proveedorId]);

  const handleDownloadFile = async (invoiceId: number, fileType: 'xml' | 'pdf') => {
    try {
      const response = await fetch(`${INVENTORY_URL}facturas/${invoiceId}/${fileType}`);
      
      if (!response.ok) {
        if (response.status === 204) {
          showErrorToast(`No ${fileType.toUpperCase()} disponible para esta factura.`);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Error al descargar ${fileType.toUpperCase()}: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${invoiceId}.${fileType}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(`Error downloading ${fileType}:`, err);
      showErrorToast(err.message || `Error desconocido al descargar ${fileType.toUpperCase()}.`);
    }
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="w-full">
            <h1 className="text-xl md:text-2xl lg:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center mb-6">
              Facturas del Proveedor: {facturas.length > 0 ? facturas[0].nombre_proveedor : proveedorId}
            </h1>
            
            {loading ? (
              <div className="text-center text-gray-600">
                Cargando facturas...
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-center text-red-500">
                Error al cargar las facturas: {error}
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-[#00A7E1] text-white rounded-full hover:bg-[#008ec1]"
                >
                  Volver
                </button>
              </div>
            ) : (
              <div className="rounded-[8px] mt-6 overflow-x-auto">
                <table className="w-full bg-white justify-center rounded-[8px]">
                  <thead className="bg-[#FCFCFD] rounded-[8px]">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Número Factura</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">CUFE</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Fecha Emisión</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Monto Subtotal</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Monto IVA</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Monto Total</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Moneda</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Cliente</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Método Pago</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Revisada</th>
                      <th className="px-4 py-2 text-sm font-medium text-[#667085]">Archivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.length > 0 ? (
                      facturas.map((factura) => (
                        <tr
                          key={factura.id}
                          className="border-b text-center border-[#EAECF0] hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.numero_factura || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.cufe || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                            {factura.fecha_emision ? format(new Date(factura.fecha_emision), 'dd/MM/yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.monto_subtotal?.toFixed(2) || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.monto_impuesto?.toFixed(2) || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.monto_total?.toFixed(2) || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.moneda || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.nombre_cliente || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">{factura.metodo_pago || 'N/A'}</td>
                          <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                            {typeof factura.revisada_manualmente === 'boolean' ? (factura.revisada_manualmente ? 'Sí' : 'No') : 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              onClick={() => handleDownloadFile(factura.id, 'xml')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs mr-2"
                              title="Descargar XML"
                            >
                              XML
                            </button>
                            <button
                              onClick={() => handleDownloadFile(factura.id, 'pdf')}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs"
                              title="Descargar PDF"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                          {loading ? 'Cargando datos...' : 'No hay facturas asociadas a este proveedor.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            <button
              onClick={() => window.history.back()}
              className="mt-[50px] bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
            >
              Volver a Proveedores
            </button>
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default FacturasProveedorPage;