'use client';
/*Lamento mucho lo complicado que quedo el codigo, solo les advierto que a veces use la variable url 
y le puse la "key" ahi dentro, y tambien decirles que el back devuelve una url prefirmada que no se 
puede utilizar en el pdf, por lo que tuve que recurir a una ruta aparte que sirve de proxy y devuelve las imagenes
sin CORS por lo que ya se pueden usar 
Porfavor tengan mucho cuidado al modificar algo de aqui, podria romperse el codigo
*/

import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { usePlaneacionStore } from '@/store/27001/use27001Store';
// import { useUserStore } from "@/store/useUserStore";
import {
  IDataTabla,
  IDataTexto,
  IDatosLado,
  IItemComplex,
  IItemImagen,
  IItemTexto,
  ISectionConfig,
  ItemFirma,
  ItemTabla,
  PageEditorProps,
} from '@/types/Planificacion/Planificacion.types';
import { userInfo } from 'node:os';
import { showErrorToast } from '@/components/feedback/toast';
import InputField from '@/components/ui/InputField';
import Button from '../landing/Button';
import { useUserStore } from '@/store/useUser';
import BotonQuality from '@/components/ui/BotonQuality';
import { filter } from 'd3-array';
import { TableEditor } from './TableEditor';
import BotonLargoQuality from '@/components/ui/BotonesLargosQuality';
import { RUTA_27001 } from '@/helpers/ruta';
import Spinner from '@/components/feedback/Spinner';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { IoIosInfinite } from 'react-icons/io';
import { CustomInputLargo } from '@/components/ui/InputTexttarea';
import { useInformesStore } from '@/store/useInformesStore';

