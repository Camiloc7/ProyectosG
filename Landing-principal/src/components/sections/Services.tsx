import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const services = [
  { 
    title: 'GASTRO-POS', 
    description: 'Transforma tu Gastrobar con tecnología. Controla ventas, inventario y facturación desde tu celular. Facturación electrónica, control en tiempo real, pedidos por mesa, cierre automático y más.',
    link: 'https://gastro-pos.netlify.app',
    image: '/foto_pos.jpg' 
  },
    { 
    title: 'PARKING POS', 
    description: 'Sistema POS especializado para parqueaderos. Controla el flujo de vehículos, registra entradas y salidas, calcula tarifas automáticamente y genera reportes detallados para una gestión eficiente.',
    link: '#', 
    image: '/parkingpos.jpeg' 
  },
  { 
    title: 'CONSTRUYENDO', 
    description: 'La app para gestión de obras. Registra avances, controla personal y materiales, genera reportes y digitaliza tu proyecto sin complicaciones.',
    link: '#',
    image: '/abc.jpg'
  },
  {
    title: "ILAC",
    description:
      "Solución digital para gestionar de forma ágil y segura el proceso de vinculación de personal, integrando automáticamente la documentación, inducción, exámenes médicos y registros requeridos por el SG-SST. Garantiza cumplimiento normativo, trazabilidad y mejora la experiencia de empleador y trabajador.",
    link: "https://qualitysoft.netlify.app/",
    image: "/ilac.jpg",
  },
  {
    title: "Quality Soft",
    description:
      "Plataforma de Gestión Integral del Talento Humano y SG-SST – 100% en la nube. Centraliza y automatiza la administración del talento humano, nómina electrónica, seguridad social y cumplimiento SG-SST. Accesible desde cualquier lugar y dispositivo.",
    link: "https://qualitysoft.netlify.app/",
    image: "/fotoQS.jpg",
  },
];


export default function Services() {
  return (
    <section id="servicios" className="bg-[#F7F7F7] py-20 px-4">
      <div className="container mx-auto text-center md:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#333332] mb-12">
          Nuestros Servicios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-[#E8EDF0] p-8 rounded-lg shadow-md text-left transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              {/* Contenedor de imagen modificado */}
              <div className="mb-6 overflow-hidden rounded-lg h-48 md:h-60 relative"> 
                <Image
                  src={service.image}
                  alt={`Imagen de ${service.title}`}
                  // Ya no necesitas width y height fijos aquí si usas fill
                  // width={600} 
                  // height={200}
                  fill // <--- Esta es la clave para que la imagen llene el contenedor
                  quality={75} 
                  className="object-cover transform transition-transform duration-300 hover:scale-110" 
                />
              </div>

              <h3 className="text-2xl font-bold text-[#333332] mb-4">
                {service.title}
              </h3>
              <p className="text-[#333332] mb-6">{service.description}</p>
              <Link
                href={service.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#00A7E1] font-semibold hover:text-[#008BB4] transition-colors"
              >
                Saber más <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}