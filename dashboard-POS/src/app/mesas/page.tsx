"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  COLOR_INPUT_BG,
  FONDO,
  FONDO_COMPONENTES,
  ORANGE,
} from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import Lista from "@/components/ui/Lista";
import InputField from "@/components/ui/InputField";
import { IMesa, useMesasStore } from "@/stores/mesasStore";
import { useAuthStore } from "@/stores/authStore";
import { EstadoMesa, ESTADOS_MESA } from "@/types/models";
import { Edit, Table, Trash2 } from "lucide-react";

export default function Mesas() {
  const confirm = useConfirm();
  const { fetchMesas, mesas, deleteMesa, loading, updateMesa, createMesa } =
    useMesasStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [estado, setEstado] = useState<EstadoMesa>(EstadoMesa.LIBRE);

  const { user } = useAuthStore();
  const establecimientoId = user?.establecimiento_id;
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "numero" | "capacidad" | "estado";
  } | null>(null);

  const [editingValue, setEditingValue] = useState<string>("");

  // Función para guardar el cambio
  const handleSaveCell = (
    id: string,
    field: "numero" | "capacidad" | "estado"
  ) => {
    const mesa = mesas.find((i) => i.id === id);
    if (!mesa) return;

    let mesaActualizada: Partial<IMesa> & { id: string };

    if (field === "estado") {
      mesaActualizada = { id, estado: editingValue as EstadoMesa };
    } else if (field === "numero") {
      if (editingValue === "") {
        return;
      }
      mesaActualizada = { id, [field]: editingValue };
    } else {
      const valueNum = Number(editingValue);
      if (isNaN(valueNum)) return;
      mesaActualizada = { id, [field]: valueNum };
    }

    updateMesa(mesaActualizada); // ✅ Ahora sí llama al store
    setEditingCell(null);
    setEditingValue("");
  };

  useEffect(() => {
    fetchMesas();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const mesa = mesas.find((m) => m.id === selectedId);
      if (mesa) {
        setNumero(mesa.numero.toString());
        setCapacidad(mesa.capacidad.toString());
        setEstado(mesa.estado);
      }
    } else {
      resetForm();
    }
  }, [selectedId]);

  const mesasFiltradas = useMemo(() => {
    if (!mesas) return [];
    return mesas.filter((mesa) => {
      return (
        String(mesa.numero.toLowerCase()).includes(search.toLowerCase()) ||
        String(mesa.capacidad).includes(search.toLowerCase())
      );
    });
  }, [mesas, search]);

  const totalPages = Math.ceil(mesasFiltradas.length / itemsPerPage);
  const paginatedMesas = mesasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (mesaID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Mesa?",
      description: "Esta acción no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) {
      deleteMesa(mesaID);
    }
  };

  const handleSave = () => {
    if (!establecimientoId) return;
    const mesa: IMesa = {
      establecimiento_id: establecimientoId,
      id: selectedId,
      numero: numero,
      capacidad: Number(capacidad),
      estado,
    };

    if (selectedId) {
      updateMesa(mesa);
    } else {
      createMesa(mesa);
    }

    handleCloseForm();
  };

  const resetForm = () => {
    setNumero("");
    setCapacidad("");
    setEstado(EstadoMesa.LIBRE);
  };

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId("");
    resetForm();
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
          Gestión de Mesas
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar mesas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <BotonRestaurante
            onClick={() => {
              setModalVisible(true);
              setSelectedId("");
            }}
            label="Nueva Mesa"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Lista */}
      {(mesas?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <Table size={60} className="mb-4" />
          <p className="text-xl font-medium">
            No hay mesaedientes registrados.
          </p>
          <p className="text-md mt-2">
            ¡Añade los mesaedientes de tu restaurante!
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase ">
                    Número
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado{" "}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedMesas.map((mesa: IMesa) => (
                  <tr
                    key={mesa.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-center  border-gray-200 w-[35%]">
                      {editingCell?.id === mesa.id &&
                      editingCell?.field === "numero" ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            if (editingValue !== mesa.numero)
                              handleSaveCell(mesa.id, "numero");
                            setEditingCell(null);
                            setEditingValue("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(mesa.id, "numero");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-center border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({ id: mesa.id, field: "numero" });
                            setEditingValue(mesa.numero);
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                        >
                          {mesa.numero}
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-sm text-gray-600 text-right  border-gray-200 w-60">
                      {editingCell?.id === mesa.id &&
                      editingCell?.field === "capacidad" ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            if (editingValue !== String(mesa.capacidad))
                              handleSaveCell(mesa.id, "capacidad");
                            setEditingCell(null);
                            setEditingValue("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCell(mesa.id, "capacidad");
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full text-right border rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: mesa.id,
                              field: "capacidad",
                            });
                            setEditingValue(String(mesa.capacidad));
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-right"
                        >
                          {mesa.capacidad}
                        </span>
                      )}
                    </td>

                    {/* Unidad de medida editable */}
                    <td className="px-6 py-4 text-sm text-gray-600 text-center  border-gray-200">
                      {editingCell?.id === mesa.id &&
                      editingCell?.field === "estado" ? (
                        <>
                          <select
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => {
                              if (editingValue !== mesa.estado)
                                handleSaveCell(mesa.id, "estado");
                              setEditingCell(null);
                              setEditingValue("");
                            }}
                            autoFocus
                            className="w-full text-center border rounded px-2 py-1"
                          >
                            <option value="">Selecciona...</option>
                            {ESTADOS_MESA.map((estado) => (
                              <option key={estado} value={estado}>
                                {estado.charAt(0).toUpperCase() +
                                  estado.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingCell({
                              id: mesa.id,
                              field: "estado",
                            });
                            setEditingValue(mesa.estado);
                          }}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 inline-block w-full text-center"
                        >
                          {mesa.estado}
                        </span>
                      )}
                    </td>

                    {/* Botones de acción */}
                    <td className="px-6 py-4 text-sm text-right space-x-2 w-60">
                      <button
                        onClick={() => {
                          setSelectedId(mesa.id);
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
                        onClick={() => handleDelete(mesa.id)}
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
            {paginatedMesas.map((mesa: IMesa) => (
              <div
                key={mesa.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {mesa.numero}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Capacidad:</span>{" "}
                    {mesa.capacidad}
                  </p>
                  <p>
                    <span className="font-medium">Estado:</span> {mesa.estado}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedId(mesa.id);
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
                    onClick={() => handleDelete(mesa.id)}
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

              <span className="text-sm text-gray-700">
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

      {/* MODAL */}
      {modalVisible && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] px-4"
          onClick={() => {
            setModalVisible(false);
            setSelectedId("");
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6 text-center">
              {selectedId ? "Editar Mesa" : "Crear Mesa"}
            </h2>

            <div className="space-y-5">
              <InputField
                label="Número de Mesa"
                name="numero"
                placeholder="Ej. 5"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <InputField
                label="Capacidad (personas)"
                name="capacidad"
                type="number"
                placeholder="Ej. 4"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
              />

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Estado:
                </label>
                <div
                  className="relative border rounded-xl overflow-hidden"
                  style={{
                    borderColor: ORANGE,
                    backgroundColor: COLOR_INPUT_BG,
                  }}
                >
                  <select
                    className="block appearance-none w-full bg-transparent border-none px-4 py-2 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-0 text-gray-900"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoMesa)}
                  >
                    {ESTADOS_MESA.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado.charAt(0).toUpperCase() +
                          estado.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <BotonRestaurante
                  label="Cancelar"
                  variacion="claro"
                  onClick={handleCloseForm}
                  className="w-full sm:w-auto"
                />
                <BotonRestaurante
                  onClick={handleSave}
                  label={selectedId ? "Guardar" : "Crear"}
                  className="w-full sm:w-auto"
                />
              </footer>
            </div>
          </div>
        </div>
      )}

      {loading && <Spinner />}
    </div>
  );
}
