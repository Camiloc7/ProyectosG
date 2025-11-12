"use client";

import React, { useState, useEffect, useMemo } from "react";
import { COLOR_ERROR, FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import FormIngredientes, {
  IIngredientesFormData,
} from "@/features/ingredientes/FormIngredientes";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import { Edit, Table, Trash2, Upload } from "lucide-react";
import Spinner from "@/components/feedback/Spinner";
import ExcelUploaderModal from "@/components/modals/ExcelUploaderModal";
interface Ingrediente {
  id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

export default function Ingredientes() {
  const confirm = useConfirm();
  const {
    traerIngredientes,
    ingredientes,
    eliminarIngrediente,
    subirExcel,
    loading,
  } = useIngredientesStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    traerIngredientes();
  }, []);

  const ingredientesFiltrados = useMemo(() => {
    if (!ingredientes) return [];
    return ingredientes.filter((ingr: Ingrediente) => {
      const full = `${ingr.nombre}`.toLowerCase();
      const query = search.toLowerCase();
      return (
        full.includes(query) ||
        ingr.nombre.toLowerCase().includes(query) ||
        ingr.unidad_medida.toLowerCase().includes(query)
      );
    });
  }, [ingredientes, search]);

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleDeleteIngrediente = async (ingredienteID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Ingrediente?",
      description: "Esta accion no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) {
      eliminarIngrediente(ingredienteID);
    }
  };

  const handleUploadExcel = async (file: File) => {
    return subirExcel(file);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Ingredientes
        </h1>

        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar ingredientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <BotonRestaurante
            onClick={() => setExcelModalVisible(true)}
            label="Subir Excel"
            variacion="claro"
          />
          <BotonRestaurante
            onClick={(e) => {
              e.stopPropagation();
              setModalVisible(true);
              setSelectedId(null);
            }}
            label="Nuevo Ingrediente"
          />
        </div>
      </div>

      {(ingredientes?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <Table size={60} className="mb-4" />
          <p className="text-xl font-medium">
            No hay ingredientes registrados.
          </p>
          <p className="text-md mt-2">
            ¡Añade los ingredientes de tu restaurante!
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-lg shadow-md border border-gray-100 mb-8"
          style={{ backgroundColor: FONDO_COMPONENTES }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead
              className="bg-gray-50"
              style={{ backgroundColor: FONDO_COMPONENTES }}
            >
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidad de medida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Minimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredientesFiltrados.map((ingr: Ingrediente) => (
                <tr
                  key={ingr.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ingr.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ingr.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ingr.stock_actual}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ingr.stock_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ingr.costo_unitario}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedId(ingr.id);
                        setModalVisible(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border"
                      style={{
                        backgroundColor: FONDO,
                        color: ORANGE,
                        borderColor: ORANGE,
                      }}
                      title="Editar ingrediente"
                    >
                      <Edit size={16} className="opacity-90" />
                    </button>

                    <button
                      onClick={() => handleDeleteIngrediente(ingr.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{
                        backgroundColor: ORANGE,
                        boxShadow: "0 2px 6px rgba(245, 101, 101, 0.25)",
                      }}
                      title="Eliminar ingrediente"
                    >
                      <Trash2 size={16} className="opacity-90" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormIngredientes
        isOpen={modalVisible}
        onClose={handleCloseForm}
        // onSave={handleGuardarIngrediente}
        ingrediente={
          selectedId
            ? ingredientes.find((ingr) => ingr.id === selectedId)
            : undefined
        }
      />
      <ExcelUploaderModal
        isOpen={excelModalVisible}
        onClose={() => setExcelModalVisible(false)}
        onUpload={handleUploadExcel}
        loading={loading}
        title="Importar Ingredientes desde Excel"
        description="Sube un archivo de Excel para agregar o actualizar tus ingredientes de forma masiva. Asegúrate de usar la plantilla correcta para evitar errores."
        templatePath="/plantilla_ingredientes.xlsx"
      />

      {loading && <Spinner />}
    </div>
  );
}
