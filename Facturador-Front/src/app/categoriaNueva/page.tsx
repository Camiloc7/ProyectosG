'use client';
import React, { useEffect, useState, ChangeEvent } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import 'react-datepicker/dist/react-datepicker.css';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import InputField from '@/components/ui/InputField';
import { Plus, Trash2, Copy } from 'lucide-react';
import { INVENTORY_URL } from '@/helpers/ruta';
import ImageSelect from '@/components/ui/ImageSelect';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import PrivateRoute from '@/helpers/PrivateRoute';

const documentosElectronicosOptions = [
  { value: 'Factura de Venta', label: 'Factura de Venta' },
  { value: 'factura de compra', label: 'Factura de Compra' },
  { value: 'Nomina electronica', label: 'Nómina Electrónica' },
  { value: 'Documento soporte', label: 'Documento Soporte' },
  { value: 'Documentos equivalentes', label: 'Documentos Equivalentes' },
  { value: 'Notas contables', label: 'Notas Contables' },
  { value: 'Comprobante de egreso', label: 'Comprobante de Egreso' },
  { value: 'Recibo de caja', label: 'Recibo de Caja' },
];
const tablasOptions = [
  { value: 'Facturas', label: 'Facturas' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Notas Credito', label: 'Notas Crédito' },
];
const procesosOptions = [
  { value: 'Venta', label: 'Venta' },
  { value: 'Compra', label: 'Compra' },
  { value: 'Nomina', label: 'Nómina' },
];
const optionsTiposContables = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PASIVO', label: 'Pasivo' },
  { value: 'PATRIMONIO', label: 'Patrimonio' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'GASTO', label: 'Gasto' },
  { value: 'COSTO', label: 'Costo' },
  { value: 'OTROS', label: 'Otros' },
];
const atributosFacturas = [
  { id: 'Valor Total', nombre: 'Valor Total' },
  { id: 'Valor Iva', nombre: 'Valor IVA' },
  { id: 'VALORSUBTOTAL', nombre: 'Valor Subtotal' },
  { id: 'ADMINISTRACION_PESOS', nombre: 'Administración (Pesos)' },
  { id: 'IMPREVISTOS_PESOS', nombre: 'Imprevistos (Pesos)' },
  { id: 'UTILIDAD_PESOS', nombre: 'Utilidad (Pesos)' },
  { id: 'ANTICIPO', nombre: 'Anticipo' },
  { id: 'Fecha Emision', nombre: 'Fecha Emisión' },
  { id: 'Numero Factura', nombre: 'Número Factura' },
  { id: 'Nombre Proveedor', nombre: 'Nombre Proveedor' },
  { id: 'NIT Proveedor', nombre: 'NIT Proveedor' },
];
const atributosNotasCredito = [
  { id: 'SUBTOTAL_SIN_AIU', nombre: 'Subtotal sin AIU' },
  { id: 'ADMINISTRACION', nombre: 'Administración' },
  { id: 'IMPREVISTOS', nombre: 'Imprevistos' },
  { id: 'UTILIDAD', nombre: 'Utilidad' },
  { id: 'IVA', nombre: 'IVA' },
  { id: 'TOTAL', nombre: 'Total' },
  { id: 'Fecha Emision', nombre: 'Fecha Emisión' },
  { id: 'Numero Nota Credito', nombre: 'Número Nota Crédito' },
];
const atributosCompras = [
  { id: 'RETEICA', nombre: 'ReteICA' },
  { id: 'RETEFUENTE', nombre: 'ReteFuente' },
  { id: 'IVA', nombre: 'IVA' },
  { id: 'SUBTOTAL', nombre: 'Subtotal' },
  { id: 'ANTICIPO', nombre: 'Anticipo' },
  { id: 'TOTAL', nombre: 'Total' },
  { id: 'Fecha Compra', nombre: 'Fecha Compra' },
  { id: 'Numero Compra', nombre: 'Número Compra' },
];
const debitoOCreditoOptions = [
  { value: 'Debito', label: 'Débito' },
  { value: 'Credito', label: 'Crédito' },
];
const frontendAttributeToDbColumnMap: Record<string, string | null> = {
  'Valor Total': 'monto_total',
  'Valor IVA': 'monto_impuesto',
  'Valor Subtotal': 'monto_subtotal',
  'Administración (Pesos)': null,
  'Imprevistos (Pesos)': null,
  'Utilidad (Pesos)': null,
  Anticipo: null,
  'Subtotal sin AIU': null,
  Administración: null,
  Imprevistos: null,
  Utilidad: null,
  IVA: 'monto_impuesto',
  Total: 'monto_total',
  ReteICA: null,
  ReteFuente: null,
  Subtotal: null,
  'Fecha Emisión': 'fecha_emision',
  'Número Factura': 'numero_factura',
  'Nombre Proveedor': 'nombre_proveedor',
  'NIT Proveedor': 'nit_proveedor',
  'Fecha Compra': 'fecha_compra',
  'Número Compra': 'numero_compra',
  'Número Nota Crédito': 'numero_nota_credito',
};

