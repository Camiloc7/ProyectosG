// src/components/PlanearTable.tsx
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaneacionStore } from '@/store/27001/use27001Store';
import { IoDocument } from 'react-icons/io5';
import CustomCheckbox from '@/components/ui/InputsQuality';

interface IUsuarioItem {
  peso: number;
  calificacionItem: 0 | 1 | 2;
  cumplimiento: number;
}

export interface IPlanearItem {
  id: number;
  actividad: string;
  codigo: string;
  valorItemEstandar: number;
  usuarioItem?: IUsuarioItem | null;
}

const PlanearTable: React.FC = () => {
  const { fetchLista, updateUsuarioItem, listaDeItems } = usePlaneacionStore();
  const router = useRouter();

  useEffect(() => {
    fetchLista();
  }, [fetchLista]);

  const handleCheckboxChange = (
    itemId: number,
    newCal: 0 | 1 | 2,
    peso: number,
    cumplimiento: number
  ) => {
    updateUsuarioItem({
      itemId,
      peso,
      calificacionItem: newCal,
      cumplimiento,
    });
  };

  const handlePesoBlur = (
    itemId: number,
    e: React.FocusEvent<HTMLInputElement>,
    cal: 0 | 1 | 2,
    cumplimiento: number
  ) => {
    const newPeso = parseFloat(e.target.value);
    if (isNaN(newPeso)) return;
    updateUsuarioItem({
      itemId,
      peso: newPeso,
      calificacionItem: cal,
      cumplimiento,
    });
  };

  return (
    <div className="overflow-x-auto w-full rounded-lg border border-gray-200 bg-white p-4">
      <table className="min-w-full divide-y divide-gray-200 text-base text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th>ÍTEM</th>
            <th>ACTIVIDAD</th>
            <th>SOPORTE</th>
            <th>Valor (peso)</th>
            <th colSpan={3}>CALIFICACIÓN</th>
          </tr>
          <tr className="bg-gray-100">
            <th />
            <th />
            <th />
            <th>--</th>
            <th>SI</th>
            <th>PROCESO</th>
            <th>NO</th>
          </tr>
        </thead>
        <tbody>
          {(listaDeItems as IPlanearItem[]).map((item) => {
            const cal = item.usuarioItem?.calificacionItem ?? 0;
            const cumplimiento = item.usuarioItem?.cumplimiento ?? 0;
            const pesoValue = item.usuarioItem?.peso ?? item.valorItemEstandar;

            return (
              <tr key={item.id}>
                <td className="px-2 py-1">{item.codigo}</td>
                <td className="px-2 py-1">{item.actividad}</td>
                <td
                  className="px-2 py-1 cursor-pointer text-center"
                  onClick={() =>
                    router.push(
                      `/estadosFinancieros/planificacion/formPdf/${item.id}`
                    )
                  }
                >
                  <IoDocument className="h-5 w-5 text-[#00A7E1] mx-auto" />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="number"
                    step="0.1"
                    className="w-20 rounded border border-gray-300 text-center"
                    defaultValue={pesoValue}
                    onBlur={(e) =>
                      handlePesoBlur(item.id, e, cal as 0 | 1 | 2, cumplimiento)
                    }
                  />
                </td>

                {/* Checkboxes en celdas uniformes */}
                <td className="px-2 py-1 text-center">
                  <CustomCheckbox
                    checked={cal === 2}
                    onChange={() =>
                      handleCheckboxChange(item.id, 2, pesoValue, cumplimiento)
                    }
                    checkedColor="#00A7E1"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <CustomCheckbox
                    checked={cal === 1}
                    onChange={() =>
                      handleCheckboxChange(item.id, 1, pesoValue, cumplimiento)
                    }
                    checkedColor="#00A7E1"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <CustomCheckbox
                    checked={cal === 0}
                    onChange={() =>
                      handleCheckboxChange(item.id, 0, pesoValue, cumplimiento)
                    }
                    checkedColor="#00A7E1"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlanearTable;
