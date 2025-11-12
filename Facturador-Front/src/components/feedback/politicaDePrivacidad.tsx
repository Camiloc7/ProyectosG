import React, { useEffect } from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const PoliticaDePrivacidad: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
}) => {
  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  // Desactivar el scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Desactiva el scroll
    } else {
      document.body.style.overflow = ''; // Restaura el scroll
    }
    return () => {
      document.body.style.overflow = ''; // Asegura restaurar el scroll cuando el modal se cierre
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-gray-900 bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Política de Privacidad para la Aplicación "Quality Soft Service"
          </h2>
          <p className="text-sm text-gray-700">
            <strong>Última actualización:</strong> Enero 2025
          </p>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            1. Introducción
          </h3>
          <p className="text-sm text-gray-700">
            En "Quality Soft Service", valoramos su privacidad y nos
            comprometemos a proteger sus datos personales. Esta Política de
            Privacidad describe cómo recopilamos, usamos, compartimos y
            protegemos su información cuando utiliza nuestra aplicación.
          </p>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            2. Información que Recopilamos
          </h3>
          <p className="text-sm text-gray-800">
            <strong>2.1 Información Personal Proporcionada por Usted</strong>
          </p>
          <ul className="text-sm text-gray-700">
            <li>Nombre completo</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Información relacionada con la facturación electrónica</li>
          </ul>
          <p className="text-sm text-gray-800">
            <strong>2.2 Información Automáticamente Recopilada</strong>
          </p>
          <ul className="text-sm text-gray-700">
            <li>Tipo de dispositivo y sistema operativo</li>
            <li>Datos de uso de la aplicación</li>
            <li>Ubicación geográfica (si está habilitada)</li>
          </ul>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            3. Uso de la Información
          </h3>
          <p className="text-sm text-gray-700">
            Utilizamos la información recopilada para:
          </p>
          <ul className="text-sm text-gray-700">
            <li>Proveer y mejorar nuestros servicios.</li>
            <li>
              Gestionar y procesar la facturación electrónica y nómina
              electrónica.
            </li>
            <li>
              Comunicarnos con usted sobre actualizaciones y soporte técnico.
            </li>
            <li>Cumplir con nuestras obligaciones legales.</li>
          </ul>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            4. Compartir Información con Terceros
          </h3>
          <p className="text-sm text-gray-700">
            No compartimos su información personal con terceros, salvo en las
            siguientes circunstancias:
          </p>
          <ul className="text-sm text-gray-700">
            <li>Cuando sea requerido por ley o regulación.</li>
            <li>
              Con proveedores de servicios que ayudan a operar nuestra
              aplicación (bajo estrictos acuerdos de confidencialidad).
            </li>
          </ul>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            5. Seguridad de la Información
          </h3>
          <p className="text-sm text-gray-700">
            Implementamos medidas de seguridad técnicas y organizativas para
            proteger su información contra accesos no autorizados, pérdidas o
            divulgación indebida.
          </p>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            6. Sus Derechos
          </h3>
          <p className="text-sm text-gray-700">
            Usted tiene los siguientes derechos en relación con su información
            personal:
          </p>
          <ul className="text-sm text-gray-700">
            <li>Acceder a los datos que tenemos sobre usted.</li>
            <li>Solicitar la corrección de datos inexactos.</li>
            <li>
              Solicitar la eliminación de sus datos, sujeto a nuestras
              obligaciones legales.
            </li>
            <li>Oponerse al procesamiento de sus datos para ciertos fines.</li>
          </ul>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            7. Conservación de Datos
          </h3>
          <p className="text-sm text-gray-700">
            Conservamos su información personal solo durante el tiempo necesario
            para cumplir con los fines descritos en esta política, a menos que
            se requiera o permita un período de retención más largo por ley.
          </p>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            8. Cambios a esta Política de Privacidad
          </h3>
          <p className="text-sm text-gray-700">
            Nos reservamos el derecho de actualizar esta Política de Privacidad
            en cualquier momento. Notificaremos cualquier cambio publicando la
            nueva versión en nuestra aplicación y, si corresponde, enviando un
            aviso adicional.
          </p>

          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            9. Contacto
          </h3>
          <p className="text-sm text-gray-700">
            Si tiene preguntas o inquietudes sobre esta Política de Privacidad,
            puede comunicarse con nosotros a través de:
          </p>
          <h3 className="font-semibold mt-4 text-sm text-gray-800">
            10. Uso de Cookies y Tecnologías Similares
          </h3>
          <p className="text-sm text-gray-700">
            Para mejorar la seguridad y el correcto funcionamiento de nuestra
            aplicación, utilizamos cookies y tecnologías similares. Estas
            herramientas nos permiten almacenar información relevante sobre su
            sesión y preferencias, lo que garantiza una experiencia más fluida y
            personalizada durante el uso de nuestros servicios.
          </p>
          <p className="text-sm text-gray-700">
            Las cookies también nos ayudan a mantener la seguridad de su cuenta
            y a proteger la información que proporciona al acceder a nuestras
            funciones. Al utilizar nuestra aplicación, usted acepta el uso de
            estas tecnologías según lo descrito en esta Política de Privacidad.
          </p>

          <ul className="text-sm text-gray-700">
            <li>
              <strong>Correo electrónico:</strong>{' '}
              soporte@qualitysoftservices.com
            </li>
            <li>
              <strong>Teléfono:</strong> +57 310-3188070
            </li>
          </ul>

          <p className="mt-4 text-sm text-gray-700">
            Gracias por confiar en "Quality Soft Service" para sus necesidades
            en el sector constructor. Su privacidad es nuestra prioridad.
          </p>

          <button
            className="bg-[#00A7E1] text-white w-28 mt-10 h-8 px-4 py-2 flex items-center justify-center font-semibold rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidad;
