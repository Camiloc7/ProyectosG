import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { FONDO, ORANGE } from '../styles/colors'
import OrangeButton from '../components/OrangeButton'

export default function TerminosYCondiciones() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: FONDO,
        padding: 24,
        fontFamily: 'Lato, sans-serif',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={() => navigate('/')}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <ArrowLeft
            size={24}
            stroke={ORANGE}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          <h1
            style={{
              marginLeft: 12,
              fontSize: 22,
              fontWeight: 700,
              color: '#333',
              userSelect: 'none'
            }}
          >
            Política de Privacidad para la Aplicación "Quality Soft Service"
          </h1>
        </div>

        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          <strong>Última actualización:</strong> Enero 2025
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          1. Introducción
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          En "Quality Soft Service", valoramos su privacidad y nos comprometemos a proteger sus
          datos personales. Esta Política de Privacidad describe cómo recopilamos, usamos,
          compartimos y protegemos su información cuando utiliza nuestra aplicación.
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          2. Información que Recopilamos
        </h3>
        <p style={{ fontWeight: '600', fontSize: 14, color: '#333' }}>
          2.1 Información Personal Proporcionada por Usted
        </p>
        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>Nombre completo</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Información relacionada con la facturación electrónica</li>
        </ul>
        <p style={{ fontWeight: '600', fontSize: 14, color: '#333' }}>
          2.2 Información Automáticamente Recopilada
        </p>
        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>Tipo de dispositivo y sistema operativo</li>
          <li>Datos de uso de la aplicación</li>
          <li>Ubicación geográfica (si está habilitada)</li>
        </ul>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          3. Uso de la Información
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Utilizamos la información recopilada para:
        </p>
        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>Proveer y mejorar nuestros servicios.</li>
          <li>Gestionar y procesar la facturación electrónica y nómina electrónica.</li>
          <li>Comunicarnos con usted sobre actualizaciones y soporte técnico.</li>
          <li>Cumplir con nuestras obligaciones legales.</li>
        </ul>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          4. Compartir Información con Terceros
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          No compartimos su información personal con terceros, salvo en las siguientes
          circunstancias:
        </p>
        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>Cuando sea requerido por ley o regulación.</li>
          <li>
            Con proveedores de servicios que ayudan a operar nuestra aplicación (bajo estrictos
            acuerdos de confidencialidad).
          </li>
        </ul>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          5. Seguridad de la Información
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Implementamos medidas de seguridad técnicas y organizativas para proteger su información
          contra accesos no autorizados, pérdidas o divulgación indebida.
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          6. Sus Derechos
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Usted tiene los siguientes derechos en relación con su información personal:
        </p>
        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>Acceder a los datos que tenemos sobre usted.</li>
          <li>Solicitar la corrección de datos inexactos.</li>
          <li>Solicitar la eliminación de sus datos, sujeto a nuestras obligaciones legales.</li>
          <li>Oponerse al procesamiento de sus datos para ciertos fines.</li>
        </ul>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          7. Conservación de Datos
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Conservamos su información personal solo durante el tiempo necesario para cumplir con los
          fines descritos en esta política, a menos que se requiera o permita un período de
          retención más largo por ley.
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          8. Cambios a esta Política de Privacidad
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento.
          Notificaremos cualquier cambio publicando la nueva versión en nuestra aplicación y, si
          corresponde, enviando un aviso adicional.
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          9. Contacto
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Si tiene preguntas o inquietudes sobre esta Política de Privacidad, puede comunicarse con
          nosotros a través de:
        </p>

        <h3
          style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: 14, color: '#333' }}
        >
          10. Uso de Cookies y Tecnologías Similares
        </h3>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Para mejorar la seguridad y el correcto funcionamiento de nuestra aplicación, utilizamos
          cookies y tecnologías similares. Estas herramientas nos permiten almacenar información
          relevante sobre su sesión y preferencias, lo que garantiza una experiencia más fluida y
          personalizada durante el uso de nuestros servicios.
        </p>
        <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8 }}>
          Las cookies también nos ayudan a mantener la seguridad de su cuenta y a proteger la
          información que proporciona al acceder a nuestras funciones. Al utilizar nuestra
          aplicación, usted acepta el uso de estas tecnologías según lo descrito en esta Política de
          Privacidad.
        </p>

        <ul style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 8, paddingLeft: 20 }}>
          <li>
            <strong>Correo electrónico:</strong> envios@qualitysoftservice.com
          </li>
          <li>
            <strong>Teléfono:</strong> +57 310-3188070
          </li>
        </ul>

        <p style={{ marginTop: 16, fontSize: 14, color: '#4a4a4a' }}>
          Gracias por confiar en "Quality Soft Service" para sus necesidades en el sector
          constructor. Su privacidad es nuestra prioridad.
        </p>

        {/* <button
          style={{
            backgroundColor: '#00A7E1',
            color: 'white',
            width: 112,
            height: 32,
            marginTop: 40,
            padding: '0 16px',
            fontWeight: 600,
            borderRadius: 9999,
            fontSize: 12,
            lineHeight: '14.63px',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#008ec1')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00A7E1')}
        >
          Aceptar
        </button> */}
        <div style={{ marginTop: 20, marginBottom: 20 }}></div>
        <OrangeButton label="Aceptar" onClick={() => navigate('/')} />
      </div>
    </div>
  )
}
