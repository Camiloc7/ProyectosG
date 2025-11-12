import React, { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  Home,
  Layers,
  BarChart2,
  Calendar,
  Users,
  Box,
  ClipboardList,
  HardDrive,
  Shield,
  Bell,
} from 'lucide-react';

export default function Servicios() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const servicios = [
    {
      title: 'GASTRO-POS',
      href: 'https://gastro-pos.netlify.app/',
      imgSrc: '/foto_pos.jpg',
      alt: 'Gastro-POS',
      description:
        'Transforma tu Gastrobar con tecnología. Controla ventas, inventario y facturación desde tu celular. Facturación electrónica, control en tiempo real, pedidos por mesa, cierre automático y más.',
      extraInfo: (
        <>
          <p>
            Transforma tu Gastrobar con Tecnología: Controla Ventas, Inventario
            y Facturación desde tu Celular
          </p>
          <p>
            ¿Tienes un gastrobar y sientes que pierdes tiempo controlando
            ventas, pedidos y facturación a mano? ¡Es momento de digitalizar tu
            negocio sin complicaciones!
          </p>
          <p>
            En Quality Soft Service SAS creamos un software pensado
            especialmente para negocios como el tuyo: gastrobares, bares,
            restaurantes pequeños y medianos.
          </p>
          <p className="font-semibold">
            ¿Qué puedes hacer desde tu celular o computador?
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <CheckCircle className="inline-block mr-2" size={16} />{' '}
              Facturación electrónica validada por la DIAN
            </li>
            <li>
              <BarChart2 className="inline-block mr-2" size={16} /> Control de
              ventas en tiempo real
            </li>
            <li>
              <Layers className="inline-block mr-2" size={16} /> Pedidos por
              mesa y cocina
            </li>
            <li>
              <ClipboardList className="inline-block mr-2" size={16} /> Cierre
              de caja automático
            </li>
            <li>
              <HardDrive className="inline-block mr-2" size={16} /> Reportes y
              estadísticas de ingresos
            </li>
            <li>
              <Box className="inline-block mr-2" size={16} /> Inventario de
              productos y bebidas
            </li>
            <li>
              <Users className="inline-block mr-2" size={16} /> Módulo de
              control Producción
            </li>
          </ul>
        </>
      ),
      icon: <Home size={24} />,
    },
    {
      title: 'CONSTRUYENDO',
      href: '',
      imgSrc: '/abc.jpg',
      alt: 'Construyendo',
      description:
        'La app para gestión de obras. Registra avances, controla personal y materiales, genera reportes y digitaliza tu proyecto sin complicaciones.',
      extraInfo: (
        <>
          <p className="flex items-center gap-2">
            <HardDrive size={18} /> ¿Gestionas obras de construcción? Esta app
            es para ti.
          </p>
          <p>
            CONSTRUYENDO es la solución digital que te permite llevar el control
            de tus proyectos desde tu celular.
          </p>
          <p className="font-semibold">Con nuestra app puedes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <CheckCircle className="inline-block mr-2" size={16} /> Registrar
              avances de obra en tiempo real
            </li>
            <li>
              <Users className="inline-block mr-2" size={16} /> Controlar
              personal, materiales y gastos
            </li>
            <li>
              <ClipboardList className="inline-block mr-2" size={16} /> Generar
              reportes automáticos para tus clientes o supervisores
            </li>
            <li>
              <Calendar className="inline-block mr-2" size={16} /> Tener
              trazabilidad total desde el inicio hasta la entrega final
            </li>
          </ul>
          <p className="flex items-center gap-2">
            <BarChart2 size={18} /> Digitaliza tu obra. Ahorra tiempo. Toma
            decisiones con datos.
          </p>
        </>
      ),
      icon: <Layers size={24} />,
    },
    {
      title: 'ILAC - Ingreso Laboral Automatizado y Conectado al SG-SST',
      href: '#',
      imgSrc: '/ilac.jpg',
      alt: 'ILAC',
      description:
        'Solución digital para gestionar de forma ágil y segura el proceso de vinculación de personal, integrando automáticamente la documentación, inducción, exámenes médicos y registros requeridos por el SG-SST. Garantiza cumplimiento normativo, trazabilidad y mejora la experiencia de empleador y trabajador.',
      extraInfo: (
        <>
          <p>
            ILAC permite automatizar el ingreso laboral, conectando todos los
            procesos requeridos por el Sistema de Gestión de Seguridad y Salud
            en el Trabajo (SG-SST).
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <CheckCircle className="inline-block mr-2" size={16} />{' '}
              Integración automática de documentación y registros
            </li>
            <li>
              <ClipboardList className="inline-block mr-2" size={16} />{' '}
              Inducción y exámenes médicos digitalizados
            </li>
            <li>
              <HardDrive className="inline-block mr-2" size={16} /> Trazabilidad
              completa del proceso de vinculación
            </li>
            <li>
              <Users className="inline-block mr-2" size={16} /> Mejora la
              experiencia de empleador y trabajador
            </li>
            <li>
              <BarChart2 className="inline-block mr-2" size={16} /> Cumplimiento
              normativo garantizado
            </li>
          </ul>
          <p className="mt-2 text-sm text-gray-500 italic">
            * Solución digital para empresas que buscan eficiencia y seguridad
            en el ingreso laboral.
          </p>
        </>
      ),
      icon: <ClipboardList size={24} />,
    },
    {
      title: 'Quality Soft',
      href: 'https://qualitysoft.netlify.app/',
      imgSrc: '/fotoQS.jpg',
      alt: 'Quality Soft',
      description:
        '🖥 Plataforma de Gestión Integral del Talento Humano y SG-SST – 100% en la nube. Centraliza y automatiza la administración del talento humano, nómina electrónica, seguridad social y cumplimiento SG-SST. Accesible desde cualquier lugar y dispositivo, facilita el trabajo remoto, trazabilidad y cumplimiento normativo en tiempo real.',
      extraInfo: (
        <>
          <p>
            Esta plataforma digital, alojada completamente en la nube, está
            diseñada para centralizar y automatizar la administración del
            talento humano, la nómina electrónica, la seguridad social y el
            cumplimiento del SG-SST.
          </p>
          <p>
            Es accesible desde cualquier lugar y dispositivo con conexión a
            internet, sin necesidad de instalaciones locales, lo que facilita el
            trabajo remoto, la trazabilidad y el cumplimiento normativo en
            tiempo real.
          </p>
          <p className="font-semibold mt-2">Módulos principales:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <Users className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Empleados:</span> Consulta de
              empleados, registro de nuevos ingresos, importación masiva de
              datos, organización por cargos y sucursales.
            </li>
            <li>
              <BarChart2 className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Bienestar Laboral:</span>{' '}
              Seguimiento y consulta del estado de bienestar de los
              trabajadores, prevención de riesgos psicosociales y mejora del
              clima organizacional.
            </li>
            <li>
              <Calendar className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Ausentismo:</span> Historial de
              asistencia e inasistencia, consulta por empleado.
            </li>
            <li>
              <Shield className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Seguridad Social:</span>{' '}
              Generación de reportes, liquidación de aportes, verificación y
              pagos.
            </li>
            <li>
              <ClipboardList className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Capacitación:</span> Gestión de
              cursos y formación para empleados, cumplimiento de requisitos del
              SG-SST.
            </li>
            <li>
              <HardDrive className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Nómina Electrónica:</span>{' '}
              Generación automática de nómina electrónica, visualización y
              reportes según lo exige la DIAN.
            </li>
            <li>
              <Layers className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">SG-SST:</span> Inicio del proceso,
              planificación, ejecución (Hacer), verificación, mejora continua.
            </li>
            <li>
              <Bell className="inline-block mr-2" size={16} />{' '}
              <span className="font-semibold">Notificaciones:</span> Alertas y
              reportes automatizados para mantener el control y la gestión
              activa del sistema.
            </li>
          </ul>
        </>
      ),
      icon: <Layers size={24} />,
    },
  ];

  return (
    <section className="my-20 px-4 md:px-0 max-w-6xl mx-auto">
      <h2
        className={`text-3xl font-semibold mb-8 transition-filter duration-300 ${
          hoverIndex !== null ? 'blur-sm' : ''
        }`}
      >
        Nuestros Servicios
      </h2>

      {/* Cambia a grid de 2 columnas y 2 filas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {servicios.map(
          ({ title, href, imgSrc, alt, description, extraInfo, icon }, i) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`
                group block rounded-lg shadow-lg overflow-hidden relative
                transition-shadow duration-300 transform
                ${
                  hoverIndex === i
                    ? 'hover:scale-105 scale-105 bg-white'
                    : 'hover:shadow-xl'
                }
                ${
                  hoverIndex !== i && hoverIndex !== null
                    ? 'filter blur-sm'
                    : ''
                }
                // Elimina las clases que hacían la card 3 más grande
              `}
            >
              <div className="relative h-64 w-full">
                {i === 1 ? (
                  <img
                    src={imgSrc}
                    alt={alt}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                ) : (
                  <img
                    src={imgSrc}
                    alt={alt}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                )}
              </div>
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-700 leading-relaxed">{description}</p>
              </div>

              <div
                className={`
                  absolute inset-0 p-6 bg-white opacity-0 pointer-events-none overflow-auto
                  transition-opacity duration-300
                  ${hoverIndex === i ? 'opacity-95 pointer-events-auto' : ''}
                `}
              >
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  {icon} {title}
                </h3>
                {extraInfo}
                <p className="mt-4 text-sm text-gray-500 italic">
                  * Haz click para ir a la página en una nueva pestaña.
                </p>
              </div>
            </a>
          )
        )}
      </div>
    </section>
  );
}
