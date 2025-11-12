'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  validateTextos,
  validateEntradasNumericas,
  validateEntradasNumericasREALES,
} from '../../app/gestionDeFacturasElectronicas/validations';
import { ArrowLeft, Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import { useItemStore, Item } from '@/store/useItemStore';
import InputField from '@/components/ui/InputField';
import Spinner from '@/components/feedback/Spinner';
import BotonSubirArchivos from '@/components/ui/botonSubirArchivos';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { ItemsVenta, ItemsVentaFront } from '@/types/types';
import InputImagenConPreview from '@/components/ui/inputImagenConPreview';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { useUserStore } from '@/store/useUser';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useSubidaArchivosStore } from '@/store/useSubidaArchivos';
import { useItemsVentaStore } from '@/store/useItemsVentaStore';
import { showErrorToast } from '@/components/feedback/toast';
import { validateSeleccionMultiple } from '@/helpers/validacionesDeBusqueda';

interface ModalFormProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  closeAcciones?: () => void;
}

interface Errors {
  descripcion: boolean;
  subtotal: boolean;
  unidadDeMedida: boolean;
  porcentajeIva: boolean;
  retefuente: boolean;
  cantidad: boolean;
  idCategoria: boolean;
  imagen: boolean;
}

const tarifas = Array.from({ length: 31 }, (_, i) => i + 0); //YA ESTA ARREGLADO SOLO SUBIR CAMBIOS A LA MAIN

