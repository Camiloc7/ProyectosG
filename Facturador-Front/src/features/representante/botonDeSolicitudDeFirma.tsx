import React, { useState, useEffect } from 'react';
import { useRepresentanteStore } from '@/store/useRepresentanteStore';
import { showErrorToast } from '@/components/feedback/toast';

interface BotonDeSolicitudDeFirmaProps {
  fechaCertificado: string;
  fechaVencimientoCertificado: string;
  isModalOpen: boolean;
  onClose: () => void;
}

interface FormData {
  comprobante: File | null;
}

const BotonDeSolicitudDeFirma: React.FC<BotonDeSolicitudDeFirmaProps> = ({
  fechaCertificado,
  fechaVencimientoCertificado,
  isModalOpen,
  onClose,
}) => {
  const { sendFirmaRepresentante } = useRepresentanteStore();
  const [formData, setFormData] = useState<FormData>({ comprobante: null });
  const { infoFirma } = useRepresentanteStore();

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
  }, [isModalOpen]);

  const handleCancel = () => onClose();
  const handlePagarConEpayco = () => {
    console.log('Click pagar con epayco');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, comprobante: file }));
  };

  const handleSubmit = async () => {
    if (formData.comprobante) {
      await sendFirmaRepresentante(formData.comprobante);
      onClose();
    } else {
      showErrorToast('Debes seleccionar un archivo');
    }
  };

  return (
    <div className="relative flex items-center space-x-3">
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]"
          onClick={handleCancel}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-[90%] max-h-[90vh] sm:max-w-[500px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-gray-800 mb-4 md:text-lg">
              Siga estos pasos para finalizar con éxito la solicitud
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Si ya realizó el pago por otra plataforma, simplemente adjunte el
              comprobante.
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-4">
              <li>Realice el pago a través de Epayco</li>
              <button
                className="w-auto min-w-36 bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
                onClick={handlePagarConEpayco}
              >
                Pagar con Epayco
              </button>
              <li>Adjunte el comprobante de pago</li>
              <input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="fileUpload"
              />

              {/* Contenedor para el botón de adjuntar y el check */}
              <div className="flex items-center">
                <label
                  htmlFor="fileUpload"
                  className="w-auto min-w-36 bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] cursor-pointer"
                >
                  Adjuntar archivo
                </label>
                {formData.comprobante && (
                  <div className="ml-2" title="Archivo subido">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-white bg-green-500 rounded-full shadow-md">
                      <span>✔</span>
                    </span>
                  </div>
                )}
              </div>
            </ol>
            <button
              className="w-36 bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] mt-4"
              onClick={handleSubmit}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotonDeSolicitudDeFirma;
