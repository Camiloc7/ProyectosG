import React from "react";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "Luis H tenía solo una idea de negocio. Nosotros la transformamos en una realidad gracias a la tecnología y a la optimización de sus procesos de construcción.",
    author: "Luis H",
    logo: "/img/testimonials/Logo-luish.png",
  },
  {
    quote:
      "Flores N necesitaba facturar electrónicamente sin contar con herramientas tecnológicas. Implementamos una solución a su medida que hoy impulsa su operación comercial.",
    author: "Flores N",
    logo: "/img/testimonials/Logo-floresn.png",
  },
  {
    quote:
      "OMC enfrentaba grandes retos en el sector construcción. Digitalizamos su gestión de materiales y proyectos, logrando mayor eficiencia y control de costos.",
    author: "OMC",
    logo: "/img/testimonials/Logo-omc.png",
  },
  {
    quote:
      "DJC necesitaba modernizar la manera de administrar sus obras. Creamos un sistema que centraliza la información y les permite tomar decisiones más rápidas y seguras.",
    author: "DJC",
    logo: "/img/testimonials/Logo-djc.png",
  },
  {
    quote:
      "Caracol buscaba una solución para optimizar la producción audiovisual. Diseñamos una plataforma digital que conecta a sus equipos creativos y acelera la entrega de proyectos.",
    author: "Caracol Tv",
    logo: "/img/testimonials/Logo-caracol.png",
  },
  {
    quote:
      "APR, dedicada a la construcción, requería una mejor forma de coordinar sus proyectos. Implementamos un software que integra la planeación, ejecución y seguimiento en tiempo real.",
    author: "APR",
    logo: "/img/testimonials/Logo-apr.png",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="bg-[#E8EDF0] py-20 px-4">
      <div className="container mx-auto text-center md:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#333332] mb-12">
          Lo que nuestros clientes dicen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author} // Usamos un identificador único en lugar del índice
              className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center justify-between text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#F7F7F7]"
            >
              <p className="italic text-[#333332] text-lg mb-6 flex-grow">
                {testimonial.quote}
              </p>

              <div className="mb-6 h-20 w-20 relative">
                <Image
                  src={testimonial.logo}
                  alt={`Logo de ${testimonial.author}`}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain" }}
                  quality={75}
                />
              </div>
              <p className="font-semibold text-gray-500">
                - {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
