"use client";

import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import React, { useState, useRef, useCallback, ReactNode, ChangeEvent, useMemo, useEffect } from 'react';
import { useFixedAssetsStore } from '@/store/Inventario/useFixedAssets';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { CreateFixedAssetDto, FixedAssetDto, NiifSummary, AssetSummary } from '@/types/fixed-assets';
import { useRouter } from 'next/navigation';
type MetodoDepreciacion = 'linea-recta' | 'saldos-decrecientes';
type UbicacionValue = string;
type ResponsableValue = string;
type ClasificacionValue = 'equipo-computo' | 'mobiliario' | 'maquinaria';
interface SelectOption {
    value: string;
    label: string;
}
interface ActivoData {
    id: number;
    descripcion: string;
    codigoBarras: string;
    ubicacion: UbicacionValue | '';
    responsable: ResponsableValue | '';
    fechaCompra: string;
    valorCompra: string;
    vidaUtil: number | '';
    metodDepreciacion: MetodoDepreciacion | '';
    codigoPuc: string;
    clasificacion: ClasificacionValue | '';
    notaContable: string;
    errors: Partial<Record<keyof ActivoData, string>>;
}

const cn = (...classes: (string | boolean | undefined)[]): string => classes.filter(Boolean).join(' ');

const metodos: SelectOption[] = [
    { value: 'linea-recta', label: 'Línea Recta' },
    { value: 'saldos-decrecientes', label: 'Saldos Decrecientes' },
];

const clasificaciones: SelectOption[] = [
    { value: 'equipo-computo', label: 'Equipo de Cómputo' },
    { value: 'mobiliario', label: 'Mobiliario' },
    { value: 'maquinaria', label: 'Maquinaria' },
];

const calcularPorcentaje = (vidaUtil: number | string, metodo: MetodoDepreciacion | ''): number => {
    const util = parseInt(vidaUtil as string) || 0;
    if (util === 0 || metodo === '') return 0;

    let porcentaje = 0;
    switch (metodo) {
        case 'linea-recta':
            porcentaje = (1 / util) * 100;
            break;
        case 'saldos-decrecientes':
            porcentaje = (2 / util) * 100;
            break;
    }
    return Number(porcentaje.toFixed(2));
};

const createNewRow = (id: number, previousActivo?: ActivoData): ActivoData => ({
    id,
    descripcion: previousActivo?.descripcion || '',
    codigoBarras: '',
    ubicacion: previousActivo?.ubicacion || ('' as UbicacionValue | ''),
    responsable: previousActivo?.responsable || ('' as ResponsableValue | ''),
    fechaCompra: previousActivo?.fechaCompra || new Date().toISOString().split('T')[0],
    valorCompra: previousActivo?.valorCompra || '',
    vidaUtil: previousActivo?.vidaUtil || 0,
    metodDepreciacion: previousActivo?.metodDepreciacion || ('' as MetodoDepreciacion | ''),
    codigoPuc: previousActivo?.codigoPuc || '',
    clasificacion: previousActivo?.clasificacion || ('' as ClasificacionValue | ''),
    notaContable: previousActivo?.notaContable || '',
    errors: {},
});

