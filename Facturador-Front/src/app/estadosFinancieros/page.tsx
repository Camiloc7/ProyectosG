'use client';
import { useSelector } from 'react-redux';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaPlayCircle,
} from 'react-icons/fa';
import { ArrowRight } from 'lucide-react';

// Registra los componentes necesarios
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

Chart.register(ArcElement, Tooltip, Legend);

// 1. Define la interfaz para las opciones de nuestro plugin
interface CenterTextPluginOptions {
  text?: string;
  font?: string;
  color?: string;
}

// 2. Crea el plugin tipado (sin generics)
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart: Chart, _args: unknown, options: CenterTextPluginOptions) {
    const {
      ctx,
      chartArea: { left, top, width, height },
    } = chart;
    if (!options?.text) return;

    ctx.save();
    ctx.font = options.font || 'bold 24px sans-serif';
    ctx.fillStyle = options.color || 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    ctx.fillText(options.text, centerX, centerY);
    ctx.restore();
  },
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
);

const UsersPage = () => {
  // Función para calcular el mayor porcentaje del dataset
  const getMaxPercentage = (data: number[]) => {
    const total = data.reduce((acc, val) => acc + val, 0);
    const max = Math.max(...data);
    return ((max / total) * 100).toFixed(0) + '%';
  };

  // Datos de la primera dona (Cumplimiento)
  const doughnutData = {
    labels: ['Cumplimiento', 'Faltante'],
    datasets: [
      {
        data: [86, 14],
        backgroundColor: ['#3B82F6', '#E5E7EB'],
        hoverBackgroundColor: ['#60A5FA', '#F3F4F6'],
      },
    ],
  };

  // Datos de la segunda dona
  const doughnutDataFour = {
    labels: ['Actuar', 'Planear', 'Hacer', 'Verificar'],
    datasets: [
      {
        data: [40, 22, 33, 5],
        backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
        hoverBackgroundColor: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
      },
    ],
  };

  // Opciones compartidas para las donas
  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      // Si en algún momento deseas utilizar el plugin custom, aquí lo activarías
      // centerText: {},
    },
  };

  // Datos y opciones para el gráfico de barras
  const barData = {
    labels: ['Planear', 'Hacer', 'Verificar', 'Actuar'],
    datasets: [
      {
        label: 'Datos',
        data: [3, 2, 5, 1],
        backgroundColor: '#3B82F6',
      },
    ],
  };
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Indicador Mensual' },
      datalabels: {
        color: 'white',
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          const total = context.dataset.data
            .filter((val): val is number => typeof val === 'number')
            .reduce((acc, val) => acc + val, 0);
          const porcentaje = ((value / total) * 100).toFixed(1) + '%';
          return porcentaje;
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Datos y opciones para el gráfico lineal
  const lineData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Tendencia',
        data: [2, 4, 3, 5, 7, 6],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: 'Tendencia Semanal' },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="min-h-screen bg-gray-50 px-6 py-10 space-y-12">
          {/* ENCABEZADO */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-800">Planificación</h1>
            <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 drop-shadow">
              Estados Financieros
            </p>
          </div>

          {/* BOTONES DE ACCIÓN - FLUJO PDCA */}
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6">
            {[
              {
                href: '/estadosFinancieros/planificacion/',
                icon: <FaLightbulb className="text-yellow-500 text-xl" />,
                label: 'Planear',
              },
              {
                href: '#hacer',
                icon: <FaPlayCircle className="text-green text-xl" />,
                label: 'Hacer',
              },
              {
                href: '#verificar',
                icon: <FaCheckCircle className="text-blue text-xl" />,
                label: 'Verificar',
              },
              {
                href: '#actuar',
                icon: <FaChartLine className="text-red-500 text-xl" />,
                label: 'Actuar',
              },
            ].map((btn, i, arr) => (
              <React.Fragment key={btn.label}>
                <a
                  href={btn.href}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 text-base font-medium rounded-xl shadow-sm hover:bg-gray-100 transition-all duration-300"
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </a>
                {i < arr.length - 1 && (
                  <div className="hidden md:block text-darkBlue2">
                    <ArrowRight size={36} strokeWidth={2.5} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* SECCIÓN DE GRÁFICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* CUMPLIMIENTO GENERAL */}
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Cumplimiento General
              </h2>
              <div className="h-64 relative">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* CUMPLIMIENTO CATEGORÍA DESTACADA */}
            <div className="bg-white p-8 rounded-2xl shadow-md flex flex-col items-center justify-center">
              <div className="relative h-64 w-64">
                <Doughnut data={doughnutDataFour} options={doughnutOptions} />
                <h2 className="absolute inset-0 flex items-center justify-center -top-14 text-4xl font-bold text-darkBlue2">
                  {getMaxPercentage(doughnutDataFour.datasets[0].data)}
                </h2>
              </div>
            </div>
          </div>

          {/* SEGUNDA FILA: DOUGHNUT + MÉTRICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* DOUGHNUT INDIVIDUAL */}
            <div className="bg-white p-8 rounded-2xl shadow-md text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Cumplimiento De Plan De Trabajo
              </h3>
              <div className="relative h-64 w-64 mx-auto">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <h2 className="absolute inset-0 flex items-center justify-center text-4xl -top-6 font-bold text-darkBlue2">
                  {getMaxPercentage(doughnutData.datasets[0].data)}
                </h2>
              </div>
            </div>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="flex flex-col gap-6">
              {/* Título con color rojo y ícono de alerta */}
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-semibold ">
                  Riesgos Críticos Identificados
                </h3>
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>

              {/* Lista de métricas con color dinámico */}
              {[
                { label: 'Tareas Pendientes', value: 13 },
                { label: 'Actividades en Progreso', value: 5 },
                { label: 'Actividades Finalizadas', value: 8 },
              ].map((metric) => {
                // Determinar el color de fondo según el valor
                let bgColor = 'bg-red-300'; // Default color
                if (metric.value > 10) {
                  bgColor = 'bg-red-600'; // Si el valor es mayor que 10, el color es más intenso
                } else if (metric.value > 7) {
                  bgColor = 'bg-red-500'; // Si el valor es mayor que 7, el color es rojo moderado
                }

                return (
                  <div
                    key={metric.label}
                    className="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between"
                  >
                    <h4 className="text-lg font-medium text-gray-800">
                      {metric.label}
                    </h4>
                    <span
                      className={`text-3xl font-bold text-white ${bgColor} px-5 py-2 rounded-xl shadow-lg`}
                    >
                      {metric.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO LINEAL
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Riesgos Críticos Identificados
        </h3>
        <div className="relative h-72">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div> */}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default UsersPage;