const defaultImageOptions = [
  {
    name: 'Compra EPPS',
    imageUrl: 'https://img.icons8.com/plasticine/400/workers-male.png',
  },
  {
    name: 'Materiales de construcción',
    imageUrl: 'https://img.icons8.com/fluency/240/construction-materials.png',
  },
  {
    name: 'Arrendamientos',
    imageUrl: 'https://img.icons8.com/papercut/480/key-exchange.png',
  },
  {
    name: 'Compras de papeleria',
    imageUrl: 'https://img.icons8.com/dusk/512/note.png',
  },
  {
    name: 'Compra de servicios administrativos',
    imageUrl: 'https://img.icons8.com/office/480/id-verified.png',
  },
  {
    name: 'Compra de otros activos',
    imageUrl: 'https://img.icons8.com/matisse/500/investment.png',
  },
];

type CausationRuleRowData = {
  id: string;
  categoria: string;
  descripcionCategoria: string;
  documentosElectronicos: string;
  tipos: string;
  ladoDeContabilidad: string;
  primerAtributo: string;
  operacion: string;
  esConstante: boolean;
  segundoAtributo: string;
  valorConstante?: number;
};

// --- Valor por defecto para una nueva fila de regla ---
const defaultRuleRow: CausationRuleRowData = {
  id: '',
  categoria: '',
  descripcionCategoria: '',
  documentosElectronicos: '',
  tipos: '',
  ladoDeContabilidad: '',
  primerAtributo: '',
  operacion: '=',
  esConstante: false,
  segundoAtributo: '',
  valorConstante: undefined,
};

