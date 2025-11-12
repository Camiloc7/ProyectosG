"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import FormIngredientes from "@/features/ingredientes/FormIngredientes";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import {
  Edit,
  Table,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"; // 🟢 NUEVO
import Spinner from "@/components/feedback/Spinner";
import ExcelUploaderModal from "@/components/modals/ExcelUploaderModal";
import { useDatosExtraStore } from "@/stores/datosExtraStore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Ingrediente {
  id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

// utils/numberFormatter.ts
const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(2).replace(/\.?0+$/, "");
};

export default function Ingredientes() {
  const confirm = useConfirm();
  const {
    traerIngredientes,
    ingredientes,
    eliminarIngrediente,
    subirExcel,
    actualizarIngrediente,
    loading,
  } = useIngredientesStore();
  const { unidadesDeMedida, fetchUnidadesDeMedida } = useDatosExtraStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Editable
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field:
      | "stock_actual"
      | "stock_minimo"
      | "costo_unitario"
      | "nombre"
      | "unidad_medida";
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // 🟢 NUEVO: Estado de ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ingrediente;
    direction: "asc" | "desc" | null;
  }>({ key: "nombre", direction: null });

  // 🟢 NUEVO: Alternar orden
  const handleSort = (key: keyof Ingrediente) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const handleSaveCell = (id: string, field: string) => {
    const ingrediente = ingredientes.find((i) => i.id === id);
    if (!ingrediente) return;

    let updatedIngrediente: any;
    if (field === "nombre" || field === "unidad_medida") {
      updatedIngrediente = { id, [field]: editingValue };
    } else {
      const valueNum = Number(editingValue);
      if (isNaN(valueNum)) return;
      updatedIngrediente = { id, [field]: valueNum };
    }

    actualizarIngrediente(updatedIngrediente);
    setEditingCell(null);
    setEditingValue("");
  };

  useEffect(() => {
    traerIngredientes();
    fetchUnidadesDeMedida();
  }, []);

  const exportExcel = () => {
    // Tomamos todos los ingredientes filtrados (sin paginar)
    const data = ingredientesFiltrados.map((ingr) => ({
      Nombre: ingr.nombre,
      Unidad: ingr.unidad_medida,
      "Stock Actual": ingr.stock_actual,
      "Stock Mínimo": ingr.stock_minimo,
      "Costo Unitario": ingr.costo_unitario,
    }));

    // Crear hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ingredientes");

    // Convertir a binario y descargar
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "ingredientes.xlsx");
  };

  // 🟢 Modificado: filtrado + ordenamiento
  const ingredientesFiltrados = useMemo(() => {
    if (!ingredientes) return [];
    let filtrados = ingredientes.filter((ingr: Ingrediente) => {
      const query = search.toLowerCase();
      return (
        ingr.nombre.toLowerCase().includes(query) ||
        ingr.unidad_medida.toLowerCase().includes(query)
      );
    });

    // Aplicar orden si hay configuración
    if (sortConfig.direction) {
      filtrados = [...filtrados].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtrados;
  }, [ingredientes, search, sortConfig]);

  const totalPages = Math.ceil(ingredientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const ingredientesPaginados = ingredientesFiltrados.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCloseForm = () => setModalVisible(false);

  const handleDeleteIngrediente = async (ingredienteID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Ingrediente?",
      description: "Esta acción no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (confirmado) eliminarIngrediente(ingredienteID);
  };

  const handleUploadExcel = async (file: File) => subirExcel(file);

  const selectedIngrediente = selectedId
    ? ingredientes.find((ingr) => ingr.id === selectedId)
    : undefined;

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
              setCurrentPage(1);
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
          <BotonRestaurante
            onClick={exportExcel}
            label="Exportar Excel"
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
                  {[
                    { key: "nombre", label: "Nombre" },
                    { key: "unidad_medida", label: "Unidad" },
                    { key: "stock_actual", label: "Stock Actual" },
                    { key: "stock_minimo", label: "Stock Mínimo" },
                    { key: "costo_unitario", label: "Costo Unitario" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as keyof Ingrediente)}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-center gap-1">
                        {col.label}
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === "asc" ? (
                            <ArrowUp size={14} />
                          ) : sortConfig.direction === "desc" ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {ingredientesPaginados.map((ingr: Ingrediente) => (
                  <tr
                    key={ingr.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    {/* NOMBRE */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center border-gray-200 w-[35%]">
                      {editingCell?.id === ingr.id &&
                      editingCell?.field === "nombre" ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            if (editingValue !== ingr.nombre)
                              handleSaveCell(ingr.id, "nombre");
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(ingr.id, "nombre");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-center border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({ id: ingr.id, field: "nombre" });
                            setEditingValue(ingr.nombre);
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                        >
                          {ingr.nombre}
                        </span>
                      )}
                    </td>

                    {/* UNIDAD */}
                    <td className="px-6 py-4 text-sm text-gray-600 text-center border-gray-200">
                      {editingCell?.id === ingr.id &&
                      editingCell?.field === "unidad_medida" ? (
                        <select
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            if (editingValue !== ingr.unidad_medida)
                              handleSaveCell(ingr.id, "unidad_medida");
                            setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full text-center border rounded px-2 py-1"
                        >
                          <option value="">Selecciona...</option>
                          {unidadesDeMedida.map((unidad) => (
                            <option key={unidad.id} value={unidad.id}>
                              {unidad.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: ingr.id,
                              field: "unidad_medida",
                            });
                            setEditingValue(ingr.unidad_medida);
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                        >
                          {ingr.unidad_medida}
                        </span>
                      )}
                    </td>

                    {/* STOCK ACTUAL */}
                    <td className="py-4 text-sm text-gray-600 text-right border-gray-200 w-60">
                      {editingCell?.id === ingr.id &&
                      editingCell?.field === "stock_actual" ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveCell(ingr.id, "stock_actual")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(ingr.id, "stock_actual");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-right border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: ingr.id,
                              field: "stock_actual",
                            });
                            setEditingValue(String(ingr.stock_actual));
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-right"
                        >
                          {formatNumber(ingr.stock_actual)}
                        </span>
                      )}
                    </td>

                    {/* STOCK MINIMO */}
                    <td className="px-6 py-4 text-sm text-gray-600 text-right border-gray-200 w-60">
                      {editingCell?.id === ingr.id &&
                      editingCell?.field === "stock_minimo" ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveCell(ingr.id, "stock_minimo")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(ingr.id, "stock_minimo");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-right border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: ingr.id,
                              field: "stock_minimo",
                            });
                            setEditingValue(String(ingr.stock_minimo));
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-right"
                        >
                          {formatNumber(ingr.stock_minimo)}
                        </span>
                      )}
                    </td>

                    {/* COSTO UNITARIO */}
                    <td className="px-6 py-4 text-sm text-gray-600 text-right border-gray-200 w-60">
                      {editingCell?.id === ingr.id &&
                      editingCell?.field === "costo_unitario" ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() =>
                            handleSaveCell(ingr.id, "costo_unitario")
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(ingr.id, "costo_unitario");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-right border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: ingr.id,
                              field: "costo_unitario",
                            });
                            setEditingValue(String(ingr.costo_unitario));
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-right"
                        >
                          {formatNumber(ingr.costo_unitario)}
                        </span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-sm text-right space-x-2 w-60">
                      <button
                        onClick={() => {
                          setSelectedId(ingr.id);
                          setModalVisible(true);
                        }}
                        className="p-2 rounded-full text-sm font-medium border"
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
                        className="p-2 rounded-full text-sm font-semibold text-white"
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

          {/* PAGINACIÓN */}
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

      <FormIngredientes
        isOpen={modalVisible}
        onClose={handleCloseForm}
        ingrediente={selectedIngrediente}
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
