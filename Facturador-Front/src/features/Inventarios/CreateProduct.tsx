import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { INVENTORY_URL } from '@/helpers/ruta';
import { ProductCategory, useCategoryStore } from '@/store/Inventario/useCategoryStore'; 

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (productId: string, productName: string, productSku: string, productBarcode: string | null, categoryId: string) => void;
  initialData?: {
    name: string;
    sku: string | null;
    barcode: string | null;
    category_id: string | null;
  };
}
export default function ModalCrearProducto({ isOpen, onClose, onProductCreated, initialData }: ModalCrearProductoProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number | string>('');
  const [salePrice, setSalePrice] = useState<number | string>('');
  const { categories, fetchCategories, isLoading: areCategoriesLoading, error: categoryError } = useCategoryStore();
  const [categoryInput, setCategoryInput] = useState(''); 
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); 
  const [filteredCategories, setFilteredCategories] = useState<typeof categories>([]); 
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false); 
  const [isCreatingProduct, setIsCreatingProduct] = useState(false); 
  const [productCreationError, setProductCreationError] = useState<string | null>(null); 
  const categoryInputRef = useRef<HTMLInputElement>(null); 
  useEffect(() => {
    if (isOpen) {
      fetchCategories(); 
    }
  }, [isOpen, fetchCategories]); 

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);




  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setSku(initialData.sku || '');
        setBarcode(initialData.barcode || '');
        if (initialData.category_id) {
          const initialCategory = categories.find(cat => cat.id === initialData.category_id);
          if (initialCategory) {
            setCategoryInput(initialCategory.name);
            setSelectedCategoryId(initialCategory.id);
          }
        }
      }
    } else {
      setName('');
      setSku('');
      setBarcode('');
      setDescription('');
      setCostPrice('');
      setSalePrice('');
      setCategoryInput('');
      setSelectedCategoryId('');
      setProductCreationError(null);
      setShowCategorySuggestions(false);
    }
  }, [isOpen, initialData, categories]);


  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategoryInput(value);
    setSelectedCategoryId(''); 
    if (value.length > 0) {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowCategorySuggestions(true);
    } else {
      setFilteredCategories(categories); 
      setShowCategorySuggestions(false); 
    }
  };

  const handleSelectCategory = (category: ProductCategory) => { 
    setCategoryInput(category.name);
    setSelectedCategoryId(category.id);
    setShowCategorySuggestions(false); 
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryInputRef.current && !categoryInputRef.current.contains(event.target as Node)) {
        if (!selectedCategoryId) {
            setShowCategorySuggestions(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true); 
    setProductCreationError(null); 

    let finalCategoryId = selectedCategoryId;
    if (!finalCategoryId && categoryInput.trim()) {
      try {
        const newCategory = await createNewCategory(categoryInput.trim());
        if (newCategory) {
          finalCategoryId = newCategory.id;
          fetchCategories(); 
        } else {
          throw new Error('No se pudo crear la nueva categoría.');
        }
      } catch (catError: any) {
        setProductCreationError(catError.message || 'Error al crear la categoría.'); 
        setIsCreatingProduct(false); 
        return;
      }
    }
    if (!finalCategoryId) {
        setProductCreationError('Por favor, selecciona o crea una categoría.'); 
        setIsCreatingProduct(false);
        return;
    }
    const productData = {
      sku: sku || undefined,
      name,
      description: description || undefined,
      barcode,
      cost_price: Number(costPrice),
      sale_price: Number(salePrice),
      category_id: finalCategoryId,
    };

    try {
      const res = await fetch(`${INVENTORY_URL}products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el producto');
      }
      const newProduct = await res.json();
      alert('Producto creado con éxito');
      onProductCreated?.(newProduct.id, newProduct.name, newProduct.sku, newProduct.barcode, newProduct.category_id);
      onClose(); 
    } catch (err: any) {
      console.error('Error creating product:', err);
      setProductCreationError(err.message || 'Hubo un error al crear el producto.'); 
    } finally {
      setIsCreatingProduct(false); 
    }
  };

  const createNewCategory = async (categoryName: string): Promise<ProductCategory | null> => { 
    try {
      const res = await fetch(`${INVENTORY_URL}products/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: categoryName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la categoría');
      }
      const newCategory: ProductCategory = await res.json(); 
      return newCategory;
    } catch (err: any) {
      console.error('Error creating new category:', err);
      throw err; 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Crear Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre del Producto" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
            <input type="text" placeholder="SKU (opcional)" value={sku} onChange={(e) => setSku(e.target.value)} className="input" />
            <input type="text" placeholder="Código de barras" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="input" required />
            <div className="relative" ref={categoryInputRef}>
              <input
                type="text"
                placeholder="Buscar o crear categoría"
                value={categoryInput}
                onChange={handleCategoryInputChange}
                onFocus={() => setShowCategorySuggestions(true)} 
                className="input w-full"
                required
              />
              {areCategoriesLoading && <p className="text-xs text-gray-500 mt-1">Cargando categorías...</p>}
              {categoryError && <p className="text-red-500 text-xs italic mt-1">{categoryError}</p>}

              {showCategorySuggestions && filteredCategories.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                  {filteredCategories.map(cat => (
                    <li
                      key={cat.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectCategory(cat)}
                    >
                      {cat.name}
                    </li>
                  ))}
                </ul>
              )}
              {categoryInput.trim() && !selectedCategoryId && !filteredCategories.some(cat => cat.name.toLowerCase() === categoryInput.trim().toLowerCase()) && (
                <p className="text-xs text-gray-600 mt-2 px-1">
                  Categoría no encontrada. Se creará "{categoryInput.trim()}" al guardar.
                </p>
              )}
            </div>
            <input type="number" placeholder="Precio de Costo" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="input" required />
            <input type="number" placeholder="Precio de Venta" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="input" required />
          </div>
          <textarea rows={3} placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full" />
          {productCreationError && <p className="text-red-500 text-sm mt-4">{productCreationError}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1]" disabled={isCreatingProduct}>
              {isCreatingProduct ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
