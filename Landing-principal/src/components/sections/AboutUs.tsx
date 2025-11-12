// src/components/sections/AboutUs.tsx

import React from "react";
import {
  CheckCircleIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChartBarIcon,
  LightBulbIcon,
  ClockIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/solid";

const pillars = [
  { title: "Calidad comprobada", icon: CheckCircleIcon },
  { title: "Rendimiento optimizado", icon: RocketLaunchIcon },
  { title: "Seguridad garantizada", icon: ShieldCheckIcon },
  { title: "Atención personalizada", icon: UsersIcon },
  { title: "Datos que importan", icon: ChartBarIcon },
  { title: "Innovación constante", icon: LightBulbIcon },
  { title: "Eficiencia asegurada", icon: ClockIcon },
  { title: "Acompañamiento continuo", icon: HandRaisedIcon },
];

const awards = [
  {
    title:
      "Seleccionados por el Ministerio de Comercio, Industria y Turismo como una de las empresas destacadas para la internacionalización de tecnología en Suramérica.",
  },
  {
    title:
      "Ganadores del concurso de innovación de la Cámara de Comercio de Colombia 2023, gracias a nuestras soluciones disruptivas y de alto impacto.",
  },
  {
    title:
      "Nominados por la Alcaldía de Funza como una empresa que impulsa el empleo y promueve el desarrollo económico de la región.",
  },
];

export default function AboutUs() {
  return (
    <section id="nosotros" className="bg-[#E8EDF0] py-20 px-4">
      <div className="container mx-auto md:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#333332] mb-12 text-center">
          Acerca de Nosotros
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-12 mb-12">
          {/* Columna de Misión y Visión */}
          <div className="lg:w-1/2 text-lg text-[#333332]">
            <p className="mb-6">
              En Quality Soft Service SAS creemos que la tecnología es una
              herramienta para transformar negocios y mejorar la vida de las
              personas. Somos una empresa dedicada al desarrollo de software y
              soluciones digitales que impulsan el crecimiento de nuestros
              clientes.
            </p>
            <p className="mb-6">
              Nuestra misión es crear herramientas tecnológicas robustas,
              seguras y fáciles de usar, diseñadas para simplificar procesos,
              optimizar la productividad y generar valor real en cada proyecto.
              Con un equipo apasionado por la innovación, trabajamos día a día
              para ofrecer un servicio cercano, confiable y orientado a
              resultados, convirtiéndonos no solo en proveedores, sino en
              aliados estratégicos en la transformación digital de tu negocio.
              <br className="my-2" />
              <span className="font-bold">
                Además, contamos con el respaldo de importantes reconocimientos
                que validan nuestro compromiso con la excelencia.
              </span>
            </p>
          </div>

          {/* Columna de Reconocimientos con Cards */}
          <div className="lg:w-1/2 grid grid-cols-1 gap-6">
            <h3 className="text-2xl font-bold text-[#333332] mb-2">
              Nuestros Reconocimientos
            </h3>
            {awards.map((award, index) => (
              <div
                key={index}
                className="bg-[#F7F7F7] p-6 rounded-lg shadow-md flex items-start text-left transform transition-all duration-300 hover:scale-[1.10] hover:shadow-xl hover:border-l-4 hover:border-[#00A7E1] z-0 hover:z-10"
              >
                <p className="text-[#333332]">{award.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Pilares (nueva ubicación) */}
        <div className="container mx-auto pt-8 md:px-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-8">
            {pillars.map((pillar, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="h-8 w-8 text-[#00A7E1] mb-2">
                  <pillar.icon />
                </div>
                {/* Texto ahora en gris */}
                <p className="text-gray-600 text-sm font-semibold text-center">
                  {pillar.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