export default function CategoriaNueva() {
  const { categoriasListas, fetchCategoriasCincoAlOcho } = useDatosExtraStore();

  const [nombreCategoria, setNombreCategoria] = useState<string>('');
  const [descripcionCategoria, setDescripcionCategoria] = useState<string>('');
  const [tablaGlobalSeleccionada, setTablaGlobalSeleccionada] =
    useState<string>('');
  const [procesoGlobalSeleccionado, setProcesoGlobalSeleccionado] =
    useState<string>('');

  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  const [errors, setErrors] = useState<{
    tablaGlobal?: string;
    procesoGlobal?: string;
  }>({});

  const [rows, setRows] = useState<CausationRuleRowData[]>([
    { ...defaultRuleRow, id: `rule_${Date.now()}_0` },
  ]);

  const [formMessage, setFormMessage] = useState<string>('');

  useEffect(() => {
    if (fetchCategoriasCincoAlOcho) {
      fetchCategoriasCincoAlOcho();
    }
  }, [fetchCategoriasCincoAlOcho]);

  // Esta función ahora usa la tabla GLOBAL seleccionada
  const getAtributosByTable = () => {
    if (tablaGlobalSeleccionada === 'Facturas') return atributosFacturas;
    if (tablaGlobalSeleccionada === 'Compras') return atributosCompras;
    if (tablaGlobalSeleccionada === 'Notas Credito')
      return atributosNotasCredito;
    return [];
  };

  const generateUniqueId = () =>
    `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAgregarFila = () => {
    setRows((prev) => [...prev, { ...defaultRuleRow, id: generateUniqueId() }]);
    setFormMessage('');
  };

  const handleDeleteRuleRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setFormMessage('');
  };

  const handleDuplicateRuleRow = (id: string) => {
    const rowToDuplicate = rows.find((row) => row.id === id);
    if (rowToDuplicate) {
      setRows((prev) => [
        ...prev,
        { ...rowToDuplicate, id: generateUniqueId() },
      ]);
      setFormMessage('');
    }
  };

  const handleChangeRow = (
    idx: number,
    field: keyof CausationRuleRowData,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i === idx) {
          setFormMessage('');
          if (field === 'esConstante') {
            return {
              ...row,
              esConstante: value,
              segundoAtributo: value ? '' : row.segundoAtributo,
              valorConstante: value ? row.valorConstante : undefined,
            };
          }
          if (field === 'categoria') {
            const selectedPuc = (categoriasListas || []).find(
              (cat) => cat.id === value
            );
            return {
              ...row,
              categoria: value,
              descripcionCategoria: selectedPuc?.nombre || '',
            };
          }
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormMessage('');
    if (name === 'nombreCategoria') {
      setNombreCategoria(value);
    } else if (name === 'descripcionCategoria') {
      setDescripcionCategoria(value);
    }
  };

  const handleGlobalSelectChange = (
    field: 'tablaGlobalSeleccionada' | 'procesoGlobalSeleccionado',
    value: string
  ) => {
    setFormMessage('');
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'tablaGlobalSeleccionada') {
      setTablaGlobalSeleccionada(value);
      // Resetear atributos en todas las reglas cuando la tabla global cambia
      setRows((prevRows) =>
        prevRows.map((row) => ({
          ...row,
          primerAtributo: '',
          segundoAtributo: '',
          esConstante: false,
          valorConstante: undefined,
        }))
      );
    } else {
      setProcesoGlobalSeleccionado(value);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    let message = '';
    const newErrors: { tablaGlobal?: string; procesoGlobal?: string } = {};

    if (!nombreCategoria.trim()) {
      message = 'El nombre de la categoría es obligatorio.';
      isValid = false;
    } else if (!descripcionCategoria.trim()) {
      message = 'La descripción de la categoría es obligatoria.';
      isValid = false;
    }

    if (!tablaGlobalSeleccionada) {
      newErrors.tablaGlobal = 'Debe seleccionar una tabla.';
      message = message || 'Debe seleccionar una tabla.';
      isValid = false;
    }
    if (!procesoGlobalSeleccionado) {
      newErrors.procesoGlobal = 'Debe seleccionar un proceso.';
      message = message || 'Debe seleccionar un proceso.';
      isValid = false;
    }

    if (rows.length === 0 && isValid) {
      message = 'Debe agregar al menos una regla de causación.';
      isValid = false;
    }

    if (isValid) {
      for (const rule of rows) {
        if (
          !rule.categoria ||
          !rule.documentosElectronicos ||
          !rule.tipos ||
          !rule.ladoDeContabilidad ||
          !rule.primerAtributo ||
          !rule.operacion
        ) {
          message =
            'Todos los campos de las reglas (excepto el segundo valor si es constante) son obligatorios.';
          isValid = false;
          break;
        }
        if (rule.esConstante) {
          if (
            rule.valorConstante === undefined ||
            rule.valorConstante === null ||
            isNaN(rule.valorConstante)
          ) {
            message = `El valor constante para la regla de "${
              rule.descripcionCategoria || rule.categoria
            }" no puede estar vacío.`;
            isValid = false;
            break;
          }
        } else {
          if (!rule.segundoAtributo) {
            message = `El segundo atributo para la regla de "${
              rule.descripcionCategoria || rule.categoria
            }" no puede estar vacío si no es constante.`;
            isValid = false;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    setFormMessage(message);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const token = getTokenFromCookies(); // <-- Obtener el token
    if (!token) {
      setFormMessage(
        'Error: No se encontró token de autenticación. Por favor, inicia sesión de nuevo.'
      );
      // Opcional: Redirigir al login
      // window.location.href = '/login';
      return;
    }

    const categoryPayload = {
      name: nombreCategoria,
      description: descripcionCategoria,
      imageUrl: selectedImageUrl, // Usamos el nuevo estado
    };

    const rulesPayload = rows.map((rule) => {
      const firstOperandDbColumn =
        frontendAttributeToDbColumnMap[rule.primerAtributo] || null;

      let secondOperandDbColumn = null;
      let secondOperandValue = null;
      let secondOperandSource: 'invoice_field' | 'fixed_value';

      if (rule.esConstante) {
        secondOperandSource = 'fixed_value';
        secondOperandValue = rule.valorConstante ?? null;
      } else {
        secondOperandSource = 'invoice_field';
        secondOperandDbColumn =
          frontendAttributeToDbColumnMap[rule.segundoAtributo] || null;
      }

      return {
        pucCode: rule.categoria,
        pucDescription: rule.descripcionCategoria,
        electronicDocumentType: rule.documentosElectronicos,
        targetTable: tablaGlobalSeleccionada,
        processType: procesoGlobalSeleccionado,
        accountingType:
          rule.ladoDeContabilidad === 'Débito' ? 'Debit' : 'Credit',
        firstOperandFrontendName: rule.primerAtributo,
        firstOperandDbColumn: firstOperandDbColumn,
        operation: rule.operacion,
        secondOperandSource: secondOperandSource,
        secondOperandFrontendName: rule.esConstante
          ? null
          : rule.segundoAtributo,
        secondOperandDbColumn: secondOperandDbColumn,
        secondOperandValue: secondOperandValue,
      };
    });

    setFormMessage('Enviando datos...');
    try {
      const response = await fetch(
        `${INVENTORY_URL}supplier-causation/categories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, 
          },
          body: JSON.stringify({ ...categoryPayload, rules: rulesPayload }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFormMessage('Categoría y reglas creadas con éxito!');
        setNombreCategoria('');
        setDescripcionCategoria('');
        setSelectedImageUrl(''); 
        setTablaGlobalSeleccionada('');
        setProcesoGlobalSeleccionado('');
        setRows([{ ...defaultRuleRow, id: generateUniqueId() }]);
        setErrors({}); 
      } else {
        setFormMessage(
          `Error al guardar: ${
            data.message || data.error || 'Error desconocido.'
          }`
        );
        console.error('Error del backend:', data);
      }
    } catch (error) {
      console.error('Error al enviar datos:', error);
      setFormMessage('Error al conectar con el servidor. Intenta de nuevo.');
    }
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full">
          <h1 className="text-3xl font-bold text-[#6F6F6F] mb-6">
            Crear Categoría de Proveedor y Reglas de Causación
          </h1>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-[#00A7E1] rounded-full"></div>
              Datos Generales de la Categoría
            </h2>
            {/* Fila para Nombre, Descripción y URL de Imagen */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 mt-4 items-start lg:items-center">
              <div className="flex-1 min-w-[30%]">
                <InputField
                  label="Nombre de la categoría *"
                  name="nombreCategoria"
                  value={nombreCategoria}
                  onChange={handleChange}
                  placeholder="Ej: Proveedores Nacionales"
                />
              </div>
              <div className="flex-1 min-w-[30%]">
                <InputField
                  label="Descripción de la categoría *"
                  name="descripcionCategoria"
                  value={descripcionCategoria}
                  onChange={handleChange}
                  placeholder="Breve descripción de la categoría"
                />
              </div>
              {/* Controles para seleccionar o ingresar URL de imagen */}
              <div className="flex-1 min-w-[30%] flex flex-col justify-center h-full">
                <label className="block text-sm font-medium text-[#6F6F6F]">
                  Seleccionar o ingresar URL de imagen
                </label>
                <ImageSelect
                  options={defaultImageOptions.map((img) => ({
                    value: img.imageUrl,
                    label: img.name,
                  }))}
                  value={selectedImageUrl}
                  onChange={setSelectedImageUrl}
                  placeholder="Selecciona una imagen o ingresa una URL..."
                />
              </div>
            </div>
            {selectedImageUrl && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-2">Previsualización:</p>
                <img
                  src={selectedImageUrl}
                  alt="Previsualización"
                  className="w-32 h-32 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}

            {/* Nueva Fila para Tabla y Proceso Globales */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 mt-6 items-start lg:items-center">
              <div className="flex-1 min-w-[30%]">
                <label className="block text-sm font-medium text-[#6F6F6F]">
                  Tabla de Datos *
                  {errors.tablaGlobal && (
                    <span className="text-red-500 ml-1"> (Obligatorio)</span>
                  )}
                </label>
                <SimpleSelect
                  options={tablasOptions}
                  value={tablaGlobalSeleccionada}
                  onChange={(v) =>
                    handleGlobalSelectChange('tablaGlobalSeleccionada', v)
                  }
                />
                {errors.tablaGlobal && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.tablaGlobal}
                  </p>
                )}
              </div>
              <div className="flex-1 min-w-[30%]">
                <label className="block text-sm font-medium text-[#6F6F6F]">
                  Proceso Contable *
                  {errors.procesoGlobal && (
                    <span className="text-red-500 ml-1"> (Obligatorio)</span>
                  )}
                </label>
                <SimpleSelect
                  options={procesosOptions}
                  value={procesoGlobalSeleccionado}
                  onChange={(v) =>
                    handleGlobalSelectChange('procesoGlobalSeleccionado', v)
                  }
                />
                {errors.procesoGlobal && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.procesoGlobal}
                  </p>
                )}
              </div>
              {/* Espacio vacío para mantener la alineación si hay 3 columnas arriba */}
              <div className="flex-1 min-w-[30%] lg:visible hidden"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#00A7E1] rounded-full"></div>
                Definir Reglas de Causación ({rows.length})
              </h2>
              <button
                onClick={handleAgregarFila}
                className="bg-[#00A7E1] hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar Regla
              </button>
            </div>

            {rows.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600 mb-4">
                  No hay reglas definidas. Agrega una para empezar.
                </p>
                <button
                  onClick={handleAgregarFila}
                  className="bg-[#00A7E1] hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Primera Regla
                </button>
              </div>
            )}

            {/* Encabezados de columnas - Ajustados a las columnas de la regla */}
            {rows.length > 0 && (
              <div className="hidden lg:grid lg:grid-cols-[2fr_3fr_2fr_1.5fr_1.5fr_2fr_1fr_2fr_2fr_1fr] bg-gray-100 py-2 px-4 rounded-t-lg font-bold text-sm text-[#6F6F6F] gap-2">
                <div className="px-2 flex items-center justify-start">
                  Cuentas PUC
                </div>
                <div className="px-2 flex items-center justify-start">
                  Descripción
                </div>
                <div className="px-2 flex items-center justify-start">
                  Doc. Electrónicos
                </div>
                <div className="px-2 flex items-center justify-start">
                  Tipos
                </div>
                <div className="px-2 flex items-center justify-start">
                  Débito/Crédito
                </div>
                <div className="px-2 flex items-center justify-start">
                  Prim. Atributo
                </div>
                <div className="px-2 flex items-center justify-center">
                  Operación
                </div>
                <div className="px-2 flex items-center justify-start">
                  Segundo Valor
                </div>
                <div className="px-2 flex items-center justify-start">
                  Fórmula
                </div>
                <div className="px-2 flex items-center justify-center">
                  Acciones
                </div>
              </div>
            )}

            {/* Filas de reglas dinámicas */}
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_3fr_2fr_1.5fr_1.5fr_2fr_1fr_2fr_2fr_1fr] bg-white py-2 px-4 border-t last:border-b gap-4 items-center"
              >
                {/* Cuentas PUC */}
                <div className="relative flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Cuentas PUC
                  </label>
                  <SelectConSearch
                    options={(categoriasListas || []).map((categoria) => ({
                      value: categoria.id,
                      label: `${categoria.clave} - ${categoria.nombre}`,
                    }))}
                    placeholder="Buscar por clave..."
                    value={row.categoria}
                    onChange={(v) => handleChangeRow(idx, 'categoria', v)}
                  />
                </div>

                {/* Descripción */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcionCategoria"
                    value={row.descripcionCategoria}
                    readOnly
                    placeholder="Descripción cuenta"
                    className="w-full h-10 px-4 border rounded-[8px] border-gray-300 bg-gray-50 text-[#6F6F6F] text-sm focus:outline-none"
                  />
                </div>

                {/* Doc. Electrónicos */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Doc. Electrónicos
                  </label>
                  <SimpleSelect
                    options={documentosElectronicosOptions}
                    value={row.documentosElectronicos}
                    onChange={(v) =>
                      handleChangeRow(idx, 'documentosElectronicos', v)
                    }
                  />
                </div>

                {/* Tipos */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Tipos
                  </label>
                  <SimpleSelect
                    options={optionsTiposContables}
                    value={row.tipos}
                    onChange={(v) => handleChangeRow(idx, 'tipos', v)}
                  />
                </div>

                {/* Débito/Crédito */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Débito/Crédito
                  </label>
                  <SimpleSelect
                    options={debitoOCreditoOptions}
                    value={row.ladoDeContabilidad}
                    onChange={(v) =>
                      handleChangeRow(idx, 'ladoDeContabilidad', v)
                    }
                  />
                </div>

                {/* Prim. Atributo - Ahora usa la tabla GLOBAL y se deshabilita si no hay tabla seleccionada */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Prim. Atributo
                  </label>
                  <SimpleSelect
                    options={getAtributosByTable().map((attr) => ({
                      value: attr.nombre,
                      label: attr.nombre,
                    }))}
                    value={row.primerAtributo}
                    onChange={(v) => handleChangeRow(idx, 'primerAtributo', v)}
                  />
                </div>

                {/* Operación */}
                <div className="flex flex-col w-full items-center">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Operación
                  </label>
                  <SimpleSelect
                    options={[
                      { value: '+', label: '+' },
                      { value: '-', label: '-' },
                      { value: '*', label: 'X' },
                      { value: '/', label: '/' },
                      { value: '%', label: '%' },
                      { value: '=', label: '=' },
                    ]}
                    value={row.operacion}
                    onChange={(v) => handleChangeRow(idx, 'operacion', v)}
                  />
                </div>

                {/* Segundo Atributo / Valor Constante */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Segundo Valor
                  </label>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      checked={row.esConstante}
                      onChange={(e) =>
                        handleChangeRow(idx, 'esConstante', e.target.checked)
                      }
                      className="rounded text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-600 flex-shrink-0 lg:hidden">
                      Es valor fijo
                    </span>
                    {row.esConstante ? (
                      <input
                        type="number"
                        value={row.valorConstante ?? ''}
                        onChange={(e) =>
                          handleChangeRow(
                            idx,
                            'valorConstante',
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        placeholder="Ej: 0.19"
                        className="w-full h-10 px-3 py-2 border rounded-[8px] border-gray-300 text-[#6F6F6F] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    ) : (
                      <SimpleSelect
                        options={getAtributosByTable().map((attr) => ({
                          value: attr.nombre,
                          label: attr.nombre,
                        }))}
                        value={row.segundoAtributo}
                        onChange={(v) =>
                          handleChangeRow(idx, 'segundoAtributo', v)
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Columna de Fórmula (para previsualización) */}
                <div className="flex flex-col w-full">
                  <label className="block text-xs font-medium text-[#6F6F6F] mb-1 lg:hidden">
                    Fórmula
                  </label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg break-words w-full">
                    <p>
                      {row.primerAtributo && row.operacion
                        ? `${row.primerAtributo} ${row.operacion} ${
                            row.esConstante
                              ? row.valorConstante !== undefined &&
                                row.valorConstante !== null
                                ? row.valorConstante
                                : '[Valor Fijo]'
                              : row.segundoAtributo || '[Segundo Atributo]'
                          }`
                        : 'Complete la operación'}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="col-span-full lg:col-span-1 flex justify-center items-center gap-1 mt-2 lg:mt-0">
                  <button
                    onClick={() => handleDuplicateRuleRow(row.id)}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded-md"
                    title="Duplicar regla"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRuleRow(row.id)}
                    className="p-1 hover:bg-red-50 text-red-600 rounded-md"
                    title="Eliminar regla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {formMessage && (
            <p
              className={`text-sm mt-4 w-full text-center ${
                formMessage.includes('éxito')
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
            >
              {formMessage}
            </p>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#00A7E1] text-white px-6 py-2 font-bold rounded-3xl hover:bg-[#008ec1] mb-32"
            >
              Guardar
            </button>
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}