interface SimpleComponentProps { children: ReactNode; className?: string; }
const Card = ({ children, className }: SimpleComponentProps) => (<div className={cn("rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg", className)}> {children} </div>);
const CardContent = ({ children, className }: SimpleComponentProps) => (<div className={cn("p-0 pt-0", className)}>{children}</div>);
interface ButtonProps { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; }
const Button = ({ children, onClick, className, type = "button", disabled = false }: ButtonProps) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2", className)}
    >
        {children}
    </button>
);
interface ToastProps { message: string; show: boolean; className?: string; }
const Toast = ({ message, show, className }: ToastProps) => (
    <div
        className={cn("fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white", show ? 'bg-green-500 transition-opacity duration-300' : 'hidden opacity-0', className)}
        role="alert"
        aria-live="assertive"
    >
        {message}
    </div>
);
interface SearchableSelectProps {
    name: keyof ActivoData;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    options: string[];
    placeholder: string;
    error: string | undefined;
    baseInputClass: string;
}
const SearchableSelect = React.memo(({ name, value, onChange, options, placeholder, error, baseInputClass }: SearchableSelectProps) => {

    const [searchTerm, setSearchTerm] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownWidth, setDropdownWidth] = useState<number | 'auto'>('auto');
    const measureInputWidth = useCallback(() => {
        if (inputRef.current) {
            setDropdownWidth(inputRef.current.offsetWidth);
        }
    }, []);

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const filteredOptions = useMemo(() => {
        const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
        if (!searchTerm) return uniqueOptions;
        return uniqueOptions.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, options]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value: inputValue } = e.target;
        setSearchTerm(inputValue);
        setIsOpen(true);
        onChange({
            target: { name, value: inputValue } as unknown as HTMLSelectElement
        } as ChangeEvent<HTMLSelectElement>);
    };

    const handleSelectOption = (option: string) => {
        setSearchTerm(option);
        setIsOpen(false);
        onChange({
            target: { name, value: option } as unknown as HTMLSelectElement
        } as ChangeEvent<HTMLSelectElement>);
    };
    useEffect(() => {
        if (isOpen) {
            measureInputWidth();
        }
    }, [isOpen, measureInputWidth]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputBlur = () => {
        setTimeout(() => setIsOpen(false), 150);
    }

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                name={name as string}
                value={searchTerm}
                placeholder={placeholder}
                onChange={handleInputChange}
                onMouseDown={() => setIsOpen(true)}
                onFocus={() => setIsOpen(true)}
                onBlur={handleInputBlur}
                className={cn(baseInputClass, error ? 'border border-red-500 bg-red-50' : 'border-none', 'bg-white')}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul
                    className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-0.5"
                    style={{ width: dropdownWidth }}
                >
                    {filteredOptions.map((option) => (
                        <li
                            key={option}
                            className="p-1.5 text-sm cursor-pointer hover:bg-blue-100"
                            onMouseDown={() => handleSelectOption(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
            {error && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{error}</span>}
        </div>
    );
});
SearchableSelect.displayName = 'SearchableSelect';
interface ActivoRowProps {
    activo: ActivoData;
    onChange: (id: number, name: keyof ActivoData, value: string | number) => void;
    onRemove: (id: number) => void;
    isLastRow: boolean;
    ubicacionesOptions: string[];
    responsablesOptions: string[];
    codigosPucOptions: SelectOption[];
}
const ActivoRow = React.memo(({ activo, onChange, onRemove, isLastRow, ubicacionesOptions, responsablesOptions, codigosPucOptions }: ActivoRowProps) => {

    const porcentajeAnual = calcularPorcentaje(activo.vidaUtil, activo.metodDepreciacion);
    const handleNumericChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let numericValue: string | number;
        if (name === 'vidaUtil') {
            const parsedInt = parseInt(value);
            numericValue = isNaN(parsedInt) || parsedInt < 0 ? 0 : parsedInt;
        } else {
            numericValue = value;
        }
        onChange(activo.id, name as keyof ActivoData, numericValue);
    };
    const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(activo.id, name as keyof ActivoData, value);
    };
    const baseInputClass = `w-full text-sm p-1.5 outline-none transition-colors duration-100`;
    return (
        <tr key={activo.id} className="border-b border-gray-200 hover:bg-gray-50 align-top">
            <td className="p-0 border-r border-gray-200">
                <input
                    type="text"
                    name="descripcion"
                    value={activo.descripcion}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, activo.errors.descripcion ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
                {activo.errors.descripcion && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.descripcion}</span>}
            </td>
            <td className="p-0 border-r border-gray-200">
                <input
                    type="text"
                    name="codigoBarras"
                    value={activo.codigoBarras}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, activo.errors.codigoBarras ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
                {activo.errors.codigoBarras && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.codigoBarras}</span>}
            </td>
            <td className="p-0 border-r border-gray-200 relative overflow-visible">
                <SearchableSelect
                    name="ubicacion"
                    value={activo.ubicacion}
                    onChange={handleTextChange}
                    options={ubicacionesOptions}
                    placeholder="Ubicación..."
                    error={activo.errors.ubicacion}
                    baseInputClass={baseInputClass}
                />
            </td>
            <td className="p-0 border-r border-gray-200 relative overflow-visible">
                <SearchableSelect
                    name="responsable"
                    value={activo.responsable}
                    onChange={handleTextChange}
                    options={responsablesOptions}
                    placeholder="Responsable..."
                    error={activo.errors.responsable}
                    baseInputClass={baseInputClass}
                />
            </td>
            <td className="p-0 border-r border-gray-200">
                <input
                    type="date"
                    name="fechaCompra"
                    value={activo.fechaCompra}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, 'bg-white', activo.errors.fechaCompra ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
            </td>
            <td className="p-0 border-r border-gray-200 text-right">
                <input
                    type="number"
                    name="valorCompra"
                    value={activo.valorCompra}
                    onChange={handleNumericChange}
                    min="0"
                    step="0.01"
                    className={cn(baseInputClass, 'text-right', activo.errors.valorCompra ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
                {activo.errors.valorCompra && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.valorCompra}</span>}
            </td>
            <td className="p-0 border-r border-gray-200 text-center">
                <input
                    type="number"
                    name="vidaUtil"
                    value={activo.vidaUtil === 0 ? '' : activo.vidaUtil}
                    onChange={handleNumericChange}
                    min="1"
                    step="1"
                    className={cn(baseInputClass, 'text-center', activo.errors.vidaUtil ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
                {activo.errors.vidaUtil && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.vidaUtil}</span>}
            </td>
            <td className="p-0 border-r border-gray-200">
                <select
                    name="metodDepreciacion"
                    value={activo.metodDepreciacion}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, 'bg-white', activo.errors.metodDepreciacion ? 'border border-red-500 bg-red-50' : 'border-none')}
                >
                    <option value="">Método...</option>
                    {metodos.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </td>
            <td className="p-0 border-r border-gray-200 text-center font-bold">
                <span className="p-1.5 w-full text-sm bg-gray-50 block h-full flex items-center justify-center">
                    {porcentajeAnual}%
                </span>
            </td>
            <td className="p-0 border-r border-gray-200">
                <select
                    name="codigoPuc"
                    value={activo.codigoPuc}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, 'bg-white', activo.errors.codigoPuc ? 'border border-red-500 bg-red-50' : 'border-none')}
                >
                    <option value="">PUC...</option>
                    {codigosPucOptions.map((opt: SelectOption) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </td>

            <td className="p-0 border-r border-gray-200">
                <select
                    name="clasificacion"
                    value={activo.clasificacion}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, 'bg-white', activo.errors.clasificacion ? 'border border-red-500 bg-red-50' : 'border-none')}
                >
                    <option value="">Clasificación...</option>
                    {clasificaciones.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </td>
            <td className="p-0 border-r border-gray-200">
                <input
                    type="text"
                    name="notaContable"
                    value={activo.notaContable}
                    onChange={handleTextChange}
                    className={cn(baseInputClass, activo.errors.notaContable ? 'border border-red-500 bg-red-50' : 'border-none')}
                />
            </td>
            <td className="p-0 text-center min-w-[65px]">
                <Button
                    onClick={() => onRemove(activo.id)}
                    className="hover:bg-red-600 text-white h-7 w-7 p-0 m-1 flex items-center justify-center"
                >
                    🗑️
                </Button>
            </td>
        </tr>
    );
});

ActivoRow.displayName = 'ActivoRow';

