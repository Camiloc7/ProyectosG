"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useComprasStore } from '@/stores/comprasStore';
import { useProveedoresStore } from '@/stores/proveedoresStore';
import { useIngredientesStore } from '@/stores/ingredientesStore';
import FormularioFactura from '@/features/compras/FormularioFactura';
import Spinner from '@/components/feedback/Spinner';
import BotonRestaurante from '@/components/ui/Boton';
import { Table } from 'lucide-react';
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import ModalCompras from '@/components/modals/ModalCompras';

interface Compra {
    id: string;
    ingrediente: { nombre: string };
    proveedor: { nombre: string };
    cantidad_comprada: number;
    unidad_medida_compra: string;
    costo_total: number;
    fecha_compra: string;
    numero_factura?: string; 
}

const ComprasPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { compras, traerCompras, loading } = useComprasStore();
    const { traerProveedores } = useProveedoresStore();
    const { traerIngredientes } = useIngredientesStore();

    useEffect(() => {
        traerCompras();
        traerProveedores();
        traerIngredientes();
    }, [traerCompras, traerProveedores, traerIngredientes]);

    const handleCloseModal = () => setIsModalOpen(false);
    const comprasFormateadas = useMemo(() => {
        if (!compras) return [];
        return compras.map((compra: Compra) => ({
            ...compra,
            fecha_formateada: new Date(compra.fecha_compra).toLocaleDateString(),
            costo_formateado: `$${compra.costo_total.toFixed(2)}`,
        }));
    }, [compras]);

    return (
        <div
            className="p-6 md:p-8 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
            style={{ backgroundColor: FONDO }}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 mb-8 gap-4">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
                    Gestión de Compras
                </h1>
                <BotonRestaurante 
                    label="Registrar Nueva Factura" 
                    onClick={() => setIsModalOpen(true)} 
                    className="w-full sm:w-auto"
                />
            </div>
            
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {(compras?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                            <Table size={60} className="mb-4" />
                            <p className="text-xl font-medium">
                                No hay compras registradas.
                            </p>
                            <p className="text-md mt-2">
                                ¡Registra tu primera factura!
                            </p>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <div
                                className="hidden md:block overflow-x-auto rounded-lg shadow-md border border-gray-100"
                                style={{ backgroundColor: FONDO_COMPONENTES }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50" style={{ backgroundColor: FONDO_COMPONENTES }}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura #</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {comprasFormateadas.map((compra) => (
                                            <tr key={compra.id} className="hover:bg-gray-50 text-left transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.ingrediente.nombre}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{compra.proveedor.nombre}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{compra.cantidad_comprada} {compra.unidad_medida_compra}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{compra.costo_formateado}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{compra.fecha_formateada}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{compra.numero_factura}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {comprasFormateadas.map((compra) => (
                                    <div
                                        key={compra.id}
                                        className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border"
                                        style={{ backgroundColor: FONDO_COMPONENTES }}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Factura #{compra.numero_factura}
                                        </h3>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>
                                                <span className="font-medium">Ingrediente:</span>{" "}
                                                {compra.ingrediente.nombre}
                                            </p>
                                            <p>
                                                <span className="font-medium">Proveedor:</span>{" "}
                                                {compra.proveedor.nombre}
                                            </p>
                                            <p>
                                                <span className="font-medium">Cantidad:</span>{" "}
                                                {compra.cantidad_comprada} {compra.unidad_medida_compra}
                                            </p>
                                            <p>
                                                <span className="font-medium">Costo Total:</span>{" "}
                                                {compra.costo_formateado}
                                            </p>
                                            <p>
                                                <span className="font-medium">Fecha:</span>{" "}
                                                {compra.fecha_formateada}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
<ModalCompras
  isOpen={isModalOpen} 
  onClose={handleCloseModal} 
  title="Registrar Factura"
  className="max-w-4xl" 
>
    <FormularioFactura onClose={handleCloseModal} />
</ModalCompras>
        </div>
    );
};

export default ComprasPage;