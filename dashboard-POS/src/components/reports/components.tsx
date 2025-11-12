import React from 'react';
import Boton from '@/components/ui/Boton';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart, // <--- Importado para el gráfico de líneas
    Line,      // <--- Importado para el gráfico de líneas
} from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
}

interface ReportHeaderProps {
    title: string;
    children?: React.ReactNode;
}

interface TableWithPaginationProps<T> {
    data: T[];
    columns: { key: keyof T; header: string; render?: (item: T) => React.ReactNode }[];
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (limit: number) => void;
}

interface ChartCardProps {
    title: string;
    data: any[];
    dataKey: string;
    xLabel: string;
    yLabel: string;
}

interface PieChartCardProps {
    title: string;
    data: any[];
    nameKey: string;
    valueKey: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00c49f', '#ffbb28', '#0088fe'];

export const StatCard = ({ title, value }: StatCardProps) => (
    <div className="bg-white p-6 rounded-xl shadow flex flex-col items-start justify-between border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
);

export const ReportHeader = ({ title, children }: ReportHeaderProps) => (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {children && <div className="flex flex-wrap items-end gap-4">{children}</div>}
    </header>
);

export const TableWithPagination = <T extends object>({
    data,
    columns,
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onRowsPerPageChange
}: TableWithPaginationProps<T>) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <>
            <div className="overflow-x-auto rounded-xl shadow-md">
                <table className="min-w-full bg-white rounded-lg">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs sm:text-sm">
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} className="py-4 px-6 text-left">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
                        {data.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="py-4 px-6">
                                        {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Filas por página:</span>
                    <SimpleSelect
                        label=''
                        value={itemsPerPage.toString()}
                        options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
                        onChange={(val) => onRowsPerPageChange(parseInt(val))}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Página {currentPage} de {totalPages}</span>
                    <Boton
                        label="Anterior"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </Boton>
                    <Boton
                        label="Siguiente"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </Boton>
                </div>
            </div>
        </>
    );
};

export const BarChartCard = ({ title, data, dataKey, xLabel, yLabel }: ChartCardProps) => (
    <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xLabel} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={dataKey} fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export const PieChartCard = ({ title, data, nameKey, valueKey }: PieChartCardProps) => (
    <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

// <--- Nuevo componente para el gráfico de líneas --->
export const LineChartCard = ({ title, data, dataKey, xLabel, yLabel }: ChartCardProps) => (
    <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xLabel} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);




// // src/components/reports/components.tsx
// import React from 'react';
// import Boton from '@/components/ui/Boton';
// import SimpleSelect from '@/components/ui/SimpleSelect';
// import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts';

// interface StatCardProps {
//   title: string;
//   value: string | number;
// }

// interface ReportHeaderProps {
//   title: string;
//   children?: React.ReactNode;
// }

// interface TableWithPaginationProps<T> {
//   data: T[];
//   columns: { key: keyof T; header: string; render?: (item: T) => React.ReactNode }[];
//   totalItems: number;
//   itemsPerPage: number;
//   currentPage: number;
//   onPageChange: (page: number) => void;
//   onRowsPerPageChange: (limit: number) => void;
// }

// interface BarChartCardProps {
//   title: string;
//   data: any[];
//   dataKey: string;
//   xLabel: string;
//   yLabel: string;
// }

// interface PieChartCardProps {
//   title: string;
//   data: any[];
//   nameKey: string;
//   valueKey: string;
// }

// const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00c49f', '#ffbb28', '#0088fe'];

// export const StatCard = ({ title, value }: StatCardProps) => (
//   <div className="bg-white p-6 rounded-xl shadow flex flex-col items-start justify-between border border-gray-100">
//     <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
//     <p className="text-2xl font-bold text-gray-900">{value}</p>
//   </div>
// );

// export const ReportHeader = ({ title, children }: ReportHeaderProps) => (
//   <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
//     <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
//     {children && <div className="flex flex-wrap items-end gap-4">{children}</div>}
//   </header>
// );

// export const TableWithPagination = <T extends object>({
//   data,
//   columns,
//   totalItems,
//   itemsPerPage,
//   currentPage,
//   onPageChange,
//   onRowsPerPageChange
// }: TableWithPaginationProps<T>) => {
//   const totalPages = Math.ceil(totalItems / itemsPerPage);

//   return (
//     <>
//       <div className="overflow-x-auto rounded-xl shadow-md">
//         <table className="min-w-full bg-white rounded-lg">
//           <thead className="bg-gray-100 text-gray-700 uppercase text-xs sm:text-sm">
//             <tr>
//               {columns.map((col) => (
//                 <th key={String(col.key)} className="py-4 px-6 text-left">
//                   {col.header}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
//             {data.map((item, index) => (
//               <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
//                 {columns.map((col) => (
//                   <td key={String(col.key)} className="py-4 px-6">
//                     {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="flex justify-between items-center mt-4">
//         <div className="flex items-center gap-2 text-sm text-gray-600">
//           <span>Filas por página:</span>
//           <SimpleSelect
//           label=''
//             value={itemsPerPage.toString()}
//             options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
//             onChange={(val) => onRowsPerPageChange(parseInt(val))}
//           />
//         </div>
//         <div className="flex items-center gap-2 text-sm text-gray-600">
//           <span>Página {currentPage} de {totalPages}</span>
//           <Boton
//             label="Anterior"
//             onClick={() => onPageChange(currentPage - 1)}
//             disabled={currentPage <= 1}
//           >
//             <ChevronLeftIcon className="w-5 h-5" />
//           </Boton>
//           <Boton
//             label="Siguiente"
//             onClick={() => onPageChange(currentPage + 1)}
//             disabled={currentPage >= totalPages}
//           >
//             <ChevronRightIcon className="w-5 h-5" />
//           </Boton>
//         </div>
//       </div>
//     </>
//   );
// };

// export const BarChartCard = ({ title, data, dataKey, xLabel, yLabel }: BarChartCardProps) => (
//   <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//     <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
//     <ResponsiveContainer width="100%" height={300}>
//       <BarChart
//         data={data}
//         margin={{
//           top: 5,
//           right: 30,
//           left: 20,
//           bottom: 5,
//         }}
//       >
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey={xLabel} />
//         <YAxis />
//         <Tooltip />
//         <Legend />
//         <Bar dataKey={dataKey} fill="#8884d8" />
//       </BarChart>
//     </ResponsiveContainer>
//   </div>
// );

// export const PieChartCard = ({ title, data, nameKey, valueKey }: PieChartCardProps) => (
//   <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//     <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
//     <ResponsiveContainer width="100%" height={300}>
//       <PieChart>
//         <Pie
//           data={data}
//           dataKey={valueKey}
//           nameKey={nameKey}
//           cx="50%"
//           cy="50%"
//           outerRadius={100}
//           fill="#8884d8"
//           label
//         >
//           {data.map((entry, index) => (
//             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//           ))}
//         </Pie>
//         <Tooltip />
//         <Legend />
//       </PieChart>
//     </ResponsiveContainer>
//   </div>
// );