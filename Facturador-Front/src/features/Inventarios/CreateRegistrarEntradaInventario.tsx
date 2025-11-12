// 'use client';
// import { useEffect, useState } from 'react';
// import { X } from 'lucide-react';
// import { INVENTORY_URL } from '@/helpers/ruta';
// import { useUserStore } from '@/store/useUser';
// interface ModalCrearProductoProps {
//   isOpen: boolean;
//   onClose: () => void;
// }
// type Category = { id: string; name: string };
// type Supplier = { nit: string; name: string };
// type Location = { id: string; name: string };
// type Product = { id: string; name: string; sku: string; barcode: string; category_id: string };
// export default function ModalRegistrarEntradaInventario({ isOpen, onClose }: ModalCrearProductoProps) {
//   const user = useUserStore(state => state.user);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [locations, setLocations] = useState<Location[]>([]);
//   const [existingProducts, setExistingProducts] = useState<Product[]>([]); 
//   const [searchTerm, setSearchTerm] = useState(''); 
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
//   const [form, setForm] = useState({
//     product: { id: '' , sku: '', name: '', barcode: '', category_id: '' },
//     supplier_nit: '',
//     lot: { lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 },
//     location_id: '',
//     movement: {
//       movement_type: 'entrada',
//       quantity: 0,
//       user_id: '',
//       movement_date: '',
//     },
//     serials: [] as string[],
//   });
//   const [createProductFlow, setCreateProductFlow] = useState(true); 
//   const [selectedProductId, setSelectedProductId] = useState(''); 
//   const [handleSerials, setHandleSerials] = useState(false); 
//   const [rawSerialsInput, setRawSerialsInput] = useState(''); 
//   useEffect(() => {
//     if (!isOpen) return;
//     const fetchData = async () => {
//       try {
//         const [catRes, supRes, locRes, prodRes] = await Promise.all([
//           fetch(`${INVENTORY_URL}products/categories`),
//           fetch(`${INVENTORY_URL}suppliers`),
//           fetch(`${INVENTORY_URL}locations`),
//           fetch(`${INVENTORY_URL}products`),
//         ]);
//         if (!catRes.ok || !supRes.ok || !locRes.ok || !prodRes.ok) {
//           throw new Error('Error al cargar datos iniciales');
//         }
//         const categoriesData = await catRes.json();
//         const suppliersData = await supRes.json();
//         const locationsData = await locRes.json();
//         const productsData = await prodRes.json();
//         setCategories(categoriesData);
//         setSuppliers(suppliersData);
//         setLocations(locationsData);
//         setExistingProducts(productsData);
//         setFilteredProducts(productsData);
//       } catch (error) {
//         console.error('Fetch error:', error);
//         alert('Error al cargar datos iniciales: ');
//       }
//     };
//     fetchData();
//   }, [isOpen]);
//   useEffect(() => {
//     if (isOpen && user?.id) {
//       setForm(prev => ({
//         ...prev,
//         movement: {
//           ...prev.movement,
//           user_id: user.id,
//           movement_date: new Date().toISOString().split('T')[0], 
//         },
//       }));
//     }
//   }, [isOpen, user]);
//   useEffect(() => {
//     if (!isOpen) {
//       setForm({
//         product: { id:'', sku: '', name: '', barcode: '', category_id: '' },
//         supplier_nit: '',
//         lot: { lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 },
//         location_id: '',
//         movement: {
//           movement_type: 'entrada',
//           quantity: 0,
//           user_id: '',
//           movement_date: '',
//         },
//         serials: [],
//       });
//       setRawSerialsInput('');
//       setCreateProductFlow(true); 
//       setSelectedProductId('');
//       setHandleSerials(false);
//     }
//   }, [isOpen]);
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     if (name.startsWith('product.')) {
//       const field = name.split('.')[1];
//       setForm(prev => ({ ...prev, product: { ...prev.product, [field]: value } }));
//     } else if (name.startsWith('lot.')) {
//       const field = name.split('.')[1];
//       setForm(prev => ({
//         ...prev,
//         lot: { ...prev.lot, [field]: field === 'initial_quantity' ? Number(value) : value },
//       }));
//     } else if (name.startsWith('movement.')) {
//       const field = name.split('.')[1];
//       setForm(prev => ({
//         ...prev,
//         movement: { ...prev.movement, [field]: field === 'quantity' ? Number(value) : value },
//       }));
//     } else if (name === 'supplier_nit' || name === 'location_id') {
//       setForm(prev => ({ ...prev, [name]: value }));
//     }
//   };
//   const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const term = e.target.value;
//     setSearchTerm(term);
//     if (term.length > 2) {
//       setFilteredProducts(existingProducts.filter(p =>
//         p.name.toLowerCase().includes(term.toLowerCase()) ||
//         p.sku.toLowerCase().includes(term.toLowerCase()) ||
//         p.barcode.toLowerCase().includes(term.toLowerCase())
//       ));
//     } else {
//       setFilteredProducts(existingProducts); 
//     }
//   };
//   const handleSelectExistingProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const productId = e.target.value;
//     setSelectedProductId(productId);
//     const product = existingProducts.find(p => p.id === productId);
//     if (product) {
//       setForm(prev => ({
//         ...prev,
//         product: { 
//           id: product.id,
//           sku: product.sku,
//           name: product.name,
//           barcode: product.barcode,
//           category_id: product.category_id,
//         },
//       }));
//     }
//   };
//   const handleSerialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const value = e.target.value;
//     setRawSerialsInput(value);
//     const serialsArray = value.split('\n').map(s => s.trim()).filter(Boolean);
//     setForm(prev => ({ ...prev, serials: serialsArray }));
//     if (handleSerials) {
//         setForm(prev => ({
//             ...prev,
//             lot: { ...prev.lot, initial_quantity: serialsArray.length },
//             movement: { ...prev.movement, quantity: serialsArray.length },
//         }));
//     }
//   };
//   const toggleCreateProductFlow = (shouldCreate: boolean) => {
//     setCreateProductFlow(shouldCreate);
//     if (!shouldCreate) {
//       setForm(prev => ({
//         ...prev,
//         product: { id:'', sku: '', name: '', barcode: '', category_id: '' },
//       }));
//       setSelectedProductId(''); 
//     } else {
//       setSelectedProductId(''); 
//     }
//   };
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     let payload = { ...form };
//     if (!createProductFlow) {
//       payload = {
//         ...form,
//         product: {
//           ...form.product,
//           id: form.product.id ? form.product.id : selectedProductId, 
//         },
//       };
//     }
//     if (handleSerials && form.serials.length === 0) {
//         alert('Si manejas seriales, debes ingresar al menos uno.');
//         return;
//     }
//     if (!handleSerials && form.movement.quantity <= 0) {
//         alert('La cantidad del movimiento debe ser mayor que cero.');
//         return;
//     }
//     try {
//       const res = await fetch(`${INVENTORY_URL}/inventory/orchestration/entry`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         console.error('Backend error:', errorData);
//         throw new Error(errorData.message || 'Error al crear el producto');
//       }
//       alert('Entrada de inventario registrada con éxito');
//       onClose();
//     } catch (err) {
//       console.error(err);
//       alert('Hubo un error al registrar la entrada: ');
//     }
//   };
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative">
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
//           <X size={20} />
//         </button>
//         <h2 className="text-xl font-semibold text-gray-800 mb-6">Registrar Entrada de Inventario</h2>
//         <form onSubmit={handleSubmit} className="space-y-4 text-sm">
//           <div className="mb-4 flex gap-4">
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="productFlow"
//                 checked={createProductFlow}
//                 onChange={() => toggleCreateProductFlow(true)}
//                 className="mr-2"
//               />
//               Crear Nuevo Producto
//             </label>
//             <label className="flex items-center">
//               <input
//                 type="radio"
//                 name="productFlow"
//                 checked={!createProductFlow}
//                 onChange={() => toggleCreateProductFlow(false)}
//                 className="mr-2"
//               />
//               Seleccionar Producto Existente
//             </label>
//           </div>
//           {createProductFlow ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
//               <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Nuevo Producto</h3>
//               <input type="text" name="product.sku" placeholder="SKU (opcional)" value={form.product.sku} onChange={handleChange} className="input" />
//               <input type="text" name="product.name" placeholder="Nombre del Producto" value={form.product.name} onChange={handleChange} className="input" required />
//               <input type="text" name="product.barcode" placeholder="Código de barras" value={form.product.barcode} onChange={handleChange} className="input" required />
//               <select name="product.category_id" value={form.product.category_id} onChange={handleChange} className="input" required>
//                 <option value="">Selecciona una categoría</option>
//                 {categories.map(cat => (
//                   <option key={cat.id} value={cat.id}>{cat.name}</option>
//                 ))}
//               </select>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
//               <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Seleccionar Producto Existente</h3>
//               <input
//                 type="text"
//                 placeholder="Buscar producto por nombre, SKU, código de barras..."
//                 value={searchTerm}
//                 onChange={handleProductSearch}
//                 className="input col-span-2"
//               />
//               {searchTerm.length > 2 && filteredProducts.length === 0 && (
//                 <p className="col-span-2 text-sm text-gray-500">No se encontraron productos.</p>
//               )}
//               <select
//                 name="selectedProductId"
//                 value={selectedProductId}
//                 onChange={handleSelectExistingProduct}
//                 className="input col-span-2"
//                 required={!createProductFlow} 
//               >
//                 <option value="">Selecciona un producto</option>
//                 {filteredProducts.map(prod => (
//                   <option key={prod.id} value={prod.id}>
//                     {prod.name} {prod.sku ? `(SKU: ${prod.sku})` : ''}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//           <div className="border p-4 rounded-md bg-white">
//             <h3 className="text-md font-semibold text-gray-700 mb-2">Proveedor</h3>
//             <select name="supplier_nit" value={form.supplier_nit} onChange={handleChange} className="input w-full" required>
//               <option value="">Selecciona un proveedor</option>
//               {suppliers.map(sup => (
//                 <option key={sup.nit} value={sup.nit}>{sup.name}</option>
//               ))}
//             </select>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-white">
//             <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Lote</h3>
//             <input type="text" name="lot.lot_number" placeholder="Número de lote" value={form.lot.lot_number} onChange={handleChange} className="input" required />
//             <input type="date" name="lot.manufacture_date" value={form.lot.manufacture_date} onChange={handleChange} className="input" required />
//             <input type="date" name="lot.expiration_date" value={form.lot.expiration_date} onChange={handleChange} className="input" required />
//             <input
//               type="number"
//               name="lot.initial_quantity"
//               placeholder="Cantidad inicial del lote"
//               value={form.lot.initial_quantity}
//               onChange={handleChange}
//               className="input"
//               required
//               disabled={handleSerials} 
//             />
//           </div>
//           <div className="border p-4 rounded-md bg-white">
//             <h3 className="text-md font-semibold text-gray-700 mb-2">Ubicación de Entrada</h3>
//             <select name="location_id" value={form.location_id} onChange={handleChange} className="input w-full" required>
//               <option value="">Selecciona una ubicación</option>
//               {locations.map(loc => (
//                 <option key={loc.id} value={loc.id}>{loc.name}</option>
//               ))}
//             </select>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-white">
//             <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Movimiento</h3>
//             <select name="movement.movement_type" value={form.movement.movement_type} onChange={handleChange} className="input">
//               <option value="entrada">Entrada</option>
//             </select>
//             <input
//               type="number"
//               name="movement.quantity"
//               placeholder="Cantidad del movimiento"
//               value={form.movement.quantity}
//               onChange={handleChange}
//               className="input"
//               required
//               disabled={handleSerials} 
//             />
//             <input type="date" name="movement.movement_date" value={form.movement.movement_date} onChange={handleChange} className="input" required />
//             <input type="hidden" name="movement.user_id" value={form.movement.user_id} />
//           </div>
//           <div className="border p-4 rounded-md bg-white">
//             <h3 className="text-md font-semibold text-gray-700 mb-2">Manejo de Seriales</h3>
//             <label className="flex items-center mb-4">
//               <input
//                 type="checkbox"
//                 checked={handleSerials}
//                 onChange={(e) => {
//                   setHandleSerials(e.target.checked);
//                   if (!e.target.checked) {
//                     setRawSerialsInput('');
//                     setForm(prev => ({
//                         ...prev,
//                         serials: [],
//                         lot: { ...prev.lot, initial_quantity: 0 },
//                         movement: { ...prev.movement, quantity: 0 },
//                     }));
//                   }
//                 }}
//                 className="mr-2"
//               />
//               Este producto maneja números de serie
//             </label>
//             {handleSerials && (
//               <textarea
//                 rows={6}
//                 placeholder="Ingresa cada número de serie en una nueva línea (ej: SN12345, SN12346)"
//                 value={rawSerialsInput}
//                 onChange={handleSerialsChange}
//                 className="input w-full resize-y"
//               />
//             )}
//           </div>
//           <div className="flex justify-end gap-4 pt-4">
//             <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600">
//               Cancelar
//             </button>
//             <button type="submit" className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1]">
//               Registrar Entrada
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { INVENTORY_URL } from '@/helpers/ruta';
import { useUserStore } from '@/store/useUser'; // Todavía la importamos si la necesitas para otras cosas en este modal, pero no para el movimiento

interface ModalCrearProductoProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = { id: string; name: string };
type Supplier = { nit: string; name: string };
type Location = { id: string; name: string };
type Product = { id: string; name: string; sku: string; barcode: string; category_id: string };

export default function ModalRegistrarEntradaInventario({ isOpen, onClose }: ModalCrearProductoProps) {
  // const user = useUserStore(state => state.user); // No es necesario si no usas el user.id en el movimiento

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    product: { id: '' , sku: '', name: '', barcode: '', category_id: '' },
    supplier_nit: '',
    lot: { lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 },
    location_id: '',
    movement: {
      movement_type: 'entrada',
      quantity: 0,
      // user_id: '', // ELIMINADO: No inicializamos user_id aquí
      movement_date: '',
    },
    serials: [] as string[],
  });

  const [createProductFlow, setCreateProductFlow] = useState(true); 
  const [selectedProductId, setSelectedProductId] = useState(''); 
  const [handleSerials, setHandleSerials] = useState(false); 
  const [rawSerialsInput, setRawSerialsInput] = useState(''); 

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [catRes, supRes, locRes, prodRes] = await Promise.all([
          fetch(`${INVENTORY_URL}products/categories`),
          fetch(`${INVENTORY_URL}suppliers`),
          fetch(`${INVENTORY_URL}locations`),
          fetch(`${INVENTORY_URL}products`),
        ]);
        if (!catRes.ok || !supRes.ok || !locRes.ok || !prodRes.ok) {
          throw new Error('Error al cargar datos iniciales');
        }
        const categoriesData = await catRes.json();
        const suppliersData = await supRes.json();
        const locationsData = await locRes.json();
        const productsData = await prodRes.json();

        setCategories(categoriesData);
        setSuppliers(suppliersData);
        setLocations(locationsData);
        setExistingProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Error al cargar datos iniciales: ');
      }
    };
    fetchData();
  }, [isOpen]);

  // ELIMINADO: Este useEffect ya no es necesario porque no asignamos user_id al movimiento
  // useEffect(() => {
  //   if (isOpen && user?.id) {
  //     setForm(prev => ({
  //       ...prev,
  //       movement: {
  //         ...prev.movement,
  //         user_id: user.id,
  //         movement_date: new Date().toISOString().split('T')[0], 
  //       },
  //     }));
  //   }
  // }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        product: { id:'', sku: '', name: '', barcode: '', category_id: '' },
        supplier_nit: '',
        lot: { lot_number: '', manufacture_date: '', expiration_date: '', initial_quantity: 0 },
        location_id: '',
        movement: {
          movement_type: 'entrada',
          quantity: 0,
          // user_id: '', // ELIMINADO: No reseteamos user_id aquí
          movement_date: '',
        },
        serials: [],
      });
      setRawSerialsInput('');
      setCreateProductFlow(true); 
      setSelectedProductId('');
      setHandleSerials(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('product.')) {
      const field = name.split('.')[1];
      setForm(prev => ({ ...prev, product: { ...prev.product, [field]: value } }));
    } else if (name.startsWith('lot.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        lot: { ...prev.lot, [field]: field === 'initial_quantity' ? Number(value) : value },
      }));
    } else if (name.startsWith('movement.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        movement: { ...prev.movement, [field]: field === 'quantity' ? Number(value) : value },
      }));
    } else if (name === 'supplier_nit' || name === 'location_id') {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      setFilteredProducts(existingProducts.filter(p =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.sku.toLowerCase().includes(term.toLowerCase()) ||
        p.barcode.toLowerCase().includes(term.toLowerCase())
      ));
    } else {
      setFilteredProducts(existingProducts); 
    }
  };

  const handleSelectExistingProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const product = existingProducts.find(p => p.id === productId);
    if (product) {
      setForm(prev => ({
        ...prev,
        product: { 
          id: product.id,
          sku: product.sku,
          name: product.name,
          barcode: product.barcode,
          category_id: product.category_id,
        },
      }));
    }
  };

  const handleSerialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRawSerialsInput(value);
    const serialsArray = value.split('\n').map(s => s.trim()).filter(Boolean);
    setForm(prev => ({ ...prev, serials: serialsArray }));
    if (handleSerials) {
        setForm(prev => ({
            ...prev,
            lot: { ...prev.lot, initial_quantity: serialsArray.length },
            movement: { ...prev.movement, quantity: serialsArray.length },
        }));
    }
  };

  const toggleCreateProductFlow = (shouldCreate: boolean) => {
    setCreateProductFlow(shouldCreate);
    if (!shouldCreate) {
      setForm(prev => ({
        ...prev,
        product: { id:'', sku: '', name: '', barcode: '', category_id: '' },
      }));
      setSelectedProductId(''); 
    } else {
      setSelectedProductId(''); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload = { ...form };
    if (!createProductFlow) {
      payload = {
        ...form,
        product: {
          ...form.product,
          id: form.product.id ? form.product.id : selectedProductId, 
        },
      };
    }
    if (handleSerials && form.serials.length === 0) {
        alert('Si manejas seriales, debes ingresar al menos uno.');
        return;
    }
    if (!handleSerials && form.movement.quantity <= 0) {
        alert('La cantidad del movimiento debe ser mayor que cero.');
        return;
    }
    try {
      const res = await fetch(`${INVENTORY_URL}/inventory/orchestration/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Error al crear el producto');
      }
      alert('Entrada de inventario registrada con éxito');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al registrar la entrada: ');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Registrar Entrada de Inventario</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="mb-4 flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="productFlow"
                checked={createProductFlow}
                onChange={() => toggleCreateProductFlow(true)}
                className="mr-2"
              />
              Crear Nuevo Producto
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productFlow"
                checked={!createProductFlow}
                onChange={() => toggleCreateProductFlow(false)}
                className="mr-2"
              />
              Seleccionar Producto Existente
            </label>
          </div>
          {createProductFlow ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
              <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Nuevo Producto</h3>
              <input type="text" name="product.sku" placeholder="SKU (opcional)" value={form.product.sku} onChange={handleChange} className="input" />
              <input type="text" name="product.name" placeholder="Nombre del Producto" value={form.product.name} onChange={handleChange} className="input" required />
              <input type="text" name="product.barcode" placeholder="Código de barras" value={form.product.barcode} onChange={handleChange} className="input" required />
              <select name="product.category_id" value={form.product.category_id} onChange={handleChange} className="input" required>
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50">
              <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Seleccionar Producto Existente</h3>
              <input
                type="text"
                placeholder="Buscar producto por nombre, SKU, código de barras..."
                value={searchTerm}
                onChange={handleProductSearch}
                className="input col-span-2"
              />
              {searchTerm.length > 2 && filteredProducts.length === 0 && (
                <p className="col-span-2 text-sm text-gray-500">No se encontraron productos.</p>
              )}
              <select
                name="selectedProductId"
                value={selectedProductId}
                onChange={handleSelectExistingProduct}
                className="input col-span-2"
                required={!createProductFlow} 
              >
                <option value="">Selecciona un producto</option>
                {filteredProducts.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} {prod.sku ? `(SKU: ${prod.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="border p-4 rounded-md bg-white">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Proveedor</h3>
            <select name="supplier_nit" value={form.supplier_nit} onChange={handleChange} className="input w-full" required>
              <option value="">Selecciona un proveedor</option>
              {suppliers.map(sup => (
                <option key={sup.nit} value={sup.nit}>{sup.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-white">
            <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Lote</h3>
            <input type="text" name="lot.lot_number" placeholder="Número de lote" value={form.lot.lot_number} onChange={handleChange} className="input" required />
            <input type="date" name="lot.manufacture_date" value={form.lot.manufacture_date} onChange={handleChange} className="input" required />
            <input type="date" name="lot.expiration_date" value={form.lot.expiration_date} onChange={handleChange} className="input" required />
            <input
              type="number"
              name="lot.initial_quantity"
              placeholder="Cantidad inicial del lote"
              value={form.lot.initial_quantity}
              onChange={handleChange}
              className="input"
              required
              disabled={handleSerials} 
            />
          </div>
          <div className="border p-4 rounded-md bg-white">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Ubicación de Entrada</h3>
            <select name="location_id" value={form.location_id} onChange={handleChange} className="input w-full" required>
              <option value="">Selecciona una ubicación</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-white">
            <h3 className="col-span-2 text-md font-semibold text-gray-700 mb-2">Detalles del Movimiento</h3>
            <select name="movement.movement_type" value={form.movement.movement_type} onChange={handleChange} className="input">
              <option value="entrada">Entrada</option>
            </select>
            <input
              type="number"
              name="movement.quantity"
              placeholder="Cantidad del movimiento"
              value={form.movement.quantity}
              onChange={handleChange}
              className="input"
              required
              disabled={handleSerials} 
            />
            <input type="date" name="movement.movement_date" value={form.movement.movement_date} onChange={handleChange} className="input" required />
            {/* ELIMINADO: No renderizamos el input hidden para user_id */}
            {/* <input type="hidden" name="movement.user_id" value={form.movement.user_id} /> */}
          </div>
          <div className="border p-4 rounded-md bg-white">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Manejo de Seriales</h3>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={handleSerials}
                onChange={(e) => {
                  setHandleSerials(e.target.checked);
                  if (!e.target.checked) {
                    setRawSerialsInput('');
                    setForm(prev => ({
                        ...prev,
                        serials: [],
                        lot: { ...prev.lot, initial_quantity: 0 },
                        movement: { ...prev.movement, quantity: 0 },
                    }));
                  }
                }}
                className="mr-2"
              />
              Este producto maneja números de serie
            </label>
            {handleSerials && (
              <textarea
                rows={6}
                placeholder="Ingresa cada número de serie en una nueva línea (ej: SN12345, SN12346)"
                value={rawSerialsInput}
                onChange={handleSerialsChange}
                className="input w-full resize-y"
              />
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-3xl hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" className="bg-[#00A7E1] text-white px-4 py-2 rounded-3xl hover:bg-[#008ec1]">
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}