"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import FormIngredientes from "@/features/ingredientes/FormIngredientes";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import { Edit, Table, Trash2 } from "lucide-react";
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 🔹 Cantidad de ingredientes por página

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

  // 🔹 Ingredientes con paginación aplicada
  const totalPages = Math.ceil(ingredientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const ingredientesPaginados = ingredientesFiltrados.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleDeleteIngrediente = async (ingredienteID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Ingrediente?",
      description: "Esta acción no se puede deshacer",
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
          Gestión de Ingredientes
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar ingredientes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // resetear página al buscar
            }}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <BotonRestaurante
            onClick={() => setExcelModalVisible(true)}
            label="Subir Excel"
            variacion="claro"
            className="w-full sm:w-auto"
          />

          <BotonRestaurante
            onClick={(e) => {
              e.stopPropagation();
              setModalVisible(true);
              setSelectedId(null);
            }}
            label="Nuevo Ingrediente"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Lista */}
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
        <div className="mb-8">
          {/* TABLA (escritorio) */}
          <div
            className="hidden md:block overflow-x-auto rounded-lg shadow-md border border-gray-100"
            style={{ backgroundColor: FONDO_COMPONENTES }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead
                className="bg-gray-50"
                style={{ backgroundColor: FONDO_COMPONENTES }}
              >
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Costo Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredientesPaginados.map((ingr: Ingrediente) => (
                  <tr
                    key={ingr.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {ingr.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ingr.unidad_medida}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ingr.stock_actual}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ingr.stock_minimo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ingr.costo_unitario}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedId(ingr.id);
                          setModalVisible(true);
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium border"
                        style={{
                          backgroundColor: FONDO,
                          color: ORANGE,
                          borderColor: ORANGE,
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteIngrediente(ingr.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ backgroundColor: ORANGE }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS (móvil) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {ingredientesPaginados.map((ingr: Ingrediente) => (
              <div
                key={ingr.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {ingr.nombre}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Unidad:</span>{" "}
                    {ingr.unidad_medida}
                  </p>
                  <p>
                    <span className="font-medium">Stock actual:</span>{" "}
                    {ingr.stock_actual}
                  </p>
                  <p>
                    <span className="font-medium">Stock mínimo:</span>{" "}
                    {ingr.stock_minimo}
                  </p>
                  <p>
                    <span className="font-medium">Costo unitario:</span>{" "}
                    {ingr.costo_unitario}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedId(ingr.id);
                      setModalVisible(true);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium border"
                    style={{
                      backgroundColor: FONDO,
                      color: ORANGE,
                      borderColor: ORANGE,
                    }}
                  >
                    <Edit size={16} /> Editar
                  </button>

                  <button
                    onClick={() => handleDeleteIngrediente(ingr.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: ORANGE }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <BotonRestaurante
                label="Anterior"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              />

              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <BotonRestaurante
                label="Siguiente"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                variacion={currentPage === totalPages ? "claro" : "default"}
              />
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <FormIngredientes
        isOpen={modalVisible}
        onClose={handleCloseForm}
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
        description="Sube un archivo de Excel para agregar o actualizar tus ingredientes de forma masiva."
        templatePath="/plantilla_ingredientes.xlsx"
      />

      {loading && <Spinner />}
    </div>
  );
}
