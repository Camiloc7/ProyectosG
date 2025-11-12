'use client';
import React from 'react';
// import { CheckIcon } from "@heroicons/react/24/solid";

// Para usar Radar Chart:
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
// import { CustomCheckbox } from "../ui/checkbox";

// Registramos los componentes de chart.js que usaremos
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Datos de ejemplo para la Radar Chart
const radarData = {
  labels: [
    'RECURSOS',
    'MEJORAMIENTO',
    'VERIFICACIÓN DEL SG-SST',
    'GESTIÓN INTEGRAL DEL SG SST',
    'GESTIÓN DE LA SALUD',
    'GESTIÓN DE PELIGROS Y RIESGOS',
  ],
  datasets: [
    {
      label: 'Avance',
      data: [50, 25, 20, 70, 68, 80],
      backgroundColor: 'rgba(37, 99, 235, 0.2)', // Azul clarito
      borderColor: 'rgba(37, 99, 235, 1)', // Azul
      borderWidth: 2,
      pointBackgroundColor: 'rgba(37, 99, 235, 1)',
    },
  ],
};

const radarOptions = {
  scales: {
    r: {
      angleLines: { color: '#e5e7eb' }, // Líneas grises
      grid: { color: '#e5e7eb' },
      suggestedMin: 0,
      suggestedMax: 100,
      pointLabels: {
        font: { size: 14 },
        color: '#4b5563',
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: '#374151', // Texto gris
        font: {
          size: 14,
        },
      },
    },
  },
};

const DashboardSummary = () => {
  return (
    <div className="flex flex-wrap gap-6 md:flex-row md:gap-8 ">
      {/*CheckList */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-700">
          RESOLUCIÓN 312 del 2019
        </h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={true}
              onChange={() => console.log('oa')}
            />
            <span>21 Estándares</span>
          </li>
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={true}
              onChange={() => console.log('oa')}
            />

            <span>60 Estándares</span>
          </li>
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={true}
              onChange={() => console.log('oa')}
            />

            <span>Criterios de Verificación</span>
          </li>
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={true}
              onChange={() => console.log('oa')}
            />

            <span>Resultado 60 Estándares</span>
          </li>
        </ul>
      </div>

      {/*Porcentajes */}
      <div className="flex flex-1 flex-col justify-evenly space-y-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:space-y-8">
        <h2 className="text-xl font-bold text-gray-700">% CUMPLIMIENTO</h2>

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <div className="rounded-full border border-gray-300 hover:bg-gray-100 px-4 py-2 text-xl font-semibold text-black shadow-sm">
              90%
            </div>
            <span className="mt-1 text-sm text-gray-600">Avance Superior</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-[#00A7E1] px-4 text-white py-2 text-xl font-semibold shadow-sm">
              67.8%
            </div>
            <span className="mt-1 text-sm text-gray-600">Avance Promedio</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-700">
          AVANCE POR CICLO
        </h2>
        <div className="h-[100%] w-full">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* Tarjetas de métricas rápidas */}
      <div className="flex gap-4  w-full">
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Actividades COPASST
          </h3>
          <span className="px-4 py-2 rounded-2xl bg-[#00A7E1] text-white text-xl font-bold">
            89%
          </span>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Actividades COCOLA
          </h3>
          <span className="px-4 py-2 rounded-2xl bg-[#00A7E1] text-white text-xl font-bold">
            85%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
