'use client';
import {
  Mail,
  MapPin,
  Phone,
  Instagram,
  Linkedin,
  Twitter,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from './Button';
import { useLandingStore } from '@/store/useLandingStore';

const Form = () => {
  const {
    enviarMensaje,
    loading: loadingFactura,
    error: errorFactura,
    success,
  } = useLandingStore();
  const [formData, setFormData] = useState({
    interes: '',
    nombre: '',
    email: '',
    mensaje: '',
    number: '',
  });

  const handleInteresChange = (interes: string) => {
    setFormData((prevData) => ({ ...prevData, interes }));
  };

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log(formData)
    enviarMensaje(formData);
  };

  return (
    <div className="flex flex-col md:flex-row justify-center gap-[25px] md:gap-[180px] pt-[82px] pb-0 md:py-[116px] md:px-[80px] md:bg-[#F7F7F7]">
      <div className="flex flex-col justify-between">
        <h1 className="text-[#1D1B1B] mb-8 md:mb-0 text-[36px] md:text-[49px] font-bold md:w-[400px] text-center md:text-start leading-[55px]">
          Vamos a hablar de algo <span className="text-[#00A7E1]">grande</span>{' '}
          <br /> juntos
        </h1>

        <div className="mt-[56px] hidden md:flex flex-col">
          <div className="flex gap-2 items-center mb-[54px]">
            <Mail className="text-[#00A7E1]" />
            <span className="ml-[16px]">contacto@qualitysoftservice.com</span>
          </div>
          <div className="flex gap-2 items-center mb-[54px]">
            <Phone className="text-[#00A7E1]" />
            <span className="ml-[16px]">+57 310 3188070</span>
          </div>
          <div className="flex gap-2 items-center mb-10">
            <MapPin className="text-[#00A7E1]" />
            <span className="ml-[16px]">
              Dirección Oficina Bogotá: Calle 79B 5-81 Spaces Nogal
            </span>
          </div>
          <div className="flex gap-2 items-center mb-10">
            <MapPin className="text-[#00A7E1]" />
            <span className="ml-[16px]">Oficina Medellín: KR 3A SUR 17 98</span>
          </div>

          <div className="flex gap-6 mt-20 justify-center md:justify-start">
            <Linkedin className="text-[#00A7E1]" />
            <Instagram className="text-[#00A7E1]" />
            <Twitter className="text-[#00A7E1]" />
          </div>
        </div>
      </div>

      <div className="bg-[#FFFEFE] md:w-[484px] max-w-full h-auto py-8 px-6 flex flex-col rounded-[24px] overflow-hidden">
        <span className="text-[#00A7E1] font-[600] text-start">
          Estoy interesado en:
        </span>
        <div className="flex flex-wrap gap-[11px] mt-[12px] mb-[30px]">
          {['Contratar', 'Cotizar', 'Una demo', 'Necesito soporte', 'Otro'].map(
            (opcion) => (
              <button
                key={opcion}
                className={`px-[18px] py-[8px] rounded-[30px] text-sm border ${
                  formData.interes === opcion
                    ? 'bg-[#00A7E1] text-white'
                    : 'border-[#787878] text-[#787878]'
                }`}
                onClick={() => handleInteresChange(opcion)}
              >
                {opcion}
              </button>
            )
          )}
        </div>

        <form
          action=""
          className="flex flex-col"
          onSubmit={(e) => {
            handleEnviar(e);
          }}
        >
          <label
            className="text-start font-[600] text-[#464646] text-sm"
            htmlFor="nombre"
          >
            Tu nombre
          </label>
          <input
            id="nombre"
            className="pl-3 mt-2 mb-[30px] text-sm"
            style={{ borderBottom: '1px solid #BFBFBF' }}
            type="text"
            placeholder="Joe Doe"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
          />

          <label
            className="text-start font-[600] text-[#464646] text-sm"
            htmlFor="email"
          >
            Tu email
          </label>
          <input
            id="email"
            className="pl-3 mt-2 mb-[30px] text-sm"
            style={{ borderBottom: '1px solid #BFBFBF' }}
            type="email"
            placeholder="email@gmail.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <label
            className="text-start font-[600] text-[#464646] text-sm"
            htmlFor="number"
          >
            Tu Numero
          </label>
          <input
            id="number"
            className="pl-3 mt-2 mb-[30px] text-sm"
            style={{ borderBottom: '1px solid #BFBFBF' }}
            type="number"
            placeholder="Tu numero"
            value={formData.number}
            onChange={(e) =>
              setFormData({ ...formData, number: e.target.value })
            }
          />

          <label
            className="text-start font-[600] text-[#464646] mb-[6px] text-sm"
            htmlFor="mensaje"
          >
            Tu mensaje
          </label>
          <textarea
            id="mensaje"
            className="border border-[#BFBFBF] md:w-[414px] h-[100px] rounded-[12px] mb-[30px]"
            placeholder="Escribe tu mensaje aquí..."
            value={formData.mensaje}
            onChange={(e) =>
              setFormData({ ...formData, mensaje: e.target.value })
            }
          ></textarea>

          <Button title="Enviar mensaje" bg="" />
        </form>
      </div>
    </div>
  );
};

export default Form;
