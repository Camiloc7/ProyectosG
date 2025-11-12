"use client";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import FormProducto from "@/features/Menu/FormProducto";
import { Producto, useProductosStore } from "@/stores/productosStore";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import ExcelUploaderModal from "@/components/modals/ExcelUploaderModal";
import { useCategoriasStore } from "@/stores/categoriasStore";
import SimpleSelect from "@/components/ui/SimpleSelect";
import SelectConSearch from "@/components/ui/SelectConSearch";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const { categoriasNames, fetchCategoriasNames } = useCategoriasStore();
  const [progreso, setProgreso] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [exportando, setExportando] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("Todas");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [producto, setProducto] = useState<Producto | null>(null);

  // Modal Excel
  const [excelModalVisible, setExcelModalVisible] = useState(false);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const productosPorPagina = 6;

  useEffect(() => {
    traerProductos();
    fetchCategoriasNames();
  }, []);

  // Filtrado por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    if (!productos) return [];

    return productos.filter((p) => {
      const matchesSearch = p.nombre
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategoria =
        categoriaSeleccionada === "Todas" ||
        p.categoria === categoriaSeleccionada;
      return matchesSearch && matchesCategoria;
    });
  }, [productos, search, categoriaSeleccionada]);

  // Paginación
  const totalPaginas = Math.ceil(
    productosFiltrados.length / productosPorPagina
  );
  const productosPaginados = productosFiltrados.slice(
    (pagina - 1) * productosPorPagina,
    pagina * productosPorPagina
  );

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setProducto(null);
  };

  const handleOpenNuevoProducto = () => {
    setProducto(null);
    setIsFormOpen(true);
  };

  const exportExcel = async () => {
    setExportando(true);
    const dataFinal: any[] = [];
    const cantidadTotal = productos.length;
    const tiempoEstimadoPorProducto = 1.2; // segundos promedio por producto (ajústalo)
    const tiempoTotalEstimado = cantidadTotal * tiempoEstimadoPorProducto;

    for (let i = 0; i < cantidadTotal; i++) {
      // for (let i = 0; i < 1; i++) {
      const prod = productos[i];

      const startTime = performance.now();

      const dataCompleta = await traerProductoPorID(prod.id, prod.tipo, false);
      let costoTotalReceta = 0;
      const ingredientes: string[] = [];

      if (dataCompleta?.receta && dataCompleta.receta.length > 0) {
        dataCompleta.receta.forEach((r: any) => {
          const ingr = r.ingrediente;
          const costoIngr = parseFloat(String(ingr.costo_unitario ?? "0"));
          const cantidad = parseFloat(String(r.cantidad_necesaria ?? "0"));
          const costoTotalIngr = costoIngr * cantidad;
          costoTotalReceta += costoTotalIngr;
          ingredientes.push(ingr.nombre);
        });
      }

      const precioVenta = parseFloat(String(dataCompleta?.precio ?? "0"));
      const ganancia = precioVenta - costoTotalReceta;

      const fila: any = {
        Nombre: dataCompleta?.nombre,
        Categoría: dataCompleta?.categoria?.nombre
          ? dataCompleta?.categoria?.nombre
          : "",
        "Precio de Venta": precioVenta,
        "Costo Total Receta": costoTotalReceta,
        "Ganancia por Producto": ganancia,
      };

      ingredientes.forEach((nombre, idx) => {
        fila[`Ingrediente ${idx + 1}`] = nombre;
      });

      dataFinal.push(fila);

      // Actualizar progreso y tiempo restante
      const progresoActual = ((i + 1) / cantidadTotal) * 100;
      const tiempoTranscurrido = (i + 1) * tiempoEstimadoPorProducto;
      const tiempoRest = tiempoTotalEstimado - tiempoTranscurrido;

      setProgreso(progresoActual);
      setTiempoRestante(Math.max(tiempoRest, 0));

      // Simulación realista de carga (puedes eliminar si tu función ya es lenta)
      const elapsed = performance.now() - startTime;
      const delay = Math.max(0, 1000 - elapsed);
      await new Promise((r) => setTimeout(r, delay));
    }
    // Generar Excel
    const worksheet = XLSX.utils.json_to_sheet(dataFinal);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "productos.xlsx");
    toast.success("Exel generado correctamente");
    setExportando(false);
    setProgreso(100);
    setTiempoRestante(0);
  };

  const handleDeleteProducto = async (productoId: string | undefined) => {
    if (!productoId) {
      toast.error("No hay id");
      return;
    }
    const confirmado = await confirm({
      title: "¿Estás seguro de que deseas eliminar este Producto?",
      description: "Esta acción no se puede deshacer.",
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
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center md:text-left">
          Productos
        </h1>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagina(1);
            }}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <SelectConSearch
            value={categoriaSeleccionada}
            onChange={(e) => {
              setCategoriaSeleccionada(e);
              setPagina(1);
            }}
            options={["Todas", ...categoriasNames]} // <-- agregamos "Todas"
          />

          <BotonRestaurante
            onClick={() => setExcelModalVisible(true)}
            label="Subir Excel"
            variacion="claro"
            className="w-full sm:w-auto"
          />

          <BotonRestaurante
            label="Nuevo Producto"
            onClick={handleOpenNuevoProducto}
            className="w-full sm:w-auto"
          />
          <BotonRestaurante
            onClick={() => exportExcel()}
            label="Exportar Excel"
            className="w-full sm:w-auto"
          />
        </div>
      </header>

      {productosPaginados.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">
          No se encontraron productos.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productosPaginados.map((prod) => (
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
                  <p className="text-sm font-medium text-green-600">
                    {`$ ${
                      prod.tipo === "configurable"
                        ? parseFloat(String(prod.precio_base ?? "0")).toString()
                        : parseFloat(String(prod.precio ?? "0")).toString()
                    }`}
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

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <BotonRestaurante
            label="Anterior"
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            disabled={pagina === 1}
            variacion={pagina === 1 ? "claro" : "default"}
          />

          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <BotonRestaurante
            label="Siguiente"
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
            disabled={pagina === totalPaginas}
            variacion={pagina === totalPaginas ? "claro" : "default"}
          />
        </div>
      )}

      {loading && <Spinner />}
      {exportando && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all">
          <div className="w-11/12 max-w-2xl bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-center mb-4 text-gray-800">
              Generando Excel...
            </h2>

            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
              <div
                className="bg-green-600 h-5 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>

            <p className="text-center text-gray-600 mt-3 text-sm">
              {progreso.toFixed(0)}% completado
              {tiempoRestante !== null &&
                ` — Tiempo restante estimado: ${tiempoRestante.toFixed(1)}s`}
            </p>
          </div>
        </div>
      )}

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
