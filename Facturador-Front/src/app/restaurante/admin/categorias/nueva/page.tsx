'use client';

import React, { useEffect } from 'react';
import { useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import InputField from '@/components/ui/InputField';
import BotonSubirArchivos from '@/components/ui/botonSubirArchivos';
import AdminLayoutRestaurante from '@/app/restaurante/AdminLayout';
import { MdArrowBack } from 'react-icons/md';
import { useRouter } from 'next/navigation';

const documentosElectronicos = [
  'Factura de Venta',
  'factura de compra',
  'Nomina electronica',
  'Documento soporte',
  'Documentos equivalentes',
  'Notas contables',
  'Comprobante de egreso',
  'Recibo de caja',
];
const tablas = ['Facturas', 'Compras', 'Notas Credito'];

const procesos = ['Venta', 'Compra', 'Nomina'];

const optionsTipos = [
  'ACTIVO',
  'PASIVO',
  'PATRIMONIO',
  'INGRESO',
  'GASTO',
  'COSTO',
  'OTROS',
];

const atributosFacturas = [
  { id: '1', nombre: 'Valor Total' },
  { id: '2', nombre: 'Valor Iva' },
  { id: '3', nombre: 'VALORSUBTOTAL' },
  { id: '4', nombre: 'ADMINISTRACION_PESOS' },
  { id: '5', nombre: 'IMPREVISTOS_PESOS' },
  { id: '6', nombre: 'UTILIDAD_PESOS' },
  { id: '7', nombre: 'ANTICIPO' },
];

const atributosNotasCredito = [
  { id: '1', nombre: 'SUBTOTAL_SIN_AIU' },
  { id: '2', nombre: 'ADMINISTRACION' },
  { id: '3', nombre: ' IMPREVISTOS' },
  { id: '4', nombre: 'UTILIDAD' },
  { id: '5', nombre: 'IVA' },
  { id: '6', nombre: 'TOTAL' },
];

const atributosCompras = [
  { id: '1', nombre: 'RETEICA' },
  { id: '2', nombre: 'RETEFUENTE' },
  { id: '3', nombre: ' IVA' },
  { id: '4', nombre: 'SUBTOTAL' },
  { id: '5', nombre: 'ANTICIPO' },
  { id: '6', nombre: 'TOTAL' },
];

const debitoOCredito = ['Debito', 'Credito'];

type RowData = {
  categoria: string;
  descripcionCategoria: string;
  documentosElectronicos: string;
  tipos: string;
  ladoDeContabilidad: string;
  primerAtributo: string;
  operacion: string;
  segundoAtributo: string;
};

const defaultRow: RowData = {
  categoria: '',
  descripcionCategoria: '',
  documentosElectronicos: '',
  tipos: '',
  ladoDeContabilidad: '',
  primerAtributo: '',
  operacion: '+',
  segundoAtributo: '',
};
export default function Categorias() {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const router = useRouter();

  const handleAgregar = () => {
    if (nuevaCategoria.trim() === '') return;
    setCategorias([...categorias, nuevaCategoria]);
    setNuevaCategoria('');
  };

  const { categoriasListas, fetchCategoriasCincoAlOcho } = useDatosExtraStore();

  // Select global de tablas
  const [tablaSeleccionada, setTablaSeleccionada] = useState<string>('');
  const [procesoSeleccioado, setProcesoSeleccioado] = useState<string>('');

  const [nombre, setNombre] = useState<string>('');
  const [imagen, setImagen] = useState<File | null>(null);

  const [rows, setRows] = useState<RowData[]>([{ ...defaultRow }]);

  useEffect(() => {
    // fetchCategoriasCincoAlOcho();
  }, []);

  // Obtiene atributos según la tabla global
  const getAtributos = () => {
    if (tablaSeleccionada === 'Facturas') return atributosFacturas;
    if (tablaSeleccionada === 'Compras') return atributosCompras;
    if (tablaSeleccionada === 'Notas Credito') return atributosNotasCredito;
    return [];
  };

  const handleAgregarFila = () => {
    setRows((prev) => [...prev, { ...defaultRow }]);
  };

  const handleChange = (idx: number, field: keyof RowData, value: any) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = () => {
    // console.log('Datos a enviar:', {
    //   tabla: tablaSeleccionada,
    //   datos: rows,
    //   imagen,
    //   procesoSeleccioado,
    //   nombre,
    // });
    // TODO: enviar al backend
  };

  const handleChangeName = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { value } = e.target;
    setNombre(value);
  };

  const handleSubidaImagen = (file: File | null) => {
    setImagen(file);
  };

  const btnStyle =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] rounded-[20px] hover:bg-[#EDEFF3] transition-all';

  return (
    <AdminLayoutRestaurante>
      <MdArrowBack
        onClick={() => router.back()}
        className="text-[#05264E] text-base cursor-pointer mb-4"
      />

      <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full overflow-auto overflow-y-hidden">
        <h1 className="text-3xl font-bold text-[#6F6F6F] mb-6">
          Crear categoría
        </h1>

        {/* Select global de Tabla y botón de agregar fila */}
        <div className="flex items-end mb-4 space-x-4 mt-4">
          <div className="w-60">
            <InputField
              label="Nombre"
              value={nombre}
              onChange={handleChangeName}
              placeholder="Nombre"
            />
          </div>

          <div className="w-1/4">
            <label className="block text-sm font-medium text-[#6F6F6F]">
              Elegir Tabla
            </label>
            <div className="mt-2">
              <SimpleSelect
                options={tablas}
                width="100%"
                value={tablaSeleccionada}
                onChange={(v) => setTablaSeleccionada(v)}
              />
            </div>
          </div>

          <div className="w-1/4">
            <label className="block text-sm font-medium text-[#6F6F6F]">
              Proceso
            </label>
            <div className="mt-2">
              <SimpleSelect
                options={procesos}
                width="100%"
                value={procesoSeleccioado}
                onChange={(v) => setProcesoSeleccioado(v)}
              />
            </div>
          </div>
          {/* 
          <BotonSubirArchivos
            label={'Subir Imagen'}
            onSubmit={handleSubidaImagen}
          /> */}
          <button onClick={handleAgregarFila} className={btnStyle}>
            Agregar Fila
          </button>
        </div>

        {/* Encabezados de columnas */}
        <div className="flex bg-white py-2 px-4 rounded-t-lg font-bold text-sm text-[#6F6F6F]">
          {[
            'Cuentas PUC',
            'Descripción',
            'Doc. Electrónicos',
            'Tipos',
            'Deb/Cred',
            'Prim. Atributo',
            'Operación',
            'Seg. Atributo',
          ].map((title) => (
            <div key={title} className="flex-1 px-2">
              {title}
            </div>
          ))}
        </div>

        {/* Filas dinámicas */}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex bg-white py-4 px-4 border-t last:border-b gap-2"
          >
            {/* Categoría */}
            <div className="w-[12.5%] px-2 overflow-visible">
              <SelectConSearch
                options={categoriasListas}
                placeholder="Buscar..."
                value={row.categoria}
                onChange={(v) => handleChange(idx, 'categoria', v)}
              />
            </div>
            {/* Descripción Categoría */}
            <div className="flex-[2] px-2">
              <input
                type="text"
                name="descripcionCategoria"
                value={
                  // busco en tu array la categoría cuyo id coincide con row.categoria
                  categoriasListas.find((cat) => cat.id === row.categoria)
                    ?.nombre || ''
                }
                readOnly
                placeholder="Descripción categoría"
                className="w-full h-10 px-4 border rounded-[25px] border-[#00A7E1] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
              />
            </div>
            {/* Documentos Electrónicos */}
            <div className="flex-[2] px-2 ">
              <SimpleSelect
                options={documentosElectronicos}
                width="100%"
                value={row.documentosElectronicos}
                onChange={(v) => handleChange(idx, 'documentosElectronicos', v)}
              />
            </div>
            {/* Tipos */}
            <div className="flex-[2] px-2">
              <SimpleSelect
                options={optionsTipos}
                width="100%"
                value={row.tipos}
                onChange={(v) => handleChange(idx, 'tipos', v)}
              />
            </div>
            {/* Debito/Credito */}
            <div className="flex-[2] px-2">
              <SimpleSelect
                options={debitoOCredito}
                width="100%"
                value={row.ladoDeContabilidad}
                onChange={(v) => handleChange(idx, 'ladoDeContabilidad', v)}
              />
            </div>
            {/* Primer Atributo */}
            <div className="flex-[2] px-2">
              <SimpleSelect
                options={getAtributos()}
                width="100%"
                value={row.primerAtributo}
                onChange={(v) => handleChange(idx, 'primerAtributo', v)}
              />
            </div>
            {/* Operación */}
            <div className="w-20 px-2">
              <SimpleSelect
                options={[
                  { value: '+', label: '+' },
                  { value: '-', label: '-' },
                  { value: '*', label: 'X' },
                  { value: '/', label: '/' },
                  { value: '%', label: '%' },
                ]}
                width="100%"
                value={row.operacion}
                onChange={(v) => handleChange(idx, 'operacion', v)}
              />
            </div>
            {/* Segundo Atributo */}
            <div className="flex-[2] px-2">
              <SimpleSelect
                options={getAtributos()}
                width="100%"
                value={row.segundoAtributo}
                onChange={(v) => handleChange(idx, 'segundoAtributo', v)}
              />
            </div>
          </div>
        ))}

        {/* Botón Guardar */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#00A7E1] text-white px-6 py-2 font-bold rounded-3xl hover:bg-[#008ec1]"
          >
            Guardar
          </button>
        </div>
      </div>
    </AdminLayoutRestaurante>
  );
}
