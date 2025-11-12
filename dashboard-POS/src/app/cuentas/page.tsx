"use client";

import React, { useState, useEffect, useMemo } from "react";
import { COLOR_ERROR, FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import FormIngredientes, {
  IIngredientesFormData,
} from "@/features/ingredientes/FormIngredientes";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import { Edit, Table, Trash2 } from "lucide-react";
import Spinner from "@/components/feedback/Spinner";
import FormCuentas, { IFormCuentas } from "@/features/cuentas/FormCuentas";
import { useCuentasStore } from "@/stores/cuentaStore";
import Lista from "@/components/ui/Lista";

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

  useEffect(() => {
    traerCuentas();
  }, []);

  const cuentasFiltradas = useMemo(() => {
    if (!cuentas) return [];
    return cuentas.filter((cuenta) => {
      return (
        String(cuenta.numero_cuenta.toLowerCase()).includes(
          search.toLowerCase()
        ) ||
        String(cuenta.codigo_puc).includes(search.toLowerCase()) ||
        String(cuenta.nombre_banco.toLowerCase()).includes(search.toLowerCase())
      );
    });
  }, [cuentas, search]);

  const handleCloseForm = () => {
    setModalVisible(false);
    setSelectedId("");
  };

  const handleDelete = async (cuentaID: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Cuenta?",
      description: "Esta accion no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) {
      eliminarCuenta(cuentaID);
    }
  };

  const handleSave = async (data: IFormCuentas) => {
    const isEditing = Boolean(data.id);
    if (isEditing) {
      actualizarCuenta(data);
    } else {
      crearCuenta(data);
    }
  };
  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Cuentas
        </h1>

        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar cuentas..."
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
            label="Nueva Cuenta"
          />
        </div>
      </div>

      <Lista
        datos={cuentasFiltradas}
        columnas={[
          { header: "Banco", accessor: "nombre_banco" },
          { header: "Numero de cuenta", accessor: "numero_cuenta" },
          { header: "Tipo de cuenta", accessor: "tipo_cuenta" },
          { header: "Clave", accessor: "codigo_puc" },
        ]}
        onEdit={(item) => {
          setSelectedId(item.id);
          setModalVisible(true);
        }}
        onDelete={(item) => handleDelete(item.id)}
      />
      <FormCuentas
        isOpen={modalVisible}
        onClose={handleCloseForm}
        onSave={(data: any) => {
          handleSave(data);
        }}
        cuenta={
          selectedId
            ? cuentas.find((item) => item.id === selectedId)
            : undefined
        }
      />
      {loading && <Spinner />}
    </div>
  );
}
