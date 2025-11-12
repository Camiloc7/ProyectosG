'use client';
import { useEffect, useState } from 'react';

interface EpaycoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PagoEmprendedorMensual: React.FC<EpaycoModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://checkout.epayco.co/checkout.js';
      script.setAttribute(
        'data-epayco-key',
        '4d7fa9e5261be47cd4f7dc9c7f35685b'
      );
      script.setAttribute('class', 'epayco-button');
      script.setAttribute('data-epayco-amount', '71400');
      script.setAttribute('data-epayco-tax', '11400.00');
      script.setAttribute('data-epayco-tax-ico', '0.00');
      script.setAttribute('data-epayco-tax-base', '60000');
      script.setAttribute(
        'data-epayco-name',
        'LICENCIA MENSUAL SOFTWARE DE FACTURACIÓN ELECTRONICA | Facturas de venta ilimitadas | Ingresos hasta $60.000.000 COP Mensuales'
      );
      script.setAttribute(
        'data-epayco-description',
        'LICENCIA MENSUAL SOFTWARE DE FACTURACIÓN ELECTRONICA | Facturas de venta ilimitadas | Ingresos hasta $60.000.000 COP Mensuales'
      );
      script.setAttribute('data-epayco-currency', 'cop');
      script.setAttribute('data-epayco-country', 'CO');
      script.setAttribute('data-epayco-test', 'false');
      script.setAttribute('data-epayco-external', 'false');
      script.setAttribute(
        'data-epayco-response',
        'https://qualitybillservice.qualitysoftservice.com/App/payment_controller/response'
      );
      script.setAttribute('data-epayco-confirmation', '');
      script.setAttribute(
        'data-epayco-button',
        'https://multimedia.epayco.co/dashboard/btns/btn7.png'
      );
      const container = document.getElementById('epayco-container');
      if (container) {
        container.appendChild(script);
      }

      // Limpieza del modal al desmontar
      return () => {
        if (container) {
          container.innerHTML = '';
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg w-[50%] relative">
        <h3 className="text-lg font-bold mb-4">
          Seleccionar el metodo de pago
        </h3>
        <div id="epayco-container" className="flex justify-center"></div>
        <button
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-700"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PagoEmprendedorMensual;
