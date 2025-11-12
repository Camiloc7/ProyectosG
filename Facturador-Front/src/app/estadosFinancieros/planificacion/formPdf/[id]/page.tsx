'use client';

import LayoutAdmi from '@/components/layout/layoutAdmi';
import { PdfGenerator } from '@/features/27001/PdfForm';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useRouter } from 'next/navigation';

const FormPdf = () => {
  const router = useRouter();
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="sectionContainer">
            <PdfGenerator />
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default FormPdf;
