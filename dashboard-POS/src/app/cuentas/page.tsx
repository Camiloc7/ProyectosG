"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import FormCuentas, { IFormCuentas } from "@/features/cuentas/FormCuentas";
import { useCuentasStore } from "@/stores/cuentaStore";
import { Edit, Trash2 } from "lucide-react";

const tiposDeCuentas = [
  { id: "AHORRO", nombre: "Cuenta de Ahorro" },
  { id: "CORRIENTE", nombre: "Cuenta Corriente" },
];

export default function Cuentas() {
  const confirm = useConfirm();
  const {
    traerCuentas,
    cuentas,
    eliminarCuenta,
    loading,
    actualizarCuenta,
    crearCuenta,
  } = useCuentasStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "nombre_banco" | "numero_cuenta" | "email" | "tipo_cuenta";
  } | null>(null);

  const [editingValue, setEditingValue] = useState<string>("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    traerCuentas();
  }, []);

  const handleSaveCell = (id: string, field: string) => {
    const ingrediente = cuentas.find((i) => i.id === id);
    if (!ingrediente) return;

    let updateProveedor: any;

    updateProveedor = { id, [field]: editingValue };

    actualizarCuenta(updateProveedor);
    setEditingCell(null);
    setEditingValue("");
  };

  const cuentasFiltradas = useMemo(() => {
    if (!cuentas) return [];
    return cuentas.filter((cuenta) => {
      return (
        String(cuenta.numero_cuenta)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(cuenta.codigo_puc)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(cuenta.nombre_banco).toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [cuentas, search]);

  // Paginación aplicada
  const totalPages = Math.ceil(cuentasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const cuentasPaginadas = cuentasFiltradas.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId("");
  };

  const handleDelete = async (cuentaID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Cuenta?",
      description: "Esta acción no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) eliminarCuenta(cuentaID);
  };

  const handleSave = async (data: IFormCuentas) => {
    const isEditing = Boolean(data.id);
    if (isEditing) actualizarCuenta(data);
    else crearCuenta(data);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
          Gestión de Cuentas
        </h1>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar cuentas..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <BotonRestaurante
            onClick={() => {
              setModalVisible(true);
              setSelectedId("");
            }}
            label="Nueva Cuenta"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Tabla escritorio */}
      <div
        className="hidden md:block overflow-x-auto rounded-lg shadow-md border border-gray-100"
        style={{ backgroundColor: FONDO_COMPONENTES }}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Banco
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Número de cuenta
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Clave
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cuentasPaginadas.map((cuenta) => (
              <tr
                key={cuenta.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 text-sm text-gray-600 text-right  border-gray-200 w-[23%]">
                  {editingCell?.id === cuenta.id &&
                  editingCell?.field === "nombre_banco" ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => {
                        if (editingValue !== String(cuenta.nombre_banco))
                          handleSaveCell(cuenta.id, "nombre_banco");
                        setEditingCell(null);
                        setEditingValue("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleSaveCell(cuenta.id, "nombre_banco");
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      className="w-full text-center border rounded px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingCell({
                          id: cuenta.id,
                          field: "nombre_banco",
                        });
                        setEditingValue(String(cuenta.nombre_banco));
                      }}
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                    >
                      {cuenta.nombre_banco}
                    </span>
                  )}
                </td>
                <td className="py-4 text-sm text-gray-600 text-right  border-gray-200 w-[23%]">
                  {editingCell?.id === cuenta.id &&
                  editingCell?.field === "numero_cuenta" ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => {
                        if (editingValue !== String(cuenta.numero_cuenta))
                          handleSaveCell(cuenta.id, "numero_cuenta");
                        setEditingCell(null);
                        setEditingValue("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleSaveCell(cuenta.id, "numero_cuenta");
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      className="w-full text-center border rounded px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingCell({
                          id: cuenta.id,
                          field: "numero_cuenta",
                        });
                        setEditingValue(String(cuenta.numero_cuenta));
                      }}
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                    >
                      {cuenta.numero_cuenta}
                    </span>
                  )}
                </td>
                {/* Unidad de medida editable */}
                <td className="px-6 py-4 text-sm text-gray-600 text-center  border-gray-200 w-[23%]">
                  {editingCell?.id === cuenta.id &&
                  editingCell?.field === "tipo_cuenta" ? (
                    <>
                      <select
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => {
                          if (editingValue !== cuenta.tipo_cuenta)
                            handleSaveCell(cuenta.id, "tipo_cuenta");
                          setEditingCell(null);
                          setEditingValue("");
                        }}
                        autoFocus
                        className="w-full text-center border rounded px-2 py-1"
                      >
                        <option value="">Selecciona...</option>
                        {tiposDeCuentas.map((cuent) => (
                          <option key={cuent.id} value={cuent.id}>
                            {cuent.nombre}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span
                      onClick={() => {
                        setEditingCell({
                          id: cuenta.id,
                          field: "tipo_cuenta",
                        });
                        setEditingValue(cuenta.tipo_cuenta);
                      }}
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                    >
                      {cuenta.tipo_cuenta}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-center">
                  {cuenta.codigo_puc}
                </td>
                <td className="px-6 py-4 text-sm space-x-2 text-center w-40">
                  <button
                    onClick={() => {
                      setSelectedId(cuenta.id);
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
                    onClick={() => handleDelete(cuenta.id)}
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

      {/* Cards móvil */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {cuentasPaginadas.map((cuenta) => (
          <div
            key={cuenta.id}
            className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {cuenta.nombre_banco}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Número de cuenta:</span>{" "}
                {cuenta.numero_cuenta}
              </p>
              <p>
                <span className="font-medium">Tipo:</span> {cuenta.tipo_cuenta}
              </p>
              <p>
                <span className="font-medium">Clave:</span> {cuenta.codigo_puc}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedId(cuenta.id);
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
                onClick={() => handleDelete(cuenta.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: ORANGE }}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      <FormCuentas
        isOpen={modalVisible}
        onClose={handleCloseForm}
        onSave={handleSave}
        cuenta={
          selectedId ? cuentas.find((c) => c.id === selectedId) : undefined
        }
      />

      {loading && <Spinner />}
    </div>
  );
}
