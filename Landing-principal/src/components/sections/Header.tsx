// src/components/sections/Header.tsx

import { Play } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export default function Header() {
  const [playVideo, setPlayVideo] = useState(false);

  return (
    <section id="inicio" className="bg-[#F7F7F7] py-20 px-4 md:py-32">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 md:px-20">
        <div className="lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#333332] leading-tight mb-4">
            BIENVENID@ A <br /> Quality Soft Service
          </h1>
          <p className="text-lg md:text-xl text-[#333332] max-w-2xl mx-auto lg:mx-0 mb-8">
            Software de Facturación Electrónica para: Constructoras, empresas de
            Servicios Públicos, Entidades Promotoras de Salud, Hospitales,
            Uniones Temporales y Facturación POS.
          </p>
          <Link
            href="#promociones"
            className="bg-[#00A7E1] text-[#F7F7F7] rounded-full py-3 px-8 text-lg font-bold hover:bg-[#008BB4] transition-colors shadow-lg inline-block"
          >
            Saber más
          </Link>
        </div>
        {/* <div className="lg:w-1/2 w-full mt-12 lg:mt-0"> */}
        {/* <div className="w-full bg-gray-300 rounded-2xl aspect-video flex items-center justify-center p-8"> */}
        <div className="px-[25px] md:px-0 md:w-[1082px] h-36   md:h-[557px] bg-[#E8EDF0] rounded-[40px] mt-[99px] mx-auto flex justify-center items-center">
          {playVideo ? (
            <iframe
              className="w-[850px] h-[154px] md:h-[410px] rounded-[20px]"
              src="https://www.youtube.com/embed/Mqpxbaoozbs?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div
              className="flex justify-center items-center w-[850px] h-[154px] md:h-[410px] rounded-[20px] bg-[url('https://res.cloudinary.com/decbwosgj/image/upload/v1737644960/Captura_de_pantalla_de_2025-01-23_11-07-20_ipnyej.png')] bg-cover bg-start cursor-pointer"
              onClick={() => setPlayVideo(true)}
            >
              <div className="bg-[#00A7E1] w-[70px] md:w-[100px] h-[70px] md:h-[100px] rounded-full relative flex justify-center items-center">
                <Play className="text-white absolute text-[19px] md:text-[35px] right-[23px] md:right-[28px]" />
              </div>
            </div>
          )}
          {/* </div> */}
          {/* </div> */}
        </div>
      </div>
    </section>
  );
}