//TODO ---- FORM QUE EDITA EL PDF----
const PageEditor: React.FC<PageEditorProps> = ({ page, onChange }) => {
  const { deleteImage } = usePlaneacionStore();
  const { uploadImage, loading } = usePlaneacionStore();
  const { informesIA, loading: loadingInformes, infoIA } = useInformesStore();
  const [modalInformesOpen, setmodalInformesOpen] = useState<boolean>(false);
  const { infoDelUsuario } = useUserStore();
  const [firstYear, setFirstYear] = useState<string>('');
  const [secondYear, setSecondYear] = useState<string>('');

  const addColumn = () => {
    const newCols = [...page.sideData, { id: uuidv4(), label: '', value: '' }];
    onChange({ ...page, sideData: newCols });
  };
  const updateColumn = (
    colId: string,
    field: keyof IDatosLado,
    val: string
  ) => {
    const cols = page.sideData.map((c) =>
      c.id === colId ? { ...c, [field]: val } : c
    );
    onChange({ ...page, sideData: cols });
  };

  const handleImageChange = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/jpg'].includes(selectedFile.type)) {
      showErrorToast('Solo se permiten JPG o JPEG');
      return;
    }
    const url = URL.createObjectURL(selectedFile);

    // Subir imagen inmediatamente
    try {
      const key = await uploadImage(selectedFile);

      const newItems = page.items.map((it) => {
        if (it.id !== id || it.tipo !== 'imagen') return it;
        return {
          ...it,
          data: {
            ...it.data,
            src: '', // ya no necesitas src local
            file: null, // ya no necesitas file local
            url, // url proxy para mostrar preview
            key, // key para guardar en el backend
          },
        } as IItemImagen;
      });

      onChange({ ...page, items: newItems });
    } catch (err) {
      showErrorToast('Error subiendo imagen');
    }
  };

  const removeColumn = (colId: string) => {
    const cols = page.sideData.filter((c) => c.id !== colId);
    onChange({ ...page, sideData: cols });
  };

  useEffect(() => {
    const hasSection = page.items.some((it) => it.tipo === 'texto');
    if (!hasSection) {
      const texto: IItemTexto = {
        id: uuidv4(),
        tipo: 'texto',
        poscicion: 0,
        data: { subtitulo: '', contenido: '' },
      };
      // Añadimos también la firma al final
      const firma: ItemFirma = {
        id: uuidv4(),
        tipo: 'firma',
        poscicion: 1,
        data: { nombre: '', cargo: '' },
      };
      onChange({ ...page, items: [texto, firma] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar

  const addImage = () => {
    const newImg: IItemImagen = {
      poscicion: page.items.length,
      id: uuidv4(),
      tipo: 'imagen',
      data: { src: '', width: 100, height: 100, file: null },
    };
    onChange({ ...page, items: [...page.items, newImg] });
  };

  const updateTabla = (id: string, newData: IDataTabla) => {
    const items = page.items.map((it) => {
      // si no es el que buscamos, lo devolvemos igual
      if (it.id !== id) return it;

      // si no es tabla, también lo devolvemos igual (por seguridad)
      if (it.tipo !== 'tabla') return it;

      // finalmente, clonamos el item y sustituimos solo el .data
      return {
        ...it,
        data: newData,
      } as ItemTabla;
    });

    onChange({ ...page, items });
  };

  const addFirma = () => {
    const newItem: ItemFirma = {
      id: uuidv4(),
      tipo: 'firma',
      poscicion: page.items.length,
      data: { nombre: '', cargo: '' },
    };
    onChange({ ...page, items: [...page.items, newItem] });
  };
  const addTable = () => {
    const newItem: ItemTabla = {
      id: uuidv4(),
      tipo: 'tabla',
      poscicion: page.items.length,
      data: {
        headers: ['Col 1', 'Col 2', 'Col 3'],
        rows: [
          ['', '', ''],
          ['', '', ''],
        ],
      },
    };
    onChange({ ...page, items: [...page.items, newItem] });
  };
  interface IDataFirma {
    nombre: string;
    cargo: string;
  }

  // En tu función updateItem:
  const updateItem = (id: string, field: string, value: string) => {
    // Validación de longitud máxima
    const maxLengths: Record<string, number> = {
      nombre: 42,
      cargo: 40,
      subtitulo: 100,
      // contenido: 500,
    };

    if (maxLengths[field] && value.length > maxLengths[field]) {
      value = value.substring(0, maxLengths[field]);
      showErrorToast(`Máximo ${maxLengths[field]} caracteres permitidos`);
    }

    const items = page.items.map((it) => {
      if (it.id !== id) return it;
      return { ...it, data: { ...it.data, [field]: value } } as IItemComplex;
    });
    onChange({ ...page, items });
  };

  // Reemplaza tu función existente por esta:
  const moveItem = (itemId: string, dir: -1 | 1) => {
    // 1) Calculamos el índice real en base al ID
    const idx = page.items.findIndex((it) => it.id === itemId);
    const target = idx + dir;
    // 2) Validamos límites
    if (idx < 0 || target < 0 || target >= page.items.length) return;
    // 3) Hacemos el intercambio
    const arr = [...page.items];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    // 4) Recalculamos posiciones
    const items = arr.map((it, i) => ({ ...it, poscicion: i }));
    onChange({ ...page, items });
  };

  const removeItem = (id: string) => {
    // 1. Encontrar el ítem a eliminar
    const itemToRemove = page.items.find((item) => item.id === id);
    // 2. Si es imagen con URL, eliminarla primero
    if (itemToRemove?.tipo === 'imagen' && itemToRemove.data.key) {
      deleteImage(itemToRemove.data.key);
    }

    // 3. Filtrar y recalcular posiciones
    const filtered = page.items
      .filter((item) => item.id !== id)
      .map((item, index) => ({
        ...item,
        poscicion: index,
      }));

    // // 4. Log y emitir cambio
    onChange({
      ...page,
      items: filtered,
    });
  };
  function groupItems(
    items: IItemComplex[]
  ): (IItemComplex[] | IItemComplex)[] {
    const groups: (IItemComplex[] | IItemComplex)[] = [];
    let buffer: IItemComplex[] = [];
    let currentTipo: 'imagen' | 'firma' | null = null;

    for (const item of items) {
      if (item.tipo === 'imagen' || item.tipo === 'firma') {
        // Si ya había un buffer y cambia el tipo, lo añadimos y reiniciamos
        if (buffer.length > 0 && currentTipo !== item.tipo) {
          groups.push(buffer);
          buffer = [];
        }
        buffer.push(item);
        currentTipo = item.tipo;
      } else {
        // Si buffer con firmas/imagenes pendiente, lo volcamos antes del elemento normal
        if (buffer.length > 0) {
          groups.push(buffer);
          buffer = [];
          currentTipo = null;
        }
        groups.push(item);
      }
    }
    // Al final, volcamos cualquier buffer pendiente
    if (buffer.length > 0) {
      groups.push(buffer);
    }
    return groups;
  }

  const addTexto = () => {
    const newItem: IItemTexto = {
      id: uuidv4(),
      tipo: 'texto',
      poscicion: page.items.length,
      data: { subtitulo: '', contenido: '' },
    };
    onChange({ ...page, items: [...page.items, newItem] });
  };

  const handleEnviarIAData = (e: any) => {
    e.preventDefault(); // Evita que el formulario se recargue

    if (!firstYear || !secondYear) {
      showErrorToast('Completa ambos campos porfavor.');
      return;
    }
    if (!infoDelUsuario.nit) {
      console.log('No hay nit');
      console.log(infoDelUsuario);
      return;
    }
    informesIA(firstYear, secondYear, infoDelUsuario.nit);
    setmodalInformesOpen(false);
  };
  return (
    <div>
      <h3 className="text-red-500 ml-[27%]">
        Las firmas iran en la parte de abajo del PDF de manera predeterminada.
      </h3>
      <div className="flex gap-6 overflow-hidden">
        {/* Datos de Lado */}
        {page.sideData.length > 0 && (
          <aside className="w-1/4 min-w-[250px] bg-gray-50 p-4 rounded-lg shadow-sm shrink-0">
            <h3 className="text-lg font-semibold mb-2">Datos de Lado</h3>
            <div className="space-y-3">
              {page.sideData.map((col) => (
                <div key={col.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex">
                      <InputField
                        placeholder="valor"
                        label="Etiqueta"
                        value={col.label}
                        onChange={(e) =>
                          updateColumn(col.id, 'label', e.target.value)
                        }
                      />
                      <button onClick={() => removeColumn(col.id)}>
                        <X size={20} />
                      </button>
                    </div>
                    <InputField
                      label="Valor"
                      value={col.value}
                      onChange={(e) =>
                        updateColumn(col.id, 'value', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
        {/* Contenedor de form firmas texto, etc */}
        <div className="flex-1 overflow-auto min-w-0">
          {groupItems(page.items).map((group, i) => {
            // Si es un array, son firmas/imágenes contiguas
            if (Array.isArray(group)) {
              return (
                <div key={i} className="flex flex-wrap gap-4 justify-start">
                  {group.map((it) => (
                    <div
                      key={it.id}
                      className="w-[30%] border p-4 rounded-lg space-y-2 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold capitalize">
                          {it.tipo}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveItem(it.id, -1)}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(it.id, 1)}
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {it.tipo === 'firma' && (
                        <>
                          <InputField
                            label="Nombre representante"
                            value={(it.data as IDataFirma).nombre}
                            onChange={(e) =>
                              updateItem(it.id, 'nombre', e.target.value)
                            }
                          />
                          <InputField
                            label="Cargo"
                            value={(it.data as IDataFirma).cargo}
                            onChange={(e) =>
                              updateItem(it.id, 'cargo', e.target.value)
                            }
                          />
                        </>
                      )}

                      {it.tipo === 'imagen' &&
                        (() => {
                          const img = it as IItemImagen;
                          const hasValidImage =
                            Boolean(img?.data?.url?.trim()) ||
                            Boolean(img?.data?.src?.trim());

                          return (
                            <>
                              <div className="mt-4 flex justify-center">
                                {hasValidImage ? (
                                  <img
                                    className="w-32 h-32 object-cover rounded"
                                    src={
                                      img.data.url?.trim() ||
                                      img.data.src?.trim()
                                    }
                                    alt="Preview"
                                  />
                                ) : (
                                  <div className="w-32 h-32 rounded bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500">
                                      Sin imagen
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg"
                                  onChange={(e) => handleImageChange(it.id, e)}
                                  className="block w-full text-sm text-gray-500 file:py-2 file:px-4 file:bg-gray-200"
                                />
                              </div>
                            </>
                          );
                        })()}
                    </div>
                  ))}
                </div>
              );
            }

            // Caso individual (texto o tabla)
            const it = group as any;
            return (
              <div
                key={it.id}
                className="border p-4 rounded-lg space-y-2 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold capitalize">{it.tipo}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveItem(it.id, -1)}>
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" onClick={() => moveItem(it.id, 1)}>
                      <ArrowDown size={16} />
                    </button>
                    <button type="button" onClick={() => removeItem(it.id)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {it.tipo === 'texto' && (
                  <>
                    <InputField
                      label="Subtítulo"
                      value={(it.data as IDataTexto).subtitulo}
                      onChange={(e) =>
                        updateItem(it.id, 'subtitulo', e.target.value)
                      }
                    />
                    <CustomInputLargo
                      label="Contenido"
                      value={(it.data as IDataTexto).contenido}
                      onChange={(e) =>
                        updateItem(it.id, 'contenido', e.target.value)
                      }
                    />
                  </>
                )}

                {it.tipo === 'tabla' && (
                  <TableEditor
                    data={(it as ItemTabla).data}
                    onChange={(newData) => updateTabla(it.id, newData)}
                  />
                )}
              </div>
            );
          })}
          <div className="flex gap-2 mt-4">
            <BotonQuality label={' Agregar Texto'} onClick={addTexto} />

            <BotonQuality label={' Agregar Imagen'} onClick={addImage} />

            <BotonQuality label={' Agregar Firma'} onClick={addFirma} />

            <BotonQuality label={' Agregar Tabla'} onClick={addTable} />

            <BotonQuality label="Agregar Side Data" onClick={addColumn} />

            <BotonQuality
              label={'Analisis Financiero IA'}
              onClick={() => {
                // showErrorToast('Funcion en desarrollo.');
                setmodalInformesOpen(true);
              }}
              variant="white"
            />
          </div>
        </div>

        {loading || loadingInformes ? <Spinner /> : ''}
        {loadingInformes ? <Spinner /> : ''}
        {/* Modal de enviar */}
        {modalInformesOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
            onClick={() => setmodalInformesOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-96 "
              onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4  ">
                Entre que fechas te gustaria generar el informe?
              </h2>
              <form onSubmit={(e) => handleEnviarIAData(e)}>
                <input
                  type="firstYear"
                  name="firstYear"
                  placeholder="Primer Año"
                  className={`w-full h-10 px-4 mt-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                  value={firstYear}
                  onChange={(e) => setFirstYear(e.target.value)}
                  required
                />
                <input
                  type="firstYear"
                  name="firstYear"
                  placeholder="Segundo Año"
                  className={`w-full h-10 px-4 mt-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                  value={secondYear}
                  onChange={(e) => setSecondYear(e.target.value)}
                  required
                />
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                    onClick={() => setmodalInformesOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                  >
                    Continuar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hooks para autoguardado via Beacon + Visibility API
 */

// type PdfPayload = ReturnType<typeof buildPdfPayload>;

function buildPdfPayload(
  title: string,
  version: string,
  codigo: string,
  date: string,
  id: string,
  sections: any[]
) {
  return {
    titulo: title,
    versionDocumento: version,
    itemID: id,
    codigo,
    fechaCreacion: date,
    sections: sections.map((pg, secIndex) => ({
      poscicion: secIndex,
      sideData: pg.sideData.map((col: any, idx: number) => ({
        id: col.id,
        label: col.label,
        value: col.value,
        poscicion: idx,
      })),
      items: pg.items.map((it: any) => {
        if (it.tipo === 'imagen') {
          return {
            id: it.id,
            tipo: it.tipo,
            poscicion: it.poscicion,
            data: {
              width: it.data.width,
              height: it.data.height,
              urlImagen: it.data.key || '', // asume que ya tienes la key
            },
          };
        }
        return {
          id: it.id,
          tipo: it.tipo,
          poscicion: it.poscicion,
          data: it.data,
        };
      }),
    })),
  };
}

// hooks/useAutoSaveFetch.ts
export function useAutoSaveFetch(
  title: string,
  version: string,
  codigo: string,
  date: string,
  id: string,
  sections: any[]
): () => void {
  const buildPayload = useCallback(() => {
    return buildPdfPayload(title, version, codigo, date, id, sections);
  }, [title, version, codigo, date, id, sections]);

  const send = useCallback(() => {
    // console.log('tick');

    const endpoint = `${RUTA_27001}planeacion/pdf`;
    const token = getTokenFromCookies();
    if (!token) return;

    const payload = buildPayload();

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true, // necesario para cerrar pestaña
    });
  }, [buildPayload]);

  useEffect(() => {
    const handleUnload = () => send();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        send();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [send]);

  return send; // lo exponemos para usarlo en debounce
}

export function useDebouncedEffect(
  effect: () => void,
  deps: any[],
  delay: number
) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

//TODO ---- EL GENERADOR DEL PDF ----
export const PdfGenerator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { infoIA } = useInformesStore();

  const { traerInfoDeUsuarios, infoDelUsuario, todaLaInfoUsuario } =
    useUserStore();
  const {
    listaDeItems,
    fetchPDFInfo,
    postPDF,
    info,
    deleteImage,
    proxyImage,
    cleanPDFData,
    fetchLista,
  } = usePlaneacionStore();
  // const { fetchUserInfo, fotoDePerfilURL, infoDelUsuario } = useUserStore();

  const [title, setTitle] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [heatherTitle, setHeatherTitle] = useState<string>('');
  const [codigoItem, setCodigoItem] = useState<string>('');

  // Páginas
  const [sections, setPages] = useState<ISectionConfig[]>([
    { id: uuidv4(), sideData: [], items: [], poscicion: 0 },
  ]);
  const [activePageId, setActivePageId] = useState<string>(sections[0].id);
  const [PDFLib, setPDFLib] = useState<any>(null);
  const [styles, setStyles] = useState<any>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  // const params = useParams();
  useAutoSaveFetch(title, version, codigo, date, id!, sections);
  const saveNow = useAutoSaveFetch(title, version, codigo, date, id!, sections);

  // Esto asegura que cada cambio en los datos dispare el guardado tras 2 segundos
  useDebouncedEffect(
    () => {
      saveNow();
    },
    [title, version, codigo, date, sections],
    2000
  );

  useEffect(() => {
    fetchPDFInfo(Number(id));
    traerInfoDeUsuarios();
    fetchLista();
  }, []);

  useEffect(() => {
    if (!Array.isArray(listaDeItems)) return;
    const item = listaDeItems.find((it) => it.id === Number(id));
    if (!item) {
      fetchLista();
      return;
    }
    setHeatherTitle(String(item.actividad));
    setCodigoItem(String(item.codigo));
  }, [listaDeItems]);

  //?El quie pone la informacion que trae la ruta IA
  useEffect(() => {
    if (!infoIA) return;

    // Si infoIA viene como array, tomamos el primer elemento
    const data = Array.isArray(infoIA) ? infoIA[0] : infoIA;

    // Validamos que data.clientes sea un array
    if (!Array.isArray(data.clientes)) {
      console.warn('infoIA.clientes no es un array:', data.clientes);
      return;
    }

    // 1. Crear ítem de análisis
    const analisisItem: IItemTexto = {
      id: uuidv4(),
      tipo: 'texto',
      poscicion: 0,
      data: {
        subtitulo: 'Análisis',
        contenido: data.análisis ?? '',
      },
    };

    // 2. Crear ítem de análisis general
    const analisisGeneralItem: IItemTexto = {
      id: uuidv4(),
      tipo: 'texto',
      poscicion: 1,
      data: {
        subtitulo: 'Análisis General',
        contenido: data.análisis_general ?? '',
      },
    };

    // 3. Crear ítem de tabla con datos de clientes
    const tablaClientes: ItemTabla = {
      id: uuidv4(),
      tipo: 'tabla',
      poscicion: 2,
      data: {
        headers: [
          'Nombre',
          'Total Último Año',
          'Total Año Anterior',
          'Variación',
          'Porcentaje',
        ],
        rows: data.clientes.map((c: any) => [
          c.nombre,
          c.total_ultimo_anio,
          c.total_anio_anterior,
          c.variacion,
          c.porcentaje,
        ]),
      },
    };

    // 4. Empaquetamos en una nueva sección
    const nuevaSeccion: ISectionConfig = {
      id: uuidv4(),
      poscicion: sections.length,
      sideData: [],
      items: [analisisItem, analisisGeneralItem, tablaClientes],
    };

    setPages((prev) => [...prev, nuevaSeccion]);
    setActivePageId(nuevaSeccion.id);
  }, [infoIA]);

  //!EL QUE PONE LA INFORMACION EN EL FRONT
  useEffect(() => {
    if (!info || info.secciones.length < 1) return;
    const processData = async () => {
      setTitle(String(info.titulo));
      setCodigo(String(info.codigo));
      setVersion(String(info.versionDocumento));
      setDate(info.fechaCreacion.slice(0, 10));

      const sortedSecs = [...info.secciones].sort(
        (a, b) => Number(a.poscicion) - Number(b.poscicion)
      );

      const mappedSections: ISectionConfig[] = await Promise.all(
        sortedSecs.map(async (sec) => {
          const sortedSide = [...(sec.sideData || [])]
            .sort((a, b) => Number(a.poscicion) - Number(b.poscicion))
            .map((col) => ({
              id: col.id,
              label: col.etiqueta,
              value: col.contenido,
              poscicion: Number(col.poscicion),
            }));

          const sortedItems = [...sec.items].sort(
            (a, b) => Number(a.poscicion) - Number(b.poscicion)
          );

          const items: IItemComplex[] = await Promise.all(
            sortedItems.map(async (it): Promise<IItemComplex> => {
              switch (it.tipo) {
                case 'imagen': {
                  const img = it.imagenes?.[0] || {};
                  return {
                    id: it.id,
                    tipo: 'imagen',
                    poscicion: Number(it.poscicion),
                    data: {
                      src: img.src || '',
                      width: img.anchura ?? img.width ?? 100,
                      height: img.altura ?? img.height ?? 100,
                      file: null,
                      url: await proxyImage(img.url || ''), //ESTA ES LA URL PREFIRMADA CONVERTIDA A PROXY
                      key: img.key || '',
                    },
                  };
                }

                case 'texto': {
                  const txt = it.textos?.[0] || {
                    subtitulo: '',
                    contenido: '',
                  };
                  return {
                    id: it.id,
                    tipo: 'texto',
                    poscicion: Number(it.poscicion),
                    data: {
                      subtitulo: txt.subtitulo,
                      contenido: txt.contenido,
                    },
                  };
                }

                case 'firma': {
                  const sig = it.firmas?.[0] || { nombre: '', cargo: '' };
                  return {
                    id: it.id,
                    tipo: 'firma',
                    poscicion: Number(it.poscicion),
                    data: {
                      nombre: sig.nombre,
                      cargo: sig.cargo,
                    },
                  };
                }

                case 'tabla': {
                  const tbl = it.tablas?.[0] || { headers: [], rows: [] };
                  return {
                    id: it.id,
                    tipo: 'tabla',
                    poscicion: Number(it.poscicion),
                    data: {
                      headers: tbl.headers,
                      rows: tbl.rows,
                    },
                  };
                }

                default: {
                  // Si llega algo inesperado, lo ignoramos con tipo seguro
                  throw new Error(`Tipo de ítem desconocido: ${it.tipo}`);
                }
              }
            })
          );

          return {
            id: sec.id,
            poscicion: Number(sec.poscicion),
            sideData: sortedSide,
            items,
          };
        })
      );

      setPages(mappedSections);
      if (mappedSections.length > 0) {
        setActivePageId(mappedSections[0].id);
      }
      setShowPreview(false);
    };

    processData();
  }, [info]);

  // Página CRUD
  const addPage = () => {
    const sectionItem: IItemTexto = {
      id: uuidv4(),
      tipo: 'texto',
      poscicion: 0,
      data: { subtitulo: '', contenido: '' },
    };

    const firmaItem: ItemFirma = {
      id: uuidv4(),
      tipo: 'firma',
      poscicion: 1,
      data: { nombre: '', cargo: '' },
    };

    const newPage: ISectionConfig = {
      id: uuidv4(),
      sideData: [],
      poscicion: 1,

      items: [sectionItem, firmaItem],
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setShowPreview(false);
  };

  const hasTextContent = () => {
    return sections.some((sec) =>
      sec.items.some(
        (it) => it.tipo === 'texto' && it.data.contenido.trim() !== ''
      )
    );
  };

  const updatePage = (pageId: string, updated: ISectionConfig) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)));
    setShowPreview(false);
  };

  const hasActiveSection = sections
    .find((p) => p.id === activePageId)
    ?.items.some((it) => it.tipo === 'texto');

  /* Actualización de handleSubmit para subir cada imagen y asignar su URL en el campo urlImagen */

  const handleSubmit = async (wannaShowToast: boolean) => {
    if (!hasTextContent()) {
      if (!wannaShowToast) return;
      showErrorToast(
        'Debe haber al menos un texto con contenido para poder guardar.'
      );
      return;
    }

    const payload = {
      titulo: title,
      versionDocumento: version,
      itemID: id,
      codigo,
      fechaCreacion: date,
      sections: sections.map((pg, secIndex) => ({
        poscicion: secIndex,
        sideData: pg.sideData.map((col, idx) => ({
          id: col.id,
          label: col.label,
          value: col.value,
          poscicion: idx,
        })),
        items: pg.items.map((it) => {
          if (it.tipo === 'imagen') {
            return {
              id: it.id,
              tipo: it.tipo,
              poscicion: it.poscicion,
              data: {
                width: it.data.width,
                height: it.data.height,
                urlImagen: it.data.key, // ya está la key aquí
              },
            };
          }

          return {
            id: it.id,
            tipo: it.tipo,
            poscicion: it.poscicion,
            data: it.data,
          };
        }),
      })),
    };

    console.log('Payload final:', payload);

    postPDF(payload, wannaShowToast);
  };

  // En tu componente / handler:
  const handleRemoveSeccion = async (pgId: string) => {
    const pageToDelete = sections.find((p) => p.id === pgId);
    if (!pageToDelete) return;

    // Aquí el type guard:
    const imageItems = pageToDelete.items.filter(
      (item): item is IItemImagen =>
        item.tipo === 'imagen' &&
        typeof item.data.url === 'string' &&
        item.data.url.length > 0
    );

    // Ahora TS sabe que imageItems es IItemImagen[]
    const results = await Promise.allSettled(
      imageItems.map((img) => deleteImage(img.data.key!))
    );

    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        console.error(`Error eliminando imagen #${idx}:`, res.reason);
      }
    });

    // Actualiza UI
    setShowPreview(false);
    const newPages = sections.filter((p) => p.id !== pgId);
    setPages(newPages);
    setActivePageId(newPages[0]?.id || '');
  };

  const handleInfoShow = async () => {
    await fetchPDFInfo(Number(id));
  };

  const handleArrowBack = () => {
    handleSubmit(false);
    resetFormState();
    cleanPDFData();
    router.push('/estadosFinancieros/planificacion');
  };

  const resetFormState = () => {
    setTitle('');
    setVersion('');
    setCodigo('');
    setDate(new Date().toISOString().slice(0, 10));
    setHeatherTitle('');
    setCodigoItem('');
    setPages([{ id: uuidv4(), sideData: [], items: [], poscicion: 0 }]);
    setActivePageId(sections[0].id);
    const firstSectionId = uuidv4();
    setPages([{ id: firstSectionId, sideData: [], items: [], poscicion: 0 }]);
    setActivePageId(firstSectionId);
    setPDFLib(null);
    setStyles(null);
    setShowPreview(false);
  };

  // PDF Styles
  useEffect(() => {
    import('@react-pdf/renderer').then((mod) => {
      setPDFLib(mod);
      const ss = mod.StyleSheet.create({
        page: { padding: 20, fontSize: 12, flexDirection: 'column' },
        leftColumn: {
          width: 100,
          borderRightWidth: 1,
          borderColor: '#000',
          paddingRight: 8,
        },
        mainContent: { flex: 1, paddingLeft: 8 },
        header: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          marginBottom: 15,
          borderColor: '#000',
        },
        logo: {
          width: 80,
          height: 80,
          resizeMode: 'contain',
          padding: 4,
          borderColor: '#000',
          borderRightWidth: 1,
        },
        contenido: {
          flex: 1,
          flexDirection: 'row',
        },
        headerInfo: {
          flex: 1,
          height: 80,
          borderColor: '#000',
          borderRightWidth: 1,
        },

        containerPagina: {
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingBottom: 20,
        },
        description: {
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 20,
          marginBottom: 4,
        },
        title: { fontSize: 16, textAlign: 'center' },
        meta: { width: 100, textAlign: 'right' },
        datosExtra: {
          fontSize: 12,
          borderBottomWidth: 1,
          padding: 2,
          textAlign: 'center',
        },
        date: { fontSize: 12, padding: 2, textAlign: 'center' },
        texto: { marginBottom: 15, padding: 8 },
        sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
        sectionContent: {
          fontSize: 12,
          textAlign: 'justify',
          // textJustify: 'inter-word',
          lineHeight: 1.5,
        },

        firmaContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          paddingTop: 10,
          // borderTopWidth: 1,
          // borderColor: "#000",
        },

        firmaItem: {
          width: '30%',
          padding: 8,
          alignItems: 'center',
        },
        table: {
          // display: 'table',
          width: 'auto', // o un % fijo como '100%'
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#000',
          marginBottom: 12,
        },
        // Cada fila
        tableRow: {
          flexDirection: 'row',
        },
        // Celda de cabecera
        tableColHeader: {
          width: '33%', // ajusta según número de columnas
          borderStyle: 'solid',
          borderBottomWidth: 1,
          borderBottomColor: '#000',
          paddingVertical: 4,
          paddingHorizontal: 2,
          backgroundColor: '#f0f0f0', // opcional para resaltar header
        },
        // Celda de datos
        tableCol: {
          width: '33%',
          borderStyle: 'solid',
          borderBottomWidth: 1,
          borderBottomColor: '#ccc',
          paddingVertical: 4,
          paddingHorizontal: 2,
        },
        // Texto cabecera
        tableCellHeader: {
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        // Texto de celda
        tableCell: {
          fontSize: 10,
          textAlign: 'center',
        },
        firmaLine: {
          fontSize: 12,
          marginBottom: 2,
          textAlign: 'center',
        },
        imageBlockContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 15,
        },
        imageItem: {
          width: '33.33%',
          padding: 4,
          marginBottom: 8,
          alignItems: 'center',
        },
        lineaArriba: {
          marginTop: 70,
          width: '100%',
          borderTopWidth: 2,
          borderColor: '#000',
          marginBottom: 6,
        },
      });
      setStyles(ss);
    });
  }, []);

  //La estructura que tendra el pdf
  const generatePdfDocument = () => {
    const { Document, Page: PDFPage, Text, View, Image } = PDFLib;

    const docs = sections.map((pg) => {
      const sorted = [...pg.items].sort((a, b) => a.poscicion - b.poscicion);

      // Tipamos blocks incluyendo también tablas
      const blocks: (IItemImagen[] | IItemTexto | ItemFirma | ItemTabla)[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.tipo === 'imagen') {
          // tomamos el último bloque y verificamos si es un array de imágenes
          const prev = blocks[blocks.length - 1];
          if (Array.isArray(prev) && prev[0].tipo === 'imagen') {
            // hacemos el cast para que TS entienda que prev es IItemImagen[]
            (prev as IItemImagen[]).push(it as IItemImagen);
          } else {
            blocks.push([it as IItemImagen]);
          }
        } else {
          // texto, firma o tabla van como elementos sueltos
          blocks.push(it as IItemTexto | ItemFirma | ItemTabla);
        }
      }

      const firmas = pg.items.filter(
        (it) => it.tipo === 'firma'
      ) as ItemFirma[];
      const hasCols = pg.sideData.length > 0;
      console.log(infoDelUsuario);
      return (
        <PDFPage key={pg.id} size="A4" style={styles.page}>
          <View style={styles.containerPagina}>
            {/* HEADER */}
            <View style={styles.header} fixed>
              <Image src={infoDelUsuario.imagen} style={styles.logo} />
              <View style={styles.headerInfo}>
                <Text style={styles.description}>{infoDelUsuario.nombre}</Text>
                <Text style={styles.title}>NIT: {infoDelUsuario.nit}</Text>
                <Text style={styles.title}>{heatherTitle}</Text>
                <Text style={styles.title}>{title}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.datosExtra}>Versión: {version}</Text>
                <Text style={styles.datosExtra}>{codigo}</Text>
                <Text style={styles.date}>{date}</Text>
              </View>
            </View>

            <View
              style={[
                styles.contenido,
                !hasCols && { flexDirection: 'column', paddingLeft: 0 },
              ]}
            >
              {/* Columnas ( si hay) */}
              {hasCols && (
                <View style={styles.leftColumn}>
                  {pg.sideData.map((col) => (
                    <View
                      key={col.id}
                      style={{
                        marginBottom: 30,
                        marginTop: 10,
                        paddingHorizontal: 4, // en lugar de marginLeft
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          maxWidth: 100,
                          wordBreak: 'break-word',
                        }}
                      >
                        {col.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          maxWidth: 100,
                          wordBreak: 'break-word',
                        }}
                      >
                        {col.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contenido de texto */}
              <View style={{ flex: 1, paddingLeft: hasCols ? 8 : 0 }}>
                {blocks.map((block, idx) => {
                  // Grupo de imágenes
                  if (Array.isArray(block)) {
                    return (
                      <View key={idx} style={styles.imageBlockContainer}>
                        {block.map((img) => (
                          <View key={img.id} style={styles.imageItem}>
                            {img.data.url?.trim() ? (
                              <Image
                                src={img.data.url}
                                style={{
                                  width: img.data.width,
                                  height: img.data.height,
                                  objectFit: 'cover',
                                }}
                              />
                            ) : img.data.src?.trim() ? (
                              <Image
                                src={img.data.src}
                                style={{
                                  width: img.data.width,
                                  height: img.data.height,
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <Text style={{ fontSize: 10, color: '#888' }}>
                                Sin imagen
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  }

                  // Texto
                  if (block.tipo === 'texto') {
                    const txt = block;
                    return (
                      <View key={txt.id} style={styles.texto}>
                        <Text style={styles.sectionTitle}>
                          {txt.data.subtitulo}
                        </Text>
                        <Text style={styles.sectionContent}>
                          {txt.data.contenido}
                        </Text>
                      </View>
                    );
                  }

                  // Tabla
                  if (block.tipo === 'tabla') {
                    const tbl = block;
                    return (
                      <View key={tbl.id} style={styles.table}>
                        {/* HEADER ROW */}
                        <View style={styles.tableRow}>
                          {tbl.data.headers.map((header, i) => (
                            <View key={i} style={styles.tableColHeader}>
                              <Text style={styles.tableCellHeader}>
                                {header}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {/* DATA ROWS */}
                        {tbl.data.rows.map((row, rowIndex) => (
                          <View key={rowIndex} style={styles.tableRow}>
                            {row.map((cell, cellIndex) => (
                              <View key={cellIndex} style={styles.tableCol}>
                                <Text style={styles.tableCell}>{cell}</Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    );
                  }

                  // Ignorar firma aquí
                  return null;
                })}
              </View>
            </View>
            {/* FIRMAS SIEMPRE AL PIE */}
            {firmas.length > 0 && (
              <View wrap={false} style={styles.firmasWrapper}>
                <View style={styles.firmaContainer}>
                  {firmas.map((f) => (
                    <View key={f.id} style={styles.firmaItem}>
                      <Text style={styles.lineaArriba} />
                      <Text style={styles.firmaLine}>{f.data.nombre}</Text>
                      <Text style={styles.firmaLine}>{f.data.cargo}</Text>
                      <Text style={styles.firmaLine}>
                        {todaLaInfoUsuario?.usuario || 'No hay nombre'}
                      </Text>
                      <Text style={styles.firmaLine}>
                        {todaLaInfoUsuario?.nit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </PDFPage>
      );
    });

    return <Document>{docs}</Document>;
  };

  if (!PDFLib || !styles)
    return <div className="p-4">Cargando módulo de PDF...</div>;
  const { PDFViewer } = PDFLib;

  return (
    <div>
      <div className="flex h-full bg-white rounded-2xl text-[#6F6F6F]">
        <div className="w-full p-4 space-y-4 overflow-auto">
          <div className="flex items-center mb-4">
            <ArrowLeft onClick={handleArrowBack} />
            <h1 className="text-2xl ml-4 font-bold" onClick={handleInfoShow}>
              Creando PDF: {codigoItem} - {heatherTitle}
            </h1>
          </div>
          <div className="flex justify-end gap-2">
            <BotonQuality
              onClick={() => {
                if (!hasActiveSection) {
                  showErrorToast('Agrega al menos una sección');
                  return;
                }
                setShowPreview((v) => !v);
              }}
              label={
                showPreview ? 'Ocultar previsualización' : 'Previsualizar PDF'
              }
            />

            <BotonQuality
              onClick={() => handleSubmit(true)} //el true es si quiro mostrar toast
              label={'Guardar'}
            />
          </div>

          <div className="flex w-full gap-4   ">
            <div className="flex-col w-full ">
              <CustomInputLargo
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <InputField
                label="Versión Documento"
                type="number"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div className="flex-col w-full">
              <InputField
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <InputField
                label="Fecha"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Pestañas de Seccion */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {sections.map((pg, i) => (
              <div key={pg.id} className="flex items-center gap-1">
                <BotonQuality
                  onClick={() => setActivePageId(pg.id)}
                  variant={pg.id === activePageId ? 'blue' : 'white'}
                  label={`Seccion ${i + 1}`}
                />
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSeccion(pg.id)}
                    className="text-red-500"
                    title="Eliminar seccion"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}

            <BotonQuality label={'Agregar Seccion'} onClick={addPage} />
          </div>

          {/* Editor de página activa */}
          {sections
            .filter((pg) => pg.id === activePageId)
            .map((pg) => (
              <PageEditor
                key={pg.id}
                page={pg}
                onChange={(updated) => updatePage(pg.id, updated)}
              />
            ))}
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[199]"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative w-[70%] h-[90%]" // ① contenedor relativo
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowLeft
              onClick={() => setShowPreview(false)}
              className="absolute -left-10    top-8  cursor-pointer"
            />
            <PDFViewer width="100%" height="100%">
              {generatePdfDocument()}
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
};
