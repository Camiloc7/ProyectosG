'use client';
import React, { useEffect, useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit } from 'react-icons/fa';
import { useSupplierCategoriesStore } from '@/store/Inventario/useSupplierCategories';
interface CategoryCardDisplay {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}
const ListaItemsDeCompra = () => {
  const { categories, loading, error, fetchCategories } = useSupplierCategoriesStore();
  const router = useRouter();
  const [displayedCards, setDisplayedCards] = useState<CategoryCardDisplay[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  useEffect(() => {
    const mappedCategories: CategoryCardDisplay[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
    }));
    const newCategoryCard: CategoryCardDisplay = {
      id: 'create-new-category',
      name: 'Crear categoría nueva',
      description: null,
      imageUrl: 'https://vanacco.com/wp-content/uploads/2020/06/Form-1.jpg',
    };
    setDisplayedCards([...mappedCategories, newCategoryCard]);
  }, [categories]);

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const handleDrop = (id: string) => {
    if (!draggedCardId || draggedCardId === id) return;
    const newOrder = [...displayedCards];
    const draggedIndex = newOrder.findIndex((card) => card.id === draggedCardId);
    const targetIndex = newOrder.findIndex((card) => card.id === id);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const createNewCard = newOrder.find(card => card.id === 'create-new-category');
    const filteredOrder = newOrder.filter(card => card.id !== 'create-new-category');
    const [movedCard] = filteredOrder.splice(draggedIndex, 1);
    filteredOrder.splice(targetIndex, 0, movedCard);
    setDisplayedCards([...filteredOrder, createNewCard as CategoryCardDisplay]); 
  };
  const handleCardClick = (id: string) => {
    if (id === 'create-new-category') {
      router.push(`/categoriaNueva`);
    } else {
      router.push(`/listaItemsDeCompra/${id}`); 
    }
  };
  const handleEditClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); 
    router.push(`/categoria/editar/${id}`); 
  };


  if (loading) {
    return (
      <PrivateRoute>
        <LayoutAdmi>
          <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full text-center text-gray-600">
            Cargando categorías...
          </div>
        </LayoutAdmi>
      </PrivateRoute>
    );
  }

  if (error) {
    return (
      <PrivateRoute>
        <LayoutAdmi>
          <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full text-center text-red-500">
            Error al cargar las categorías: {error}
          </div>
        </LayoutAdmi>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#6F6F6F] text-center mb-6">
            Lista de Items de Compra
          </h1>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#6F6F6F] text-center mb-6">
            Categorías de Proveedores
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            {displayedCards.map((card) => (
              <div
                key={card.id}
                draggable={card.id !== 'create-new-category'}
                onDragStart={() => handleDragStart(card.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(card.id)}
                onClick={() => handleCardClick(card.id)} 
                className="w-64 bg-white p-4 rounded-2xl shadow-lg cursor-pointer border border-gray-200 hover:shadow-xl transition relative" 
              >
                {card.id !== 'create-new-category' && (
                  <button
                    onClick={(e) => handleEditClick(card.id, e)} 
                    className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 z-10 text-sm"
                    title="Editar Categoría"
                  >
                    Editar
                  </button>
                )}

                <img
                  src={card.imageUrl || 'https://vanacco.com/wp-content/uploads/2020/06/Form-1.jpg'}
                  alt={card.name}
                  className="w-full h-32 object-cover rounded-md bg-gray-100"
                />
                <h2 className="mt-2 text-lg font-semibold text-gray-700">
                  {card.name}
                </h2>
                {card.id === 'create-new-category' ? (
                  <div className="w-full flex items-center justify-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full mt-2">
                      <FaPlus className="text-white text-3xl" />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">{card.description}</p>
                )}
              </div>
            ))}
          </div>
          {!loading && !error && categories.length === 0 && (
            <div className="text-center text-gray-600 mt-8">
              No hay categorías de proveedor disponibles. Crea una nueva.
            </div>
          )}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default ListaItemsDeCompra;