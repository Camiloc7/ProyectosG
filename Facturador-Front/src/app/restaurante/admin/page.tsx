'use client';
import React from 'react';
import AdminLayoutRestaurante from '../AdminLayout';
import PrivateRoute from '@/helpers/PrivateRoute';

export default function AdminDashboard() {
  return (
    <PrivateRoute>
      <AdminLayoutRestaurante>
        <div>
          <h1 className="text-3xl font-bold mb-4 text-[#00A7E1]">Dashboard</h1>
          <p>
            Resumen general del sistema (estadísticas, actividad reciente, etc.)
          </p>
        </div>
      </AdminLayoutRestaurante>
    </PrivateRoute>
  );
}
