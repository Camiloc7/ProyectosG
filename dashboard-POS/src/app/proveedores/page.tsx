"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useProveedoresStore } from "@/stores/proveedoresStore";
import { Edit, Trash2 } from "lucide-react";
import Spinner from "@/components/feedback/Spinner";
import FormProveedores from "@/features/proveedores/FormProveedores";

interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  contacto: string;
}

export default function Proveedores() {
  const confirm = useConfirm();
  const {
    traerProveedores,
    proveedores,
    eliminarProveedor,
    actualizarProveedor,
    crearProveedor,
    loading,
  } = useProveedoresStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    traerProveedores();
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    if (!proveedores) return [];
    return proveedores.filter((prov) =>
      prov.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [proveedores, search]);

  // Paginación aplicada
  const totalPages = Math.ceil(proveedoresFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const proveedoresPaginados = proveedoresFiltrados.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId("");
  };

  const handleDeleteProveedor = async (proveedorID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Proveedor?",
      description: "Esta acción no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (confirmado) eliminarProveedor(proveedorID);
  };

  const handleGuardarProveedor = async (data: any) => {
    const isEditing = Boolean(data.id);
    if (isEditing) actualizarProveedor(data);
    else crearProveedor(data);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
          Gestión de Proveedores
        </h1>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar proveedores..."
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
            label="Nuevo Proveedor"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Lista Proveedores */}
      {proveedoresFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <p className="text-xl font-medium">No hay proveedores registrados.</p>
          <p className="text-md mt-2">
            ¡Añade los proveedores de tu restaurante!
          </p>
        </div>
      ) : (
        <div className="mb-8">
          {/* Tabla escritorio */}
          <div
            className="hidden md:block overflow-x-auto rounded-lg shadow-md border border-gray-100"
            style={{ backgroundColor: FONDO_COMPONENTES }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proveedoresPaginados.map((prov: Proveedor) => (
                  <tr
                    key={prov.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {prov.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {prov.telefono}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {prov.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {prov.contacto}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedId(prov.id);
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
                        onClick={() => handleDeleteProveedor(prov.id)}
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
            {proveedoresPaginados.map((prov: Proveedor) => (
              <div
                key={prov.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {prov.nombre}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Teléfono:</span>{" "}
                    {prov.telefono}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {prov.email}
                  </p>
                  <p>
                    <span className="font-medium">Contacto:</span>{" "}
                    {prov.contacto}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedId(prov.id);
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
                    onClick={() => handleDeleteProveedor(prov.id)}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <FormProveedores
        isOpen={modalVisible}
        onClose={handleCloseForm}
        onSave={handleGuardarProveedor}
        proveedor={
          selectedId
            ? proveedores.find((prov) => prov.id === selectedId)
            : undefined
        }
      />

      {loading && <Spinner />}
    </div>
  );
}
