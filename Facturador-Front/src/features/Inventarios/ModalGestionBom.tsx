'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useBomStore } from '@/store/Inventario/useBomStore';
import { useProductStore } from '@/store/Inventario/useProductStore';

import type {
    Product,
    BillOfMaterial,
    BillOfMaterialComponent,
    CreateBomItemPayload,
    CreateBomPayload,
    UpdateBomPayload,
} from '@/types/inventory';
import { showErrorToast, showTemporaryToast } from '@/components/feedback/toast';

interface ModalGestionBomProps {
    isOpen: boolean;
    onClose: () => void;
    bomToEdit?: BillOfMaterial | null;
}

export default function ModalGestionBom({ isOpen, onClose, bomToEdit }: ModalGestionBomProps) {
    const { createBom, updateBom, isLoading: bomLoading, error: bomError } = useBomStore();
    const { products, fetchProducts, isLoading: productsLoading, error: productsError } = useProductStore();
    interface FormBomItem extends Partial<BillOfMaterialComponent> {
        component_product_id: string;
        quantity: number;
        unit: string;
        componentProduct?: Product; 
    }
    const [form, setForm] = useState<Omit<CreateBomPayload, 'items'> & { items: FormBomItem[] }>({
        product_id: '',
        name: '',
        description: '',
        quantity_produced: 1,
        items: [],
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        product_id: '',
        items: '',
    });
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            if (bomToEdit) {
                setForm({
                    product_id: bomToEdit.product_id,
                    name: bomToEdit.name,
                    description: bomToEdit.description || '',
                    quantity_produced: bomToEdit.quantity_produced,
                    items: bomToEdit.items.map(item => ({
                        ...item, 
                        componentProduct: item.componentProduct, 
                        unit: item.unit || 'unidad' 
                    })) as FormBomItem[], 
                });
            } else {
                setForm({
                    product_id: '',
                    name: '',
                    description: '',
                    quantity_produced: 1,
                    items: [{ component_product_id: '', quantity: 1, unit: 'unidad' }], 
                });
            }
            setFormErrors({ name: '', product_id: '', items: '' });
            setApiError(null);
        }
    }, [isOpen, bomToEdit, fetchProducts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: '' }));
        setApiError(null);
    };

    const handleItemChange = (index: number, field: keyof FormBomItem, value: string | number) => {
        const newItems = [...form.items];
        const itemToUpdate = { ...newItems[index] };

        if (field === 'component_product_id') {
            itemToUpdate.component_product_id = value as string;
            itemToUpdate.componentProduct = products.find(p => p.id === value) || undefined;
        } else if (field === 'quantity') {
            itemToUpdate.quantity = Number(value);
        } else if (field === 'unit') {
            itemToUpdate.unit = value as string;
        }
        newItems[index] = itemToUpdate;
        setForm(prev => ({ ...prev, items: newItems }));
        setFormErrors(prev => ({ ...prev, items: '' }));
    };

    const handleAddItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { component_product_id: '', quantity: 1, unit: 'unidad' }], 
        }));
    };

    const handleRemoveItem = (index: number) => {
        if (form.items.length > 1) {
            setForm(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index),
            }));
        } else {
            setForm(prev => ({
                ...prev,
                items: [{ component_product_id: '', quantity: 1, unit: 'unidad' }],
            }));
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);
        let currentErrors = { name: '', product_id: '', items: '' };
        let isValid = true;

        if (!form.name.trim()) {
            currentErrors.name = 'El nombre de la BOM es obligatorio.';
            isValid = false;
        }
        if (!form.product_id) {
            currentErrors.product_id = 'Debe seleccionar un producto final.';
            isValid = false;
        }

        if (form.items.length === 0 || form.items.some(item => !item.component_product_id || item.quantity <= 0)) {
            currentErrors.items = 'Debe agregar al menos un componente válido con cantidad mayor a 0.';
            isValid = false;
        }

        setFormErrors(currentErrors);

        if (!isValid) {
            return;
        }
        const bomItemsPayload: CreateBomItemPayload[] = form.items.map(item => ({
            component_product_id: item.component_product_id,
            quantity: item.quantity,
            unit: item.unit, 
        }));

        const bomPayload: CreateBomPayload = {
            product_id: form.product_id,
            name: form.name,
            description: form.description,
            quantity_produced: Number(form.quantity_produced),
            items: bomItemsPayload,
        };

        try {
            let success = false;
            if (bomToEdit) {
                const updated = await updateBom(bomToEdit.id, bomPayload as UpdateBomPayload);
                if (updated) success = true;
            } else {
                const created = await createBom(bomPayload);
                if (created) success = true;
            }

            if (success) {
                onClose();
                showTemporaryToast(`BOM ${bomToEdit ? 'actualizada' : 'creada'} con éxito`);
            } else if (bomError) {
                showErrorToast(bomError);
            }
        } catch (error: any) {
            console.error('Error en handleSubmit de BOM:', error);
            if (!apiError) {
                showErrorToast(error.message || 'Ocurrió un error inesperado al procesar la BOM.');
            }
        }
    };
    if (!isOpen) return null;
    const isEditing = !!bomToEdit;
    const isFormLoading = bomLoading || productsLoading;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {isEditing ? 'Editar BOM' : 'Crear Nueva BOM'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                    {apiError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{apiError}</span>
                        </div>
                    )}
                    {bomError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{bomError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Nombre de la BOM *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Nombre de la BOM (ej. BOM para Silla Ejecutiva)"
                                value={form.name}
                                onChange={handleChange}
                                className={`input ${formErrors.name ? 'border-red-500' : ''}`}
                                required
                            />
                            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="product_id" className="block text-gray-700 font-medium mb-1">Producto Final *</label>
                            {productsLoading ? (
                                <p className="text-gray-600">Cargando productos...</p>
                            ) : productsError ? (
                                <p className="text-red-500 text-sm">Error al cargar productos: {productsError}</p>
                            ) : (
                                <select
                                    id="product_id"
                                    name="product_id"
                                    value={form.product_id}
                                    onChange={handleChange}
                                    className={`input ${formErrors.product_id ? 'border-red-500' : ''}`}
                                    required
                                >
                                    <option value="">Selecciona un producto</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>{product.name} (SKU: {product.sku})</option>
                                    ))}
                                </select>
                            )}
                            {formErrors.product_id && <p className="text-red-500 text-xs mt-1">{formErrors.product_id}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity_produced" className="block text-gray-700 font-medium mb-1">Cantidad Producida</label>
                            <input
                                type="number"
                                id="quantity_produced"
                                name="quantity_produced"
                                value={form.quantity_produced}
                                onChange={handleChange}
                                min="1"
                                className="input"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-gray-700 font-medium mb-1">Descripción</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Descripción de la BOM"
                                value={form.description}
                                onChange={handleChange}
                                rows={2}
                                className="input"
                            ></textarea>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Componentes de la BOM *</h3>
                        {formErrors.items && <p className="text-red-500 text-xs mt-1 mb-3">{formErrors.items}</p>}

                        {form.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 mb-3 p-3 bg-white border border-gray-200 rounded-md">
                                <div className="flex-grow">
                                    <label htmlFor={`component-${index}`} className="sr-only">Componente {index + 1}</label>
                                    {productsLoading ? (
                                        <p className="text-gray-600">Cargando componentes...</p>
                                    ) : (
                                        <select
                                            id={`component-${index}`}
                                            value={item.component_product_id}
                                            onChange={(e) => handleItemChange(index, 'component_product_id', e.target.value)}
                                            className="input w-full"
                                            required
                                        >
                                            <option value="">Selecciona un componente</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>{product.name} (SKU: {product.sku})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="w-24">
                                    <label htmlFor={`quantity-${index}`} className="sr-only">Cantidad</label>
                                    <input
                                        type="number"
                                        id={`quantity-${index}`}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div className="w-24">
                                    <label htmlFor={`unit-${index}`} className="sr-only">Unidad</label>
                                    <input
                                        type="text"
                                        id={`unit-${index}`}
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                        placeholder="Unidad"
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                {form.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                                    >
                                        <Minus size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="mt-4 flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            <Plus size={18} className="mr-2" /> Añadir Componente
                        </button>
                    </div>
                    <div className="flex justify-end pt-4 gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1]"
                            disabled={isFormLoading}
                        >
                            {isFormLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear BOM')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}