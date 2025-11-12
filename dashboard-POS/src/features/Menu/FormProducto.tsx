"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, PlusCircle, MinusCircle, X } from "lucide-react";
import InputField from "@/components/ui/InputField";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import { useCategoriasStore } from "@/stores/categoriasStore";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import SimpleSelect from "@/components/ui/SimpleSelect";
import Checkbox from "@/components/ui/CheckBox";
import InputImagen from "@/components/ui/InputImagen";
import { useSubidaDeImagenes } from "@/stores/subidaDeImagenes";
import { Producto, useProductosStore } from "@/stores/productosStore";
import Spinner from "@/components/feedback/Spinner";

export type IReceta = {
  ingrediente_id: string;
  cantidad_necesaria: string;
};

export type IFormProductoSimple = {
  id?: string;
  categoria_id: string;
  nombre: string;
  imagen?: File | null;
  descripcion: string;
  precio: string;
  imagen_url?: string;
  activo: boolean;
  iva?: boolean;
  ic?: boolean;
  inc?: boolean;
  receta: IReceta[];
  tipo: "simple";
};

export type IOpcionValor = {
  id?: string;
  nombre: string;
  precio: string;
  receta: IReceta[];
};

export type IOpcion = {
  id?: string;
  nombre: string;
  es_multiple: boolean;
  valores: IOpcionValor[];
};

export type IFormProductoConfigurable = {
  id?: string;
  categoria_id: string;
  nombre: string;
  imagen?: File | null;
  descripcion: string;
  precio_base: string;
  imagen_url?: string;
  activo: boolean;
  iva?: boolean;
  ic?: boolean;
  inc?: boolean;
  opciones: IOpcion[];
  tipo: "configurable";
};

export type IFormProducto = IFormProductoSimple | IFormProductoConfigurable;

//Para arreglar la forma en la que se traen los datos del back
const mapProductoFromBack = (productoBack: any): IFormProducto => {
  const esSimple = !productoBack.opciones; // si no tiene opciones, asumimos simple
  if (esSimple) {
    return {
      id: productoBack.id,
      categoria_id: productoBack.categoria_id,
      nombre: productoBack.nombre,
      descripcion: productoBack.descripcion,
      precio: productoBack.precio ?? "",
      imagen: null,
      imagen_url: productoBack.imagen_url ?? "",
      activo: productoBack.activo,
      iva: productoBack.iva,
      ic: productoBack.ic,
      inc: productoBack.inc,
      receta: productoBack.receta ?? [],
      tipo: "simple",
    };
  } else {
    return {
      id: productoBack.id,
      categoria_id: productoBack.categoria_id,
      nombre: productoBack.nombre,
      descripcion: productoBack.descripcion,
      precio_base: productoBack.precio_base ?? "",
      imagen: null,
      imagen_url: productoBack.imagen_url ?? "",
      activo: productoBack.activo,
      iva: productoBack.iva,
      ic: productoBack.ic,
      inc: productoBack.inc,
      opciones: (productoBack.opciones ?? []).map((op: any) => ({
        id: op.id,
        nombre: op.nombre,
        es_multiple: op.es_multiple,
        valores: (op.valores ?? []).map((val: any) => ({
          id: val.id,
          nombre: val.nombre,
          precio: val.precios?.[0]?.precio ?? "",
          receta: (val.ingredientes ?? []).map((ing: any) => ({
            ingrediente_id: ing.ingrediente_id,
            cantidad_necesaria: ing.cantidad,
          })),
        })),
      })),
      tipo: "configurable",
    };
  }
};

interface ModalFormProps {
  isOpen: boolean;
  producto: Producto | null;
  onClose: () => void;
}