const FormItemDeVenta: React.FC<ModalFormProps> = ({ isOpen, onClose, id }) => {
  const {
    postItem,
    fetchProximoCodigoItem,
    fetchItemInfo,
    loading,
    actualizarItem,
  } = useItemsVentaStore();
  const { todaLaInfoUsuario, traerInfoDeUsuarios } = useUserStore();
  const { subirImagenes } = useSubidaArchivosStore();
  const {
    fetchRetenciones,
    selectRetenciones,
    infoRetenciones,
    fetchCategoriasProductosVenta,
    categoriasVentas,
    loading: loadingDatos,
    fetchUnidadesDeMedida,
    unidadesDeMedida,
  } = useDatosExtraStore();
  const { isLoading, createItem } = useItemStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL de previsualización
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [proximoCodigo, setProximoCodigo] = useState(0); // Estado del modal
  const [categoriaInicial, setCategoriaInicial] = useState<number | null>(null);
  const [codigoInicial, setCodigoInicial] = useState<number | null>(null);
  const [totalConRetenciones, setTotalConRetenciones] = useState<number>(0);

  const [monto, setMonto] = useState<number>(0);

  const [formData, setFormData] = useState<ItemsVentaFront>({
    codigo: 0,
    tarifaIca: '',
    cantidad: 0,
    descripcion: '',
    subtotal: 0,
    unidadDeMedida: '',
    porcentajeIva: null,
    iva: 0,
    total: 0,
    retefuente: '',
    urlImagen: '',
    reteica: 0,
    imagen: null,
    descuentoVenta: 0,
    idCategoria: 0,
  });

  const [errors, setErrors] = useState<Errors>({
    // tarifaIca: false,
    // reteica: false,
    cantidad: false,
    porcentajeIva: false,
    descripcion: false,
    subtotal: false,
    unidadDeMedida: false,
    retefuente: false,
    imagen: false,
    idCategoria: false,
  });

  //Fetch all info
  useEffect(() => {
    fetchRetenciones();
    fetchUnidadesDeMedida();
    if (!todaLaInfoUsuario) {
      traerInfoDeUsuarios();
    }
    setFormData((prev) => ({
      ...prev,
      tarifaIca: todaLaInfoUsuario?.ica || 'No disponible',
    }));
    fetchCategoriasProductosVenta();
  }, [todaLaInfoUsuario]);

  useEffect(() => {
    const calculo = formData.total - monto - formData.reteica;
    setTotalConRetenciones(calculo);
  }, [monto, formData]);

  //Control de retefuentes
  useEffect(() => {
    if (!formData.subtotal) return;

    const infoRetefuente = infoRetenciones.find(
      (x) => x.id === Number(formData.retefuente)
    );

    if (!infoRetefuente) return;

    if (
      infoRetefuente?.baseMinimaPesos <= formData.subtotal ||
      infoRetefuente.baseMinimaPesos === 100
    ) {
      const porcentajeTransformado = infoRetefuente.porcentaje * 0.01;
      const resultado = porcentajeTransformado * formData.subtotal;

      setMonto(resultado);
    } else {
      setMonto(0);
    }
  }, [formData.retefuente, formData.subtotal]);

  //Handle CODIGO
  useEffect(() => {
    if (formData.idCategoria === categoriaInicial) {
      setFormData((prev) => ({
        ...prev,
        codigo: codigoInicial,
      }));
    } else {
      getProximoCodigo();
    }
  }, [id, formData.idCategoria]);

  useEffect(() => {
    if (formData.tarifaIca === 'No disponible') return;
    if (formData.subtotal !== null && !isNaN(formData.subtotal)) {
      // setFormData((prev) => ({
      //   ...prev,
      //   reteica: Number(formData.tarifaIca) * Number(formData.subtotal),
      // }));
    }
  }, [formData.subtotal, formData.tarifaIca]);

  useEffect(() => {
    if (formData.subtotal !== null && formData.porcentajeIva !== null) {
      setFormData((prev) => ({
        ...prev,
        iva: Number(formData.subtotal) * Number(formData.porcentajeIva) * 0.01,
      }));
    }
  }, [formData.subtotal, formData.porcentajeIva]);

  useEffect(() => {
    if (formData.subtotal) {
      setFormData((prev) => ({
        ...prev,
        total: Number(formData.subtotal) + Number(formData.iva),
      }));
    }
  }, [formData.iva, formData.subtotal]);

  //Deshabilitar el scroll y fetchInfo
  useEffect(() => {
    fetchInfo();
    // Deshabilitar scroll cuando el formulario esté abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }

    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [isOpen]);

  const getProximoCodigo = async () => {
    if (!formData.idCategoria) return;
    const codigo = await fetchProximoCodigoItem(formData.idCategoria);
    setFormData((prev) => ({
      ...prev,
      codigo: codigo,
    }));
  };

  const fetchInfo = async () => {
    if (!id) return;
    const info = await fetchItemInfo(id);
    setFormData((prev) => ({
      ...prev,
      codigo: info.codigo,
      cantidad: info.cantidad,
      descripcion: info.descripcion,
      subtotal: info.subtotal,
      unidadDeMedida: info.unidadDeMedida,
      porcentajeIva: info.porcentajeIva,
      retefuente: info.retefuente,
      imagen: null,
      descuentoVenta: info.descuentoVenta,
      idCategoria: info.idCategoria,
      urlImagen: info.urlImagen,
    }));
    setCodigoInicial(info.codigo);
    setCategoriaInicial(info.idCategoria);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // if (name === 'subtotal' && todaLaInfoUsuario?.ica) {
    //   setFormData((prev) => ({
    //     ...prev,
    //     reteica: Number(value) * Number(todaLaInfoUsuario.ica),
    //   }));
    // }

    // Actualizar datos del formulario
    setFormData((prev) => ({
      ...prev,
      [name]: value ?? '', // Usa una cadena vacía si el iva es undefined
    }));

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      codigo: validateTextos,
      descripcion: validateTextos,
      cantidad: validateEntradasNumericas,
      subtotal: validateTextos,
      iva: validateEntradasNumericas,
      total: validateEntradasNumericas,
      cargos: validateTextos,
      impuestos: validateEntradasNumericas,
      rete: validateEntradasNumericas,
      reteica: validateEntradasNumericas,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  // Cambia el tipo de evento a FormEvent para que coincida con el tipo esperado
  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();

    // Copiar el estado actual de errores
    const errorState = { ...errors };

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validaciones de los campos del formulario
    const isDescripcionValid = validateTextos(formData.descripcion);
    // const porcentajeIva = validateEntradasNumericasREALES(
    //   formData.porcentajeIva
    // );

    const subtotal = validateEntradasNumericasREALES(formData.subtotal);
    const unidadDeMedida = validateEntradasNumericasREALES(
      Number(formData.unidadDeMedida)
    );
    const retefuente = validateSeleccionMultiple(String(formData.retefuente));
    const idCategoria = validateEntradasNumericasREALES(formData.idCategoria);
    const cantidad = validateEntradasNumericasREALES(formData.cantidad);

    // Actualizar estado de errores
    errorState.descripcion = !isDescripcionValid;
    // errorState.porcentajeIva = !porcentajeIva;
    errorState.subtotal = !subtotal;
    errorState.unidadDeMedida = !unidadDeMedida;
    errorState.retefuente = !retefuente;
    errorState.idCategoria = !idCategoria;
    errorState.cantidad = !cantidad;

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      showErrorToast('Faltan campos.');
      return;
    }

    const formListo = {
      idCategoria: Number(formData.idCategoria),
      descripcion: formData.descripcion,
      subtotal: Number(formData.subtotal),
      cantidad: Number(formData.cantidad),
      unidadDeMedida: Number(formData.unidadDeMedida),
      porcentajeIva: formData.porcentajeIva,
      iva: formData.iva,
      total: formData.total,
      retefuente: Number(formData.retefuente),
      reteica: formData.reteica,
      // reteica: 0,
      urlImagen: formData.imagen,
      descuentoVenta: Number(formData.descuentoVenta),
      valorFinalConRetenciones: totalConRetenciones,
    };

    if (id) {
      await actualizarItem(formListo, id);
    } else {
      await postItem(formListo);
    }

    handleClose();
  };

  const handleSubidaImagen = (file: File | null, e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Evita la recarga si se usa en un formulario
    setFormData((prev) => ({ ...prev, imagen: file }));
    setErrors((prev) => ({ ...prev, imagen: false }));
  };

  const handleVerImagen = () => {
    if (formData.imagen) {
      const preview = URL.createObjectURL(formData.imagen);
      setPreviewUrl(preview);
      setIsModalOpen(true); // Abre el modal
      return;
    }
  };

  const handleClose = () => {
    setFormData({
      codigo: null,
      tarifaIca: '',
      cantidad: null,
      descripcion: '',
      subtotal: null,
      unidadDeMedida: '',
      porcentajeIva: null,
      iva: null,
      total: 0,
      retefuente: '',
      reteica: 0,
      imagen: null,
      descuentoVenta: null,
      idCategoria: null,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleClose} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
        >
          <div className="flex items-center justify-between mb-4">
            {/* Flecha para salir */}
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={handleClose} // Función para cerrar el modal
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Título centrado */}
            <h2 className="text-xl font-bold flex-1 text-center">
              {id ? 'Actualizar' : 'Nuevo'} Item de Venta
            </h2>

            {/* Espaciador para mantener la alineación */}
            <div className="w-10"></div>
          </div>

          <div>
            {/* Nombre */}
            <InputField
              label="Descripcion"
              name="descripcion"
              value={formData.descripcion}
              error={errors.descripcion}
              onChange={handleChange}
            />

            {/* subtotal */}
            <InputField
              label="Subtotal"
              name="subtotal"
              type="number"
              value={formData.subtotal ?? ''}
              error={errors.subtotal}
              onChange={handleChange}
            />
            {/* Unidad medida codigo */}
            <div className="flex flex-col">
              {loadingDatos ? (
                <div>Cargando Datos...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="Unidad de medida"
                    options={unidadesDeMedida}
                    placeholder="Seleccione una opción"
                    value={String(formData.unidadDeMedida) ?? ''}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        unidadDeMedida: value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        unidadDeMedida: !value,
                      }));
                    }}
                    error={errors.unidadDeMedida}
                    errorMessage="Debes seleccionar una unidad de medida"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {/* tarifa 0-30*/}
              <div className="w-full mt-4">
                <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                  Tarifa
                </label>
                <div className="relative mt-4">
                  <SimpleSelect
                    options={tarifas}
                    width={'100%'}
                    value={formData.porcentajeIva || 0}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        porcentajeIva: Number(value),
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        porcentajeIva: false,
                      }));
                    }}
                    error={errors.porcentajeIva}
                  />
                </div>
              </div>

              {/* iva */}
              <InputField
                label="IVA"
                name="iva"
                readOnly={true}
                value={
                  formData.iva !== null && !isNaN(Number(formData.iva))
                    ? String(formData.iva)
                    : ''
                }
                // error={errors.iva}
                onChange={handleChange}
              />
            </div>
            {/* total */}
            <InputField
              label="Total Sin Retenciones"
              name="total"
              value={formData.total ?? ''}
              // error={errors.total}
              onChange={handleChange}
              readOnly={true}
            />

            {/* Campo "Retefuente" */}
            <div className="w-ful mt-4">
              <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                Retefuente
                <span
                  className={`text-red-500 ml-1 ${
                    errors.retefuente ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="">
                <div className="flex flex-col">
                  {selectRetenciones ? (
                    <div className=" relative">
                      <SelectConSearch
                        options={selectRetenciones}
                        placeholder="Seleccione una opción"
                        value={String(formData.retefuente)}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            retefuente: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            retefuente: !value,
                          }));
                        }}
                        error={errors.retefuente}
                      />
                    </div>
                  ) : (
                    <h1>cargando datos..</h1>
                  )}
                </div>
              </div>
            </div>

            {/* Monto cobrado retenciones */}
            <InputField
              label="Monto de retenciones"
              name="monto"
              type="number"
              value={monto}
              onChange={handleChange}
              readOnly={true}
            />

            <div className="flex gap-4">
              {/* tarifa ica */}
              <InputField
                label="Tarifa ICA"
                name="tarifaIca"
                value={formData.tarifaIca}
                onChange={handleChange}
                readOnly={true}
              />

              {/* reteica */}
              <InputField
                label="Reteica"
                name="reteica"
                readOnly={true}
                value={formData.reteica ?? ''}
                // error={errors.reteica}
                onChange={handleChange}
              />
            </div>

            {/* descuentoVenta */}
            <div>
              <InputField
                label="Descuento Venta"
                name="descuentoVenta"
                value={formData.descuentoVenta ?? ''}
                // error={errors.descuentoVenta}
                onChange={handleChange}
                type="number"
              />
            </div>

            <InputField
              label="Unidades disponibles"
              name="cantidad"
              type="number"
              value={formData.cantidad ?? ''}
              onChange={handleChange}
              error={errors.cantidad}
            />

            <div className="mt-4">
              <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                Categoria del Producto
              </label>
              <div className="mt-4">
                {categoriasVentas ? (
                  <div className=" relative">
                    <SelectConSearch
                      // label="Unidad de medida"
                      options={categoriasVentas}
                      placeholder="Seleccione una opción"
                      value={String(formData.idCategoria) ?? ''}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          idCategoria: Number(value),
                        }));
                        setErrors((prev) => ({
                          ...prev,
                          idCategoria: !value,
                        }));
                      }}
                      error={errors.idCategoria}
                      errorMessage="Debes seleccionar una unidad de medida"
                    />
                  </div>
                ) : (
                  <h1>cargando datos..</h1>
                )}
              </div>
            </div>

            {/* codigo */}
            <InputField
              label="Código"
              name="codigo"
              type="number"
              value={formData.codigo ?? ''}
              // error={errors.codigo}
              onChange={handleChange}
              readOnly={true}
            />

            {/* total */}
            <InputField
              label="Total Con Retenciones"
              name="totalConRetenciones"
              value={totalConRetenciones}
              onChange={handleChange}
              readOnly={true}
            />

            {/* imagen */}
            <div className="mt-4">
              <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                Imagen del producto
              </label>
              {formData.urlImagen ? (
                <InputImagenConPreview
                  setArchivo={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      imagen: value,
                    }));
                  }}
                  imagenUrl={formData.urlImagen}
                />
              ) : (
                <InputImagenConPreview
                  setArchivo={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      imagen: value,
                    }));
                  }}
                />
              )}
            </div>

            {/* Mensaje de error si es que hay */}
            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-4">
                Debe llenar todos campos requeridos.
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
              >
                Guardar
              </button>
            </div>
            {isLoading || loading ? <Spinner /> : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormItemDeVenta;
