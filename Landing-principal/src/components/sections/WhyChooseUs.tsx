// src/components/sections/WhyChooseUs.tsx

import React from "react";
import {
  SparklesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  LightBulbIcon,
} from "@heroicons/react/24/solid";

const reasons = [
  {
    icon: SparklesIcon,
    title: "Software de Alta Calidad",
    description:
      "Nuestro compromiso es ofrecer soluciones robustas, confiables y diseñadas para superar tus expectativas. Cada línea de código está orientada a garantizar estabilidad, eficiencia y una experiencia de usuario impecable.",
  },
  {
    icon: RocketLaunchIcon,
    title: "Velocidad Increíble",
    description:
      "Procesa tareas complejas en segundos. Nuestra plataforma está diseñada para ofrecer un rendimiento ultrarrápido que impulsa la productividad y reduce tiempos operativos.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Seguridad Avanzada",
    description:
      "Protege tu información con los más altos estándares de seguridad. Nuestro software integra cifrado de datos, autenticación robusta y monitoreo constante para garantizar la integridad de tu operación.",
  },
  {
    icon: UsersIcon,
    title: "Colaboración Eficiente",
    description:
      "Facilita el trabajo en equipo desde cualquier lugar. Coordina tareas, comparte información en tiempo real y mejora la comunicación entre usuarios con herramientas colaborativas integradas.",
  },
  {
    icon: ChartBarIcon,
    title: "Análisis Detallado",
    description:
      "Toma decisiones informadas con datos precisos. Obtén reportes completos, métricas clave y visualizaciones que te permiten entender y mejorar cada aspecto de tu operación.",
  },
  {
    icon: ClockIcon,
    title: "Automatización Inteligente",
    description:
      "Elimina tareas repetitivas y reduce errores. Nuestra plataforma automatiza procesos críticos para que te enfoques en lo que realmente importa: hacer crecer tu negocio.",
  },
  {
    icon: LightBulbIcon,
    title: "Innovación Constante",
    description:
      "Evoluciona junto con el mercado. Nuestro software se actualiza continuamente con nuevas funcionalidades, garantizando que siempre tengas acceso a tecnología de vanguardia.",
  },
];

export default function WhyChooseUs() {
  return (
    <section id="por-que-elegirnos" className="bg-[#F7F7F7] py-20 px-4">
      <div className="container mx-auto text-center md:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#333332] mb-12">
          ¿Por qué elegirnos?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="bg-[#E8EDF0] p-8 rounded-lg shadow-md flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="text-[#00A7E1] h-12 w-12 mb-4">
                <reason.icon />
              </div>
              <h3 className="text-xl font-bold text-[#333332] mb-4">
                {reason.title}
              </h3>
              <p className="text-[#333332]">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