export default function ActivosFijosForm() {


    const {
        uniqueLocations,
        uniqueResponsibles,
        fetchUniqueLocations,
        fetchUniqueResponsibles,
        createFixedAsset
    } = useFixedAssetsStore();

    const {
        categoriasListas, fetchCategoriasPuc

    } = useDatosExtraStore();

    const router = useRouter();
    const [activos, setActivos] = useState<ActivoData[]>([createNewRow(1)]);
    const [nextId, setNextId] = useState<number>(2);
    const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
    const tableRef = useRef<HTMLTableSectionElement>(null);

    useEffect(() => {
        fetchUniqueLocations();
        fetchUniqueResponsibles();
        fetchCategoriasPuc();
    }, [fetchUniqueLocations, fetchUniqueResponsibles, fetchCategoriasPuc]);


    const validateActivo = (activo: ActivoData): Partial<Record<keyof ActivoData, string>> => {
        const errors: Partial<Record<keyof ActivoData, string>> = {};
        const descripcionTrimmed = activo.descripcion.trim();
        const codigoBarrasTrimmed = activo.codigoBarras.trim();
        const valorCompraParsed = parseFloat(activo.valorCompra);
        const vidaUtilInt = typeof activo.vidaUtil === 'number' ? activo.vidaUtil : parseInt(activo.vidaUtil as string);

        if (!descripcionTrimmed) errors.descripcion = "Obligatorio.";
        if (!codigoBarrasTrimmed) errors.codigoBarras = "Obligatorio.";
        if (activo.ubicacion.trim() === '') errors.ubicacion = "Obligatorio.";
        if (!activo.fechaCompra) errors.fechaCompra = "Obligatoria.";
        if (isNaN(valorCompraParsed) || valorCompraParsed <= 0 || activo.valorCompra === '') errors.valorCompra = "Valor > 0.";
        if (isNaN(vidaUtilInt) || vidaUtilInt <= 0 || !Number.isInteger(vidaUtilInt)) {
            errors.vidaUtil = "Entero positivo.";
        }
        if (activo.metodDepreciacion === '') errors.metodDepreciacion = "Seleccione.";

        return errors;
    };


    const codigosPucOptions: SelectOption[] = useMemo(() => {
        return categoriasListas.map(cat => ({
            value: cat.clave,
            label: `${cat.clave} - ${cat.nombre}`,
        }));
    }, [categoriasListas]);

    const handleRowChange = useCallback((id: number, name: keyof ActivoData, value: string | number) => {
        setActivos(prevActivos => prevActivos.map(activo => {
            if (activo.id === id) {
                const updatedActivo = { ...activo, [name]: value };
                if (updatedActivo.errors[name]) {
                    const newErrors = { ...updatedActivo.errors };
                    delete newErrors[name];
                    updatedActivo.errors = newErrors;
                }
                return updatedActivo;
            }
            return activo;
        }));
    }, []);
    const addRow = useCallback(() => {
        const lastActivo = activos[activos.length - 1];
        const errors = validateActivo(lastActivo);
        let isValid = Object.keys(errors).length === 0;
        if (isValid) {
            const codigoBarrasTrimmed = lastActivo.codigoBarras.trim();

            const isDuplicateCodigoBarras = activos.slice(0, activos.length - 1).some(
                a => a.codigoBarras.trim() === codigoBarrasTrimmed
            );

            if (isDuplicateCodigoBarras) {
                errors.codigoBarras = "Código de Barras duplicado.";
                isValid = false;

                setActivos(prevActivos =>
                    prevActivos.map(a => a.id === lastActivo.id ? { ...a, errors: errors as ActivoData['errors'] } : a)
                );
                setToast({ show: true, message: 'El Código de Barras de la última fila está duplicado o tiene campos incompletos. ❌' });
                setTimeout(() => setToast({ show: false, message: '' }), 3000);
                return;
            }
        }

        if (!isValid) {
            setActivos(prevActivos =>
                prevActivos.map(a => a.id === lastActivo.id ? { ...a, errors: errors as ActivoData['errors'] } : a)
            );
            if (tableRef.current) {
                const lastRowIndex = activos.length - 1;
                const rowElement = tableRef.current.children[lastRowIndex];
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            setToast({ show: true, message: 'La última fila tiene campos obligatorios incompletos o Cód. Barras duplicado. ❌' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }
        const newRow = createNewRow(nextId, lastActivo);
        setActivos(prevActivos => [...prevActivos, newRow]);
        setNextId(prevId => prevId + 1);

        setTimeout(() => {
            if (tableRef.current) {
                const lastRow = tableRef.current.lastElementChild;
                if (lastRow instanceof Element) {
                    lastRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }, 0);
    }, [activos, nextId]);

    const removeRow = useCallback((id: number) => {
        if (activos.length === 1) return;
        setActivos(prevActivos => prevActivos.filter(activo => activo.id !== id));
    }, [activos.length]);

    const validateAll = (): boolean => {
        let allValid = true;
        const seenCodigosBarras = new Set<string>();

        const newActivos: ActivoData[] = activos.map(activo => {
            const newErrors = validateActivo(activo);
            const codigoBarrasTrimmed = activo.codigoBarras.trim();
            if (codigoBarrasTrimmed) {
                if (seenCodigosBarras.has(codigoBarrasTrimmed)) {
                    newErrors.codigoBarras = "Código de Barras duplicado.";
                } else {
                    seenCodigosBarras.add(codigoBarrasTrimmed);
                }
            }

            if (Object.keys(newErrors).length > 0) {
                allValid = false;
            }

            return { ...activo, errors: newErrors as ActivoData['errors'] };
        });
        setActivos(newActivos);
        if (!allValid) {
            const firstErrorRow = newActivos.find(a => Object.keys(a.errors).length > 0);
            if (firstErrorRow && tableRef.current) {
                const rowIndex = newActivos.findIndex(a => a.id === firstErrorRow.id);
                const rowElement = tableRef.current.children[rowIndex];
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        return allValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validateAll()) {
            const assetsDto: FixedAssetDto[] = activos.map(({
                valorCompra,
                vidaUtil,
                codigoBarras,
                descripcion,
                fechaCompra,
                metodDepreciacion,
                ubicacion,
                responsable,
                codigoPuc,
                clasificacion,
                notaContable
            }) => ({
                description: descripcion,
                barcode: codigoBarras,
                location: ubicacion,
                responsible: responsable || null,
                purchase_date: fechaCompra,
                purchase_value: parseFloat(valorCompra),
                useful_life_years: typeof vidaUtil === 'number' ? vidaUtil : parseInt(vidaUtil as string),
                depreciation_method: metodDepreciacion,
                puc_code: codigoPuc || null,
                classification: clasificacion || null,
                accounting_note: notaContable || null,
            }));

            const assetsToSend: CreateFixedAssetDto = {
                assets: assetsDto
            };

            const newAssets = await createFixedAsset(assetsToSend);

            if (newAssets) {
                setToast({ show: true, message: '¡Activos guardados exitosamente!' });
                setActivos([createNewRow(1)]);
                setNextId(2);
            } else {
                setToast({ show: true, message: 'Error al guardar los activos. Revisa la conexión.' });
            }

            setTimeout(() => setToast({ show: false, message: '' }), 3000);

        } else {
            setToast({ show: true, message: 'Por favor, corrija los errores en el formulario.' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
    };
    const isAddRowDisabled = useMemo(() => {
        if (activos.length === 0) return false;
        const lastActivo = activos[activos.length - 1];
        const errors = validateActivo(lastActivo);
        return Object.keys(errors).length > 0;
    }, [activos]);


    const goToIntangibles = () => {
        router.push('/admin/inventario/activos-intangibles');
    };

    const goToOtherAssets = () => {
        router.push('/admin/inventario/otros-activos');
    };


       const { 
        fetchFixedAssets, // Usamos la función existente para cargar
        fixedAssets // Usamos el estado existente con todos los activos
    } = useFixedAssetsStore();

    // 1. Cargar todos los activos al montar (la función que ya tenías)
    useEffect(() => {
        fetchFixedAssets(); // Esto llena el estado fixedAssets
        // ... (otras funciones de fetch, ej: fetchUniqueLocations)
    }, [fetchFixedAssets]);


    // 2. Lógica de cálculo y resumen usando useMemo
    const niifSummaryData: NiifSummary = useMemo(() => {
        
        // Mapeo de la clasificación de tu API a las categorías de la tabla
        const classificationMap: { [key: string]: keyof Omit<AssetSummary, 'total'> } = {
            'equipo-computo': 'equipos_computo',
            'mobiliario': 'mobiliario',
            // Agrega otros que puedan mapear a "Maquinaria y equipo" o "Equipos de altura"
            'maquinaria': 'maquinaria', 
            'equipo-altura': 'maquinaria', 
            'maquinaria-y-equipo': 'maquinaria',
        };

        // Valores fijos del 2022 (Tomados de tu imagen para comparación histórica)
        const initialSummary2022: AssetSummary = { 
            equipos_computo: 3647000, 
            mobiliario: 0, // Ajusta si tienes una categoría específica para mobiliario
            maquinaria: 3515000 + 15190000, // Suma Maquinaria y Equipo + Equipos de altura de tu imagen
            total: 22352000 
        };
        
        // Inicializa el resumen de 2023
        const summary2023: AssetSummary = { equipos_computo: 0, mobiliario: 0, maquinaria: 0, total: 0 };
        
        // CÁLCULO DE VALORES DEL AÑO 2023 (Basado en el valor de compra de los activos actuales)
        fixedAssets.forEach(asset => {
            const value = parseFloat(String(asset.purchase_value)) || 0;
            const classification = asset.classification ?? ''; // Asegura que no sea null
            const classificationKey = classificationMap[classification] as keyof AssetSummary | undefined;
            
            if (classificationKey && summary2023.hasOwnProperty(classificationKey)) {
                summary2023[classificationKey] += value;
            } else {
                // Si no hay una clasificación válida, se suma a 'maquinaria' por defecto.
                summary2023.maquinaria += value;
            }
            summary2023.total += value;
        });
        
        const total2023 = summary2023.total;
        const total2022 = initialSummary2022.total;
        const variation = total2023 - total2022;
        const percentage = total2022 === 0 ? 0 : (variation / total2022) * 100;

        return {
            '2023': summary2023,
            '2022': initialSummary2022, 
            variation_annual: variation,
            percentage_variation: Number(percentage.toFixed(2)),
            accumulated_deterioration: 0, 
        } as NiifSummary;

    }, [fixedAssets]); // Recalcula si la lista de activos cambia

    return (
        <PrivateRoute>
            <LayoutAdmi>
                <div className="p-6 max-w-full mx-auto">
                    <div className="w-full">

                        <h1 className="text-xl md:text-2xl lg:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center w-full mb-2">
                            Registro de Activos Fijos
                        </h1>
                        <h6 className="text-sm md:text-base leading-5 font-medium font-montserrat text-[#6F6F6F] text-center w-full mb-6">
                            Ingrese los detalles de cada activo y su depreciación. <strong className="text-red-600">*Los campos con errores de validación se resaltarán en rojo.*</strong>
                        </h6>
                        <form onSubmit={handleSubmit}>
                            <Card className="min-w-full mb-20">

                                <div className="p-4 border-b border-gray-200 flex space-x-4">
                                    <Button
                                        onClick={goToIntangibles}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
                                        type="button"
                                    >
                                        <span className="text-xl mr-1"></span> Activos Intangibles
                                    </Button>
                                    <Button
                                        onClick={goToOtherAssets}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
                                        type="button"
                                    >
                                        <span className="text-xl mr-1"></span> Otros Activos
                                    </Button>
                                </div>

                                <CardContent>
                                    <div className="overflow-x-auto max-h-[60vh] w-full">
                                        <table className="min-w-full border-collapse table-fixed">
                                            <thead>
                                                <tr className=" text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky top-0 border-b border-gray-300">
                                                    <th className="py-2 px-1 border-r min-w-[150px]">Descripción*</th>
                                                    <th className="py-2 px-1 border-r min-w-[100px]">Cód. Barras*</th>
                                                    <th className="py-2 px-1 border-r min-w-[120px]">Ubicación*</th>
                                                    <th className="py-2 px-1 border-r min-w-[120px]">Responsable</th>
                                                    <th className="py-2 px-1 border-r min-w-[90px]">Fec. Compra*</th>
                                                    <th className="py-2 px-1 border-r min-w-[100px] text-right">Valor Compra*</th>
                                                    <th className="py-2 px-1 border-r min-w-[70px] text-center">Vida Útil (Años)*</th>
                                                    <th className="py-2 px-1 border-r min-w-[120px]">Método Dep.*</th>
                                                    <th className="py-2 px-1 border-r min-w-[60px] text-center">% Anual</th>
                                                    <th className="py-2 px-1 border-r min-w-[100px]">Cód. PUC</th>
                                                    <th className="py-2 px-1 border-r min-w-[100px]">Clasificación</th>
                                                    <th className="py-2 px-1 border-r min-w-[100px]">Nota Contable</th>
                                                    <th className="py-2 px-1 min-w-[40px]"></th>
                                                </tr>
                                            </thead>
                                            <tbody ref={tableRef}>
                                                {activos.map((activo, index) => (
                                                    <ActivoRow
                                                        key={activo.id}
                                                        activo={activo}
                                                        onChange={handleRowChange}
                                                        onRemove={removeRow}
                                                        isLastRow={index === activos.length - 1}
                                                        ubicacionesOptions={uniqueLocations}
                                                        responsablesOptions={uniqueResponsibles}
                                                        codigosPucOptions={codigosPucOptions}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                </CardContent>
                            </Card>

                            <div className="p-4 border-b border-gray-200">
                                <Button
                                    onClick={addRow}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
                                    type="button"
                                    disabled={isAddRowDisabled}
                                >
                                    <span className="text-xl mr-1">+</span> Agregar Nuevo Activo
                                </Button>
                                {isAddRowDisabled && (
                                    <p className="text-xs text-red-500 mt-1">
                                        *Complete los campos obligatorios de la fila anterior para agregar uno nuevo.
                                    </p>
                                )}
                            </div>
                            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-300 shadow-2xl p-4 flex justify-end items-center w-full">
                                <Button
                                    type="submit"
                                    className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-lg"
                                >
                                    Guardar Toda la Planilla (Activos)
                                </Button>
                            </div>

                            <Toast
                                message={toast.message}
                                show={toast.show}
                            />
                        </form>
                    </div>



<div className="mt-8">
    <Card className="min-w-full">
        <CardContent className="p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                NOTA 7 - TOTAL RESUMIDO PROPIEDAD, PLANTA Y EQUIPO
            </h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300">
                            <th className="py-2 px-2 border-r min-w-[150px]">NIIF</th>
                            <th colSpan={4} className="py-2 px-2 text-center border-r">TOTALES RESUMIDOS Y COMPARATIVOS</th>
                            <th className="py-2 px-2 min-w-[150px]">DETERIORO ACUMULADO</th>
                        </tr>
                        <tr className="bg-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300">
                            <th className="py-1 px-2 border-r">TOTAL RESUMIDO PROPIEDAD PLANTA Y EQUIPO</th>
                            <th className="py-1 px-2 text-right border-r">2023</th>
                            <th className="py-1 px-2 text-right border-r">2022</th>
                            <th className="py-1 px-2 text-right">VARIACIÓN ANUAL</th>
                            <th className="py-1 px-2 text-right">%</th>
                            <th className="py-1 px-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 1. EQUIPOS DE COMPUTO */}
                        <tr className="border-b border-gray-200">
                            <td className="py-1 px-2">EQUIPOS DE COMPUTO</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData['2023'].equipos_computo.toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData['2022'].equipos_computo.toLocaleString('es-CO')}</td>
                            {/* CÁLCULO DE LA VARIACIÓN */}
                            <td className="py-1 px-2 text-right">{(niifSummaryData['2023'].equipos_computo - niifSummaryData['2022'].equipos_computo).toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">
                                {niifSummaryData['2022'].equipos_computo === 0 ? '0%' : (((niifSummaryData['2023'].equipos_computo - niifSummaryData['2022'].equipos_computo) / niifSummaryData['2022'].equipos_computo) * 100).toFixed(2) + '%'}
                            </td>
                            <td className="py-1 px-2 text-right">0</td>
                        </tr>
                        
                        {/* 2. MAQUINARIA Y EQUIPO (USAMOS PARTE DE 'maquinaria' DEL SUMMARY) */}
                        <tr className="border-b border-gray-200">
                            <td className="py-1 px-2">MAQUINARIA Y EQUIPO</td>
                            {/* Nota: Aquí necesitas dividir 'maquinaria' si tu summary no lo hace. Usaremos el total 'maquinaria' para este y el siguiente, lo cual es inexacto pero simula el resumen si no puedes dividirlo por ahora. Idealmente, suma el valor de todos los activos de "MAQUINARIA" aquí. */}
                            <td className="py-1 px-2 text-right">{niifSummaryData['2023'].maquinaria.toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData['2022'].maquinaria.toLocaleString('es-CO')}</td>
                            {/* CÁLCULO DE LA VARIACIÓN */}
                            <td className="py-1 px-2 text-right">{(niifSummaryData['2023'].maquinaria - niifSummaryData['2022'].maquinaria).toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">
                                {niifSummaryData['2022'].maquinaria === 0 ? '0%' : (((niifSummaryData['2023'].maquinaria - niifSummaryData['2022'].maquinaria) / niifSummaryData['2022'].maquinaria) * 100).toFixed(2) + '%'}
                            </td>
                            <td className="py-1 px-2 text-right">0</td>
                        </tr>

                        {/* 3. EQUIPOS DE ALTURA (Si tienes esta categoría, ajusta la lógica de 'maquinaria' en useMemo) */}
                        <tr className="border-b border-gray-200">
                            <td className="py-1 px-2">EQUIPOS DE ALTURA</td>
                            {/* Como hemos consolidado en 'maquinaria', para simular la estructura, ponemos 0 o el valor real si puedes separarlos */}
                            <td className="py-1 px-2 text-right">0</td>
                            <td className="py-1 px-2 text-right">0</td>
                            <td className="py-1 px-2 text-right">0</td>
                            <td className="py-1 px-2 text-right">0%</td>
                            <td className="py-1 px-2 text-right">0</td>
                        </tr>
                        
                        {/* FILA FINAL: TOTAL PROPIEDAD, PLANTA Y EQUIPO */}
                        <tr className="border-b border-gray-300 font-bold bg-gray-50">
                            <td className="py-1 px-2">TOTAL PROPIEDAD, PLANTA Y EQUIPO</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData['2023'].total.toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData['2022'].total.toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData.variation_annual.toLocaleString('es-CO')}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData.percentage_variation.toFixed(2) + '%'}</td>
                            <td className="py-1 px-2 text-right">{niifSummaryData.accumulated_deterioration.toLocaleString('es-CO')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
</div>





                    
                </div>
            </LayoutAdmi>
        </PrivateRoute>
    );
}
























































// "use client";

// import LayoutAdmi from '@/components/layout/layoutAdmi';
// import PrivateRoute from '@/helpers/PrivateRoute';
// import React, { useState, useRef, useCallback, ReactNode, ChangeEvent, useMemo, useEffect } from 'react';
// import { useFixedAssetsStore } from '@/store/Inventario/useFixedAssets';
// import { useDatosExtraStore } from '@/store/useDatosExtraStore';
// import { CreateFixedAssetDto, FixedAssetDto } from '@/types/fixed-assets';
// import { useRouter } from 'next/navigation';
// type MetodoDepreciacion = 'linea-recta' | 'saldos-decrecientes';
// type UbicacionValue = string;
// type ResponsableValue = string;
// type ClasificacionValue = 'equipo-computo' | 'mobiliario' | 'maquinaria';
// interface SelectOption {
//     value: string;
//     label: string;
// }
// interface ActivoData {
//     id: number;
//     descripcion: string;
//     codigoBarras: string;
//     ubicacion: UbicacionValue | '';
//     responsable: ResponsableValue | '';
//     fechaCompra: string;
//     valorCompra: string;
//     vidaUtil: number | '';
//     metodDepreciacion: MetodoDepreciacion | '';
//     codigoPuc: string;
//     clasificacion: ClasificacionValue | '';
//     notaContable: string;
//     errors: Partial<Record<keyof ActivoData, string>>;
// }

// const cn = (...classes: (string | boolean | undefined)[]): string => classes.filter(Boolean).join(' ');

// const metodos: SelectOption[] = [
//     { value: 'linea-recta', label: 'Línea Recta' },
//     { value: 'saldos-decrecientes', label: 'Saldos Decrecientes' },
// ];

// const clasificaciones: SelectOption[] = [
//     { value: 'equipo-computo', label: 'Equipo de Cómputo' },
//     { value: 'mobiliario', label: 'Mobiliario' },
//     { value: 'maquinaria', label: 'Maquinaria' },
// ];

// const calcularPorcentaje = (vidaUtil: number | string, metodo: MetodoDepreciacion | ''): number => {
//     const util = parseInt(vidaUtil as string) || 0;
//     if (util === 0 || metodo === '') return 0;

//     let porcentaje = 0;
//     switch (metodo) {
//         case 'linea-recta':
//             porcentaje = (1 / util) * 100;
//             break;
//         case 'saldos-decrecientes':
//             porcentaje = (2 / util) * 100;
//             break;
//     }
//     return Number(porcentaje.toFixed(2));
// };

// const createNewRow = (id: number, previousActivo?: ActivoData): ActivoData => ({
//     id,
//     descripcion: previousActivo?.descripcion || '',
//     codigoBarras: '',
//     ubicacion: previousActivo?.ubicacion || ('' as UbicacionValue | ''),
//     responsable: previousActivo?.responsable || ('' as ResponsableValue | ''),
//     fechaCompra: previousActivo?.fechaCompra || new Date().toISOString().split('T')[0],
//     valorCompra: previousActivo?.valorCompra || '',
//     vidaUtil: previousActivo?.vidaUtil || 0,
//     metodDepreciacion: previousActivo?.metodDepreciacion || ('' as MetodoDepreciacion | ''),
//     codigoPuc: previousActivo?.codigoPuc || '',
//     clasificacion: previousActivo?.clasificacion || ('' as ClasificacionValue | ''),
//     notaContable: previousActivo?.notaContable || '',
//     errors: {},
// });

// interface SimpleComponentProps { children: ReactNode; className?: string; }
// const Card = ({ children, className }: SimpleComponentProps) => (<div className={cn("rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg", className)}> {children} </div>);
// const CardContent = ({ children, className }: SimpleComponentProps) => (<div className={cn("p-0 pt-0", className)}>{children}</div>);
// interface ButtonProps { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; }
// const Button = ({ children, onClick, className, type = "button", disabled = false }: ButtonProps) => (
//     <button
//         type={type}
//         onClick={onClick}
//         disabled={disabled}
//         className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2", className)}
//     >
//         {children}
//     </button>
// );
// interface ToastProps { message: string; show: boolean; className?: string; }
// const Toast = ({ message, show, className }: ToastProps) => (
//     <div
//         className={cn("fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white", show ? 'bg-green-500 transition-opacity duration-300' : 'hidden opacity-0', className)}
//         role="alert"
//         aria-live="assertive"
//     >
//         {message}
//     </div>
// );
// interface SearchableSelectProps {
//     name: keyof ActivoData;
//     value: string;
//     onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//     options: string[];
//     placeholder: string;
//     error: string | undefined;
//     baseInputClass: string;
// }
// const SearchableSelect = React.memo(({ name, value, onChange, options, placeholder, error, baseInputClass }: SearchableSelectProps) => {

//     const [searchTerm, setSearchTerm] = useState(value);
//     const [isOpen, setIsOpen] = useState(false);
//     const wrapperRef = useRef<HTMLDivElement>(null);
//     const inputRef = useRef<HTMLInputElement>(null);
//     const [dropdownWidth, setDropdownWidth] = useState<number | 'auto'>('auto');
//     const measureInputWidth = useCallback(() => {
//         if (inputRef.current) {
//             setDropdownWidth(inputRef.current.offsetWidth);
//         }
//     }, []);

//     useEffect(() => {
//         setSearchTerm(value);
//     }, [value]);

//     const filteredOptions = useMemo(() => {
//         const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
//         if (!searchTerm) return uniqueOptions;
//         return uniqueOptions.filter(option =>
//             option.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//     }, [searchTerm, options]);

//     const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
//         const { value: inputValue } = e.target;
//         setSearchTerm(inputValue);
//         setIsOpen(true);
//         onChange({
//             target: { name, value: inputValue } as unknown as HTMLSelectElement
//         } as ChangeEvent<HTMLSelectElement>);
//     };

//     const handleSelectOption = (option: string) => {
//         setSearchTerm(option);
//         setIsOpen(false);
//         onChange({
//             target: { name, value: option } as unknown as HTMLSelectElement
//         } as ChangeEvent<HTMLSelectElement>);
//     };
//     useEffect(() => {
//         if (isOpen) {
//             measureInputWidth();
//         }
//     }, [isOpen, measureInputWidth]);

//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
//                 setIsOpen(false);
//             }
//         };
//         document.addEventListener('mousedown', handleClickOutside);
//         return () => document.removeEventListener('mousedown', handleClickOutside);
//     }, []);

//     const handleInputBlur = () => {
//         setTimeout(() => setIsOpen(false), 150);
//     }

//     return (
//         <div ref={wrapperRef} className="relative">
//             <input
//                 ref={inputRef}
//                 type="text"
//                 name={name as string}
//                 value={searchTerm}
//                 placeholder={placeholder}
//                 onChange={handleInputChange}
//                 onMouseDown={() => setIsOpen(true)}
//                 onFocus={() => setIsOpen(true)}
//                 onBlur={handleInputBlur}
//                 className={cn(baseInputClass, error ? 'border border-red-500 bg-red-50' : 'border-none', 'bg-white')}
//                 autoComplete="off"
//             />
//             {isOpen && filteredOptions.length > 0 && (
//                 <ul
//                     className="fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-0.5"
//                     style={{ width: dropdownWidth }}
//                 >
//                     {filteredOptions.map((option) => (
//                         <li
//                             key={option}
//                             className="p-1.5 text-sm cursor-pointer hover:bg-blue-100"
//                             onMouseDown={() => handleSelectOption(option)}
//                         >
//                             {option}
//                         </li>
//                     ))}
//                 </ul>
//             )}
//             {error && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{error}</span>}
//         </div>
//     );
// });
// SearchableSelect.displayName = 'SearchableSelect';
// interface ActivoRowProps {
//     activo: ActivoData;
//     onChange: (id: number, name: keyof ActivoData, value: string | number) => void;
//     onRemove: (id: number) => void;
//     isLastRow: boolean;
//     ubicacionesOptions: string[];
//     responsablesOptions: string[];
//     codigosPucOptions: SelectOption[];
// }
// const ActivoRow = React.memo(({ activo, onChange, onRemove, isLastRow, ubicacionesOptions, responsablesOptions, codigosPucOptions }: ActivoRowProps) => {

//     const porcentajeAnual = calcularPorcentaje(activo.vidaUtil, activo.metodDepreciacion);
//     const handleNumericChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//         const { name, value } = e.target;
//         let numericValue: string | number;
//         if (name === 'vidaUtil') {
//             const parsedInt = parseInt(value);
//             numericValue = isNaN(parsedInt) || parsedInt < 0 ? 0 : parsedInt;
//         } else {
//             numericValue = value;
//         }
//         onChange(activo.id, name as keyof ActivoData, numericValue);
//     };
//     const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//         const { name, value } = e.target;
//         onChange(activo.id, name as keyof ActivoData, value);
//     };
//     const baseInputClass = `w-full text-sm p-1.5 outline-none transition-colors duration-100`;
//     return (
//         <tr key={activo.id} className="border-b border-gray-200 hover:bg-gray-50 align-top">
//             <td className="p-0 border-r border-gray-200">
//                 <input
//                     type="text"
//                     name="descripcion"
//                     value={activo.descripcion}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, activo.errors.descripcion ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//                 {activo.errors.descripcion && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.descripcion}</span>}
//             </td>
//             <td className="p-0 border-r border-gray-200">
//                 <input
//                     type="text"
//                     name="codigoBarras"
//                     value={activo.codigoBarras}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, activo.errors.codigoBarras ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//                 {activo.errors.codigoBarras && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.codigoBarras}</span>}
//             </td>
//             <td className="p-0 border-r border-gray-200 relative overflow-visible">
//                 <SearchableSelect
//                     name="ubicacion"
//                     value={activo.ubicacion}
//                     onChange={handleTextChange}
//                     options={ubicacionesOptions}
//                     placeholder="Ubicación..."
//                     error={activo.errors.ubicacion}
//                     baseInputClass={baseInputClass}
//                 />
//             </td>
//             <td className="p-0 border-r border-gray-200 relative overflow-visible">
//                 <SearchableSelect
//                     name="responsable"
//                     value={activo.responsable}
//                     onChange={handleTextChange}
//                     options={responsablesOptions}
//                     placeholder="Responsable..."
//                     error={activo.errors.responsable}
//                     baseInputClass={baseInputClass}
//                 />
//             </td>
//             <td className="p-0 border-r border-gray-200">
//                 <input
//                     type="date"
//                     name="fechaCompra"
//                     value={activo.fechaCompra}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, 'bg-white', activo.errors.fechaCompra ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//             </td>
//             <td className="p-0 border-r border-gray-200 text-right">
//                 <input
//                     type="number"
//                     name="valorCompra"
//                     value={activo.valorCompra}
//                     onChange={handleNumericChange}
//                     min="0"
//                     step="0.01"
//                     className={cn(baseInputClass, 'text-right', activo.errors.valorCompra ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//                 {activo.errors.valorCompra && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.valorCompra}</span>}
//             </td>
//             <td className="p-0 border-r border-gray-200 text-center">
//                 <input
//                     type="number"
//                     name="vidaUtil"
//                     value={activo.vidaUtil === 0 ? '' : activo.vidaUtil}
//                     onChange={handleNumericChange}
//                     min="1"
//                     step="1"
//                     className={cn(baseInputClass, 'text-center', activo.errors.vidaUtil ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//                 {activo.errors.vidaUtil && <span className="text-[10px] text-red-500 block px-1.5 pb-0.5">{activo.errors.vidaUtil}</span>}
//             </td>
//             <td className="p-0 border-r border-gray-200">
//                 <select
//                     name="metodDepreciacion"
//                     value={activo.metodDepreciacion}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, 'bg-white', activo.errors.metodDepreciacion ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 >
//                     <option value="">Método...</option>
//                     {metodos.map(opt => (
//                         <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                 </select>
//             </td>
//             <td className="p-0 border-r border-gray-200 text-center font-bold">
//                 <span className="p-1.5 w-full text-sm bg-gray-50 block h-full flex items-center justify-center">
//                     {porcentajeAnual}%
//                 </span>
//             </td>
//             <td className="p-0 border-r border-gray-200">
//                 <select
//                     name="codigoPuc"
//                     value={activo.codigoPuc}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, 'bg-white', activo.errors.codigoPuc ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 >
//                     <option value="">PUC...</option>
//                     {codigosPucOptions.map((opt: SelectOption) => (
//                         <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                 </select>
//             </td>

//             <td className="p-0 border-r border-gray-200">
//                 <select
//                     name="clasificacion"
//                     value={activo.clasificacion}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, 'bg-white', activo.errors.clasificacion ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 >
//                     <option value="">Clasificación...</option>
//                     {clasificaciones.map(opt => (
//                         <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                 </select>
//             </td>
//             <td className="p-0 border-r border-gray-200">
//                 <input
//                     type="text"
//                     name="notaContable"
//                     value={activo.notaContable}
//                     onChange={handleTextChange}
//                     className={cn(baseInputClass, activo.errors.notaContable ? 'border border-red-500 bg-red-50' : 'border-none')}
//                 />
//             </td>
//             <td className="p-0 text-center min-w-[65px]">
//                 <Button
//                     onClick={() => onRemove(activo.id)}
//                     className="hover:bg-red-600 text-white h-7 w-7 p-0 m-1 flex items-center justify-center"
//                 >
//                     🗑️
//                 </Button>
//             </td>
//         </tr>
//     );
// });

// ActivoRow.displayName = 'ActivoRow';

// export default function ActivosFijosForm() {


//     const {
//         uniqueLocations,
//         uniqueResponsibles,
//         fetchUniqueLocations,
//         fetchUniqueResponsibles,
//         createFixedAsset
//     } = useFixedAssetsStore();

//     const {
//         categoriasListas, fetchCategoriasPuc

//     } = useDatosExtraStore();

//     const router = useRouter();
//     const [activos, setActivos] = useState<ActivoData[]>([createNewRow(1)]);
//     const [nextId, setNextId] = useState<number>(2);
//     const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
//     const tableRef = useRef<HTMLTableSectionElement>(null);

//     useEffect(() => {
//         fetchUniqueLocations();
//         fetchUniqueResponsibles();
//         fetchCategoriasPuc();
//     }, [fetchUniqueLocations, fetchUniqueResponsibles, fetchCategoriasPuc]);


//     const validateActivo = (activo: ActivoData): Partial<Record<keyof ActivoData, string>> => {
//         const errors: Partial<Record<keyof ActivoData, string>> = {};
//         const descripcionTrimmed = activo.descripcion.trim();
//         const codigoBarrasTrimmed = activo.codigoBarras.trim();
//         const valorCompraParsed = parseFloat(activo.valorCompra);
//         const vidaUtilInt = typeof activo.vidaUtil === 'number' ? activo.vidaUtil : parseInt(activo.vidaUtil as string);

//         if (!descripcionTrimmed) errors.descripcion = "Obligatorio.";
//         if (!codigoBarrasTrimmed) errors.codigoBarras = "Obligatorio.";
//         if (activo.ubicacion.trim() === '') errors.ubicacion = "Obligatorio.";
//         if (!activo.fechaCompra) errors.fechaCompra = "Obligatoria.";
//         if (isNaN(valorCompraParsed) || valorCompraParsed <= 0 || activo.valorCompra === '') errors.valorCompra = "Valor > 0.";
//         if (isNaN(vidaUtilInt) || vidaUtilInt <= 0 || !Number.isInteger(vidaUtilInt)) {
//             errors.vidaUtil = "Entero positivo.";
//         }
//         if (activo.metodDepreciacion === '') errors.metodDepreciacion = "Seleccione.";

//         return errors;
//     };


//     const codigosPucOptions: SelectOption[] = useMemo(() => {
//         return categoriasListas.map(cat => ({
//             value: cat.id,
//             label: `${cat.id} - ${cat.nombre}`,
//         }));
//     }, [categoriasListas]);

//     const handleRowChange = useCallback((id: number, name: keyof ActivoData, value: string | number) => {
//         setActivos(prevActivos => prevActivos.map(activo => {
//             if (activo.id === id) {
//                 const updatedActivo = { ...activo, [name]: value };
//                 if (updatedActivo.errors[name]) {
//                     const newErrors = { ...updatedActivo.errors };
//                     delete newErrors[name];
//                     updatedActivo.errors = newErrors;
//                 }
//                 return updatedActivo;
//             }
//             return activo;
//         }));
//     }, []);
//     const addRow = useCallback(() => {
//         const lastActivo = activos[activos.length - 1];
//         const errors = validateActivo(lastActivo);
//         let isValid = Object.keys(errors).length === 0;
//         if (isValid) {
//             const codigoBarrasTrimmed = lastActivo.codigoBarras.trim();

//             const isDuplicateCodigoBarras = activos.slice(0, activos.length - 1).some(
//                 a => a.codigoBarras.trim() === codigoBarrasTrimmed
//             );

//             if (isDuplicateCodigoBarras) {
//                 errors.codigoBarras = "Código de Barras duplicado.";
//                 isValid = false;

//                 setActivos(prevActivos =>
//                     prevActivos.map(a => a.id === lastActivo.id ? { ...a, errors: errors as ActivoData['errors'] } : a)
//                 );
//                 setToast({ show: true, message: 'El Código de Barras de la última fila está duplicado o tiene campos incompletos. ❌' });
//                 setTimeout(() => setToast({ show: false, message: '' }), 3000);
//                 return;
//             }
//         }

//         if (!isValid) {
//             setActivos(prevActivos =>
//                 prevActivos.map(a => a.id === lastActivo.id ? { ...a, errors: errors as ActivoData['errors'] } : a)
//             );
//             if (tableRef.current) {
//                 const lastRowIndex = activos.length - 1;
//                 const rowElement = tableRef.current.children[lastRowIndex];
//                 if (rowElement) {
//                     rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//                 }
//             }

//             setToast({ show: true, message: 'La última fila tiene campos obligatorios incompletos o Cód. Barras duplicado. ❌' });
//             setTimeout(() => setToast({ show: false, message: '' }), 3000);
//             return;
//         }
//         const newRow = createNewRow(nextId, lastActivo);
//         setActivos(prevActivos => [...prevActivos, newRow]);
//         setNextId(prevId => prevId + 1);

//         setTimeout(() => {
//             if (tableRef.current) {
//                 const lastRow = tableRef.current.lastElementChild;
//                 if (lastRow instanceof Element) {
//                     lastRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
//                 }
//             }
//         }, 0);
//     }, [activos, nextId]);

//     const removeRow = useCallback((id: number) => {
//         if (activos.length === 1) return;
//         setActivos(prevActivos => prevActivos.filter(activo => activo.id !== id));
//     }, [activos.length]);

//     const validateAll = (): boolean => {
//         let allValid = true;
//         const seenCodigosBarras = new Set<string>();

//         const newActivos: ActivoData[] = activos.map(activo => {
//             const newErrors = validateActivo(activo);
//             const codigoBarrasTrimmed = activo.codigoBarras.trim();
//             if (codigoBarrasTrimmed) {
//                 if (seenCodigosBarras.has(codigoBarrasTrimmed)) {
//                     newErrors.codigoBarras = "Código de Barras duplicado.";
//                 } else {
//                     seenCodigosBarras.add(codigoBarrasTrimmed);
//                 }
//             }

//             if (Object.keys(newErrors).length > 0) {
//                 allValid = false;
//             }

//             return { ...activo, errors: newErrors as ActivoData['errors'] };
//         });
//         setActivos(newActivos);
//         if (!allValid) {
//             const firstErrorRow = newActivos.find(a => Object.keys(a.errors).length > 0);
//             if (firstErrorRow && tableRef.current) {
//                 const rowIndex = newActivos.findIndex(a => a.id === firstErrorRow.id);
//                 const rowElement = tableRef.current.children[rowIndex];
//                 if (rowElement) {
//                     rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//                 }
//             }
//         }

//         return allValid;
//     };

//     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();
//         if (validateAll()) {
//             const assetsDto: FixedAssetDto[] = activos.map(({
//                 valorCompra,
//                 vidaUtil,
//                 codigoBarras,
//                 descripcion,
//                 fechaCompra,
//                 metodDepreciacion,
//                 ubicacion,
//                 responsable,
//                 codigoPuc,
//                 clasificacion,
//                 notaContable
//             }) => ({
//                 description: descripcion,
//                 barcode: codigoBarras,
//                 location: ubicacion,
//                 responsible: responsable || null,
//                 purchase_date: fechaCompra,
//                 purchase_value: parseFloat(valorCompra),
//                 useful_life_years: typeof vidaUtil === 'number' ? vidaUtil : parseInt(vidaUtil as string),
//                 depreciation_method: metodDepreciacion,
//                 puc_code: codigoPuc || null,
//                 classification: clasificacion || null,
//                 accounting_note: notaContable || null,
//             }));

//             const assetsToSend: CreateFixedAssetDto = {
//                 assets: assetsDto
//             };

//             const newAssets = await createFixedAsset(assetsToSend);

//             if (newAssets) {
//                 setToast({ show: true, message: '¡Activos guardados exitosamente!' });
//                 setActivos([createNewRow(1)]);
//                 setNextId(2);
//             } else {
//                 setToast({ show: true, message: 'Error al guardar los activos. Revisa la conexión.' });
//             }

//             setTimeout(() => setToast({ show: false, message: '' }), 3000);

//         } else {
//             setToast({ show: true, message: 'Por favor, corrija los errores en el formulario.' });
//             setTimeout(() => setToast({ show: false, message: '' }), 3000);
//         }
//     };
//     const isAddRowDisabled = useMemo(() => {
//         if (activos.length === 0) return false;
//         const lastActivo = activos[activos.length - 1];
//         const errors = validateActivo(lastActivo);
//         return Object.keys(errors).length > 0;
//     }, [activos]);


//     const goToIntangibles = () => {
//         router.push('/admin/inventario/activos-intangibles');
//     };

//     const goToOtherAssets = () => {
//         router.push('/admin/inventario/otros-activos');
//     };
//     return (
//         <PrivateRoute>
//             <LayoutAdmi>
//                 <div className="p-6 max-w-full mx-auto">
//                     <div className="w-full">

//                         <h1 className="text-xl md:text-2xl lg:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center w-full mb-2">
//                             Registro de Activos Fijos
//                         </h1>
//                         <h6 className="text-sm md:text-base leading-5 font-medium font-montserrat text-[#6F6F6F] text-center w-full mb-6">
//                             Ingrese los detalles de cada activo y su depreciación. <strong className="text-red-600">*Los campos con errores de validación se resaltarán en rojo.*</strong>
//                         </h6>
//                         <form onSubmit={handleSubmit}>
//                             <Card className="min-w-full mb-20">

//                                 <div className="p-4 border-b border-gray-200 flex space-x-4">
//                                     <Button
//                                         onClick={goToIntangibles}
//                                         className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
//                                         type="button"
//                                     >
//                                         <span className="text-xl mr-1"></span> Activos Intangibles
//                                     </Button>
//                                     <Button
//                                         onClick={goToOtherAssets}
//                                         className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
//                                         type="button"
//                                     >
//                                         <span className="text-xl mr-1"></span> Otros Activos
//                                     </Button>
//                                 </div>

//                                 <CardContent>
//                                     <div className="overflow-x-auto max-h-[60vh] w-full">
//                                         <table className="min-w-full border-collapse table-fixed">
//                                             <thead>
//                                                 <tr className=" text-left text-xs font-bold uppercase tracking-wider text-gray-700 sticky top-0 border-b border-gray-300">
//                                                     <th className="py-2 px-1 border-r min-w-[150px]">Descripción*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[100px]">Cód. Barras*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[120px]">Ubicación*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[120px]">Responsable</th>
//                                                     <th className="py-2 px-1 border-r min-w-[90px]">Fec. Compra*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[100px] text-right">Valor Compra*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[70px] text-center">Vida Útil (Años)*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[120px]">Método Dep.*</th>
//                                                     <th className="py-2 px-1 border-r min-w-[60px] text-center">% Anual</th>
//                                                     <th className="py-2 px-1 border-r min-w-[100px]">Cód. PUC</th>
//                                                     <th className="py-2 px-1 border-r min-w-[100px]">Clasificación</th>
//                                                     <th className="py-2 px-1 border-r min-w-[100px]">Nota Contable</th>
//                                                     <th className="py-2 px-1 min-w-[40px]"></th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody ref={tableRef}>
//                                                 {activos.map((activo, index) => (
//                                                     <ActivoRow
//                                                         key={activo.id}
//                                                         activo={activo}
//                                                         onChange={handleRowChange}
//                                                         onRemove={removeRow}
//                                                         isLastRow={index === activos.length - 1}
//                                                         ubicacionesOptions={uniqueLocations}
//                                                         responsablesOptions={uniqueResponsibles}
//                                                         codigosPucOptions={codigosPucOptions}
//                                                                                                         />
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>

//                                 </CardContent>
//                             </Card>

//                             <div className="p-4 border-b border-gray-200">
//                                 <Button
//                                     onClick={addRow}
//                                     className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center shadow-md"
//                                     type="button"
//                                     disabled={isAddRowDisabled}
//                                 >
//                                     <span className="text-xl mr-1">+</span> Agregar Nuevo Activo
//                                 </Button>
//                                 {isAddRowDisabled && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         *Complete los campos obligatorios de la fila anterior para agregar uno nuevo.
//                                     </p>
//                                 )}
//                             </div>
//                             <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-300 shadow-2xl p-4 flex justify-end items-center w-full">
//                                 <Button
//                                     type="submit"
//                                     className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-lg"
//                                 >
//                                     Guardar Toda la Planilla (Activos)
//                                 </Button>
//                             </div>

//                             <Toast
//                                 message={toast.message}
//                                 show={toast.show}
//                             />
//                         </form>
//                     </div>








                    
//                 </div>
//             </LayoutAdmi>
//         </PrivateRoute>
//     );
// }