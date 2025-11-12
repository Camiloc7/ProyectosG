"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Utensils, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuthStore } from "@/stores/authStore";
import { ICategoria, useCategoriasStore } from "@/stores/categoriasStore";
import { FONDO, ORANGE } from "@/styles/colors";
import BotonRestaurante from "@/components/ui/Boton";
import { useConfirm } from "@/components/feedback/confirmModal";
import InputField from "@/components/ui/InputField";
import InputImagen from "@/components/ui/InputImagen";
import { useSubidaDeImagenes } from "@/stores/subidaDeImagenes";
import Spinner from "@/components/feedback/Spinner";

export default function AdminCategoriaManagementPage() {
  const confirm = useConfirm();

  const router = useRouter();
  const { subirImagen } = useSubidaDeImagenes();
  const { user } = useAuthStore();
  const establecimientoId = user?.establecimiento_id;

  const {
    categorias,
    loading: categoriasLoading,
    error,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  } = useCategoriasStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [imagen_url, setUrlImagen] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<ICategoria | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [image, setImagen] = useState<File | null>(null);

  const loadCategoriasData = useCallback(async () => {
    await fetchCategorias();
  }, [fetchCategorias]);

  //Se oculta el scroll si esta habilitado el form
  useEffect(() => {
    document.body.style.overflow = modalVisible ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalVisible]);

  useEffect(() => {
    if (establecimientoId) {
      loadCategoriasData();
    } else if (!establecimientoId) {
      toast.error(
        "No se pudo obtener el ID del establecimiento para cargar las categorías."
      );
    }
  }, [establecimientoId, loadCategoriasData]);
  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setIsEditing(false);
  };
  const handleOpenModal = (categoria?: ICategoria) => {
    if (categoria) {
      setIsEditing(true);
      setCategoriaSeleccionada(categoria);
      setUrlImagen(categoria.imagen_url || "");
      setNombre(categoria.nombre);
      setDescripcion(categoria.descripcion || "");
    } else {
      resetForm();
    }
    setModalVisible(true);
  };
  const categoriasFiltradas = useMemo(() => {
    if (!categorias) return [];
    return categorias.filter((categ) => {
      const nombre = categ.nombre?.toLowerCase() || "";
      const descripcion = categ.descripcion?.toLowerCase() || "";
      const termino = search.toLowerCase();

      return nombre.includes(termino) || descripcion.includes(termino);
    });
  }, [categorias, search]);

  const handleSaveCategoria = async () => {
    if (!nombre) {
      toast.error("Por favor, completa el nombre de la categoría.");
      return;
    }

    let imagenUrlFinal = categoriaSeleccionada?.imagen_url;

    if (image) {
      const url = await subirImagen(image);
      if (url) {
        imagenUrlFinal = url;
      } else {
        toast.error("Error al subir la imagen. No se guardará la categoría.");
        return;
      }
    }

    const categoriaData: ICategoria = {
      nombre,
      descripcion: descripcion,
      imagen_url: imagenUrlFinal,
    };

    try {
      if (isEditing && categoriaSeleccionada?.id) {
        await updateCategoria(categoriaSeleccionada.id, categoriaData);
      } else {
        await createCategoria(categoriaData);
      }

      resetForm();
      setModalVisible(false);
    } catch (error: any) {
      toast.error("Error al guardar la categoría");
      console.error("Error al guardar:", error);
    }
  };

  const handleDeleteCategoria = async (categoriaId: string | undefined) => {
    if (!categoriaId) {
      toast.error("No hay id");
      return;
    }

    const confirmado = await confirm({
      title: "¿Estás seguro de que deseas eliminar esta categoría?",
      description:
        " Esta acción no se puede deshacer y afectará los productos relacionados.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (confirmado) {
      deleteCategoria(categoriaId);
    }
  };
  if (!user) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: FONDO }}
      >
        <Loader2 size={50} className="animate-spin" style={{ color: ORANGE }} />
        <p className="mt-4 text-lg text-gray-700">Cargando autenticación...</p>
      </div>
    );
  }
  if (categoriasLoading && categorias.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: FONDO }}
      >
        <Loader2 size={50} className="animate-spin" style={{ color: ORANGE }} />
        <p className="mt-4 text-lg text-gray-700">Cargando categorías...</p>
      </div>
    );
  }
  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Categorías
        </h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <BotonRestaurante
            onClick={() => handleOpenModal()}
            label="Nueva Categoría"
          />
        </div>
      </div>

      <p className="text-lg text-gray-600 mb-8 px-2 text-center max-w-2xl mx-auto">
        Organiza tus productos en categorías claras y concisas para una mejor
        gestión del menú.
      </p>

      {categoriasFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">
          No se encontraron empleados.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriasFiltradas.map((categ) => (
            <div
              key={categ.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
            >
              {/* Imagen o ícono */}
              <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-t">
                {categ.imagen_url ? (
                  <img
                    src={categ.imagen_url}
                    alt={categ.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Utensils className="w-10 h-10 text-gray-400" />
                )}
              </div>

              {/* Contenido de la card */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xl font-semibold text-gray-700">
                    {categ.nombre}
                  </p>
                  {categ.descripcion && (
                    <p className="text-sm text-gray-500 mt-2">
                      {categ.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex justify-end mt-4 gap-3">
                  <BotonRestaurante
                    label="Editar"
                    variacion="claro"
                    onClick={() => {
                      handleOpenModal(categ);
                    }}
                  />
                  <BotonRestaurante
                    label="Eliminar"
                    onClick={() => handleDeleteCategoria(categ.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* FORM DE CATEGORIAS */}
      {modalVisible && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
          onClick={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              {isEditing ? "Editar Categoría" : "Crear Categoría"}
            </h2>

            <div className="space-y-5">
              <InputField
                label="Nombre de Categoría"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <InputField
                label="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              <InputImagen
                setArchivo={(value) => {
                  setImagen(value);
                }}
              />
            </div>

            <footer className="flex justify-end space-x-3 mt-6">
              <BotonRestaurante
                label="Cancelar"
                variacion="claro"
                onClick={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              />
              <BotonRestaurante
                type="submit"
                onClick={handleSaveCategoria}
                label={isEditing ? "Actualizar" : "Crear"}
              />
            </footer>
          </div>
          {categoriasLoading && <Spinner />}
        </div>
      )}
    </div>
  );
}
