import {
  Inbox,
  BadgeCheck,
  Handshake,
  CheckCircle,
  XCircle,
  XCircleIcon,
} from 'lucide-react';
import { FaCircleXmark } from 'react-icons/fa6';

interface InvoiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceStatusModal({
  isOpen,
  onClose,
}: InvoiceStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[201]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-96 p-6 relative"
        onClick={(e) => e.stopPropagation()} // <-- importante
      >
        <h2 className="text-xl font-semibold mb-4">Estados de la factura</h2>

        <div className="flex flex-col space-y-6">
          {/* 🔹 ESTADOS DEL CLIENTE */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-1">
              Estados del Cliente
            </h3>
            <div className="flex flex-col space-y-4">
              {/* Recibido */}
              <div className="flex items-center space-x-3">
                <Inbox className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">Recibido</p>
                  <p className="text-gray-600 text-sm">
                    La factura ha sido recibida por el sistema pero aún no ha
                    sido revisada.
                  </p>
                </div>
              </div>

              {/* Rechazada */}
              <div className="flex items-center space-x-3">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium">Rechazada</p>
                  <p className="text-gray-600 text-sm">
                    El cliente rechazo la factura.{' '}
                  </p>
                </div>
              </div>

              {/* Factoring */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <CheckCircle className="h-4 w-4 text-green-500" />

                  <Handshake className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">Aceptada</p>
                  <p className="text-gray-600 text-sm">
                    La factura está preaprobada para un proceso de factoring, es
                    decir, a través del botón puede solicitar su financiamiento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 🔹 ESTADOS EN DIAN */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-1">
              Estados en DIAN
            </h3>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium">Pendiente</p>
                  <p className="text-xs text-gray-600">
                    La factura aún está en proceso de validación.
                  </p>
                </div>
              </div>
              {/* Pendiente */}
              {/* <div className="flex items-center space-x-3">
                <div className="h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="font-medium">Pendiente</p>
                  <p className="text-gray-600 text-sm">
                    La factura fue enviada a la DIAN y está en proceso de
                    validación. Este estado es temporal.
                  </p>
                </div>
              </div> */}

              {/* Rechazada */}
              <div className="flex items-center space-x-3">
                <FaCircleXmark className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium">Rechazada por DIAN</p>
                  <p className="text-gray-600 text-sm">
                    La DIAN no aceptó la factura debido a errores en su
                    estructura, información faltante o inconsistencias en los
                    datos.
                  </p>
                </div>
              </div>

              {/* Aceptada */}
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">Aceptada por DIAN</p>
                  <p className="text-gray-600 text-sm">
                    La factura fue validada correctamente y registrada
                    oficialmente en la DIAN. Este es el estado final exitoso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de cerrar */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
