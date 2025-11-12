"use client";

import React, { useState, useEffect, useMemo } from "react";
import { COLOR_INPUT_BG, FONDO, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import Lista from "@/components/ui/Lista";
import InputField from "@/components/ui/InputField";
import { IMesa, useMesasStore } from "@/stores/mesasStore";
import { useAuthStore } from "@/stores/authStore";
import { EstadoMesa, ESTADOS_MESA } from "@/types/models";

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

      {/* LISTA RESPONSIVA */}
      <div>
        {/* VERSIÓN TABLA (solo en md en adelante) */}
        <div className="hidden md:block overflow-x-auto">
          <Lista
            datos={paginatedMesas}
            columnas={[
              { header: "Número", accessor: "numero" },
              { header: "Capacidad", accessor: "capacidad" },
              { header: "Estado", accessor: "estado" },
            ]}
            onEdit={(item) => {
              setSelectedId(item.id);
              setModalVisible(true);
            }}
            onDelete={(item) => handleDelete(item.id)}
          />
        </div>

        {/* VERSIÓN CARDS (solo en móvil) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {paginatedMesas.map((mesa) => (
            <div
              key={mesa.id}
              className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mesa {mesa.numero}
                </h3>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    mesa.estado === "LIBRE"
                      ? "bg-green-100 text-green-700"
                      : mesa.estado === "OCUPADA"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {mesa.estado}
                </span>
              </div>

              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Capacidad:</span>{" "}
                {mesa.capacidad} personas
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedId(mesa.id);
                    setModalVisible(true);
                  }}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(mesa.id)}
                  className="text-red-600 text-sm font-medium hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center gap-2 mt-6 overflow-x-auto">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded-full text-sm shrink-0 ${
              currentPage === index + 1
                ? "bg-[#ed4e05] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* MODAL */}
      {modalVisible && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] px-4"
          onClick={handleCloseForm}
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
