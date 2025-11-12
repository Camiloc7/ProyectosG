"use client";

import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Form from "@/components/Form";

export default function Contact() {
  return (
    <section id="contacto" className="bg-[#F4F8FA] py-20 px-4">
      <div className="container mx-auto md:px-20 text-center">
        <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl flex flex-col lg:flex-row gap-6 md:gap-12 text-left">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-12 w-full">
            <div className="lg:w-1/2 flex flex-col justify-center p-6 bg-white rounded-lg shadow-lg">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#1D3F72] leading-tight mb-2">
                Vamos a hablar de algo grande juntos
              </h2>
              <p className="text-lg text-gray-700 mt-4 mb-8">
                Por favor, llena el formulario a continuación para enviarnos un
                correo y nos pondremos en contacto contigo lo antes posible.
              </p>

              <h3 className="text-3xl font-semibold text-[#0D1C2A] mb-6">
                Información de Contacto
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center text-lg">
                  <Mail className="h-6 w-6 text-[#00A7E1] flex-shrink-0" />
                  <span className="ml-4">contacto@qualitysoftservices.com</span>
                </li>
                <li className="flex items-center text-lg">
                  <Phone className="h-6 w-6 text-[#00A7E1] flex-shrink-0" />
                  <span className="ml-4">+57 310 3188070</span>
                </li>
                <li className="flex items-center text-lg">
                  <MapPin className="h-6 w-6 text-[#00A7E1] flex-shrink-0" />
                  <span className="ml-4">
                    Dirección Oficina Bogotá: Calle 79B 5-81 Spaces Nogal
                    <br />
                    Oficina Medellín: KR 3A SUR 17 98
                  </span>
                </li>
              </ul>
            </div>

            {/* Panel del Formulario de Contacto */}
            <div className="lg:w-1/2 p-6 bg-[#EAF2FF] rounded-lg shadow-lg">
              <Form />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
