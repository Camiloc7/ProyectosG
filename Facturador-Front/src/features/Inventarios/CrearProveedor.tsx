'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { INVENTORY_URL } from '@/helpers/ruta';
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
import { useSupplierCategoriesStore } from '@/store/Inventario/useSupplierCategories';
interface ModalCrearProveedorProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function ModalCrearProveedor({
  isOpen,
  onClose,
}: ModalCrearProveedorProps) {
  const { fetchSuppliers } = useSuppliersStore();
  const {
    categories,
    fetchCategories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useSupplierCategoriesStore();
  const [form, setForm] = useState({
    nit: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    category_id: '',
    verification_digit: '',
    city: '',
    notifications_enabled: false,
    document_type: '',
    contact_first_name: '',
    contact_middle_name: '',
    contact_last_name: '',
    contact_second_last_name: '',
    commercial_name: '',
    bank_account_type: '',
    bank_account_number: '',
    bank_name: '',
    newCategory: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    category_id: '',
    newCategory: '',
  });
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setForm({
        nit: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        category_id: '',
        verification_digit: '',
        city: '',
        notifications_enabled: false,
        document_type: '',
        contact_first_name: '',
        contact_middle_name: '',
        contact_last_name: '',
        contact_second_last_name: '',
        commercial_name: '',
        bank_account_type: '',
        bank_account_number: '',
        bank_name: '',
        newCategory: '',
      });
      setFormErrors({ name: '', category_id: '', newCategory: '' });
      setApiError(null);
    }
  }, [isOpen, fetchCategories]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    let currentErrors = { name: '', category_id: '', newCategory: '' };
    let isValid = true;
    if (!form.name.trim()) {
      currentErrors.name = 'El nombre del proveedor es obligatorio.';
      isValid = false;
    }
    let finalCategoryId = form.category_id;
    if (form.newCategory.trim()) {
      finalCategoryId = '';
    } else if (!form.category_id) {
      currentErrors.category_id =
        'Debe seleccionar una categoría o crear una nueva.';
      isValid = false;
    }
    setFormErrors(currentErrors);
    if (!isValid) {
      return;
    }
    try {
      if (form.newCategory.trim()) {
        const res = await fetch(`${INVENTORY_URL}api/proveedores/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.newCategory.trim() }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 409) {
            setApiError(
              errorData.message || 'La categoría que intentas crear ya existe.'
            );
          } else {
            setApiError(errorData.message || 'Error al crear nueva categoría.');
          }
          throw new Error('Error al crear nueva categoría');
        }
        const newCat = await res.json();
        if (!newCat.id) {
          throw new Error(
            'La API de categorías no devolvió un ID válido para la nueva categoría.'
          );
        }
        finalCategoryId = newCat.id;
      }
      if (!finalCategoryId) {
        throw new Error(
          'La categoría del proveedor no fue asignada correctamente. Por favor, selecciona una o crea una nueva.'
        );
      }
      const supplierPayload = {
        nombre: form.name,
        nit: form.nit,
        DV: form.verification_digit,
        direccion: form.address,
        correo: form.email,
        telefono: form.phone,
        ciudad: form.city,
        NOTI: form.notifications_enabled ? '' : 'NO',
        TIPOD: form.document_type,
        nombre1: form.contact_first_name,
        nombre2: form.contact_middle_name,
        apellido1: form.contact_last_name,
        apellido2: form.contact_second_last_name,
        COMERCIO: form.commercial_name,
        TIPOC: form.bank_account_type,
        NUMCUENTA: form.bank_account_number,
        BANCO: form.bank_name,
        category_id: finalCategoryId,
      };
      const res = await fetch(`${INVENTORY_URL}api/proveedores/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierPayload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setApiError(
          errorData.message ||
            `Error ${res.status}: ${res.statusText}. Error al crear el proveedor.`
        );
        throw new Error('Error al crear el proveedor');
      }
      await fetchSuppliers();
      onClose();
      alert('Proveedor creado con éxito');
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      if (!apiError) {
        setApiError(
          error.message || 'Ocurrió un error inesperado al crear el proveedor.'
        );
      }
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Agregar Proveedor
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {apiError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{apiError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="nit"
              placeholder="NIT"
              value={form.nit}
              onChange={handleChange}
              className="input"
            />
            <input
              name="verification_digit"
              placeholder="Dígito de Verificación (DV)"
              value={form.verification_digit}
              onChange={handleChange}
              className="input"
            />
            <div>
              <input
                name="name"
                placeholder="Nombre Comercial *"
                value={form.name}
                onChange={handleChange}
                className={`input ${formErrors.name ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <input
              name="commercial_name"
              placeholder="Nombre del Comercio"
              value={form.commercial_name}
              onChange={handleChange}
              className="input"
            />
            <input
              name="address"
              placeholder="Dirección"
              value={form.address}
              onChange={handleChange}
              className="input"
            />
            <input
              name="city"
              placeholder="Ciudad"
              value={form.city}
              onChange={handleChange}
              className="input"
            />
            <input
              name="phone"
              placeholder="Teléfono"
              value={form.phone}
              onChange={handleChange}
              className="input"
            />
            <input
              name="email"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              className="input"
            />
            <input
              name="document_type"
              placeholder="Tipo de Documento (TIPOD)"
              value={form.document_type}
              onChange={handleChange}
              className="input"
            />
            <input
              name="contact_first_name"
              placeholder="Primer Nombre Contacto"
              value={form.contact_first_name}
              onChange={handleChange}
              className="input"
            />
            <input
              name="contact_middle_name"
              placeholder="Segundo Nombre Contacto"
              value={form.contact_middle_name}
              onChange={handleChange}
              className="input"
            />
            <input
              name="contact_last_name"
              placeholder="Primer Apellido Contacto"
              value={form.contact_last_name}
              onChange={handleChange}
              className="input"
            />
            <input
              name="contact_second_last_name"
              placeholder="Segundo Apellido Contacto"
              value={form.contact_second_last_name}
              onChange={handleChange}
              className="input"
            />
            <input
              name="bank_account_type"
              placeholder="Tipo de Cuenta Bancaria"
              value={form.bank_account_type}
              onChange={handleChange}
              className="input"
            />
            <input
              name="bank_account_number"
              placeholder="Número de Cuenta Bancaria"
              value={form.bank_account_number}
              onChange={handleChange}
              className="input"
            />
            <input
              name="bank_name"
              placeholder="Nombre del Banco"
              value={form.bank_name}
              onChange={handleChange}
              className="input"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notifications_enabled"
                checked={form.notifications_enabled}
                onChange={handleChange}
                className="form-checkbox h-4 w-4 text-[#00A7E1] rounded"
              />
              <label
                htmlFor="notifications_enabled"
                className="text-sm text-gray-700"
              >
                Recibir Notificaciones
              </label>
            </div>
            <input
              name="contact_person"
              placeholder="Persona de Contacto (Antiguo campo)"
              value={form.contact_person}
              onChange={handleChange}
              className="input"
            />
          </div>
          <textarea
            name="notes"
            placeholder="Notas"
            value={form.notes}
            onChange={handleChange}
            className="input"
            rows={2}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría del proveedor *
            </label>
            {categoriesLoading ? (
              <p className="text-gray-600">Cargando categorías...</p>
            ) : categoriesError ? (
              <p className="text-red-500 text-sm">
                Error al cargar categorías: {categoriesError}
              </p>
            ) : (
              <select
                name="category_id"
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                    newCategory: '',
                  })
                }
                className={`w-full border rounded px-3 py-2 text-sm ${
                  formErrors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!form.newCategory.trim()}
              >
                <option value="">Selecciona categoría existente</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-2">
              <span className="text-sm text-gray-500">O crea una nueva:</span>
              <input
                type="text"
                name="newCategory"
                placeholder="Nueva categoría"
                value={form.newCategory}
                onChange={(e) =>
                  setForm({
                    ...form,
                    newCategory: e.target.value,
                    category_id: '',
                  })
                }
                className={`mt-1 w-full border rounded px-3 py-2 text-sm ${
                  formErrors.category_id && !form.newCategory.trim()
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
            </div>
            {formErrors.category_id && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.category_id}
              </p>
            )}
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
            >
              Guardar proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
