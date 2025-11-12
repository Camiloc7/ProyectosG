"use client";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import ImportarArchivos from "@/components/ui/ImportarArchivo";
import FormProducto, { IFormProducto } from "@/features/Menu/FormProducto";
import { limpiarDecimalesCero } from "@/helpers/limpiarDecimales";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientosStore } from "@/stores/establecimientosStore";
import { Producto, useProductosStore } from "@/stores/productosStore";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import ExcelUploaderModal from "@/components/modals/ExcelUploaderModal";

export default function Menu() {
  const confirm = useConfirm();
  const {
    traerProductos,
    productos,
    eliminarProducto,
    traerProductoPorID,
    subirExcel,
    loading,
  } = useProductosStore();

  const [search, setSearch] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [producto, setProducto] = useState<Producto | null>(null);

  // ✅ Nuevo estado para el modal de Excel
  const [excelModalVisible, setExcelModalVisible] = useState(false);

  useEffect(() => {
    traerProductos();
  }, []);

  const productosFiltrados = useMemo(() => {
    if (!productos) return [];
    return productos.filter((emp) => {
      return emp.nombre.toLowerCase().includes(search.toLowerCase());
    });
  }, [productos, search]);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setProducto(null);
  };

  const handleOpenNuevoProducto = () => {
    setProducto(null);
    setIsFormOpen(true);
  };

  const handleDeleteProducto = async (productoId: string | undefined) => {
    if (!productoId) {
      toast.error("No hay id");
      return;
    }
    const confirmado = await confirm({
      title: "¿Estás seguro de que deseas eliminar este Producto?",
      description: " Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (confirmado) {
      eliminarProducto(productoId);
    }
  };

  const openProductByID = async (prod: Producto) => {
    const productoCompleto = await traerProductoPorID(prod.id, prod.tipo);
    if (productoCompleto) {
      setProducto(productoCompleto);
      setIsFormOpen(true);
    } else {
      toast.error("No se pudo cargar la informacion del producto");
    }
  };

  const handleUploadExcel = async (file: File) => {
    return subirExcel(file);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Productos
        </h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar productos..."
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
            label="Nuevo Producto"
            onClick={handleOpenNuevoProducto}
          />
          {/* <ImportarArchivos
            labelBoton="Importar"
            message="Selecciona un archivo Exel o SVG para importar productos"
            onSave={(file) => {
              toast.error("Funcion en desarrollo");
              console.log("Archivo importado:", file);
            }}
          /> */}
        </div>
      </header>
      {productosFiltrados.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">
          No se encontraron productos.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productosFiltrados.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden flex flex-col"
              onClick={(e) => {
                e.stopPropagation();
                openProductByID(prod);
              }}
            >
              {prod.imagen_url && (
                <img
                  src={prod.imagen_url}
                  alt={prod.nombre}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {prod.nombre}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {prod.descripcion}
                  </p>
                                                     {" "}
                  <p className="text-sm font-medium text-green-600">
                                       {" "}
                    {`$ ${
                      prod.tipo === "configurable"
                        ? parseFloat(String(prod.precio_base ?? "0")).toString()
                        : parseFloat(String(prod.precio ?? "0")).toString()
                    }`}
                                     {" "}
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    {prod.categoria || "Sin categoría"}
                  </p>
                </div>
                <div className="flex justify-end mt-4 gap-4">
                  <BotonRestaurante
                    label="Editar"
                    variacion="claro"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProductByID(prod);
                    }}
                  />
                  <BotonRestaurante
                    label="Eliminar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProducto(prod.id);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && <Spinner />}

      <FormProducto
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        producto={producto}
      />
      <ExcelUploaderModal
        isOpen={excelModalVisible}
        onClose={() => setExcelModalVisible(false)}
        onUpload={handleUploadExcel}
        loading={loading}
        title="Importar Productos desde Excel"
        description="Sube un archivo de Excel para agregar o actualizar tus productos y sus recetas de forma masiva. Asegúrate de usar la plantilla correcta."
        templatePath="/plantilla_productos.xlsx"
      />
    </div>
  );
}
