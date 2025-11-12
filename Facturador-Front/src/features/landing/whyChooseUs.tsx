import React from 'react';

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      number: '01',
      title: '🧠 Software de Alta Calidad',
      description:
        'Nuestro compromiso es ofrecer soluciones robustas, confiables y diseñadas para superar tus expectativas. Cada línea de código está orientada a garantizar estabilidad, eficiencia y una experiencia de usuario impecable.',
    },
    {
      number: '02',
      title: '🚀 Velocidad Increíble',
      description:
        'Procesa tareas complejas en segundos. Nuestra plataforma está diseñada para ofrecer un rendimiento ultrarrápido que impulsa la productividad y reduce tiempos operativos.',
    },
    {
      number: '03',
      title: '🛡 Seguridad Avanzada',
      description:
        'Protege tu información con los más altos estándares de seguridad. Nuestro software integra cifrado de datos, autenticación robusta y monitoreo constante para garantizar la integridad de tu operación.',
    },
    {
      number: '04',
      title: '👥 Colaboración Eficiente',
      description:
        'Facilita el trabajo en equipo desde cualquier lugar. Coordina tareas, comparte información en tiempo real y mejora la comunicación entre usuarios con herramientas colaborativas integradas.',
    },
    {
      number: '05',
      title: '📊 Análisis Detallado',
      description:
        'Toma decisiones informadas con datos precisos. Obtén reportes completos, métricas clave y visualizaciones que te permiten entender y mejorar cada aspecto de tu operación.',
    },
    {
      number: '06',
      title: '⏱ Automatización Inteligente',
      description:
        'Elimina tareas repetitivas y reduce errores. Nuestra plataforma automatiza procesos críticos para que te enfoques en lo que realmente importa: hacer crecer tu negocio.',
    },
    {
      number: '07',
      title: '💡 Innovación Constante',
      description:
        'Evoluciona junto con el mercado. Nuestro software se actualiza continuamente con nuevas funcionalidades, garantizando que siempre tengas acceso a tecnología de vanguardia.',
    },
  ];

  return (
    <section className="pt-0 pb-16 md:pt-16 md:pb-16 md:px-[100px] 2xl:px-[200px]">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold  mb-20">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
          {features.map((feature) => (
            <div key={feature.number} className="flex text-left m-auto">
              <div>
                <div className="flex items-center">
                  <span className="text-blueQ font-bold text-lg">
                    {feature.number}
                  </span>
                  <div className="w-8 h-px bg-gray-500 mx-2"></div>
                </div>
              </div>
              <div className="lg:max-w-64">
                <h3 className="font-semibold w-2/3 mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default WhyChooseUs;
