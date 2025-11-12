// TableEditor.tsx
import React from 'react';
import { IDataTabla } from '../../types/Planificacion/Planificacion.types';
import BotonQuality from '@/components/ui/BotonQuality';
import { showErrorToast } from '@/components/feedback/toast';
import BotonLargoQuality from '@/components/ui/BotonesLargosQuality';

interface TableEditorProps {
  data: IDataTabla;
  onChange: (newData: IDataTabla) => void;
}

export function TableEditor({ data, onChange }: TableEditorProps) {
  const { headers, rows } = data;

  // Cambia el texto de una celda
  const updateCell = (r: number, c: number, value: string) => {
    const newRows = rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row
    );
    onChange({ ...data, rows: newRows });
  };

  // Agrega una fila vacía
  const addRow = () => {
    const emptyRow = headers.map(() => '');
    onChange({ ...data, rows: [...rows, emptyRow] });
  };

  // Elimina una fila
  const removeRow = (r: number) => {
    onChange({ ...data, rows: rows.filter((_, ri) => ri !== r) });
  };

  // Agrega una columna vacía
  const addColumn = () => {
    const newHeaders = [...headers, `Col ${headers.length + 1}`];
    const newRows = rows.map((row) => [...row, '']);
    onChange({ ...data, headers: newHeaders, rows: newRows });
  };

  // Elimina una columna
  const removeColumn = (c: number) => {
    const newHeaders = headers.filter((_, ci) => ci !== c);
    const newRows = rows.map((row) => row.filter((_, ci) => ci !== c));
    onChange({ ...data, headers: newHeaders, rows: newRows });
  };

  return (
    <div>
      <div className="mb-2 flex gap-2 w-80">
        <BotonQuality label={'Agregar Fila'} onClick={addRow} variant="grey" />

        <BotonQuality
          label={'Agregar Columna'}
          onClick={addColumn}
          variant="grey"
        />
      </div>

      <div className="w-full overflow-x-auto border rounded">
        <div className="min-w-max inline-block align-top">
          <table className="table-auto divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {headers?.map((h, ci) => (
                  <th
                    key={ci}
                    className="px-2 py-1 text-left whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => {
                          const newHeaders = headers.map((hdr, i) =>
                            i === ci ? e.target.value : hdr
                          );
                          onChange({ ...data, headers: newHeaders });
                        }}
                        className="border-b border-gray-300 focus:outline-none w-36 px-1 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(ci)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {rows?.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        className="w-44 border-b border-gray-300 focus:outline-none px-1 h-9 py-1"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
