// components/ui/Lista.tsx
import React from "react";
import { Table, Edit, Trash2 } from "lucide-react";
import { FONDO_COMPONENTES, FONDO, ORANGE } from "@/styles/colors";

type Columna<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
};

type Props<T> = {
  datos: T[];
  columnas: Columna<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  mensajeVacio?: {
    titulo: string;
    subtitulo?: string;
  };
};

export default function Lista<T extends { id: string }>({
  datos,
  columnas,
  onEdit,
  onDelete,
  mensajeVacio = {
    titulo: "No hay registros.",
    subtitulo: "¡Agrega nuevos elementos para comenzar!",
  },
}: Props<T>) {
  if (datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <Table size={60} className="mb-4" />
        <p className="text-xl font-medium">{mensajeVacio.titulo}</p>
        {mensajeVacio.subtitulo && (
          <p className="text-md mt-2">{mensajeVacio.subtitulo}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg shadow-md border border-gray-100 mb-8"
      style={{ backgroundColor: FONDO_COMPONENTES }}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead style={{ backgroundColor: FONDO_COMPONENTES }}>
          <tr>
            {columnas.map((col, i) => (
              <th
                key={i}
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {datos.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {columnas.map((col, i) => {
                const value =
                  typeof col.accessor === "function"
                    ? col.accessor(item)
                    : item[col.accessor];
                return (
                  <td
                    key={i}
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700"
                  >
                    {value as React.ReactNode}
                  </td>
                );
              })}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border"
                      style={{
                        backgroundColor: FONDO,
                        color: ORANGE,
                        borderColor: ORANGE,
                      }}
                      title="Editar"
                    >
                      <Edit size={16} className="opacity-90" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{
                        backgroundColor: ORANGE,
                        boxShadow: "0 2px 6px rgba(245, 101, 101, 0.25)",
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} className="opacity-90" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
