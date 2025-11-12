import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

const ErrorBox = ({ error }: { error: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-lg">
        <AlertCircle className="mx-auto h-24 w-24 text-gray-400" />
        <h1 className="text-4xl font-bold text-gray-800">
          404 - Página no encontrada
        </h1>
        <p className="text-xl text-gray-600 ">{error}</p>
        <Button asChild className="mt-4 bg-blueQ">
          <Link href="/gestionDeFacturasElectronicas">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
};

export default ErrorBox;
