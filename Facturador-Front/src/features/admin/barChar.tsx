'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  //   title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
  barThickness?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  //   title,
  labels,
  datasets,
  barThickness = 0.5,
}) => {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom', // Coloca la leyenda en la parte superior
        align: 'center', // Centra la leyenda
        labels: {
          color: '#4B4B4B', // Color del texto
          font: {
            size: 14,
            family: 'Arial, sans-serif',
          },
          usePointStyle: true, // Usa estilos de punto en lugar de bloques cuadrados
          pointStyle: 'rectRounded', // Bloques con bordes redondeados
          boxWidth: 20, // Anchura de los bloques
          boxHeight: 20, // Altura de los bloques
          padding: 20, // Espaciado entre los elementos
          textAlign: 'left', // Alineación del texto
        },
      },
      title: {
        display: true,
        // text: title,
        font: {
          size: 16,
        },
        padding: 20,
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          padding: 10,
        },
      },
    },
  };

  const colors = {
    sales: '#00A7E1', // Light blue
    purchases: '#9884DC', // Purple
  };

  const data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: index === 0 ? colors.sales : colors.purchases,
      borderRadius: Number.MAX_VALUE,
      borderSkipped: false,
      barPercentage: barThickness,
    })),
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <Bar options={options} data={data} />
    </div>
  );
};

export default BarChart;
