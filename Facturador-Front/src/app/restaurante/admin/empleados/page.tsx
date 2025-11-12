'use client';

import React, { useState, useMemo } from 'react';
import AdminLayoutRestaurante from '../../AdminLayout';
import FormEmpleadoRestaurante, {
  EmpleadosRestaurante,
} from '@/features/restaurante/FormEmpleadoRestaurante';

export default function Empleados() {
  // Hardcoded employee data
  const [empleados] = useState<EmpleadosRestaurante[]>([
    { nombre: 'Juan Pérez', password: '••••••••', rol: 'mesero', seccion: '1' },
    {
      nombre: 'María García',
      password: '••••••••',
      rol: 'cocinero',
      seccion: '2',
    },
    {
      nombre: 'Luis Fernández',
      password: '••••••••',
      rol: 'cajero',
      seccion: '3',
    },
    {
      nombre: 'Ana Rodríguez',
      password: '••••••••',
      rol: 'mesero',
      seccion: '4',
    },
    {
      nombre: 'Carlos Gómez',
      password: '••••••••',
      rol: 'cocinero',
      seccion: '5',
    },
  ]);

  const [search, setSearch] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [id, setId] = useState<string>('');

  // Filter employees by search term
  const empleadosFiltrados = useMemo(
    () =>
      empleados.filter(
        (emp) =>
          emp.nombre.toLowerCase().includes(search.toLowerCase()) ||
          emp.rol.toLowerCase().includes(search.toLowerCase()) ||
          emp.seccion.includes(search)
      ),
    [search, empleados]
  );

  const handleCloseItemForm = () => {
    setIsFormOpen(false);
    setId('');
  };

  return (
    <AdminLayoutRestaurante>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-[#00A7E1]">Empleados</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#00A7E1] text-white font-semibold rounded-full px-6 py-2 text-sm hover:bg-[#008ec1] transition"
          >
            Nuevo Empleado
          </button>
        </div>

        {empleadosFiltrados.length === 0 ? (
          <p className="text-gray-500">No se encontraron empleados.</p>
        ) : (
          <ul className="space-y-3">
            {empleadosFiltrados.map((emp, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-gray-50 rounded-md transition"
                onClick={() => {
                  setId(emp.nombre);
                  setIsFormOpen(true);
                }}
              >
                <div>
                  <p className="font-medium">{emp.nombre}</p>
                  <p className="text-xs text-gray-500">
                    Rol: {emp.rol} • Sección: {emp.seccion}
                  </p>
                </div>
                <button className="text-sm text-[#00A7E1] font-semibold">
                  Editar
                </button>
              </li>
            ))}
          </ul>
        )}

        <FormEmpleadoRestaurante
          isOpen={isFormOpen}
          onClose={handleCloseItemForm}
          id={id}
        />
      </div>
    </AdminLayoutRestaurante>
  );
}