const FormProducto: React.FC<ModalFormProps> = ({
  isOpen,
  producto,
  onClose,
}) => {
  const { subirImagen } = useSubidaDeImagenes();
  const { crearProducto, actualizarProducto, loading } = useProductosStore();

  const { fetchCategorias, selectCategorias } = useCategoriasStore();
  const { traerIngredientes, ingredientes } = useIngredientesStore();

  const [tipoProducto, setTipoProducto] = useState<"SIMPLE" | "CONFIGURABLE">(
    "SIMPLE"
  );

  const [formDataSimple, setFormDataSimple] = useState<IFormProductoSimple>({
    id: "",
    categoria_id: "",
    imagen: null,
    nombre: "",
    descripcion: "",
    precio: "",
    imagen_url: "",
    activo: true,
    iva: false,
    ic: false,
    inc: false,
    receta: [],
    tipo: "simple",
  });

  const [formDataConfigurable, setFormDataConfigurable] =
    useState<IFormProductoConfigurable>({
      id: "",
      categoria_id: "",
      imagen: null,
      nombre: "",
      descripcion: "",
      precio_base: "",
      imagen_url: "",
      activo: true,
      iva: false,
      ic: false,
      inc: false,
      opciones: [
        {
          nombre: "Tamaño",
          es_multiple: false,
          valores: [],
        },
        {
          nombre: "Sabores",
          es_multiple: true,
          valores: [],
        },
      ],
      tipo: "configurable",
    });

  const [errors, setErrors] = useState({
    categoria_id: false,
    nombre: false,
    descripcion: false,
    precio: false,
    receta: false,
    opciones: false,
  });

  useEffect(() => {
    fetchCategorias();
    traerIngredientes();
  }, []);

  useEffect(() => {
    if (producto) {
      const esConfigurable =
        !!producto.opciones && producto.opciones.length > 0;

      if (esConfigurable) {
        setTipoProducto("CONFIGURABLE");
        setFormDataConfigurable(
          mapProductoFromBack(producto) as IFormProductoConfigurable
        );
        // Reset form simple
        setFormDataSimple({
          id: "",
          categoria_id: "",
          imagen: null,
          nombre: "",
          descripcion: "",
          precio: "",
          imagen_url: "",
          activo: true,
          iva: false,
          ic: false,
          inc: false,
          receta: [],
          tipo: "simple",
        });
      } else {
        setTipoProducto("SIMPLE");
        setFormDataSimple(mapProductoFromBack(producto) as IFormProductoSimple);
        // Reset form configurable
        setFormDataConfigurable({
          id: "",
          categoria_id: "",
          imagen: null,
          nombre: "",
          descripcion: "",
          precio_base: "",
          imagen_url: "",
          activo: true,
          iva: false,
          ic: false,
          inc: false,
          opciones: [],
          tipo: "configurable",
        });
      }
    } else {
      // Default si no hay producto
      setTipoProducto("SIMPLE");
      setFormDataSimple({
        id: "",
        categoria_id: "",
        imagen: null,
        nombre: "",
        descripcion: "",
        precio: "",
        imagen_url: "",
        activo: true,
        iva: false,
        ic: false,
        inc: false,
        receta: [],
        tipo: "simple",
      });
      setFormDataConfigurable({
        id: "",
        categoria_id: "",
        imagen: null,
        nombre: "",
        descripcion: "",
        precio_base: "",
        imagen_url: "",
        activo: true,
        iva: false,
        ic: false,
        inc: false,
        opciones: [
          {
            nombre: "Tamaño",
            es_multiple: false,
            valores: [],
          },
          {
            nombre: "Sabores",
            es_multiple: true,
            valores: [],
          },
        ],
        tipo: "configurable",
      });
    }
  }, [producto]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newErrors: any = {
      categoria_id: false,
      nombre: false,
      descripcion: false,
      precio: false,
      receta: false,
      opciones: false,
    };

    let productoData: IFormProducto;

    if (tipoProducto === "SIMPLE") {
      newErrors = {
        ...newErrors,
        categoria_id: formDataSimple.categoria_id === "",
        nombre: formDataSimple.nombre.trim() === "",
        descripcion: formDataSimple.descripcion.trim() === "",
        precio: Number(formDataSimple.precio) < 0,
        receta: formDataSimple.receta.length < 1,
      };
      productoData = formDataSimple;
    } else {
      newErrors = {
        ...newErrors,
        categoria_id: formDataConfigurable.categoria_id === "",
        nombre: formDataConfigurable.nombre?.trim() === "",
        descripcion: formDataConfigurable.descripcion?.trim() === "",
        opciones:
          formDataConfigurable.opciones?.length === 0 ||
          formDataConfigurable.opciones?.some(
            (op) =>
              op.nombre?.trim() === "" ||
              op.valores?.length === 0 ||
              op.valores?.some(
                (val) =>
                  val.nombre?.trim() === "" ||
                  val.precio?.trim() === "" ||
                  Number(val.precio) < 0
              )
          ),
      };
      productoData = formDataConfigurable;
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    let imagen_url_subida: string | undefined;
    const imagenAsubir =
      tipoProducto === "SIMPLE"
        ? formDataSimple.imagen
        : formDataConfigurable.imagen;
    if (imagenAsubir) {
      const url = await subirImagen(imagenAsubir);
      imagen_url_subida = url;
    }

    let finalData: IFormProducto;

    if (tipoProducto === "SIMPLE") {
      finalData = { ...formDataSimple };
    } else {
      finalData = { ...formDataConfigurable };
    }

    finalData.imagen_url = imagen_url_subida || finalData.imagen_url;

    if (finalData.imagen) {
      delete finalData.imagen;
    }

    let respuesta = false;
    if (producto) {
      respuesta = await actualizarProducto(finalData);
    } else {
      respuesta = await crearProducto(finalData);
    }

    if (respuesta) {
      handleCancel();
    } else {
      return;
    }
  };

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDataSimple((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfigurableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDataConfigurable((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: boolean) => {
    if (tipoProducto === "SIMPLE") {
      setFormDataSimple((prev) => ({ ...prev, activo: value }));
    } else {
      setFormDataConfigurable((prev) => ({ ...prev, activo: value }));
    }
  };

  const handleCategoriaChange = (value: string) => {
    if (tipoProducto === "SIMPLE") {
      setFormDataSimple((prev) => ({ ...prev, categoria_id: value }));
    } else {
      setFormDataConfigurable((prev) => ({ ...prev, categoria_id: value }));
    }
  };

  // Funciones para producto simple (receta)
  const updateReceta = (idx: number, updated: Partial<IReceta>) => {
    setFormDataSimple((prev) => {
      const newReceta = [...prev.receta];
      newReceta[idx] = { ...newReceta[idx], ...updated };
      return { ...prev, receta: newReceta };
    });
  };

  const addIngrediente = () => {
    setFormDataSimple((prev) => {
      const nuevaReceta = [
        ...(prev.receta ?? []),
        {
          ingrediente_id: ingredientes[0]?.id || "",
          cantidad_necesaria: "1",
        },
      ];

      return { ...prev, receta: nuevaReceta };
    });
  };

  const removeIngrediente = (idx: number) => {
    setFormDataSimple((prev) => {
      const newReceta = [...prev.receta];
      newReceta.splice(idx, 1);
      return { ...prev, receta: newReceta };
    });
  };

  const incCantidad = (idx: number) => {
    const cantidad = parseFloat(
      formDataSimple.receta[idx].cantidad_necesaria || "0"
    );
    updateReceta(idx, { cantidad_necesaria: (cantidad + 1).toString() });
  };

  const decCantidad = (idx: number) => {
    const cantidad = parseFloat(
      formDataSimple.receta[idx].cantidad_necesaria || "0"
    );
    if (cantidad > 0) {
      updateReceta(idx, { cantidad_necesaria: (cantidad - 1).toString() });
    }
  };

  const handleOpcionChange = (
    opcionIndex: number,
    updated: Partial<IOpcion>
  ) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      newOpciones[opcionIndex] = { ...newOpciones[opcionIndex], ...updated };
      return { ...prev, opciones: newOpciones };
    });
  };

  const addValor = (opcionIndex: number) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      const opcionActual = { ...newOpciones[opcionIndex] };

      opcionActual.valores = [
        ...opcionActual.valores,
        { nombre: "", precio: "", receta: [] },
      ];

      newOpciones[opcionIndex] = opcionActual;

      return { ...prev, opciones: newOpciones };
    });
  };

  const removeValor = (opcionIndex: number, valorIndex: number) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      newOpciones[opcionIndex].valores.splice(valorIndex, 1);
      return { ...prev, opciones: newOpciones };
    });
  };

  const handleValorChange = (
    opcionIndex: number,
    valorIndex: number,
    updated: Partial<IOpcionValor>
  ) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      newOpciones[opcionIndex].valores[valorIndex] = {
        ...newOpciones[opcionIndex].valores[valorIndex],
        ...updated,
      };
      return { ...prev, opciones: newOpciones };
    });
  };

  // CORREGIDO: Se protege el array `receta` para evitar errores
  const addReceta = (opcionIndex: number, valorIndex: number) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      const opcionActual = { ...newOpciones[opcionIndex] };
      const valoresActualizados = [...opcionActual.valores];

      const valorActual = { ...valoresActualizados[valorIndex] };
      valorActual.receta = [
        ...valorActual.receta,
        { ingrediente_id: "", cantidad_necesaria: "" },
      ];

      valoresActualizados[valorIndex] = valorActual;
      opcionActual.valores = valoresActualizados;
      newOpciones[opcionIndex] = opcionActual;

      return { ...prev, opciones: newOpciones };
    });
  };

  const removeReceta = (
    opcionIndex: number,
    valorIndex: number,
    recetaIndex: number
  ) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      newOpciones[opcionIndex].valores[valorIndex].receta.splice(
        recetaIndex,
        1
      );
      return { ...prev, opciones: newOpciones };
    });
  };

  const handleRecetaChange = (
    opcionIndex: number,
    valorIndex: number,
    recetaIndex: number,
    updated: Partial<IReceta>
  ) => {
    setFormDataConfigurable((prev) => {
      const newOpciones = [...prev.opciones];
      newOpciones[opcionIndex].valores[valorIndex].receta[recetaIndex] = {
        ...newOpciones[opcionIndex].valores[valorIndex].receta[recetaIndex],
        ...updated,
      };
      return { ...prev, opciones: newOpciones };
    });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  //Para eliminar todo lo del form:
  const resetForm = () => {
    setFormDataSimple({
      id: "",
      categoria_id: "",
      imagen: null,
      nombre: "",
      descripcion: "",
      precio: "",
      imagen_url: "",
      activo: true,
      iva: false,
      ic: false,
      inc: false,
      receta: [],
      tipo: "simple",
    });

    setFormDataConfigurable({
      id: "",
      categoria_id: "",
      imagen: null,
      nombre: "",
      descripcion: "",
      precio_base: "",
      imagen_url: "",
      activo: true,
      iva: false,
      ic: false,
      inc: false,
      opciones: [
        { nombre: "Tamaño", es_multiple: false, valores: [] },
        { nombre: "Sabores", es_multiple: true, valores: [] },
      ],
      tipo: "configurable",
    });

    setTipoProducto("SIMPLE");
  };

  if (!isOpen) return null;

  const currentFormData =
    tipoProducto === "SIMPLE" ? formDataSimple : formDataConfigurable;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={handleCancel}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <button onClick={handleCancel}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {producto ? "Editar" : "Crear"} Producto
          </h2>
          <div className="w-6" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div className="flex items-center gap-4">
            <label className="text-gray-700 font-semibold">
              Tipo de Producto:
            </label>
            <div className="flex items-center">
              <input
                type="radio"
                id="simple"
                name="tipoProducto"
                value="SIMPLE"
                checked={tipoProducto === "SIMPLE"}
                onChange={() => setTipoProducto("SIMPLE")}
                disabled={!!producto}
              />
              <label htmlFor="simple" className="ml-2 text-gray-400">
                Simple
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="configurable"
                name="tipoProducto"
                value="CONFIGURABLE"
                checked={tipoProducto === "CONFIGURABLE"}
                onChange={() => setTipoProducto("CONFIGURABLE")}
                disabled={!!producto}
              />
              <label htmlFor="configurable" className="ml-2 text-gray-400">
                Configurable
              </label>
            </div>
          </div> */}

          <SimpleSelect
            label="Categoría"
            options={selectCategorias || []}
            placeholder="Seleccione una categoría"
            value={currentFormData.categoria_id ?? ""}
            onChange={handleCategoriaChange}
            error={errors.categoria_id}
          />

          <InputField
            label="Nombre"
            name="nombre"
            value={currentFormData.nombre ?? ""}
            onChange={
              tipoProducto === "SIMPLE"
                ? handleSimpleChange
                : handleConfigurableChange
            }
            error={errors.nombre}
          />

          <InputField
            label="Descripción"
            name="descripcion"
            value={currentFormData.descripcion ?? ""}
            onChange={
              tipoProducto === "SIMPLE"
                ? handleSimpleChange
                : handleConfigurableChange
            }
            error={errors.descripcion}
          />

          {tipoProducto === "SIMPLE" ? (
            <>
              <InputField
                label="Precio"
                name="precio"
                type="number"
                value={formDataSimple.precio ?? ""}
                onChange={handleSimpleChange}
                error={errors.precio}
              />
              <div className="bg-gray-50 p-6 rounded-2xl shadow-inner space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">Receta</h3>
                {formDataSimple.receta?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm"
                  >
                    <SimpleSelect
                      label="Ingrediente"
                      options={ingredientes}
                      value={item.ingrediente_id ?? ""}
                      onChange={(val) =>
                        updateReceta(idx, { ingrediente_id: val })
                      }
                      placeholder="Selecciona ingrediente"
                    />
                    <div className="flex items-center gap-1 mt-4">
                      <button type="button" onClick={() => decCantidad(idx)}>
                        <MinusCircle className="text-[#ed4e05] text-xm" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.cantidad_necesaria ?? ""}
                        onChange={(e) =>
                          updateReceta(idx, {
                            cantidad_necesaria: e.target.value,
                          })
                        }
                        className="w-20 text-center border rounded-[25px] border-[#ed4e05] px-2 py-1 text-gray-700"
                      />
                      <button type="button" onClick={() => incCantidad(idx)}>
                        <PlusCircle className="text-[#ed4e05]" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngrediente(idx)}
                      className="text-[#ed4e05] mt-4"
                    >
                      <X />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngrediente}
                  className="flex items-center gap-2 text-[#ed4e05] "
                >
                  <PlusCircle /> Añadir ingredientes
                </button>
              </div>
            </>
          ) : (
            <>
              <InputField
                label="Precio Base"
                name="precio_base"
                type="number"
                value={formDataConfigurable.precio_base ?? ""}
                onChange={handleConfigurableChange}
                error={errors.precio}
              />
              {formDataConfigurable.opciones?.map((opcion, opcionIndex) => (
                <div
                  key={opcionIndex}
                  className="bg-white p-4 rounded-xl shadow space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">
                      {opcion.nombre}
                    </h4>
                  </div>

                  {opcion.nombre === "Sabores" && (
                    <Checkbox
                      label="¿Puede el cliente elegir varios sabores?"
                      checked={opcion.es_multiple}
                      onChange={(value) =>
                        handleOpcionChange(opcionIndex, { es_multiple: value })
                      }
                    />
                  )}
                  <div className="bg-gray-100 p-4 rounded-xl space-y-3">
                    <h5 className="font-semibold text-gray-600">
                      Opciones de {opcion.nombre || "la opción"}
                    </h5>

                    {opcion.valores?.map((valor, valorIndex) => (
                      <div
                        key={valorIndex}
                        className="bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeValor(opcionIndex, valorIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <InputField
                          label="Nombre"
                          value={valor.nombre ?? ""}
                          onChange={(e) =>
                            handleValorChange(opcionIndex, valorIndex, {
                              nombre: e.target.value,
                            })
                          }
                          placeholder="Ej. Personal"
                        />
                        <InputField
                          label={
                            opcion.nombre === "Sabores"
                              ? "Precio adicional"
                              : "Precio"
                          }
                          type="number"
                          value={valor.precio ?? ""}
                          onChange={(e) =>
                            handleValorChange(opcionIndex, valorIndex, {
                              precio: e.target.value,
                            })
                          }
                          placeholder="0.00"
                        />
                        <div className="bg-gray-50 p-4 rounded-xl mt-3">
                          <h6 className="font-medium text-gray-700">
                            Receta para {valor.nombre || "este valor"}
                          </h6>
                          {valor.receta?.map((recetaItem, recetaIndex) => (
                            <div
                              key={recetaIndex}
                              className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm my-2"
                            >
                              <SimpleSelect
                                label="Ingrediente"
                                options={ingredientes}
                                value={recetaItem.ingrediente_id ?? ""}
                                onChange={(val) =>
                                  handleRecetaChange(
                                    opcionIndex,
                                    valorIndex,
                                    recetaIndex,
                                    { ingrediente_id: val }
                                  )
                                }
                                placeholder="Selecciona ingrediente"
                              />
                              <InputField
                                label="Cantidad"
                                type="number"
                                value={recetaItem.cantidad_necesaria ?? ""}
                                onChange={(e) =>
                                  handleRecetaChange(
                                    opcionIndex,
                                    valorIndex,
                                    recetaIndex,
                                    { cantidad_necesaria: e.target.value }
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeReceta(
                                    opcionIndex,
                                    valorIndex,
                                    recetaIndex
                                  )
                                }
                                className="text-red-500 mt-4"
                              >
                                <X />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addReceta(opcionIndex, valorIndex)}
                            className="flex items-center gap-2 text-[#ed4e05] mt-2"
                          >
                            <PlusCircle className="w-4 h-4" /> Añadir
                            ingrediente
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addValor(opcionIndex)}
                      className="w-full flex items-center justify-center gap-2 text-[#ed4e05] border border-[#ed4e05] rounded-full py-2 hover:bg-[#ed4e05] hover:text-white transition-colors"
                    >
                      <PlusCircle /> Añadir Opcion
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          <InputImagen
            imagenUrl={formDataSimple.imagen_url}
            setArchivo={(value) => {
              if (tipoProducto === "SIMPLE") {
                setFormDataSimple((prev) => ({ ...prev, imagen: value }));
              } else {
                setFormDataConfigurable((prev) => ({ ...prev, imagen: value }));
              }
            }}
          />

          <Checkbox
            label="Activo"
            checked={currentFormData.activo}
            onChange={handleCheckboxChange}
          />
          <footer className="flex justify-end space-x-3 mt-6">
            <BotonRestaurante
              label="Cancelar"
              type="button"
              variacion="claro"
              onClick={handleCancel}
            />
            <BotonRestaurante
              type="submit"
              label={producto ? "Actualizar" : "Crear"}
            />
          </footer>
        </form>
        {loading && <Spinner />}
      </div>
    </div>
  );
};

export default FormProducto;
