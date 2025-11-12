"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import FormCuentas, { IFormCuentas } from "@/features/cuentas/FormCuentas";
import { useCuentasStore } from "@/stores/cuentaStore";
import { Edit, Trash2 } from "lucide-react";

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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    traerCuentas();
  }, []);

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Banco
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número de cuenta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Clave
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {cuenta.nombre_banco}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {cuenta.numero_cuenta}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {cuenta.tipo_cuenta}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {cuenta.codigo_puc}
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
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
