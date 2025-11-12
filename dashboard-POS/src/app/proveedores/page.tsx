"use client";

import React, { useState, useEffect, useMemo } from "react";
import { COLOR_ERROR, FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import { Edit, Table, Trash2 } from "lucide-react";
import Spinner from "@/components/feedback/Spinner";
import { useProveedoresStore } from "@/stores/proveedoresStore";
import { IProveedorForm } from "@/types/models";
import FormProveedores from "@/features/proveedores/FormProveedores";
import Lista from "@/components/ui/Lista";

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

  useEffect(() => {
    traerProveedores();
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    if (!proveedores) return [];
    return proveedores.filter((ingr) => {
      return ingr.nombre.toLowerCase().includes(search.toLowerCase());
    });
  }, [proveedores, search]);

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId("");
  };

  const handleDeleteProveedor = async (proveedorID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Proveedor?",
      description: "Esta accion no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) {
      eliminarProveedor(proveedorID);
    }
  };

  const handleGuardarProveedor = async (data: IProveedorForm) => {
    const isEditing = Boolean(data.id);
    if (isEditing) {
      actualizarProveedor(data);
    } else {
      crearProveedor(data);
    }
  };
  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Proveedores
        </h1>

        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <BotonRestaurante
            onClick={(e) => {
              e.stopPropagation();
              setModalVisible(true);
              setSelectedId("");
            }}
            label="Nuevo Proveedor"
          />
        </div>
      </div>

      <Lista
        datos={proveedoresFiltrados}
        columnas={[
          { header: "Nombre", accessor: "nombre" },
          { header: "Telefono", accessor: "telefono" },
          { header: "Email", accessor: "email" },
          { header: "Contacto", accessor: "contacto" },
        ]}
        onEdit={(item) => {
          setSelectedId(item.id);
          setModalVisible(true);
        }}
        onDelete={(item) => handleDeleteProveedor(item.id)}
        mensajeVacio={{
          titulo: "No hay proveedores registrados.",
          subtitulo: "¡Añade los proveedores de tu restaurante!",
        }}
      />
      <FormProveedores
        isOpen={modalVisible}
        onClose={handleCloseForm}
        onSave={(data) => {
          handleGuardarProveedor(data);
        }}
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
