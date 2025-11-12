'use client';
import DashboardSummary from '@/features/27001/DashboardSummary';
import PlanearTable from '@/features/27001/Planeartable';
import React from 'react';
import { useSelector } from 'react-redux';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
const PlanearPage = () => {
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="min-h-screen bg-gray-50 p-6">
            {/* Encabezado */}
            <div className="sectionContainer mb-6">
              <h1 className="mb-4 text-3xl font-bold text-gray-800">Planear</h1>
            </div>

            {/* Aquí añadimos w-full */}
            <div className="flex w-full gap-4 items-start">
              {/* 70% de ese w-full */}
              <div className="mb-8 w-[70%]">
                <PlanearTable />
              </div>
              {/* El resto del espacio */}
              <div className="flex-1">
                <DashboardSummary />
              </div>
            </div>
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default PlanearPage;
